import { renderPromptTemplate } from './prompt-manager.js';

const DEFAULT_REVIEW_TIMEOUT_MS = 1000 * 20;

export default class ReviewService {
    constructor(dbGetter) {
        this.dbGetter = dbGetter;
        this.clientPool = {};
        this.clientConfigSignature = null; // 保留兼容字段
        this.currentLLMConfig = null;
        this.currentLLMFeature = 'review';

        // 复盘输入规模控制（避免超长对话导致上下文爆炸）
        this.MAX_NODES = 15;
        this.MAX_MESSAGES = 120;
        this.MAX_OPTIONS_PER_NODE = 6;
        // 粗略 token 上限（经验值）：超出会触发更激进裁剪
        this.MAX_PROMPT_TOKENS_EST = 12000;
    }

    get db() {
        const db = this.dbGetter?.();
        if (!db) {
            throw new Error('Database is not initialized');
        }
        return db;
    }

    async ensureClient(feature = 'review') {
        const featureKey = typeof feature === 'string' && feature.trim() ? feature.trim().toLowerCase() : 'review';
        const llmConfig =
            (this.db.getLLMConfigForFeature && this.db.getLLMConfigForFeature(featureKey)) ||
            this.db.getDefaultLLMConfig();
        if (!llmConfig) {
            throw new Error('未找到默认LLM配置，请先在设置中配置。');
        }

        const signature = `${featureKey}:${llmConfig.id || 'unknown'}-${llmConfig.updated_at || 0}`;
        const cached = this.clientPool[featureKey];
        if (!cached || cached.signature !== signature) {
            const { default: OpenAI } = await import('openai');
            const clientConfig = { apiKey: llmConfig.api_key };
            if (llmConfig.base_url) {
                // Remove trailing '/chat/completions' if present
                const baseURL = llmConfig.base_url.replace(/\/chat\/completions\/?$/, '');
                clientConfig.baseURL = baseURL;
            }
            this.clientPool[featureKey] = {
                client: new OpenAI(clientConfig),
                signature,
                config: llmConfig
            };
        }

        this.currentLLMConfig = llmConfig;
        this.currentLLMFeature = featureKey;
        return this.clientPool[featureKey].client;
    }

    // 1. 生成复盘报告
    async generateReview(conversationId, options = {}) {
        const force = !!options.force;
        const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
        const report = (stage, percent, message, extra = null) => {
            try {
                onProgress?.({
                    stage,
                    percent,
                    message,
                    ...(extra ? { extra } : {})
                });
            } catch {
                // ignore
            }
        };

        // 检查是否已有复盘
        const existing = this.getExistingReview(conversationId);
        if (existing && existing.review_data && !force) {
            return existing.review_data;
        }

        // 1. 获取消息和选项
        report('load_data', 0.05, '加载对话与建议数据...');
        const messagesRaw = this.db.getMessagesByConversation(conversationId);
        const suggestions = this.db.getActionSuggestions(conversationId);

        // 2. 按时间戳分组，识别节点
        report('group_nodes', 0.15, '识别决策点并分组...');
        const nodesRaw = this.groupIntoNodes(suggestions);
        const explicitReviewNodes = this.buildReviewNodesFromUserSelection(nodesRaw);
        const affinityFromSelection = this.computeAffinityChangeFromSelection(explicitReviewNodes);
        const conversation = this.db.getConversationById(conversationId);

        // 3. 特殊情况处理：
        // - 如果没有节点但有消息，仍然走 LLM 复盘（不降级），让模型给出完整总结
        // - 如果既没有节点也没有消息，才使用兜底简要复盘
        const hasMessages = Array.isArray(messagesRaw) && messagesRaw.length > 0;
        if (nodesRaw.length === 0 && !hasMessages) {
            const simpleReview = this.buildSimpleSummary(conversation);
            report('save', 0.9, '保存复盘结果...');
            this.db.saveConversationReview({
                conversation_id: conversationId,
                review_data: simpleReview,
                model_used: 'none'
            });
            report('done', 1, '复盘完成');
            return simpleReview;
        }

        report('trim', 0.25, '裁剪输入规模以避免超长上下文...');
        const { messages, nodes, trimInfo } = this.trimReviewInputs(messagesRaw, nodesRaw);

        // 4. 调用 LLM 分析（带一次重试）
        let reviewData;
        try {
            report('llm_request', 0.35, '调用模型生成复盘（可能需要一些时间）...', trimInfo);
            reviewData = await this.callLLMForReview(messages, nodes);
            report('parse', 0.75, '解析模型输出...');
        } catch (err) {
            console.warn('[ReviewService] LLM 调用失败，准备重试...', err);
            // 针对“上下文过长”做更激进裁剪再重试；其他错误维持一次重试
            if (this.isLikelyContextLimitError(err)) {
                console.warn('[ReviewService] Suspected context window issue. Retrying with aggressive trimming...');
                const aggressive = this.trimReviewInputs(messagesRaw, nodesRaw, { aggressive: true });
                report('llm_request', 0.35, '上下文疑似超限，已裁剪后重试...', aggressive.trimInfo);
                reviewData = await this.callLLMForReview(aggressive.messages, aggressive.nodes);
                report('parse', 0.75, '解析模型输出...');
            } else {
                report('llm_request', 0.35, '调用失败，准备重试一次...');
                reviewData = await this.callLLMForReview(messages, nodes);
                report('parse', 0.75, '解析模型输出...');
            }
        }

        // 5. 补充 ghost_options
        report('enrich', 0.82, '补齐未选择路径（ghost options）...');
        // 在“用户显式选择”模式下，节点与选择由系统决定，不依赖 LLM 输出
        reviewData.nodes = explicitReviewNodes;
        reviewData.has_nodes = explicitReviewNodes.length > 0;
        if (!reviewData.summary) reviewData.summary = {};
        reviewData.summary.node_count = explicitReviewNodes.length;
        reviewData.summary.matched_count = explicitReviewNodes.filter((n) => n.choice_type === 'selected').length;
        reviewData.summary.custom_count = explicitReviewNodes.filter((n) => n.choice_type !== 'selected').length;
        this.enrichGhostOptions(reviewData, nodes);

        // 6. 校验/兜底
        report('validate', 0.86, '校验并兜底复盘结构...');
        reviewData = this.ensureReviewDataIntegrity(reviewData, nodes, conversation);

        // 6.1 覆盖好感度变化：完全由用户显式选择决定
        if (!reviewData.summary) reviewData.summary = {};
        reviewData.summary.total_affinity_change = affinityFromSelection;

        // 7. 保存
        report('save', 0.9, '保存复盘结果...');
        this.db.saveConversationReview({
            conversation_id: conversationId,
            review_data: reviewData,
            model_used: this.currentLLMConfig?.model_name || 'unknown'
        });

        // 8. 更新会话信息（标题、摘要、Tag、好感度）
        if (reviewData.summary) {
            report('update_conversation', 0.95, '更新会话摘要与标签...');
            const updates = {};
            if (reviewData.summary.title) updates.title = reviewData.summary.title;
            if (reviewData.summary.conversation_summary) updates.summary = reviewData.summary.conversation_summary;
            if (Array.isArray(reviewData.summary.tags)) updates.tags = reviewData.summary.tags.join(',');
            if (reviewData.summary.total_affinity_change !== undefined) updates.affinity_change = reviewData.summary.total_affinity_change;

            if (Object.keys(updates).length > 0) {
                this.db.updateConversation(conversationId, updates);
            }
        }

        report('done', 1, '复盘完成');
        return reviewData;
    }

    estimateTokens(text = '') {
        if (!text) return 0;
        // 经验：中英混合平均 1 token ~ 3-4 chars，取 4 做保守估计
        return Math.ceil(String(text).length / 4);
    }

    isLikelyContextLimitError(err) {
        const msg = String(err?.message || '').toLowerCase();
        return (
            msg.includes('context') ||
            msg.includes('maximum context') ||
            msg.includes('max context') ||
            msg.includes('token') ||
            msg.includes('length') ||
            msg.includes('too large')
        );
    }

    trimReviewInputs(messagesRaw, nodesRaw, opts = {}) {
        const aggressive = !!opts.aggressive;
        const maxNodes = aggressive ? Math.max(6, Math.floor(this.MAX_NODES / 2)) : this.MAX_NODES;
        const maxMessages = aggressive ? Math.max(40, Math.floor(this.MAX_MESSAGES / 2)) : this.MAX_MESSAGES;
        const maxOptions = aggressive ? Math.max(3, Math.floor(this.MAX_OPTIONS_PER_NODE / 2)) : this.MAX_OPTIONS_PER_NODE;

        const messages = Array.isArray(messagesRaw) ? [...messagesRaw] : [];
        const nodes = Array.isArray(nodesRaw) ? [...nodesRaw] : [];

        // 1) 先限制 nodes 数量：保留最近 maxNodes 个（按 timestamp）
        nodes.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        const trimmedNodes = nodes.length > maxNodes ? nodes.slice(nodes.length - maxNodes) : nodes;

        // 2) 限制每个节点的 options 数量（保留最靠前的若干条，通常 index=0..）
        const finalNodes = trimmedNodes.map((n) => ({
            ...n,
            suggestions: Array.isArray(n.suggestions) ? n.suggestions.slice(0, maxOptions) : []
        }));

        // 3) 限制消息数量：保留最近 maxMessages 条
        messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        const finalMessages = messages.length > maxMessages ? messages.slice(messages.length - maxMessages) : messages;

        // 4) 如仍超估计 token，上下文再裁一次（优先裁消息）
        const promptPreview = this.buildReviewPrompt(finalMessages, finalNodes);
        const est = this.estimateTokens(promptPreview);
        if (est > this.MAX_PROMPT_TOKENS_EST) {
            const moreAggressiveMessages = finalMessages.slice(Math.max(0, finalMessages.length - Math.floor(maxMessages / 2)));
            const moreAggressivePrompt = this.buildReviewPrompt(moreAggressiveMessages, finalNodes);
            const est2 = this.estimateTokens(moreAggressivePrompt);
            return {
                messages: moreAggressiveMessages,
                nodes: finalNodes,
                trimInfo: { aggressive, nodes: { before: nodesRaw?.length || 0, after: finalNodes.length }, messages: { before: messagesRaw?.length || 0, after: moreAggressiveMessages.length }, tokenEst: { before: est, after: est2 } }
            };
        }

        return {
            messages: finalMessages,
            nodes: finalNodes,
            trimInfo: { aggressive, nodes: { before: nodesRaw?.length || 0, after: finalNodes.length }, messages: { before: messagesRaw?.length || 0, after: finalMessages.length }, tokenEst: { est } }
        };
    }

    // 获取已有复盘
    getExistingReview(conversationId) {
        return this.db.getConversationReview(conversationId);
    }

    // 分组节点逻辑
    groupIntoNodes(suggestions) {
        if (!suggestions || suggestions.length === 0) return [];

        const withDecisionPoint = [];
        const legacy = [];
        for (const s of suggestions) {
            if (s && s.decision_point_id) withDecisionPoint.push(s);
            else legacy.push(s);
        }

        const nodes = [];

        // 1) 新版：按 decision_point_id 聚合；
        // - 若用户在某个 batch 显式选择了建议，则该决策点选择“被选中项所在 batch”作为节点选项（便于回放 ghost options）
        // - 否则取“最新 batch”作为该节点的选项
        if (withDecisionPoint.length > 0) {
            const byDP = new Map();
            for (const s of withDecisionPoint) {
                const dpId = s.decision_point_id;
                if (!byDP.has(dpId)) byDP.set(dpId, []);
                byDP.get(dpId).push(s);
            }

            // 按决策点的最早 created_at 排序，稳定输出 node_1..n
            const dpGroups = [...byDP.entries()].map(([dpId, list]) => {
                const minTs = Math.min(...list.map((x) => x.created_at || 0));
                const maxTs = Math.max(...list.map((x) => x.created_at || 0));
                return { dpId, list, minTs, maxTs };
            }).sort((a, b) => a.minTs - b.minTs);

            for (const group of dpGroups) {
                // 找最新批次：优先按 batch_id 分组，取 created_at 最大的 batch
                const byBatch = new Map();
                for (const s of group.list) {
                    const batchId = s.batch_id || 'unknown';
                    if (!byBatch.has(batchId)) byBatch.set(batchId, []);
                    byBatch.get(batchId).push(s);
                }
                const batchCount = byBatch.size;

                // 若存在显式选择，优先使用该 batch
                let selectedBatchId = null;
                for (const [batchId, list] of byBatch.entries()) {
                    if (list.some((x) => x && (x.is_selected === 1 || x.is_selected === true || x.is_selected === '1'))) {
                        selectedBatchId = batchId;
                        break;
                    }
                }

                let latestBatchId = null;
                let latestBatchTs = -1;
                for (const [batchId, list] of byBatch.entries()) {
                    const ts = Math.max(...list.map((x) => x.created_at || 0));
                    if (ts > latestBatchTs) {
                        latestBatchTs = ts;
                        latestBatchId = batchId;
                    }
                }

                const pickedBatchId = selectedBatchId || latestBatchId;
                const latest = (pickedBatchId && byBatch.get(pickedBatchId)) ? byBatch.get(pickedBatchId) : group.list;
                const sortedLatest = [...latest].sort((a, b) => {
                    const aIndex = a.suggestion_index ?? a.index ?? 999;
                    const bIndex = b.suggestion_index ?? b.index ?? 999;
                    return aIndex - bIndex;
                });

                nodes.push({
                    decision_point_id: group.dpId,
                    batch_id: pickedBatchId !== 'unknown' ? pickedBatchId : null,
                    batch_count: batchCount,
                    timestamp: sortedLatest[0]?.created_at || group.minTs,
                    suggestions: sortedLatest
                });
            }
        }

        // 2) 旧版数据：回退到时间窗口分组（保留原逻辑，但不再硬丢弃为3条）
        if (legacy.length > 0) {
            // 按 created_at 排序，如果时间戳相同，则按 index 排序
            const sorted = [...legacy].sort((a, b) => {
                if (a.created_at !== b.created_at) {
                    return a.created_at - b.created_at;
                }
                const aIndex = a.index !== undefined ? a.index : 999;
                const bIndex = b.index !== undefined ? b.index : 999;
                return aIndex - bIndex;
            });

            const groups = [];
            let currentGroup = [sorted[0]];

            for (let i = 1; i < sorted.length; i++) {
                const prev = currentGroup[currentGroup.length - 1];
                const curr = sorted[i];

                const timeDiff = curr.created_at - prev.created_at;
                const hasIndexInfo = curr.index !== undefined && prev.index !== undefined;
                const isIndexReset = hasIndexInfo && curr.index === 0 && prev.index >= 0 && prev.index < 3;
                const isFullBatch = currentGroup.length >= 3;

                if (timeDiff < 1000 && !(isFullBatch && isIndexReset)) {
                    currentGroup.push(curr);
                } else {
                    groups.push(currentGroup);
                    currentGroup = [curr];
                }
            }
            groups.push(currentGroup);

            const legacyNodes = groups.map((group) => ({
                timestamp: group[0].created_at,
                suggestions: group
            }));
            nodes.push(...legacyNodes);
        }

        // 统一生成 node_id
        return nodes
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
            .map((node, index) => ({
                node_id: `node_${index + 1}`,
                timestamp: node.timestamp || 0,
                decision_point_id: node.decision_point_id || null,
                batch_id: node.batch_id || null,
                suggestions: node.suggestions || []
            }));
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
                const dpInfo = node.decision_point_id ? `, DP:${node.decision_point_id}` : '';
                const batchInfo = node.batch_id ? `, Batch:${node.batch_id}` : '';
                const batchCountInfo = node.batch_count && node.batch_count > 1 ? `, BatchCount:${node.batch_count}` : '';

                // 补充上下文：决策点锚点消息 + 本批次触发信息（可解释“为什么弹建议/是否换一批”）
                let anchorLine = '';
                let triggerLine = '';
                try {
                    if (node.decision_point_id && this.db.getDecisionPointById) {
                        const dp = this.db.getDecisionPointById(node.decision_point_id);
                        const anchorId = dp?.anchor_message_id;
                        if (anchorId && this.db.getMessageById) {
                            const msg = this.db.getMessageById(anchorId);
                            if (msg) {
                                anchorLine = `锚点消息: [${formatTime(msg.timestamp)}] ${msg.sender === 'user' ? 'User' : 'Character'}: ${msg.content}`;
                            }
                        }
                    }
                    if (node.batch_id && this.db.getSuggestionBatchById) {
                        const batch = this.db.getSuggestionBatchById(node.batch_id);
                        if (batch) {
                            triggerLine = `触发: ${batch.trigger || 'unknown'} / ${batch.reason || 'unknown'}`;
                        }
                    }
                } catch {
                    // ignore
                }

                const options = node.suggestions.map(s => `  - ID:${s.id} 内容:${s.content || s.title}`).join('\n');
                const extraLines = [triggerLine, anchorLine].filter(Boolean).map((l) => `  ${l}`).join('\n');
                return `节点${i + 1} (ID: ${node.node_id}${dpInfo}${batchInfo}${batchCountInfo}, Time: ${formatTime(node.timestamp)}):\n${extraLines ? `${extraLines}\n` : ''}${options}`;
            }).join('\n\n')
            : "无关键决策节点";

        const promptId = nodes.length > 0 ? 'review.with_nodes' : 'review.no_nodes';
        return renderPromptTemplate(promptId, {
            transcript,
            nodeInfo,
            nodesCount: nodes.length
        });
    }

    buildReviewNodesFromUserSelection(nodes = []) {
        const reviewNodes = [];
        for (const node of nodes || []) {
            const suggestions = Array.isArray(node.suggestions) ? node.suggestions : [];
            const selected = suggestions.find((s) => s && (s.is_selected === 1 || s.is_selected === true || s.is_selected === '1')) || null;
            reviewNodes.push({
                node_id: node.node_id,
                node_title: selected?.title || '已选择建议',
                timestamp: node.timestamp || 0,
                choice_type: selected ? 'selected' : 'unselected',
                selected_suggestion_id: selected?.id || null,
                selected_affinity_delta: typeof selected?.affinity_prediction === 'number' ? selected.affinity_prediction : null,
                user_description: selected?.content || selected?.title || (selected ? '已选择建议' : '未选择建议'),
                reasoning: selected
                    ? `该节点为用户显式选择：${selected.title || selected.id || '建议'}.`
                    : '该节点未进行显式选择，无法从系统记录确定采用了哪个选项。',
                ghost_options: []
            });
        }
        return reviewNodes;
    }

    computeAffinityChangeFromSelection(reviewNodes = []) {
        const deltas = Array.isArray(reviewNodes) ? reviewNodes.map((n) => n?.selected_affinity_delta).filter((v) => typeof v === 'number' && !Number.isNaN(v)) : [];
        const sum = deltas.reduce((acc, v) => acc + v, 0);
        // 复盘口径：整段对话总变化限制到 [-10, +10]（与 UI/历史数据兼容）
        return Math.max(-10, Math.min(10, Math.round(sum)));
    }

    async callLLMForReview(messages, nodes) {
        const client = await this.ensureClient('review');
        const prompt = this.buildReviewPrompt(messages, nodes);

        console.log('[ReviewService] Sending prompt to LLM:', prompt);

        let completion;
        const timeoutMs = this.resolveTimeoutMs(this.currentLLMConfig, DEFAULT_REVIEW_TIMEOUT_MS);
        const controller = new AbortController();
        const timer = setTimeout(() => {
            controller.abort(new Error('LLM生成超时，请稍后重试'));
        }, timeoutMs);
        try {
            completion = await client.chat.completions.create({
                model: this.currentLLMConfig.model_name,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2, // 分析类任务降低随机性
                max_tokens: 2000,
                stream: false
            }, { signal: controller.signal });
        } catch (apiError) {
            console.error('[ReviewService] LLM API 调用失败:', apiError);
            throw new Error(`LLM API 调用失败: ${apiError.message || apiError}`);
        } finally {
            clearTimeout(timer);
        }

        console.log('[ReviewService] LLM API 响应:', JSON.stringify(completion, null, 2));

        if (!completion || !completion.choices || !completion.choices[0]) {
            console.error('[ReviewService] LLM 响应格式异常:', completion);
            throw new Error('LLM 响应格式异常，请检查 API 配置');
        }

        const content = completion.choices[0]?.message?.content;
        console.log('[ReviewService] LLM Response:', content);

        if (!content || !content.trim()) {
            throw new Error('LLM response is empty or invalid');
        }

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

    resolveTimeoutMs(config, fallback) {
        const raw = config?.timeout_ms;
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed > 0) {
            return Math.round(parsed);
        }
        return fallback;
    }

    parseReviewToon(text, originalNodes) {
        if (!text) {
            return {
                version: "1.0",
                has_nodes: originalNodes && originalNodes.length > 0,
                summary: {},
                nodes: []
            };
        }
        const lines = text.split('\n').filter(l => l.trim());

        const result = {
            version: "1.0",
            has_nodes: true,
            summary: {},
            nodes: []
        };

        // 解析 summary
        const summaryHeaderRegex = /^review_summary\[(\d+)\]\{([^}]+)\}:?/;
        const summaryHeaderIndex = lines.findIndex(l => l.match(summaryHeaderRegex));
        if (summaryHeaderIndex !== -1 && lines[summaryHeaderIndex + 1]) {
            const headerMatch = lines[summaryHeaderIndex].match(summaryHeaderRegex);
            const fields = headerMatch?.[2]?.split(',').map(f => f.trim()) || [];
            const parts = this.csvSplit(lines[summaryHeaderIndex + 1]);
            const summaryMap = {};
            fields.forEach((field, idx) => {
                summaryMap[field] = parts[idx] ?? '';
            });

            result.summary.total_affinity_change = parseInt(summaryMap.total_affinity_change) || 0;
            result.summary.title = summaryMap.title || "";
            // 优先 chat_overview 填充概要，其次 conversation_summary
            result.summary.conversation_summary = summaryMap.conversation_summary || summaryMap.chat_overview || "";
            result.summary.self_evaluation = summaryMap.self_evaluation || "";
            result.summary.chat_overview = summaryMap.chat_overview || result.summary.conversation_summary;
            // 解析用户表现评价的评分
            result.summary.performance_evaluation = {
                expression_ability: {
                    score: parseInt(summaryMap.expression_score) || null,
                    description: summaryMap.expression_desc || ""
                },
                topic_selection: {
                    score: parseInt(summaryMap.topic_score) || null,
                    description: summaryMap.topic_desc || ""
                }
            };
            // 解析 Tags
            result.summary.tags = (summaryMap.tags || "").split(/[;；]/).map(t => t.trim()).filter(Boolean);
            // 解析对象态度分析
            result.summary.attitude_analysis = summaryMap.attitude_analysis || "";
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
                conversation_summary: summaryText || "本次对话较为顺畅，无需特别决策点。",
                self_evaluation: "暂无复盘评价。",
                chat_overview: summaryText || "本次对话较为顺畅，无需特别决策点。",
                performance_evaluation: {
                    expression_ability: {
                        score: null,
                        description: ""
                    },
                    topic_selection: {
                        score: null,
                        description: ""
                    }
                },
                tags: [],
                attitude_analysis: "暂无态度分析。"
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
        if (!safe.summary.chat_overview) {
            safe.summary.chat_overview = safe.summary.conversation_summary;
        }
        if (!safe.summary.self_evaluation) {
            safe.summary.self_evaluation = "暂无复盘评价。";
        }
        // 确保performance_evaluation字段存在
        if (!safe.summary.performance_evaluation) {
            safe.summary.performance_evaluation = {
                expression_ability: {
                    score: null,
                    description: ""
                },
                topic_selection: {
                    score: null,
                    description: ""
                }
            };
        } else {
            // 确保子字段存在
            if (!safe.summary.performance_evaluation.expression_ability) {
                safe.summary.performance_evaluation.expression_ability = { score: null, description: "" };
            }
            if (!safe.summary.performance_evaluation.topic_selection) {
                safe.summary.performance_evaluation.topic_selection = { score: null, description: "" };
            }
        }
        if (!safe.summary.tags) {
            safe.summary.tags = [];
        }
        if (!safe.summary.attitude_analysis) {
            safe.summary.attitude_analysis = "暂无态度分析。";
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
