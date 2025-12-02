"""
Minimal JSONL-based Agent worker.

读取 stdin 的 JSON 行，写入 stdout（每行一个 JSON）。
事件：
  - partial：流式中间结果
  - final：最终结构化建议

当前是占位实现，返回固定建议，便于前端联调。
"""

import json
import sys
import time
import uuid
from typing import Any, Dict


def log(message: str) -> None:
    sys.stderr.write(f"[AgentWorker] {message}\n")
    sys.stderr.flush()


def send(obj: Dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def build_mock_final(request_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    latest = payload.get("latest_text", "") or "（空）"
    suggestions = [
        {
            "title": "共情回应",
            "content": f"听起来你在说「{latest[:40]}...」，我理解你的感受，可以这样回应：‘嗯，我在听，你继续说～’",
            "tags": ["共情", "倾听"],
            "affinity_delta": 5,
            "confidence": 0.62,
        },
        {
            "title": "推进话题",
            "content": "顺着对方话题抛一个轻量问题：‘那件事后来怎么样了？’",
            "tags": ["推进", "提问"],
            "affinity_delta": 3,
            "confidence": 0.54,
        },
    ]
    return {
        "id": request_id,
        "event": "final",
        "data": {
            "suggestions": suggestions,
            "rationale": "基于最新转写内容给出两条可选建议（占位实现）。",
            "safety_flags": [],
        },
    }


def handle_run(msg: Dict[str, Any]) -> None:
    request_id = msg.get("id") or str(uuid.uuid4())
    payload = msg.get("payload", {}) or {}
    stream = bool(msg.get("stream"))

    if stream:
        send({"id": request_id, "event": "partial", "data": {"stage": "thinking", "text": "分析上下文中..."}})
        time.sleep(0.1)
        send({"id": request_id, "event": "partial", "data": {"stage": "draft", "text": "生成候选建议..."}})
        time.sleep(0.1)

    final_msg = build_mock_final(request_id, payload)
    send(final_msg)


def main() -> None:
    log("Agent worker started (mock mode).")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            log(f"Invalid JSON: {line[:80]}")
            continue

        msg_type = msg.get("type")
        if msg_type == "run":
            handle_run(msg)
        elif msg_type == "ping":
            send({"id": msg.get("id"), "event": "pong"})
        else:
            log(f"Unknown message type: {msg_type}")


if __name__ == "__main__":
    main()
