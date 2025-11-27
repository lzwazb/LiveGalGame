import { app, BrowserWindow } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { ASR_MODEL_PRESETS, getAsrModelPreset } from '../shared/asr-models.js';

const DOWNLOAD_SCRIPT = path.join(app.getAppPath(), 'scripts', 'download_asr_model.py');

function safeReaddir(targetPath) {
  try {
    return fs.readdirSync(targetPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function directorySize(targetPath) {
  let total = 0;
  const stack = [targetPath];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      try {
        if (entry.isDirectory()) {
          stack.push(fullPath);
        } else if (entry.isFile()) {
          const stat = fs.statSync(fullPath);
          total += stat.size;
        }
      } catch {
        // Ignore files that disappear mid-scan
      }
    }
  }
  return total;
}

export default class ASRModelManager extends EventEmitter {
  constructor() {
    super();
    this.cacheDir = process.env.ASR_CACHE_DIR
      || (process.env.HF_HOME ? path.join(process.env.HF_HOME, 'hub') : path.join(app.getPath('userData'), 'hf-home', 'hub'));
    fs.mkdirSync(this.cacheDir, { recursive: true });

    this.pythonPath = this.detectPythonPath();
    this.activeDownloads = new Map(); // modelId -> download context
  }

  detectPythonPath() {
    const envPython = process.env.ASR_PYTHON_PATH;
    if (envPython && fs.existsSync(envPython)) {
      return envPython;
    }
    const projectRoot = app.isPackaged
      ? path.join(process.resourcesPath, '..')
      : app.getAppPath();
    const candidates = [
      path.join(projectRoot, '.venv', 'bin', 'python'),
      path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
      'python3',
      'python',
    ];
    for (const candidate of candidates) {
      try {
        if (candidate.includes(path.sep) && fs.existsSync(candidate)) {
          return candidate;
        }
      } catch {
        // ignore
      }
    }
    return 'python3';
  }

  getModelPresets() {
    return ASR_MODEL_PRESETS;
  }

  findSnapshotDir(preset) {
    const repoSafe = `models--${preset.repoId.replace('/', '--')}`;
    const repoRoot = path.join(this.cacheDir, repoSafe);
    if (!fs.existsSync(repoRoot)) {
      return null;
    }
    const refsDir = path.join(repoRoot, 'refs');
    let snapshotSha = null;
    const preferredRefs = ['main', 'default', 'refs/head/main'];
    for (const refName of preferredRefs) {
      const refPath = path.join(refsDir, refName);
      if (fs.existsSync(refPath)) {
        try {
          snapshotSha = fs.readFileSync(refPath, 'utf-8').trim();
          if (snapshotSha) break;
        } catch {
          // ignore
        }
      }
    }
    const snapshotsDir = path.join(repoRoot, 'snapshots');
    if (!snapshotSha) {
      const snapshots = safeReaddir(snapshotsDir).filter((entry) => entry.isDirectory());
      snapshots.sort((a, b) => {
        try {
          const aStat = fs.statSync(path.join(snapshotsDir, a.name));
          const bStat = fs.statSync(path.join(snapshotsDir, b.name));
          return bStat.mtimeMs - aStat.mtimeMs;
        } catch {
          return 0;
        }
      });
      snapshotSha = snapshots.length > 0 ? snapshots[0].name : null;
    }
    if (!snapshotSha) {
      return null;
    }
    const snapshotPath = path.join(snapshotsDir, snapshotSha);
    return fs.existsSync(snapshotPath) ? snapshotPath : null;
  }

  getModelStatus(modelId) {
    const preset = getAsrModelPreset(modelId);
    if (!preset) {
      return null;
    }
    const snapshotPath = this.findSnapshotDir(preset);
    let downloadedBytes = 0;
    let updatedAt = null;
    if (snapshotPath) {
      downloadedBytes = directorySize(snapshotPath);
      try {
        const stat = fs.statSync(snapshotPath);
        updatedAt = stat.mtimeMs;
      } catch {
        updatedAt = null;
      }
    }
    const targetSize = preset.sizeBytes || 0;
    const isDownloaded = targetSize
      ? downloadedBytes >= targetSize * 0.98
      : downloadedBytes > 0;
    return {
      modelId,
      repoId: preset.repoId,
      sizeBytes: targetSize,
      downloadedBytes,
      isDownloaded,
      snapshotPath,
      updatedAt,
      activeDownload: this.activeDownloads.has(modelId),
    };
  }

  startDownload(modelId) {
    if (this.activeDownloads.has(modelId)) {
      return { status: 'running' };
    }
    const preset = getAsrModelPreset(modelId);
    if (!preset) {
      throw new Error(`Unknown ASR model: ${modelId}`);
    }
    const pythonExecutable = this.pythonPath;
    if (!pythonExecutable) {
      throw new Error('Python executable not found');
    }
    const jobs = Math.max(2, Math.min(8, Math.floor((os.cpus()?.length || 4) / 2)) || 2);
    const args = [
      DOWNLOAD_SCRIPT,
      '--model-id',
      preset.id,
      '--repo-id',
      preset.repoId,
      '--cache-dir',
      this.cacheDir,
      '--jobs',
      String(jobs),
    ];
    const env = {
      ...process.env,
      ASR_CACHE_DIR: this.cacheDir,
      PYTHONIOENCODING: 'utf-8',
    };
    const child = spawn(pythonExecutable, args, { env });
    const downloadCtx = {
      modelId,
      repoId: preset.repoId,
      child,
      totalBytes: preset.sizeBytes || null,
      snapshotPath: null,
      timer: null,
    };
    this.activeDownloads.set(modelId, downloadCtx);
    this.broadcast('asr-model-download-started', {
      modelId,
      repoId: preset.repoId,
    });
    let stdoutBuffer = '';
    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';
      lines.forEach((line) => this.handleScriptMessage(downloadCtx, line));
    });
    child.stderr.on('data', (chunk) => {
      const message = chunk.toString();
      this.broadcast('asr-model-download-log', {
        modelId,
        repoId: preset.repoId,
        message,
      });
    });
    const finalize = (code, signal) => {
      if (downloadCtx.timer) {
        clearInterval(downloadCtx.timer);
      }
      this.activeDownloads.delete(modelId);
      const status = this.getModelStatus(modelId);
      if (code === 0) {
        this.broadcast('asr-model-download-complete', {
          modelId,
          repoId: preset.repoId,
          status,
        });
      } else {
        this.broadcast('asr-model-download-error', {
          modelId,
          repoId: preset.repoId,
          code,
          signal,
        });
      }
    };
    child.on('close', (code, signal) => finalize(code, signal));
    child.on('error', (error) => {
      this.broadcast('asr-model-download-error', {
        modelId,
        repoId: preset.repoId,
        message: error.message,
      });
      finalize(1, null);
    });
    return { status: 'started' };
  }

  handleScriptMessage(ctx, line) {
    if (!line.trim()) return;
    let payload;
    try {
      payload = JSON.parse(line);
    } catch {
      this.broadcast('asr-model-download-log', {
        modelId: ctx.modelId,
        repoId: ctx.repoId,
        message: line,
      });
      return;
    }
    if (payload.event === 'manifest') {
      if (payload.totalBytes) {
        ctx.totalBytes = payload.totalBytes;
      }
      if (payload.snapshotRelativePath) {
        ctx.snapshotPath = path.isAbsolute(payload.snapshotRelativePath)
          ? payload.snapshotRelativePath
          : path.join(this.cacheDir, payload.snapshotRelativePath);
      }
      if (!ctx.timer) {
        ctx.timer = setInterval(() => this.emitProgress(ctx), 1000);
      }
    } else if (payload.event === 'completed') {
      this.emitProgress(ctx, true);
    } else if (payload.event === 'error') {
      this.broadcast('asr-model-download-error', {
        modelId: ctx.modelId,
        repoId: ctx.repoId,
        message: payload.message,
      });
    } else if (payload.event === 'cancelled') {
      this.broadcast('asr-model-download-cancelled', {
        modelId: ctx.modelId,
        repoId: ctx.repoId,
      });
    }
  }

  emitProgress(ctx, force = false) {
    if (!ctx.snapshotPath) {
      return;
    }
    const downloadedBytes = directorySize(ctx.snapshotPath);
    const totalBytes = ctx.totalBytes || downloadedBytes;
    this.broadcast('asr-model-download-progress', {
      modelId: ctx.modelId,
      repoId: ctx.repoId,
      downloadedBytes,
      totalBytes,
    });
    if (force && ctx.timer) {
      clearInterval(ctx.timer);
      ctx.timer = null;
    }
  }

  cancelDownload(modelId) {
    const ctx = this.activeDownloads.get(modelId);
    if (!ctx) {
      return { status: 'idle' };
    }
    if (ctx.child) {
      ctx.child.kill('SIGINT');
    }
    if (ctx.timer) {
      clearInterval(ctx.timer);
    }
    this.activeDownloads.delete(modelId);
    this.broadcast('asr-model-download-cancelled', {
      modelId,
      repoId: ctx.repoId,
    });
    return { status: 'cancelled' };
  }

  shutdown() {
    this.activeDownloads.forEach((ctx, modelId) => {
      if (ctx.child) {
        try {
          ctx.child.kill('SIGINT');
        } catch {
          // ignore
        }
      }
      if (ctx.timer) {
        clearInterval(ctx.timer);
      }
      this.broadcast('asr-model-download-cancelled', {
        modelId,
        repoId: ctx.repoId,
      });
    });
    this.activeDownloads.clear();
  }

  broadcast(channel, payload) {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send(channel, payload);
    });
  }
}

