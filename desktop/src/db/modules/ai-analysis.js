export default function AIAnalysisManager(BaseClass) {
  return class extends BaseClass {
    // 获取对话的AI分析报告
    getConversationAnalysis(conversationId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM ai_analysis
        WHERE conversation_id = ? AND insight_type = 'analysis_report'
        ORDER BY created_at DESC
        LIMIT 1
      `);
      const result = stmt.get(conversationId);
      console.log(`[DB] getConversationAnalysis for ${conversationId}:`, result ? 'found' : 'not found');
      if (result) {
        console.log(`[DB] Analysis report content:`, result.content);
      }
      return result || null;
    } catch (error) {
      console.error('Error getting conversation analysis:', error);
      return null;
    }
  }

  // 获取对话的关键时刻回放
  getKeyMoments(conversationId) {
    try {
      const stmt = this.db.prepare(`
        SELECT
          a.*,
          m.content as message_content,
          m.timestamp as message_timestamp,
          m.sender
        FROM ai_analysis a
        LEFT JOIN messages m ON a.message_id = m.id
        WHERE a.conversation_id = ? AND a.insight_type = 'key_moment'
        ORDER BY a.created_at ASC
      `);
      return stmt.all(conversationId) || [];
    } catch (error) {
      console.error('Error getting key moments:', error);
      return [];
    }
  }

  // 获取对话的行动建议
  getActionSuggestions(conversationId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM ai_suggestions
        WHERE conversation_id = ?
        ORDER BY created_at DESC
      `);
      return stmt.all(conversationId) || [];
    } catch (error) {
      console.error('Error getting action suggestions:', error);
      return [];
    }
  }

  // 保存行动建议到数据库
  saveActionSuggestion(suggestion, conversationId, messageId = null) {
    try {
      if (!suggestion || !conversationId) {
        console.warn('[DB] saveActionSuggestion: Missing required fields', { suggestion, conversationId });
        return null;
      }

      const stmt = this.db.prepare(`
        INSERT INTO ai_suggestions (
          id, conversation_id, message_id, title, content, 
          affinity_prediction, tags, is_used, created_at
        ) VALUES (
          @id, @conversation_id, @message_id, @title, @content,
          @affinity_prediction, @tags, @is_used, @created_at
        )
      `);

      const tagsStr = Array.isArray(suggestion.tags) 
        ? suggestion.tags.join(',') 
        : (suggestion.tags || '');

      const now = Date.now();
      const suggestionId = suggestion.id || `suggestion-${now}-${Math.random().toString(36).substr(2, 9)}`;

      stmt.run({
        id: suggestionId,
        conversation_id: conversationId,
        message_id: messageId,
        title: suggestion.title || suggestion.content || '未命名建议',
        content: suggestion.content || suggestion.title || '',
        affinity_prediction: suggestion.affinity_prediction || null,
        tags: tagsStr,
        is_used: suggestion.is_used || 0,
        created_at: suggestion.created_at || now
      });

      console.log(`[DB] Saved action suggestion: ${suggestionId} for conversation: ${conversationId}`);
      return suggestionId;
    } catch (error) {
      console.error('Error saving action suggestion:', error);
      return null;
    }
  }

  // 获取对话的完整AI分析数据
  getConversationAIData(conversationId) {
    console.log(`[DB] Getting AI data for conversation: ${conversationId}`);

    // 获取分析报告
    const analysisReport = this.getConversationAnalysis(conversationId);
    console.log(`[DB] Analysis report found:`, analysisReport ? 'yes' : 'no');

    // 获取关键时刻
    const keyMoments = this.getKeyMoments(conversationId);
    console.log(`[DB] Key moments found: ${keyMoments.length}`);

    // 获取行动建议
    const actionSuggestions = this.getActionSuggestions(conversationId);
    console.log(`[DB] Action suggestions found: ${actionSuggestions.length}`);

    // 获取对话信息以获取角色ID
    const conversation = this.getConversationById(conversationId);

    // 获取本轮对话的表现态度分析（从ai_analysis表获取）
    let attitudeAnalysis = null;
    try {
      const attitudeStmt = this.db.prepare(`
        SELECT content FROM ai_analysis
        WHERE conversation_id = ? AND insight_type = 'attitude_analysis'
        ORDER BY created_at DESC
        LIMIT 1
      `);
      const attitudeData = attitudeStmt.get(conversationId);
      if (attitudeData && attitudeData.content) {
        // 如果content是JSON，解析它；否则直接使用
        try {
          const parsed = JSON.parse(attitudeData.content);
          const affinityChange = parsed.affinityChange || conversation?.affinity_change || 0;
          attitudeAnalysis = {
            description: parsed.description || parsed.content || attitudeData.content,
            affinityChange: affinityChange,
            trend: parsed.trend || (affinityChange > 0 ? '上升' : affinityChange < 0 ? '下降' : '持平')
          };
        } catch (e) {
          // 如果不是JSON，直接使用字符串，从conversation获取affinity_change
          const affinityChange = conversation?.affinity_change || 0;
          attitudeAnalysis = {
            description: attitudeData.content,
            affinityChange: affinityChange,
            trend: affinityChange > 0 ? '上升' : affinityChange < 0 ? '下降' : '持平'
          };
        }
      } else if (conversation) {
        // 如果没有专门的attitude_analysis，使用conversation的affinity_change作为基础
        const affinityChange = conversation.affinity_change || 0;
        attitudeAnalysis = {
          description: '本轮对话中，对方表现积极，互动良好。',
          affinityChange: affinityChange,
          trend: affinityChange > 0 ? '上升' : affinityChange < 0 ? '下降' : '持平'
        };
      }
    } catch (error) {
      console.error('Error getting attitude analysis:', error);
    }

    // 解析分析报告
    let parsedReport = null;
    if (analysisReport && analysisReport.content) {
      try {
        parsedReport = JSON.parse(analysisReport.content);
      } catch (e) {
        console.error('Failed to parse analysis report:', e);
      }
    }

    // 解析关键时刻评价
    const parsedKeyMoments = keyMoments.map(km => {
      let evaluation = null;
      if (km.content) {
        try {
          evaluation = JSON.parse(km.content);
        } catch (e) {
          evaluation = km.content; // 如果不是JSON，直接使用字符串
        }
      }
      return {
        id: km.id,
        timestamp: km.message_timestamp,
        messageContent: km.message_content,
        sender: km.sender,
        evaluation: evaluation
      };
    });

    const result = {
      analysisReport: parsedReport,
      keyMoments: parsedKeyMoments,
      attitudeAnalysis,
      actionSuggestions: actionSuggestions.map(as => ({
        id: as.id,
        title: as.title,
        content: as.content,
        tags: as.tags ? as.tags.split(',').map(t => t.trim()) : []
      }))
    };

    console.log(`[DB] Returning AI data:`, {
      hasAnalysisReport: !!result.analysisReport,
      keyMomentsCount: result.keyMoments.length,
      hasAttitudeAnalysis: !!result.attitudeAnalysis,
      actionSuggestionsCount: result.actionSuggestions.length
    });

    return result;
  }
  };
}