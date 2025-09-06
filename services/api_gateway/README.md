# API Gateway 使用说明

- 运行（开发）：
  - PowerShell 7：`.\scripts\win\start-dev.ps1`
  - 或项目根：`uvicorn services.api_gateway.py.src.main:app --reload`
- 健康检查：`GET http://localhost:8000/healthz`
- 提交任务：`POST http://localhost:8000/convert`
- 查询状态：`GET http://localhost:8000/jobs/{job_id}/status`
- 查询结果：`GET http://localhost:8000/jobs/{job_id}/result`

注意：
- 目录名使用 `api_gateway`（下划线），避免 Python 导入失败。
- 真实执行 docling 命令建议放入后台 Worker；当前示例仅构建命令字符串。