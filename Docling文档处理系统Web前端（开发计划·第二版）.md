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

已确定采用方案A - 控制台三栏式布局：左侧功能导航栏(240px)、中央主工作区(flex-grow)、右侧任务抽屉(320px可滑出)。响应式设计：移动端左侧导航收起为汉堡菜单，右侧抽屉全屏覆盖。严格贴合功能清单与业务流程图，内置参数校验与SSE/轮询兜底。

## Plan

Note: 

- [ ] is holding
- [/] is doing
- [X] is done

---

[X] 开发计划（第二版）制定与确认

[X] 界面布局与交互多方案输出（A/B/C/D）

[X] 确定布局方案A并制定详细交互原型

[X] 项目初始化和基础架构搭建（Vite+TS+MUI+RTK+Axios，Windows脚本：kill-port/start-dev，.editorconfig/.gitattributes）

[X] 模块1：文件上传与队列（单/多/文件夹/URL、进度、移除、大小/类型校验）+ 增强功能（批量操作、预览、重命名、统计）

[X] 模块2：目标模式与通用配置（Conversion/Chunking/Extraction互斥，output/from_formats/image_export_mode、性能/错误处理/远程开关）

[X] 模块3：流水线配置（STANDARD：OCR/增强；VLM：本地/远程；ASR：模型选择）

[X] 模块4：附加功能（图片描述：本地/远程需enable_remote；产物导出：CSV/HTML/PNG/Parquet；后处理：翻译）

[/] 模块5：任务执行与可观测性（POST /convert，job_id 轮询/SSE，进度/日志，取消）

[ ] 模块6：结果预览与下载（MD/HTML/JSON 预览、单个/打包下载、错误报告中文提示）

[ ] 模块7：动态校验与可见性规则（冲突：extraction/chunking→锁定JSON、to_formats冲突400；image_export_mode可见性提示；远程前置依赖）

[ ] 联调与验收：对齐openapi/convert.yml、错误码映射、四类示例回归（Minimal/Custom/Chunking/Extraction/Picture）

[ ] 文档与交付：使用手册、问题排查、脚本说明、版本与兼容声明
