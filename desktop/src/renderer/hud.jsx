import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './hud.css';

const HUD_SUGGESTIONS = [
  {
    title: '提议具体地点',
    body: '"我知道附近有个很棒的公园，樱花特别美，要不要去那里？"',
    badges: ['主动', '体贴']
  },
  {
    title: '表达期待',
    body: '"太好了！我一直想和你一起去散步呢。"',
    badges: ['情感', '真诚']
  }
];

const getPointerCoords = (event) => {
  const x = event.screenX !== undefined && event.screenX !== null ? event.screenX : event.clientX;
  const y = event.screenY !== undefined && event.screenY !== null ? event.screenY : event.clientY;
  return { x, y };
};

function Hud() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const transcriptRef = useRef(null);
  const dragStateRef = useRef({ dragging: false, startX: 0, startY: 0 });

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const api = window.electronAPI;
      if (!api || !api.getRecentConversations || !api.getMessagesByConversation) {
        throw new Error('数据库API不可用');
      }

      const conversations = await api.getRecentConversations(1);
      if (!conversations?.length) {
        setMessages([]);
        return;
      }

      const conversationId = conversations[0].id;
      const fetchedMessages = await api.getMessagesByConversation(conversationId);
      setMessages(fetchedMessages || []);
    } catch (err) {
      console.error('加载对话失败：', err);
      setError(err instanceof Error ? err.message : '加载失败');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => loadMessages(), 0);
  }, [loadMessages]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const api = window.electronAPI;
      if (!dragStateRef.current.dragging || !api?.updateHUDDrag) return;
      const pos = getPointerCoords(event);
      api.updateHUDDrag(pos);
    };

    const handleMouseUp = () => {
      if (!dragStateRef.current.dragging) return;
      dragStateRef.current.dragging = false;
      setIsDragging(false);
      window.electronAPI?.endHUDDrag?.();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  const handleDragStart = (event) => {
    const api = window.electronAPI;
    if (!api?.startHUDDrag) return;
    const pos = getPointerCoords(event);
    dragStateRef.current = { dragging: true, startX: pos.x, startY: pos.y };
    setIsDragging(true);
    api.startHUDDrag(pos);
    event.preventDefault();
    event.stopPropagation();
  };

  const handleClose = () => {
    if (window.electronAPI?.closeHUD) {
      window.electronAPI.closeHUD();
    }
  };

  const renderTranscriptContent = () => {
    if (loading) {
      return (
        <div className="hud-status">
          <span className="hud-spinner" aria-hidden="true" />
          <p className="hud-status-text">加载中...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="hud-status hud-error">
          <p className="hud-status-text">加载失败：{error}</p>
        </div>
      );
    }

    if (!messages.length) {
      return (
        <div className="hud-status">
          <p className="hud-status-text">该对话还没有消息</p>
        </div>
      );
    }

    return messages.map((msg, index) => {
      const isUser = msg.sender === 'user';
      const key = msg.id ?? `${msg.sender}-${msg.timestamp ?? index}`;
      return (
        <div className={`message-item ${isUser ? 'message-user' : 'message-other'}`} key={key}>
          <div className="message-bubble">{msg.content || msg.text || ''}</div>
        </div>
      );
    });
  };

  return (
    <div className="hud-container">
      <header className="hud-header">
        <div
          className={`hud-drag-zone ${isDragging ? 'hud-dragging' : ''}`}
          onMouseDown={handleDragStart}
          title="拖拽HUD"
        >
          <span className="status-indicator" />
          <span className="hud-title">心情助手</span>
        </div>
        <div className="hud-controls">
          <button className="control-btn" onClick={handleClose} aria-label="关闭 HUD">
            ×
          </button>
        </div>
      </header>

      <section className="hud-section">
        <div className="section-label">最近互动</div>
        <div className="transcript-area" ref={transcriptRef}>
          {renderTranscriptContent()}
        </div>
      </section>

      <section className="hud-section">
        <div className="section-label">AI 建议</div>
        <div className="suggestions-grid">
          {HUD_SUGGESTIONS.map((suggestion) => (
            <article className="suggestion-card" key={suggestion.title}>
              <div className="suggestion-header">
                <strong>{suggestion.title}</strong>
              </div>
              <p className="suggestion-body">{suggestion.body}</p>
              <div className="suggestion-meta">
                {suggestion.badges.map((badge) => (
                  <span className="suggestion-badge" key={badge}>
                    {badge}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const hudRoot = document.getElementById('hud-root');
if (hudRoot) {
  ReactDOM.createRoot(hudRoot).render(
    <React.StrictMode>
      <Hud />
    </React.StrictMode>
  );
} else {
  console.error('HUD root element not found');
}

