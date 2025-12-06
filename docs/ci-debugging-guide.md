# GitHub Actions 自动化排查与调试指南

本文档总结了利用 MCP 浏览器工具与 Cursor 协作排查 GitHub Actions 问题的完整工作流。这种方法能够高效定位 CI/CD 构建失败的根因，特别是针对复杂的跨平台编译和依赖问题。

## 核心思路

传统的 CI 排查通常依赖于阅读冗长的文本日志或盲目推测。本方案的核心在于：
**像用户一样使用浏览器，直观地定位错误现场，结合源码分析，精准修复。**

## 推荐排查工具

1. **MCP Browser Tools** (Cursor 内置)：
   - `browser_navigate`: 访问 GitHub Actions 页面。
   - `browser_snapshot`: 获取页面结构快照，理解页面内容。
   - `browser_click`: 模拟点击，深入查看特定 Job 或 Step 的日志。
   - `browser_wait_for`: 等待动态内容加载。

2. **Codebase Tools**:
   - `read_file`: 读取工作流配置文件 (`.yml`) 和构建脚本。
   - `grep` / `search`: 搜索报错关键词。

## CI 验证全流程

当你修改了代码（例如修复了构建逻辑）并希望验证 CI 是否正常时，请遵循以下步骤：

### 1. 提交代码触发 Action
首先，确保你的修改已提交并推送到远程分支。
```bash
git add .
git commit -m "fix: CI build logic"
git push
```
GitHub Actions 会根据 `.github/workflows/*.yml` 中的 `on: push` 规则自动触发构建。

### 2. 访问 Action 列表页
推送后，立即通过浏览器工具访问 Actions 页面，确认 Action 是否已被触发。

```javascript
// 示例工具调用
browser_navigate({ url: "https://github.com/JStone2934/LiveGalGame/actions" })
```
- **目的**：确认最新的 commit 确实触发了一个新的 Workflow Run。
- **预期**：你应该能看到一个状态为 "in progress"（黄色旋转图标）或 "queued" 的新记录，标题应包含你刚才的 commit message。

### 3. 实时监控构建状态
使用快照工具周期性查看页面，或点击进入详情页等待。

```javascript
// 示例工具调用
browser_snapshot()
// 如果看到运行记录，点击进入详情
browser_click({ element: "in progress: Run ...", ref: "e211" })
```
- **目的**：监控构建进度。
- **技巧**：
  - CI 构建通常需要几分钟到几十分钟。
  - 你可以使用 `browser_wait_for` 或间隔性调用 `browser_snapshot` 来观察状态变化。
  - 关注 "Jobs" 列表，看各个平台的构建任务（如 `Desktop mac (arm64)`）是否开始运行。

### 4. 快速定位失败（如果有）
如果构建变成红色（Failure），立即按照以下步骤定位：

1. **定位失败的 Run**：
   ```javascript
   browser_snapshot()
   // 点击红色的失败记录
   browser_click({ element: "failed: Run ...", ref: "e211" })
   ```
2. **深入 Job 详情**：
   进入详情页后，找到失败的 Job（例如 `Desktop mac (arm64)`），点击进入。
   ```javascript
   browser_wait_for({ time: 2 }) // 等待加载
   browser_click({ element: "failed: Desktop mac (arm64)", ref: "..." })
   ```
3. **获取详细报错日志**：
   查看具体的 Step 日志，复制报错信息进行分析。
   （参考下文 "排查实战案例"）

### 5. 验证成功
如果构建变成绿色（Success），说明修复有效。
- **检查 Artifacts**：在 Run 详情页底部，确认是否生成了预期的构建产物（如 `.dmg` 或 `.exe` 文件）。
- **下载验证**（可选）：如果需要回归测试，可下载 Artifact 进行本地运行（参考 `docs/asr-ci-regression.md`）。

---

## 排查工作流详解（当构建失败时）

### 4. 获取详细报错日志
点击失败的 Job，查看具体的 Step 日志。

**排查实战案例（ASR 依赖编译失败）**：
1. **现象**：Job `Desktop mac (arm64)` 失败。
2. **操作**：点击 Job 链接。
3. **发现**：在 "Install ASR dependencies" 步骤中，pip 报错：
   ```
   Package libavformat was not found in the pkg-config search path.
   ERROR: Failed to build 'av' when getting requirements to build wheel
   ```
4. **分析**：
   - 错误表明 `av` 包试图从源码编译，但系统缺少 `ffmpeg` (libavformat) 库。
   - 检查 `.github/workflows/desktop-build.yml`，发现是在 `Setup Python` 后直接运行 `pip install -r requirements.txt`。
   - CI 环境（GitHub Hosted Runner）默认没有安装 FFmpeg 开发库。

### 5. 源码比对与根因分析
回到代码库，检查相关配置。

- **检查 `requirements.txt`**：确认 `av==10.0.0` 是否存在。
- **检查构建脚本**：查看 `scripts/prepare-python-env.js`。
- **发现矛盾**：
  - 我们已经在 `prepare-python-env.js` 中实现了使用 `conda` 安装预编译二进制包（不需要本地编译）。
  - 但 CI Workflow 中却保留了一个旧的步骤 `pip install -r requirements.txt`，它运行在 `prepare-python-env.js` **之前**。
  - **结论**：CI 的冗余步骤抢先执行了 pip 安装，导致编译失败。

### 6. 修复方案
**移除 CI 中的冗余步骤，统一构建逻辑。**

将环境准备工作完全收敛到 `prepare-python-env.js` 中，利用 Conda 的二进制分发能力解决编译依赖问题。

```yaml
# 修改前
- name: Setup Python ...
- name: Install ASR dependencies ... # ❌ 这里直接 pip install 导致编译失败
  run: pip install -r requirements.txt

# 修改后
# ✅ 移除上述步骤，直接进入 Build 阶段，由脚本统一处理
- name: Build desktop package
  run: pnpm run build:mac # 内部调用 prepare-python-env.js
```

## 总结

通过 **Browser 浏览日志 -> Codebase 定位配置 -> 逻辑一致性分析** 的闭环流程，我们能够快速识别出 CI 配置与实际构建脚本之间的冲突。

这种方法的优势在于：
1. **所见即所得**：直接看到 CI 运行时的真实报错，而非本地猜测。
2. **上下文完整**：能同时看到报错发生的 Step 和其前后的环境设置。
3. **精准打击**：直接定位到配置文件的具体行数进行修复。
