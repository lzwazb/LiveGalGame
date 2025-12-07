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

const pythonCmd =
  process.env.PYTHON ||
  process.env.ASR_PYTHON_PATH ||
  (process.platform === 'win32' ? 'python' : 'python3');

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

