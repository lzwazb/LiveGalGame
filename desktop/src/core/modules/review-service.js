
export default class ReviewService {
    constructor(dbGetter) {
        this.dbGetter = dbGetter;
        this.client = null;
        this.clientConfigSignature = null;
        this.currentLLMConfig = null;
    }

    get db() {
        const db = this.dbGetter?.();
        if (!db) {
            throw new Error('Database is not initialized');
        }
        return db;
    }

    async ensureClient() {
        const llmConfig = this.db.getDefaultLLMConfig();
        if (!llmConfig) {
            throw new Error('未找到默认LLM配置，请先在设置中配置。');
        }

        const signature = `${llmConfig.id || 'unknown'}-${llmConfig.updated_at || 0}`;
        if (!this.client || this.clientConfigSignature !== signature) {
            const { default: OpenAI } = await import('openai');
            const clientConfig = { apiKey: llmConfig.api_key };
            if (llmConfig.base_url) {
                // Remove trailing '/chat/completions' if present
                const baseURL = llmConfig.base_url.replace(/\/chat\/completions\/?$/, '');
                clientConfig.baseURL = baseURL;
            }
            this.client = new OpenAI(clientConfig);
            this.clientConfigSignature = signature;
        }

        this.currentLLMConfig = llmConfig;
        return this.client;
    }

    // 1. 生成复盘报告
    async generateReview(conversationId, options = {}) {
        const force = !!options.force;

        // 检查是否已有复盘
        const existing = this.getExistingReview(conversationId);
        if (existing && existing.review_data && !force) {
            return existing.review_data;
        }

        // 1. 获取消息和选项
        const messages = this.db.getMessagesByConversation(conversationId);
        const suggestions = this.db.getActionSuggestions(conversationId); // 需要在 db 中确认此方法存在，或者使用 getActionSuggestions

        // 2. 按时间戳分组，识别节点
        const nodes = this.groupIntoNodes(suggestions);
        const conversation = this.db.getConversationById(conversationId);

        // 3. 特殊情况：无节点，直接使用兜底简要复盘（无需调用 LLM）
        if (nodes.length === 0) {
            const simpleReview = this.buildSimpleSummary(conversation);
            this.db.saveConversationReview({
                conversation_id: conversationId,
                review_data: simpleReview,
                model_used: 'none'
            });
            return simpleReview;
        }

        // 4. 调用 LLM 分析（带一次重试）
        let reviewData;
        try {
            reviewData = await this.callLLMForReview(messages, nodes);
        } catch (err) {
            console.warn('[ReviewService] LLM 调用失败，正在重试一次...', err);
            reviewData = await this.callLLMForReview(messages, nodes);
        }

        // 5. 补充 ghost_options
        this.enrichGhostOptions(reviewData, nodes);

        // 6. 校验/兜底
        reviewData = this.ensureReviewDataIntegrity(reviewData, nodes, conversation);

        // 7. 保存
        this.db.saveConversationReview({
            conversation_id: conversationId,
            review_data: reviewData,
            model_used: this.currentLLMConfig?.model_name || 'unknown'
        });

        return reviewData;
    }

    // 获取已有复盘
    getExistingReview(conversationId) {
        return this.db.getConversationReview(conversationId);
    }

    // 分组节点逻辑
    groupIntoNodes(suggestions) {
        if (!suggestions || suggestions.length === 0) return [];

        // 按 created_at 排序，如果时间戳相同，则按 index 排序
        const sorted = [...suggestions].sort((a, b) => {
            if (a.created_at !== b.created_at) {
                return a.created_at - b.created_at;
            }
            // 时间戳相同时，按 index 排序（如果存在）
            const aIndex = a.index !== undefined ? a.index : 999;
            const bIndex = b.index !== undefined ? b.index : 999;
            return aIndex - bIndex;
        });

        const groups = [];
        let currentGroup = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const prev = currentGroup[currentGroup.length - 1];
            const curr = sorted[i];

            // 判断是否应该开始新的一组：
            // 1. 时间差超过1秒（主要判断条件）
            // 2. 或者时间戳相同但index重置为0（说明是新的一批，但时间戳可能因为修复前的bug而不一致）
            const timeDiff = curr.created_at - prev.created_at;
            const hasIndexInfo = curr.index !== undefined && prev.index !== undefined;
            const isIndexReset = hasIndexInfo && curr.index === 0 && prev.index >= 0 && prev.index < 3;
            const isFullBatch = currentGroup.length >= 3;

            // 如果时间戳相同（或非常接近），且不是index重置，则归为同一组
            // 如果时间差超过1秒，则开始新组
            // 如果时间差小于1秒但index重置且当前组已满，则开始新组（处理旧数据）
            if (timeDiff < 1000 && !(isFullBatch && isIndexReset)) {
                currentGroup.push(curr);
            } else {
                groups.push(currentGroup);
                currentGroup = [curr];
            }
        }
        groups.push(currentGroup);

        // 限制每个节点的suggestion数量，最多保留3个
        return groups.map((group, index) => {
            let filteredGroup = group;
            
            if (group.length > 3) {
                // 如果一组中有超过3个suggestion，可能是多次生成的结果
                // 按index排序，优先保留index 0,1,2的完整批次
                const sortedByIndex = [...group].sort((a, b) => {
                    const aIndex = a.index !== undefined ? a.index : 999;
                    const bIndex = b.index !== undefined ? b.index : 999;
                    return aIndex - bIndex;
                });
                
                // 找出第一个完整的批次（index 0,1,2）
                const firstBatch = sortedByIndex.filter(s => s.index !== undefined && s.index < 3);
                if (firstBatch.length === 3) {
                    filteredGroup = firstBatch;
                } else {
                    // 如果没有完整的批次，保留前3个（按时间顺序）
                    filteredGroup = group.slice(0, 3);
                }
                console.warn(`[ReviewService] Node ${index + 1} has ${group.length} suggestions (expected 3), limiting to ${filteredGroup.length}. IDs: ${group.map(s => s.id).join(', ')}`);
            }
            
            return {
                node_id: `node_${index + 1}`,
                timestamp: filteredGroup[0].created_at,
                suggestions: filteredGroup
            };
        });
    }

    // 构建 Prompt
    buildReviewPrompt(messages, nodes) {
        const formatTime = (ts) => new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });

        // 过滤掉 system 消息，保留 user 和 character
        // 确保时间顺序
        const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

        const transcript = sortedMessages.map(m =>
            `[${formatTime(m.timestamp)}] ${m.sender === 'user' ? 'User' : 'Character'}: ${m.content}`
        ).join('\n');

        const nodeInfo = nodes.length > 0 
            ? nodes.map((node, i) => {
                const options = node.suggestions.map(s => `  - ID:${s.id} 内容:${s.content || s.title}`).join('\n');
                return `节点${i + 1} (ID: ${node.node_id}, Time: ${formatTime(node.timestamp)}):\n${options}`;
            }).join('\n\n')
            : "无关键决策节点";

        return `
# Role
你是恋爱对话复盘分析师。

# Task
${nodes.length > 0 ? '根据对话记录和已知的"关键节点"（系统当时生成选项的时刻），判断用户实际选择了什么，并总结对话。' : '根据对话记录，总结对话内容并评估好感度变化。'}

# Input

## 对话记录
${transcript}

## 关键节点及当时的选项
${nodeInfo}

# Output (TOON 格式)
输出分为两部分，请严格遵守格式，不要输出其他废话：

${nodes.length > 0 ? `第一部分：节点分析（每行一个节点）
review_nodes[${nodes.length}]{node_id,title,choice_type,matched_id,confidence,user_desc,reasoning}:
<节点ID>,<标题>,<matched/custom>,<匹配ID>,<置信度0-1>,<用户行为描述>,<原因分析>

第二部分：整体总结（单独一行）` : `第一部分：整体总结（单独一行）`}
review_summary[1]{total_affinity_change,conversation_summary}:
<好感度变化整数>,<对话整体概述>

# 规则
${nodes.length > 0 ? `- choice_type: 如果用户的回复语义接近某选项 → matched，否则 → custom
- confidence: 0.8+ 高度匹配，0.5-0.8 部分匹配，<0.5 归为 custom
- matched_id: 仅 choice_type=matched 时填写选项ID
- 节点数据行数必须与提供的节点数一致` : ''}
- total_affinity_change: 整个会话的好感度变化，-10 到 +10 的整数
- 字段用英文逗号分隔，如内容含逗号请用引号包裹

# 示例
${nodes.length > 0 ? `review_nodes[2]{node_id,title,choice_type,matched_id,confidence,user_desc,reasoning}:
node_1,初次问候,matched,sugg_101,0.92,主动打招呼表达惊喜,积极社交建立好感
node_2,深入交流,custom,,0.3,"聊了冰岛旅行和极光",独特故事引发兴趣
review_summary[1]{total_affinity_change,conversation_summary}:
+16,整体对话轻松愉快，双方互有好感，关系稳步推进` : `review_summary[1]{total_affinity_change,conversation_summary}:
+5,双方进行了简单的日常寒暄，氛围和谐。`}
`;
    }

    async callLLMForReview(messages, nodes) {
        const client = await this.ensureClient();
        const prompt = this.buildReviewPrompt(messages, nodes);

        console.log('[ReviewService] Sending prompt to LLM:', prompt);

        const completion = await client.chat.completions.create({
            model: this.currentLLMConfig.model_name,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2, // 分析类任务降低随机性
            max_tokens: 2000,
            stream: false
        });

        const content = completion.choices[0].message.content;
        console.log('[ReviewService] LLM Response:', content);

        return this.parseReviewToon(content, nodes);
    }

    csvSplit(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i += 1) {
            const char = line[i];
            if (char === '"' && line[i - 1] !== '\\') {
                inQuotes = !inQuotes;
                continue;
            }
            if ((char === ',' || char === '，') && !inQuotes) {
                result.push(current);
                current = '';
                continue;
            }
            current += char;
        }
        if (current !== '' || line.endsWith(',') || line.endsWith('，')) {
            result.push(current);
        }
        return result.map(s => s.trim().replace(/^["']|["']$/g, '')); // Trim and unquote
    }

    parseReviewToon(text, originalNodes) {
        const lines = text.split('\n').filter(l => l.trim());

        const result = {
            version: "1.0",
            has_nodes: true,
            summary: {},
            nodes: []
        };

        // 解析 summary
        const summaryHeaderRegex = /^review_summary\[(\d+)\]\{([^}]+)\}:?/;
        const summaryDataLine = lines.find((l, i) => i > 0 && lines[i - 1].match(summaryHeaderRegex));
        if (summaryDataLine) {
            const parts = this.csvSplit(summaryDataLine);
            // header fields: total_affinity_change, conversation_summary
            result.summary.total_affinity_change = parseInt(parts[0]) || 0;
            result.summary.conversation_summary = parts[1] || "";
        } else {
            // Fallback try to find any line that looks like summary
            // ... implementation detail, maybe unnecessary if LLM is good
        }

        // 解析 nodes
        const nodesHeaderRegex = /^review_nodes\[(\d+)\]\{([^}]+)\}:?/;
        const headerLineIndex = lines.findIndex(l => l.match(nodesHeaderRegex));

        if (headerLineIndex !== -1) {
            // Assume subsequent lines are nodes until summary or end
            // Note: The example shows summary comes AFTER nodes usually.
            // Let's just iterate and try to match node IDs

            let currentNodeIndex = 1;
            for (let i = headerLineIndex + 1; i < lines.length; i++) {
                const line = lines[i];
                if (line.match(/^review_summary/)) break;
                if (!line.includes(',')) continue; // Skip empty/weird lines

                const parts = this.csvSplit(line);
                // node_id,title,choice_type,matched_id,confidence,user_desc,reasoning
                if (parts.length >= 7) {
                    const nodeId = parts[0]; // e.g., node_1
                    const originalNode = originalNodes.find(n => n.node_id === nodeId);

                    result.nodes.push({
                        node_id: nodeId,
                        node_title: parts[1],
                        timestamp: originalNode ? originalNode.timestamp : 0,
                        choice_type: parts[2] === 'matched' ? 'matched' : 'custom',
                        matched_suggestion_id: parts[3] || null,
                        match_confidence: parseFloat(parts[4]) || 0,
                        user_description: parts[5],
                        reasoning: parts[6],
                        ghost_options: [] // Will be enriched later
                    });
                }
            }
        }

        // Fill in summary counts
        result.summary.node_count = result.nodes.length;
        result.summary.matched_count = result.nodes.filter(n => n.choice_type === 'matched').length;
        result.summary.custom_count = result.nodes.filter(n => n.choice_type === 'custom').length;

        return result;
    }

    buildSimpleSummary(conversation, summaryText) {
        return {
            version: "1.0",
            has_nodes: false,
            summary: {
                total_affinity_change: conversation?.affinity_change || 0,
                node_count: 0,
                matched_count: 0,
                custom_count: 0,
                conversation_summary: summaryText || "本次对话较为顺畅，无需特别决策点。"
            },
            nodes: []
        };
    }

    ensureReviewDataIntegrity(reviewData, originalNodes, conversation) {
        const safe = reviewData || { summary: {}, nodes: [] };
        safe.summary = safe.summary || {};
        safe.nodes = Array.isArray(safe.nodes) ? safe.nodes : [];

        const expectedCount = originalNodes?.length || 0;
        const parsedCount = safe.nodes.length;
        const missingNodes = expectedCount > 0 && parsedCount === 0;
        const countMismatch = expectedCount > 0 && parsedCount !== expectedCount;

        if (missingNodes) {
            console.warn('[ReviewService] LLM 输出未解析出任何节点，降级为无节点复盘。');
            return this.buildSimpleSummary(
                conversation,
                safe.summary.conversation_summary || "未能解析关键决策点，已输出简要复盘。"
            );
        }

        if (countMismatch) {
            console.warn('[ReviewService] LLM 节点数与输入不一致，已继续使用解析结果：', {
                expected: expectedCount,
                parsed: parsedCount
            });
        }

        safe.has_nodes = safe.nodes.length > 0;
        safe.summary.node_count = safe.nodes.length;
        safe.summary.matched_count = safe.nodes.filter(n => n.choice_type === 'matched').length;
        safe.summary.custom_count = safe.nodes.filter(n => n.choice_type === 'custom').length;
        if (safe.summary.total_affinity_change === undefined || safe.summary.total_affinity_change === null) {
            safe.summary.total_affinity_change = conversation?.affinity_change || 0;
        }
        if (!safe.summary.conversation_summary) {
            safe.summary.conversation_summary = "本次对话复盘已生成。";
        }

        return safe;
    }

    enrichGhostOptions(reviewData, originalNodes) {
        reviewData.nodes.forEach(reviewNode => {
            const original = originalNodes.find(n => n.node_id === reviewNode.node_id);
            if (original) {
                reviewNode.ghost_options = original.suggestions
                    .filter(s => s.id !== reviewNode.matched_suggestion_id) // Filter out matched one
                    .map(s => ({
                        suggestion_id: s.id,
                        content: s.content || s.title
                    }));
            }
        });
    }
}
