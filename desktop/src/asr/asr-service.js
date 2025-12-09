import fs from 'fs';
import os from 'os';
import path from 'path';
import { app } from 'electron';
import { spawn } from 'child_process';
import { setTimeout as delay } from 'node:timers/promises';
import killPort from 'kill-port';
import portfinder from 'portfinder';
import WebSocket from 'ws';
import treeKill from 'tree-kill';
import * as logger from '../utils/logger.js';
import { getAsrModelPreset } from '../shared/asr-models.js';

const PCM_SAMPLE_RATE = 16000;
const DEFAULT_HOST = '127.0.0.1';
const SERVER_READY_TEXT = 'Application startup complete';

function safeDirSize(targetPath) {
  try {
    const stat = fs.statSync(targetPath, { throwIfNoEntry: false });
    if (!stat) return 0;
    if (stat.isFile()) return stat.size;
    if (!stat.isDirectory()) return 0;
    let total = 0;
    const stack = [targetPath];
    while (stack.length) {
      const dir = stack.pop();
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isFile()) {
          try {
            total += fs.statSync(full).size;
          } catch {
            // ignore stat errors
          }
        } else if (entry.isDirectory()) {
          stack.push(full);
        }
      }
    }
    return total;
  } catch {
    return 0;
  }
}

function getRepoPathsForModel(preset, cacheDir) {
  const paths = [];
  if (!preset || !cacheDir) return paths;

  if (preset.repoId) {
    const repoSafe = `models--${preset.repoId.replace(/\//g, '--')}`;
    paths.push(path.join(cacheDir, repoSafe));
  }
  if (preset.modelScopeRepoId) {
    paths.push(path.join(cacheDir, 'models', preset.modelScopeRepoId));
    paths.push(path.join(cacheDir, preset.modelScopeRepoId));
    // 额外加入默认的 ModelScope 全局缓存目录，避免进度一直为 0
    paths.push(path.join(os.homedir(), '.cache', 'modelscope', 'hub', 'models', preset.modelScopeRepoId));
    paths.push(path.join(os.homedir(), '.cache', 'modelscope', 'hub', preset.modelScopeRepoId));
  }

  // FunASR onnx 模型也需要参与缓存探测（funasr_onnx 默认放在 modelscope 下）
  if (preset.onnxModels) {
    const modelDirs = Array.from(new Set(Object.values(preset.onnxModels).filter(Boolean)));
    modelDirs.forEach((modelDir) => {
      paths.push(path.join(cacheDir, modelDir));
      paths.push(path.join(cacheDir, 'models', modelDir));
    });
  }
  return paths;
}

function cleanModelScopeLocks(cacheDir, maxAgeMs = 10 * 60 * 1000) {
  if (!cacheDir) return;
  const lockDir = path.join(cacheDir, '.lock');
  try {
    const entries = fs.readdirSync(lockDir, { withFileTypes: true });
    const now = Date.now();
    entries.forEach((entry) => {
      if (!entry.isFile()) return;
      const full = path.join(lockDir, entry.name);
      try {
        const stat = fs.statSync(full);
        if (stat.mtimeMs < now - maxAgeMs) {
          fs.unlinkSync(full);
          logger.log(`[ASR] Removed stale ModelScope lock: ${entry.name}`);
        }
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore if lock dir missing
  }
}

function float32ToInt16Buffer(floatArray) {
  const int16Array = new Int16Array(floatArray.length);
  for (let i = 0; i < floatArray.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, floatArray[i]));
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  return Buffer.from(int16Array.buffer);
}

function ensureDir(dirPath) {
  if (!dirPath) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function getModelCacheCandidates() {
  const homeDir = os.homedir();
  const userDataDir = app.getPath('userData');
  return [
    process.env.MODELSCOPE_CACHE,
    process.env.ASR_CACHE_DIR,
    process.env.HF_HOME ? path.join(process.env.HF_HOME, 'hub') : null,
    path.join(userDataDir, 'hf-home', 'hub'),
    path.join(userDataDir, 'ms-cache'),
    homeDir ? path.join(homeDir, '.cache', 'huggingface', 'hub') : null,
    homeDir ? path.join(homeDir, '.cache', 'modelscope', 'hub') : null,
  ].filter(Boolean);
}

function resolveModelCache(modelName) {
  const preset = getAsrModelPreset(modelName);
  const repoId = preset?.repoId || (typeof modelName === 'string' && modelName.includes('/') ? modelName : null);
  const repoSafe = repoId ? `models--${repoId.replace(/\//g, '--')}` : null;
  const msRepoId = preset?.modelScopeRepoId;
  const candidates = getModelCacheCandidates();

  // 优先使用已存在的缓存目录
  for (const candidate of candidates) {
    try {
      if (repoSafe && fs.existsSync(path.join(candidate, repoSafe))) {
        return { cacheDir: candidate, found: true };
      }
      if (msRepoId && fs.existsSync(path.join(candidate, 'models', msRepoId))) {
        return { cacheDir: candidate, found: true };
      }
    } catch {
      // ignore and continue
    }
  }

  // 如果 ModelScope 默认目录存在目标模型，也直接使用
  if (msRepoId) {
    const msDefault = path.join(os.homedir(), '.cache', 'modelscope', 'hub');
    if (fs.existsSync(path.join(msDefault, 'models', msRepoId))) {
      return { cacheDir: msDefault, found: true };
    }
  }

  return { cacheDir: candidates[0] || path.join(app.getPath('userData'), 'hf-home', 'hub'), found: false };
}

// 针对 funasr_onnx：优先复用已存在的 ModelScope 缓存目录，避免重复下载
function resolveFunasrModelScopeCache(preset) {
  if (!preset?.onnxModels) {
    return null;
  }
  const modelDirs = Array.from(new Set(Object.values(preset.onnxModels).filter(Boolean)));
  
  // 1. 优先检查系统默认 ModelScope 缓存目录 (~/.cache/modelscope/hub)
  // 这是 funasr_onnx 库默认下载的位置，如果模型已存在则直接使用，避免重复下载
  const systemMsCache = path.join(os.homedir(), '.cache', 'modelscope', 'hub');
  try {
    let systemHit = false;
    let systemBytes = 0;
    for (const dir of modelDirs) {
      const p1 = path.join(systemMsCache, dir);
      const p2 = path.join(systemMsCache, 'models', dir);
      if (fs.existsSync(p1)) {
        systemHit = true;
        systemBytes += safeDirSize(p1);
      } else if (fs.existsSync(p2)) {
        systemHit = true;
        systemBytes += safeDirSize(p2);
      }
    }
    // 如果系统目录有模型（至少找到一个），优先使用系统目录
    if (systemHit && systemBytes > 0) {
      return { cacheDir: systemMsCache, found: true };
    }
  } catch {
    // ignore and continue
  }
  
  // 2. 检查其他候选目录，选择模型最完整的
  const candidates = getModelCacheCandidates();
  let best = null;
  let bestBytes = -1;
  for (const candidate of candidates) {
    // 跳过系统目录（已在上面检查过）
    if (candidate === systemMsCache) continue;
    
    try {
      let hit = false;
      let bytes = 0;
      for (const dir of modelDirs) {
        const p1 = path.join(candidate, dir);
        const p2 = path.join(candidate, 'models', dir);
        if (fs.existsSync(p1)) {
          hit = true;
          bytes += safeDirSize(p1);
        } else if (fs.existsSync(p2)) {
          hit = true;
          bytes += safeDirSize(p2);
        }
      }
      if (hit && bytes > bestBytes) {
        best = { cacheDir: candidate, found: true };
        bestBytes = bytes;
      }
    } catch {
      // ignore and continue
    }
  }
  if (best) return best;
  
  // 3. 如果都没有，使用系统默认目录（funasr_onnx 会下载到这里）
  return { cacheDir: systemMsCache, found: false };
}

function detectPythonPath() {
  const envPython = process.env.ASR_PYTHON_PATH;
  if (envPython && fs.existsSync(envPython)) {
    return envPython;
  }
  const projectRoot = path.resolve(app.getAppPath(), app.isPackaged ? '../..' : '.');
  const venvPy = path.join(projectRoot, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python3');
  if (fs.existsSync(venvPy)) {
    return venvPy;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

class FastAPISession {
  constructor(ws, sourceId, onSentence, onPartial) {
    this.ws = ws;
    this.sourceId = sourceId;
    this.onSentence = onSentence;
    this.onPartial = onPartial;
    this.bind();
  }

  setCallbacks(onSentence, onPartial) {
    this.onSentence = onSentence;
    this.onPartial = onPartial;
  }

  bind() {
    this.ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (!payload) return;
        if (payload.type === 'sentence_complete' && this.onSentence) {
          this.onSentence({
            sessionId: payload.session_id || this.sourceId,
            text: payload.text,
            timestamp: payload.timestamp,
            trigger: payload.trigger || 'asr',
            audioDuration: payload.audio_duration,
            language: payload.language,
            isSegmentEnd: payload.isSegmentEnd || payload.is_segment_end,
            // 多句分发模式支持
            sentenceIndex: payload.sentence_index,
            totalSentences: payload.total_sentences,
            rawText: payload.raw_text,
            startTime: payload.start_time,
            endTime: payload.end_time,
          });
        } else if (payload.type === 'partial' && this.onPartial) {
          this.onPartial({
            sessionId: payload.session_id || this.sourceId,
            partialText: payload.text,
            fullText: payload.full_text,
            timestamp: payload.timestamp,
            isSpeaking: true,
          });
        }
      } catch (error) {
        logger.warn('[ASR][WS] Failed to parse message:', error);
      }
    });
  }

  sendAudio(buffer) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(buffer);
    }
  }

  sendControl(payload) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  reset() {
    this.sendControl({ type: 'reset_session' });
  }

  close() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.ws.close();
    }
  }
}

class ASRService {
  constructor() {
    this.modelName = 'funasr-paraformer';
    this.engine = 'funasr';
    this.pythonPath = detectPythonPath();
    this.isInitialized = false;
    this.lastProgressBytes = 0;
    this.lastProgressTimestamp = 0;
    this.modelPreset = null;
    this.modelCacheDir = null;
    this.modelCacheFound = false;
    this.modelCachePreDownloaded = false;
    this.shouldReportProgress = true;
    this.serverProcess = null;
    this.isDownloading = false;
    this.serverHost = DEFAULT_HOST;
    this.serverPort = null;
    this.serverReady = false;
    this.sessions = new Map();
    this.onSentenceComplete = null;
    this.onPartialResult = null;
    this.onServerCrash = null;
    this.progressEmitter = null;
    this.retainAudioFiles = false;
    this.audioStoragePath = path.join(app.getPath('temp'), 'asr');
    ensureDir(this.audioStoragePath);
    this.isStopping = false; // 标记是否为预期的关闭，避免误报崩溃
  }

  setServerCrashCallback(callback) {
    this.onServerCrash = callback;
  }

  setProgressEmitter(emitter) {
    this.progressEmitter = emitter;
  }

  emitDownloadProgress(payload = {}) {
    if (typeof this.progressEmitter !== 'function') return;
    this.progressEmitter({
      modelId: this.modelName,
      engine: this.engine,
      source: payload.source || 'preload',
      ...payload,
    });
  }

  async initialize(modelName = 'funasr-paraformer', options = {}) {
    this.modelName = modelName || this.modelName;
    const preset = getAsrModelPreset(modelName);
    this.modelPreset = preset;
    this.engine = preset?.engine || 'funasr';
    this.retainAudioFiles = options.retainAudioFiles || false;
    this.audioStoragePath = options.audioStoragePath || this.audioStoragePath;
    ensureDir(this.audioStoragePath);

    // 确保服务器在预加载时就启动（不要懒加载）
    if (!this.serverProcess) {
      await this.startBackendServer();
    } else if (!this.serverReady) {
      // 如果进程存在但还没准备好，等待健康检查
      await this.waitForHealth();
    }
    this.serverReady = true;
    this.isInitialized = true;
    return true;
  }

  async startBackendServer() {
    // Pick a free port dynamically
    const port = await portfinder.getPortPromise({ port: Number(process.env.ASR_PORT) || 18000 });
    this.serverPort = port;
    this.isDownloading = false;

    try {
      await killPort(port);
    } catch {
      // ignore
    }

    const projectRoot = app.getAppPath();
    const binName = process.platform === 'win32' ? 'asr-backend.exe' : 'asr-backend';
    const packagedBin = path.join(process.resourcesPath, 'backend', 'asr-backend', binName);
    const backendEntry = app.isPackaged && fs.existsSync(packagedBin)
      ? packagedBin
      : path.join(projectRoot, 'backend', 'main.py');

    const useBinary = app.isPackaged && fs.existsSync(packagedBin);

    if (!fs.existsSync(backendEntry)) {
      throw new Error(`[ASR] Backend entry not found: ${backendEntry}`);
    }

    const { cacheDir, found } = resolveModelCache(this.modelName);
    this.modelCacheDir = cacheDir;
    this.modelCacheFound = found;

    // FunASR 模型：尝试自动复用已存在的 ModelScope 缓存，避免重复下载
    let msCacheEnv = process.env.MODELSCOPE_CACHE || path.join(app.getPath('userData'), 'ms-cache');
    if (this.engine === 'funasr' && this.modelPreset?.onnxModels) {
      const funasrMs = resolveFunasrModelScopeCache(this.modelPreset);
      if (funasrMs?.cacheDir) {
        logger.log(`[ASR] FunASR ModelScope cache resolved: ${funasrMs.cacheDir} (found=${funasrMs.found})`);
        msCacheEnv = funasrMs.cacheDir;
        if (funasrMs.found) {
          // 记录已存在缓存，便于后续进度判定
          this.modelCacheFound = true;
          logger.log(`[ASR] Using existing ModelScope cache at: ${msCacheEnv}`);
        }
      }
    }

    // 计算已有缓存，若已下载完成则不再上报进度
    const presetSize = this.modelPreset?.sizeBytes || null;
    const repoPathsSet = new Set(getRepoPathsForModel(this.modelPreset, cacheDir));
    // funasr 需要把 ModelScope onnx 目录也纳入探测
    if (this.engine === 'funasr' && this.modelPreset?.onnxModels && msCacheEnv) {
      getRepoPathsForModel(this.modelPreset, msCacheEnv).forEach((p) => repoPathsSet.add(p));
    }
    const repoPaths = Array.from(repoPathsSet);
    const initialDownloaded = repoPaths.length ? repoPaths.reduce((sum, p) => sum + safeDirSize(p), 0) : 0;
    const cachedEnough = presetSize
      ? initialDownloaded >= presetSize * 0.9
      : initialDownloaded > 50 * 1024 * 1024; // 没有 size 时粗判>50MB
    this.modelCachePreDownloaded = cachedEnough;
    this.shouldReportProgress = !cachedEnough;

    // Large 模型默认不使用量化，精度更高
    const isLargeModel = this.modelName.toLowerCase().includes('large');
    const useQuantize = this.modelPreset?.quantize !== false && !isLargeModel;

    // 如果检测到已有完整缓存，启用离线模式避免每次启动都联网检查版本
    const useOfflineMode = this.modelCacheFound && cachedEnough;
    
    const env = {
      ...process.env,
      ASR_ENGINE: this.engine,
      ASR_MODEL: this.modelName,
      ASR_HOST: this.serverHost,
      ASR_PORT: String(this.serverPort),
      ASR_QUANTIZE: useQuantize ? 'true' : 'false',
      HF_HOME: process.env.HF_HOME || path.join(app.getPath('userData'), 'hf-home'),
      ASR_CACHE_DIR: this.engine === 'funasr' ? msCacheEnv : cacheDir,
      MODELSCOPE_CACHE: msCacheEnv,
      MODELSCOPE_CACHE_HOME: msCacheEnv,
      // 启用离线模式：跳过 ModelScope 版本检查，直接使用本地缓存
      MODELSCOPE_OFFLINE: useOfflineMode ? '1' : '',
      HF_HUB_OFFLINE: useOfflineMode ? '1' : '',
      PYTHONUNBUFFERED: '1',
    };
    
    if (useOfflineMode) {
      logger.log(`[ASR] Offline mode enabled: using local cache without version check`);
    }

    ensureDir(env.HF_HOME);
    ensureDir(cacheDir);
    ensureDir(env.MODELSCOPE_CACHE);
    cleanModelScopeLocks(env.MODELSCOPE_CACHE);

    if (useBinary) {
      logger.log(`[ASR] Spawning packaged backend: ${backendEntry}`);
      this.serverProcess = spawn(backendEntry, [], { env });
    } else {
      logger.log(`[ASR] Spawning FastAPI backend: ${this.pythonPath} ${backendEntry} (engine=${this.engine}, model=${this.modelName}, port=${this.serverPort})`);
      this.serverProcess = spawn(this.pythonPath, [backendEntry], { env });
    }

    logger.log(`[ASR] cache dir: ${cacheDir} (found=${found})`);

    this.serverProcess.stdout.on('data', (data) => {
      const text = data.toString();
      logger.log(`[ASR Backend][stdout] ${text.trim()}`);
      if (text.includes(SERVER_READY_TEXT) || text.includes('Uvicorn running')) {
        this.serverReady = true;
      }
    });

    this.serverProcess.stderr.on('data', (data) => {
      const text = data.toString();
      const lines = text.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        logger.log(`[ASR Backend][stderr] ${line}`);

        // 简单关键字检测：只要出现 Downloading Model 视为正在下载
        if (!this.isDownloading && line.includes('Downloading Model')) {
          this.isDownloading = true;
        }
        // 下载完成/就绪的关键字，清除下载标记
        if (
          this.isDownloading &&
          (line.includes('All models loaded successfully')
            || line.includes('Worker is READY')
            || line.includes('Worker is READY!')
            || line.includes('Received READY signal'))
        ) {
          this.isDownloading = false;
        }
      }
    });

    this.serverProcess.on('close', (code, signal) => {
      const isExpectedStop = this.isStopping || code === 0;
      this.isDownloading = false;
      if (isExpectedStop) {
        logger.log(`[ASR Backend] exited normally (code=${code}, signal=${signal ?? 'none'})`);
      } else {
        logger.error(`[ASR Backend] exited with code ${code}, signal=${signal ?? 'none'}`);
        if (this.onServerCrash) {
          this.onServerCrash(code);
        }
      }
      this.serverProcess = null;
      this.serverReady = false;
      this.isStopping = false;
    });

    this.serverProcess.on('error', (error) => {
      logger.error('[ASR Backend] process error:', error);
      this.serverProcess = null;
      this.serverReady = false;
      this.isDownloading = false;
    });

    await this.waitForHealth();
  }

  async waitForHealth(timeoutMs = 180000) { // 默认 3 分钟，会在有下载进展时自动延长
    const start = Date.now();
    const maxTimeoutMs = Math.max(timeoutMs, 15 * 60 * 1000); // 最长 15 分钟
    let deadline = start + timeoutMs;
    let lastProgressSeenAt = start;
    const url = `http://${this.serverHost}:${this.serverPort}/health`;
    const totalSize = this.modelPreset?.sizeBytes || null;
    const repoPaths = getRepoPathsForModel(this.modelPreset, this.modelCacheDir);
    const calcDownloaded = () => {
      if (!repoPaths || repoPaths.length === 0) return 0;
      let downloaded = 0;
      for (const p of repoPaths) {
        downloaded += safeDirSize(p);
      }
      return downloaded;
    };

    // 预先发送一次进度，便于 UI 立即显示（仅首次下载时）
    if (this.shouldReportProgress && totalSize && repoPaths.length > 0) {
      const initialDownloaded = calcDownloaded();
      this.lastProgressBytes = initialDownloaded;
      this.lastProgressTimestamp = Date.now();
      this.emitDownloadProgress({
        status: 'start',
        downloadedBytes: initialDownloaded,
        totalBytes: totalSize,
        bytesPerSecond: 0,
        activeDownload: true,
      });
    }

    let lastReportAt = 0;
    let lastLogAt = 0;

    while (Date.now() < deadline) {
      try {
        // Node 20 has global fetch
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const finalDownloaded = calcDownloaded();
          if (this.shouldReportProgress) {
            this.emitDownloadProgress({
              status: 'complete',
              downloadedBytes: finalDownloaded,
              totalBytes: totalSize || finalDownloaded,
              bytesPerSecond: 0,
              activeDownload: false,
              isDownloaded: true,
            });
          }
          this.isDownloading = false;
          this.serverReady = true;
          return true;
        }
      } catch {
        // ignore
      }
      const waited = Date.now() - start;
      const now = Date.now();

      // 进度上报（每秒一次，避免频繁扫描目录）
      if (this.shouldReportProgress && now - lastReportAt >= 1000 && repoPaths.length > 0) {
        const downloaded = calcDownloaded();
        const deltaBytes = downloaded - this.lastProgressBytes;
        const deltaMs = now - this.lastProgressTimestamp || 1;
        const bytesPerSecond = deltaMs > 0 ? deltaBytes / (deltaMs / 1000) : 0;
        this.lastProgressBytes = downloaded;
        this.lastProgressTimestamp = now;
        lastReportAt = now;

        this.emitDownloadProgress({
          status: 'progress',
          downloadedBytes: downloaded,
          totalBytes: totalSize || downloaded,
          bytesPerSecond,
          activeDownload: true,
        });
        if (deltaBytes > 0) {
          lastProgressSeenAt = now;
          // 有进展则滚动延时，最多不超过 maxTimeoutMs
          const extended = Math.min(start + maxTimeoutMs, now + 120000); // 额外给 2 分钟窗口
          if (extended > deadline) {
            deadline = extended;
          }
        }

        // 日志保持原有节奏（约 5s 一次）
        if (now - lastLogAt >= 5000) {
          let progressText = '';
          if (totalSize) {
            const pct = Math.min(99, Math.max(0, Math.round((downloaded / totalSize) * 100)));
            progressText = ` (approx ${pct}% of model cached)`;
          }
          logger.log(`[ASR] Waiting for backend health... ${Math.round(waited / 1000)}s elapsed${progressText}`);
          lastLogAt = now;
        }
      }
      await delay(500);
    }
    if (this.shouldReportProgress) {
      this.emitDownloadProgress({
        status: 'error',
        downloadedBytes: this.lastProgressBytes,
        totalBytes: totalSize || this.lastProgressBytes,
        activeDownload: false,
        message: 'FastAPI backend health check timeout',
      });
    }
    throw new Error('FastAPI backend health check timeout');
  }

  getDownloadStatus() {
    return { downloading: this.isDownloading };
  }

  getSession(sourceId) {
    if (this.sessions.has(sourceId)) {
      return this.sessions.get(sourceId);
    }

    const wsUrl = `ws://${this.serverHost}:${this.serverPort}/ws/transcribe?session_id=${encodeURIComponent(sourceId)}`;
    const ws = new WebSocket(wsUrl);

    const session = new Promise((resolve, reject) => {
      ws.on('open', () => {
        const s = new FastAPISession(ws, sourceId, this.onSentenceComplete, this.onPartialResult);
        resolve(s);
      });
      ws.on('error', (err) => {
        this.sessions.delete(sourceId);
        reject(err);
      });
      ws.on('close', () => {
        this.sessions.delete(sourceId);
      });
    });

    this.sessions.set(sourceId, session);
    return session;
  }

  async addAudioChunk(audioData, timestamp, sourceId = 'default') {
    if (!this.isInitialized) {
      throw new Error('ASR service not initialized');
    }
    if (!audioData || audioData.length === 0) {
      return null;
    }
    if (!this.serverReady) {
      await this.waitForHealth();
    }

    const sessionPromise = this.getSession(sourceId);
    const session = await sessionPromise;
    const buffer = float32ToInt16Buffer(audioData);
    session.sendAudio(buffer);
    return null;
  }

  async sendResetCommand(sessionId) {
    const sessionPromise = this.sessions.get(sessionId);
    if (!sessionPromise) return;
    const session = await sessionPromise;
    session.reset();
  }

  async forceCommitSentence(sessionId) {
    const sessionPromise = this.sessions.get(sessionId);
    if (!sessionPromise) return false;
    const session = await sessionPromise;
    session.sendControl({ type: 'force_commit' });
    return true;
  }

  async commitSentence() {
    return null;
  }

  setSentenceCompleteCallback(callback) {
    this.onSentenceComplete = callback;
    this.sessions.forEach(async (sessionPromise) => {
      try {
        const session = await sessionPromise;
        session.setCallbacks(this.onSentenceComplete, this.onPartialResult);
      } catch {
        // ignore
      }
    });
  }

  setPartialResultCallback(callback) {
    this.onPartialResult = callback;
    this.sessions.forEach(async (sessionPromise) => {
      try {
        const session = await sessionPromise;
        session.setCallbacks(this.onSentenceComplete, this.onPartialResult);
      } catch {
        // ignore
      }
    });
  }

  async stop() {
    for (const sessionPromise of this.sessions.values()) {
      try {
        const session = await sessionPromise;
        session.close();
      } catch {
        // ignore
      }
    }
    this.sessions.clear();
  }

  async destroy() {
    await this.stop();
    if (this.serverProcess) {
      this.isStopping = true;
      try {
        treeKill(this.serverProcess.pid);
      } catch {
        this.serverProcess.kill();
      }
      this.serverProcess = null;
    }
    this.serverReady = false;
    this.isInitialized = false;
  }

  async saveAudioFile(audioData, recordId, conversationId, sourceId) {
    if (!this.retainAudioFiles) {
      return null;
    }

    const filename = `${recordId}_${sourceId}.wav`;
    const conversationDir = path.join(this.audioStoragePath, conversationId);
    ensureDir(conversationDir);

    const filepath = path.join(conversationDir, filename);
    const float32Array = audioData instanceof Float32Array ? audioData : new Float32Array(audioData);
    const wavBuffer = this.createWavBuffer(float32Array);
    fs.writeFileSync(filepath, wavBuffer);
    return filepath;
  }

  createWavBuffer(audioData) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = audioData.length * bytesPerSample;
    const buffer = Buffer.alloc(44 + dataLength);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(PCM_SAMPLE_RATE, 24);
    buffer.writeUInt32LE(PCM_SAMPLE_RATE * blockAlign, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    for (let i = 0; i < audioData.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      buffer.writeInt16LE(int16, 44 + i * 2);
    }

    return buffer;
  }

  clearContext() {
    // handled server side
  }
}

export default ASRService;

