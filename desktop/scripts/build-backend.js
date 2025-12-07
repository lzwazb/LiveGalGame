/**
 * Build Python backend (FastAPI + workers) via PyInstaller.
 * - Windows: onefile exe（保持与参考项目一致，打包后仅有 exe，无需额外 Python 运行时）
 * - macOS/Linux: 继续使用 onedir（兼容现有流程）
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
const isWin = process.platform === 'win32';
const addDataArg = isWin
  ? `--add-data "${path.join(backendDir, 'asr')};asr"`
  : `--add-data "${path.join(backendDir, 'asr')}:asr"`;

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

  const baseArgs = [
    `"${pythonCmd}"`,
    '-m PyInstaller',
    '--clean',
    '-y',
    '--name asr-backend',
    addDataArg,
    `--distpath "${distDir}"`,
    `--workpath "${buildDir}"`,
  ];

  // Windows 改为 onefile，保持最终产物单一 exe；其他平台沿用 onedir
  const modeArgs = isWin ? ['--onefile', '--noconsole'] : ['--onedir'];

  const cmd = [...baseArgs, ...modeArgs, `"${entryFile}"`].join(' ');

  run(cmd);

  // 将 Windows onefile exe 归档到 dist/asr-backend 下，维持现有资源路径
  if (isWin) {
    const exeSrc = path.join(distDir, 'asr-backend.exe');
    const targetDir = path.join(distDir, 'asr-backend');
    const exeDst = path.join(targetDir, 'asr-backend.exe');

    if (fs.existsSync(exeSrc)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.mkdirSync(targetDir, { recursive: true });
      fs.renameSync(exeSrc, exeDst);
      console.log(`[build-backend] packaged onefile exe -> ${exeDst}`);
    } else {
      console.warn(`[build-backend] expected exe not found: ${exeSrc}`);
    }
  }

  console.log('[build-backend] done');
}

main();

