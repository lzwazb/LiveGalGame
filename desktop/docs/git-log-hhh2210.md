# hhh2210 近期改动（高层概要）

时间范围：2025-12-06 ~ 2025-12-08

## 1) 建议/对话相关
- 新增 “场景判断 LLM” 配置，完全由专用模型决定是否生成选项，移除关键词启发式，支持单独模型名与开关。
- 前端表单和 Hook 同步加载/保存该配置，默认沿用 gpt-4o-mini；架构图补充字段与流程。

## 2) 结构化记忆侧车
- 引入独立 FastAPI 侧车（profiles/events 查询与写入，SQLite 存储），支持 add/update/append/replace 合并模式与时间/标签过滤。
- Electron 主进程增加 MemoryService 客户端与 IPC，渲染层可通过 preload 调用；未配置 baseUrl 时安全降级为空结果。
- README 补充发布建议：PyInstaller 打包随 Electron 分发、启动探活、端口选择、macOS 签名注意事项。

## 3) ASR 下载与体验
- 下载缓存改为应用级共享（HF/MS 双源，自动创建 HF_HOME / MODELSCOPE_CACHE），可解析 ModelScope 实际落盘路径。
- UI 支持断点续传与错误提示，下载源可选；状态更新更及时。

## 4) 稳定性修复
- HUD 创建增加防抖并在加载中提示。
- 数据库路径优先写入 userData，回退检测避免打包后权限问题。
- DB 模块改用预生成文本 ID，避免 lastInsertRowid 失配。
- ASR 设置页的“测试 ASR”按钮现执行真实测试并展示实时结果/错误。

