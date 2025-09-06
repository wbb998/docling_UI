# -*- coding: utf-8 -*-
# 说明：网关服务入口，基于 FastAPI。对外暴露统一 /convert 接口与 /jobs 查询。
# 提示：模块路径使用下划线 services.api_gateway，避免连字符导致的导入失败。

from fastapi import FastAPI  # 导入 FastAPI 框架
from fastapi.middleware.cors import CORSMiddleware  # 导入 CORS 中间件
from .routes.index import router as api_router  # 导入统一路由分组

app = FastAPI(  # 创建 FastAPI 应用
    title="Docling UI API Gateway",  # 应用标题
    description="统一端点 /convert；支持异步任务与中文错误",  # 应用描述
    version="0.1.0"  # 版本号
)

app.add_middleware(  # 注册 CORS 中间件
    CORSMiddleware,  # 指定中间件类型
    allow_origins=["*"],  # 开发阶段允许任意来源
    allow_credentials=True,  # 允许凭据
    allow_methods=["*"],  # 允许全部方法
    allow_headers=["*"],  # 允许全部请求头
)

@app.get("/healthz")  # 健康检查端点
def healthz():  # 处理函数
    return {"status": "ok"}  # 返回简单状态

app.include_router(api_router)  # 挂载业务路由

# 开发运行示例（项目根目录执行）：
# uvicorn services.api_gateway.py.src.main:app --reload