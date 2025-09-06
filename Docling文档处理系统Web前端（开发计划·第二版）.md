# Docling文档处理系统Web前端（开发计划·第二版）

## Core Features

- 文件上传管理（单/多/文件夹/URL、队列、移除）

- 目标模式：转换/分块/提取（三选一）

- 处理流水线配置：STANDARD/VLM/ASR（含OCR、VLM、ASR细项）

- 附加功能：图片描述、产物导出、后处理

- 性能与调试：device/threads/batch/log

- 任务执行与监控：总体/单文件进度、实时日志、取消

- 结果预览与下载：Markdown/HTML/JSON/打包ZIP

- 模式切换：简单/高级

- 动态校验：参数冲突/前置依赖/可见性提示

- 前后端联调与契约校验（OpenAPI/错误码中文化）

## Tech Stack

{
  "Web": {
    "arch": "react",
    "component": "mui"
  }
}

## Design

- 视觉与布局：MUI v6 主题化（primary #1976d2、success #2e7d32、warning #ed6c02、error #d32f2f），浅色为主，强调对比与留白；固定顶部AppBar + 左侧Drawer，主内容区设置pt以避免遮挡。
- 字体与中文：系统中文优先（'Microsoft YaHei', 'PingFang SC'），UTF-8+CRLF，避免中文乱码。
- 交互：按钮/切换/单复选统一MUI风格；表单分区（目标模式/流水线/通用/附加/性能），渐进披露；参数冲突即时校验与中文提示；长任务提供进度条+日志区；失败态采用Alert/对话框。
- 信息架构：
  1) 简单模式：上传区 + 一键转换（Minimal/默认Markdown）；
  2) 高级模式：配置面板（目标模式互斥）+ 流水线面板（STANDARD/VLM/ASR）+ 附加面板（图片描述/产物）+ 性能面板 + 任务区（进度/日志）+ 结果区（预览/下载）。

## Plan

Note: 

- [ ] is holding
- [/] is doing
- [X] is done

---

[X] 开发计划（第二版）制定与确认

[ ] 项目初始化和基础架构搭建（Vite+TS+MUI+RTK+Axios，Windows脚本：kill-port/start-dev，.editorconfig/.gitattributes）

[ ] 模块1：文件上传与队列（单/多/文件夹/URL、进度、移除、大小/类型校验）

[ ] 模块2：目标模式与通用配置（Conversion/Chunking/Extraction互斥，output/from_formats/image_export_mode、性能/错误处理/远程开关）

[ ] 模块3：流水线配置（STANDARD：OCR/增强；VLM：本地/远程；ASR：模型选择）

[ ] 模块4：附加功能（图片描述：本地/远程需enable_remote；产物导出：CSV/HTML/PNG/Parquet；后处理：翻译）

[ ] 模块5：任务执行与可观测性（POST /convert，job_id 轮询/SSE，进度/日志，取消）

[ ] 模块6：结果预览与下载（MD/HTML/JSON 预览、单个/打包下载、错误报告中文提示）

[ ] 模块7：动态校验与可见性规则（冲突：extraction/chunking→锁定JSON、to_formats冲突400；image_export_mode可见性提示；远程前置依赖）

[ ] 联调与验收：对齐openapi/convert.yml、错误码映射、四类示例回归（Minimal/Custom/Chunking/Extraction/Picture）

[ ] 文档与交付：使用手册、问题排查、脚本说明、版本与兼容声明
