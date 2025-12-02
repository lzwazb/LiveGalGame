# Agent 开发说明（占位版）

> 目标：让协作同学在不踩坑的情况下快速接入 / 替换 Agent‑LLM 后端。当前实现为本地 Python mock，接口稳定，可在此基础上逐步替换为真实模型与记忆逻辑。

## 1. 范围与现状
- 作用：接收对话上下文（含最新 ASR 文本），返回 AI 建议（可流式）。
- 现状：内置 mock（`src/agent/agent_worker.py`），无真实推理/记忆，仅供前端联调。
- 默认通路：Electron 主进程通过 stdin/stdout 与 Python worker 通信；渲染层通过 IPC (`agent-run` / `agent-run-stream`) 调用。

## 2. 架构与数据流
```
ASR sentence_complete
        │
        ▼
   主进程 (IPCManager)
        │ IPC invoke / stream
        ▼
   AgentService (Node)
        │ spawn + JSONL over stdin/stdout
        ▼
   agent_worker.py (Python)
        │ emits partial/final JSON lines
        ▼
   主进程转发 → 渲染层 HUD/页面
```
- 通信方式：JSON 每行一条（JSONL），UTF‑8。
- 流式：Python 侧可发送多条 `event=partial`，最后 `event=final`。

## 3. 接口契约
### 3.1 请求（主进程 → Python）
```json
{
  "id": "uuid",
  "type": "run",
  "stream": true,
  "payload": {
    "latest_text": "string",
    "history": [ { "role": "user|partner", "text": "..." } ],
    "character": { "name": "...", "tags": ["..."] },
    "conversation_id": "uuid",
    "lang": "zh|en|..."
  }
}
```

### 3.2 响应事件（Python → 主进程）
- `partial`
```json
{ "id": "...", "event": "partial", "data": { "stage": "thinking|draft|...", "text": "..." } }
```
- `final`
```json
{
  "id": "...",
  "event": "final",
  "data": {
    "suggestions": [
      { "title": "string", "content": "string", "tags": ["..."], "affinity_delta": 3, "confidence": 0.54 }
    ],
    "rationale": "why these suggestions",
    "safety_flags": []
  }
}
```
- `error`（可选）
```json
{ "id": "...", "event": "error", "data": { "code": "internal_error", "message": "..." } }
```

### 3.3 渲染层 API（preload 暴露）
- 非流式：`window.electronAPI.agentRun(payload)` → Promise<final>
- 流式：`window.electronAPI.agentRunStream(payload)` 返回 `{requestId}`；在 `onAgentStream(cb)` 里收到 `{requestId, event, data}`。

## 4. 运行与依赖
- Python 3.8+，默认解释器：`python3`；可用 `AGENT_PYTHON_PATH` 指定。
- 启动：主进程懒加载。独立测试：
  ```bash
  cd desktop
  echo '{"type":"run","payload":{"latest_text":"你好"},"stream":true}' | python3 src/agent/agent_worker.py
  ```
- 日志：stdout 用于协议；stderr 前缀 `[AgentWorker]`。

## 5. 节流与超时建议
- 触发：ASR sentence_complete 或用户显式点击；避免对每个 partial 调用。
- 并发：同一会话串行，1 在跑 + 1 排队。
- 超时：主进程侧 8~12s 超时，超时返回降级提示。

## 6. 回退/降级
- Worker 崩溃：AgentService 清空 pending，下一次调用重启；调用方应提示“AI 暂不可用”。
- 限流/超时：返回 `event=error`，主进程转换为可展示提示。

## 7. 记忆/向量检索（规划）
- 分层记忆：短窗 + 摘要 + 向量召回（bge/MiniLM），存 SQLite + 内存检索；尚未实现。
- 召回打分：相似度 + 时效衰减；在输出中标注引用来源。

## 8. 安全与隐私
- API Key 仅存主进程/DB，Python 通过环境变量传入。
- 输出过滤：长度上限、危险词/PII 粗过滤（待实现）。

## 9. 常见问题
- **没有 partial？** 确认 `stream=true` 且已监听 `onAgentStream`。
- **worker 不启动？** 检查 `AGENT_PYTHON_PATH` 或 `.venv/bin/python`；看主进程控制台。
- **如何关掉 Agent？** 暂无开关，可在主进程调用前加环境变量 `AGENT_DISABLED=1`（待实现）。

## 10. 变更流程（建议）
- 兼容：新增字段向后兼容；破坏性变更用 `api_version`。
- 发布：先保持契约，在 worker 内替换逻辑；保留 `--mock` 开关便于回滚。

---
Owner: @TODO  
最后更新：2025-12-02
