import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { app } from 'electron';

const DEFAULT_PYTHON = 'python3';

function detectPythonPath() {
  const envPython = process.env.AGENT_PYTHON_PATH;
  if (envPython && fs.existsSync(envPython)) return envPython;

  const projectRoot = path.resolve(app.getAppPath(), app.isPackaged ? '../..' : '.');
  const venvPython = path.join(projectRoot, '.venv', 'bin', 'python');
  if (fs.existsSync(venvPython)) return venvPython;

  if (process.platform === 'win32') {
    const venvPythonWin = path.join(projectRoot, '.venv', 'Scripts', 'python.exe');
    if (fs.existsSync(venvPythonWin)) return venvPythonWin;
  }
  return DEFAULT_PYTHON;
}

export default class AgentService extends EventEmitter {
  constructor() {
    super();
    const projectRoot = path.resolve(app.getAppPath(), app.isPackaged ? '../..' : '.');
    this.scriptPath = path.join(projectRoot, 'src/agent/agent_worker.py');
    this.pythonPath = detectPythonPath();
    this.workerProcess = null;
    this.pending = new Map();
    this.isStarting = false;
  }

  async ensureWorker() {
    if (this.workerProcess || this.isStarting) return;
    this.isStarting = true;

    const env = {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      PYTHONIOENCODING: 'utf-8'
    };

    console.log(`[AgentService] Spawning worker: ${this.pythonPath} ${this.scriptPath}`);
    this.workerProcess = spawn(this.pythonPath, [this.scriptPath], { env });

    this.workerProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        this.handleWorkerMessage(trimmed);
      });
    });

    this.workerProcess.stderr.on('data', (data) => {
      console.log(`[AgentWorker] ${data.toString().trim()}`);
    });

    this.workerProcess.on('close', (code) => {
      console.warn(`[AgentService] Worker exited with code ${code}`);
      this.workerProcess = null;
      this.isStarting = false;
      // fail all pending
      for (const [, entry] of this.pending) {
        entry.reject(new Error('Agent worker exited'));
      }
      this.pending.clear();
    });

    this.workerProcess.on('error', (err) => {
      console.error('[AgentService] Worker error:', err);
    });

    this.isStarting = false;
  }

  handleWorkerMessage(line) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch (err) {
      console.error('[AgentService] Failed to parse worker message:', line);
      return;
    }
    const { id, event, data } = msg;
    if (!id || !this.pending.has(id)) {
      console.warn('[AgentService] Unknown request id from worker:', id);
      return;
    }
    const entry = this.pending.get(id);
    if (event === 'partial') {
      if (entry.onStream) entry.onStream({ event: 'partial', data });
    } else if (event === 'final') {
      if (entry.onStream) entry.onStream({ event: 'final', data });
      entry.resolve({ id, ...data });
      this.pending.delete(id);
    } else if (event === 'pong') {
      entry.resolve({ pong: true });
      this.pending.delete(id);
    } else {
      console.warn('[AgentService] Unknown event from worker:', event);
    }
  }

  async run(payload, { stream = false, onStream, requestId } = {}) {
    await this.ensureWorker();
    const id = requestId || randomUUID();

    const message = {
      id,
      type: 'run',
      payload,
      stream
    };

    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onStream });
      try {
        this.workerProcess.stdin.write(JSON.stringify(message) + '\n');
      } catch (err) {
        this.pending.delete(id);
        reject(err);
      }
    });

    return promise;
  }

  async ping() {
    await this.ensureWorker();
    const id = randomUUID();
    const message = { id, type: 'ping' };
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      try {
        this.workerProcess.stdin.write(JSON.stringify(message) + '\n');
      } catch (err) {
        this.pending.delete(id);
        reject(err);
      }
    });
    return promise;
  }

  async destroy() {
    if (this.workerProcess) {
      try {
        this.workerProcess.kill();
      } catch (err) {
        console.error('[AgentService] Failed to kill worker:', err);
      }
      this.workerProcess = null;
    }
    this.pending.clear();
  }
}
