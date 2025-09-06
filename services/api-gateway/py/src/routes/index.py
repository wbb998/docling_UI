# -*- coding: utf-8 -*-
# 说明：统一路由定义，聚合 /convert 及异步任务相关接口。

from fastapi import APIRouter  # 导入 APIRouter 以定义路由分组
from ..controllers.convert_controller import handle_convert  # 导入转换控制器
from ..services.jobs_service import JobsService  # 导入任务服务用于状态查询

router = APIRouter()  # 创建路由分组对象
_jobs = JobsService()  # 初始化一个简单的内存任务服务（可替换为 Redis/DB）

@router.post("/convert")  # 定义提交转换任务的端点
def post_convert(payload: dict):  # 接收 JSON 请求体（字典）
    # 交给控制器处理，控制器内部会调用 service 与 adapter
    return handle_convert(payload, _jobs)  # 返回统一的响应结构

@router.get("/jobs/{job_id}/status")  # 定义查询任务状态端点
def get_job_status(job_id: str):  # 路由参数为 job_id
    return _jobs.get_status(job_id)  # 返回任务的状态信息

@router.get("/jobs/{job_id}/result")  # 定义查询任务结果端点
def get_job_result(job_id: str):  # 路由参数为 job_id
    return _jobs.get_result(job_id)  # 返回任务结果（成功/失败明细）

# 可选：SSE 实时事件流（日志/进度），需要额外依赖与实现，后续按需补充