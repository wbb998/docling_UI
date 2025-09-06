# -*- coding: utf-8 -*-
# 说明：本文件是网关服务的入口。采用 FastAPI（轻量、性能好），对外暴露统一的 /convert 接口。
# 目标：作为与 docling 后端解耦的薄层，负责参数校验、任务编排、错误中文化与异步任务管理。

from fastapi import FastAPI  # 导入 FastAPI 框架以创建 Web 服务应用
from fastapi.middleware.cors import CORSMiddleware  # 导入 CORS 中间件以支持跨域请求
from .routes.index import router as api_router  # 从路由模块导入统一路由对象

# 创建 FastAPI 应用实例
app = FastAPI(
    title="Docling UI API Gateway",  # 应用名称，用于文档页展示
    description="统一的文档处理端点：/convert；支持异步任务与中文错误提示",  # 应用描述
    version="0.1.0"  # 初始版本号
)

# 注册 CORS 中间件，允许前端（本地开发端口）访问
app.add_middleware(
    CORSMiddleware,  # 指定使用的中间件类型
    allow_origins=["*"],  # 开发阶段放开，生产可收敛到特定域
    allow_credentials=True,  # 允许携带凭据
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有请求头
)

# 健康检查路由，便于存活探针与联通性排查
@app.get("/healthz")  # 定义 GET /healthz 路由
def healthz():  # 路由处理函数
    return {"status": "ok"}  # 返回简单 JSON，表示健康

# 挂载业务路由（/convert、/jobs 等）
app.include_router(api_router)  # 将统一路由注册进应用

# 启动方式（开发）：uvicorn services.api-gateway.py.src.main:app --reload
# 注意：路径以项目根为基准；建议通过 scripts 启动，避免路径问题