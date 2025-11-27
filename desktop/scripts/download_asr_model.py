#!/usr/bin/env python3
"""
Download a Faster-Whisper model snapshot with progress metadata.
Outputs newline-delimited JSON that can be consumed by the Electron main process.
"""

import argparse
import json
import os
import sys
import traceback
from typing import Tuple

try:
    from huggingface_hub import HfApi, snapshot_download
except ImportError:
    print(json.dumps({
        "event": "error",
        "message": "huggingface_hub is not installed. Please ensure faster-whisper is installed.",
    }))
    sys.exit(1)


def emit(event: str, **payload):
    """Emit a JSON event to stdout."""
    data = {"event": event}
    data.update(payload)
    sys.stdout.write(json.dumps(data, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def resolve_cache_dir(explicit: str = None) -> str:
    if explicit:
        return explicit
    env_cache = os.environ.get("ASR_CACHE_DIR")
    if env_cache:
        return env_cache
    hf_home = os.environ.get("HF_HOME")
    if hf_home:
        return os.path.join(hf_home, "hub")
    return os.path.expanduser("~/.cache/huggingface/hub")


def collect_repo_metadata(api: HfApi, repo_id: str, revision: str) -> Tuple[int, str, int]:
    """Return (total_bytes, snapshot_sha, file_count)."""
    info = api.model_info(repo_id, revision=revision)
    tree = api.list_repo_tree(repo_id=repo_id, revision=revision, recursive=True)
    total = 0
    files = 0
    for node in tree:
        if node.type == "file":
            files += 1
            if node.size:
                total += int(node.size)
    return total, info.sha, files


def main():
    parser = argparse.ArgumentParser(description="Download a Faster-Whisper model with JSON progress output")
    parser.add_argument("--model-id", required=True, help="Short model id (tiny/base/...)")
    parser.add_argument("--repo-id", required=True, help="HuggingFace repo id, e.g. Systran/faster-whisper-small")
    parser.add_argument("--revision", default="main", help="Repo revision/tag (default: main)")
    parser.add_argument("--cache-dir", help="Cache directory (defaults to ASR_CACHE_DIR or HF cache)")
    parser.add_argument("--jobs", type=int, default=4, help="Max parallel download workers (default: 4)")
    args = parser.parse_args()

    cache_dir = resolve_cache_dir(args.cache_dir)
    os.makedirs(cache_dir, exist_ok=True)

    api = HfApi()

    try:
        total_bytes, snapshot_sha, file_count = collect_repo_metadata(api, args.repo_id, args.revision)
        repo_safe = f"models--{args.repo_id.replace('/', '--')}"
        snapshot_rel = os.path.join(repo_safe, "snapshots", snapshot_sha)

        emit(
            "manifest",
            modelId=args.model_id,
            repoId=args.repo_id,
            totalBytes=total_bytes,
            fileCount=file_count,
            cacheDir=os.path.abspath(cache_dir),
            snapshotSha=snapshot_sha,
            snapshotRelativePath=snapshot_rel,
        )

        local_dir = snapshot_download(
            repo_id=args.repo_id,
            revision=args.revision,
            cache_dir=cache_dir,
            resume_download=True,
            max_workers=max(1, args.jobs),
            local_dir_use_symlinks=False,
        )

        emit(
            "completed",
            modelId=args.model_id,
            repoId=args.repo_id,
            totalBytes=total_bytes,
            snapshotSha=snapshot_sha,
            localDir=local_dir,
        )
    except KeyboardInterrupt:
        emit("cancelled", modelId=args.model_id, message="Download cancelled by user")
        sys.exit(1)
    except Exception as exc:
        emit("error", modelId=args.model_id, message=str(exc), traceback=traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()

