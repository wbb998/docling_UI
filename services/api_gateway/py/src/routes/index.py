# -*- coding: utf-8 -*-
# 说明：统一路由定义，聚合 /convert 与异步任务查询端点。

from fastapi import APIRouter  # 导入 APIRouter 以定义路由分组
from ..controllers.convert_controller import handle_convert  # 导入转换控制器
from ..services.jobs_service import JobsService  # 导入任务服务（内存版）

router = APIRouter()  # 实例化路由分组
_jobs = JobsService()  # 创建任务服务实例

@router.post("/convert")  # 提交转换任务
def post_convert(payload: dict):  # 接收 JSON 请求体
    return handle_convert(payload, _jobs)  # 交由控制器处理

@router.get("/jobs/{job_id}/status")  # 查询任务状态
def get_job_status(job_id: str):  # 路径参数：任务ID
    return _jobs.get_status(job_id)  # 返回状态

@router.get("/jobs/{job_id}/result")  # 查询任务结果
def get_job_result(job_id: str):  # 路径参数：任务ID
    return _jobs.get_result(job_id)  # 返回结果