/**
 * Build Python backend (FastAPI + workers) via PyInstaller.
 */
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function resolvePython() {
  // 优先显式传入的 ASR_PYTHON_PATH（CI 已指向 python-env）
  if (process.env.ASR_PYTHON_PATH) {
    return process.env.ASR_PYTHON_PATH;
  }
  if (process.env.PYTHON) {
    return process.env.PYTHON;
  }
  // 尝试使用项目内的 python-env
  const venvPy = process.platform === 'win32'
    ? path.join(projectRoot, 'python-env', 'Scripts', 'python.exe')
    : path.join(projectRoot, 'python-env', 'bin', 'python3');
  if (fs.existsSync(venvPy)) {
    return venvPy;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

const pythonCmd = resolvePython();

const backendDir = path.join(projectRoot, 'backend');
const distDir = path.join(backendDir, 'dist');
const buildDir = path.join(backendDir, 'build');
const entryFile = path.join(backendDir, 'main.py');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: projectRoot });
}

function ensureDirs() {
  [backendDir, distDir, buildDir].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));
}

function main() {
  console.log(`[build-backend] using python: ${pythonCmd}`);
  console.log(`[build-backend] entry: ${entryFile}`);
  ensureDirs();

  // 使用 onedir 方便 electron-builder extraResources 打包
  const cmd = [
    `"${pythonCmd}"`,
    '-m PyInstaller',
    '--clean',
    '-y',
    '--name asr-backend',
    `--distpath "${distDir}"`,
    `--workpath "${buildDir}"`,
    '--onedir',
    `"${entryFile}"`,
  ].join(' ');

  run(cmd);
  console.log('[build-backend] done');
}

main();

