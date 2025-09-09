# -*- coding: utf-8 -*-
# 说明：统一路由定义，聚合 /convert 及异步任务相关接口。

from fastapi import APIRouter, Request  # 导入 APIRouter 以定义路由分组
from fastapi.responses import StreamingResponse  # 导入流式响应用于SSE
from ..controllers.convert_controller import handle_convert  # 导入转换控制器
from ..services.jobs_service import JobsService  # 导入任务服务用于状态查询
import json
import asyncio

router = APIRouter()  # 创建路由分组对象
_jobs = JobsService()  # 初始化一个简单的内存任务服务（可替换为 Redis/DB）

@router.post("/convert")  # 定义提交转换任务的端点
async def post_convert(request: Request):  # 接收原始请求对象
    # 解析JSON请求体
    try:
        payload = await request.json()
    except Exception as e:
        payload = {}
    
    # 交给控制器处理，控制器内部会调用 service 与 adapter
    return handle_convert(payload, _jobs)  # 返回统一的响应结构

@router.get("/jobs/{job_id}/status")  # 定义查询任务状态端点
def get_job_status(job_id: str):  # 路由参数为 job_id
    return _jobs.get_status(job_id)  # 返回任务的状态信息

@router.get("/jobs/{job_id}/result")  # 定义查询任务结果端点
def get_job_result(job_id: str):  # 路由参数为 job_id
    return _jobs.get_result(job_id)  # 返回任务结果（成功/失败明细）

@router.get("/jobs/{job_id}/events")  # 定义SSE事件流端点
async def get_job_events(job_id: str):  # 路由参数为 job_id
    """
    SSE事件流端点，用于实时推送任务进度和日志
    """
    async def event_generator():
        # 模拟事件流生成器
        try:
            # 检查任务是否存在
            status_info = _jobs.get_status(job_id)
            if not status_info or "error" in status_info:
                error_data = json.dumps({"type": "error", "message": "任务不存在"})
                yield f"data: {error_data}\n\n"
                return
            
            # 发送初始状态
            status_data = json.dumps({"type": "status", "status": status_info.get("status", "unknown")})
            yield f"data: {status_data}\n\n"
            
            # 模拟进度更新（实际应该从任务服务获取）
            for progress in [10, 30, 50, 70, 90, 100]:
                await asyncio.sleep(1)  # 模拟处理时间
                
                # 检查任务当前状态
                current_status = _jobs.get_status(job_id)
                if current_status and current_status.get("status") in ["completed", "failed"]:
                    break
                
                # 发送进度事件
                progress_data = json.dumps({"type": "progress", "progress": progress})
                yield f"data: {progress_data}\n\n"
                
                # 发送日志事件
                log_data = json.dumps({"type": "log", "message": f"处理进度: {progress}%"})
                yield f"data: {log_data}\n\n"
            
            # 发送完成事件
            final_status = _jobs.get_status(job_id)
            complete_data = json.dumps({"type": "complete", "status": final_status.get("status", "completed")})
            yield f"data: {complete_data}\n\n"
            
        except Exception as e:
            error_data = json.dumps({"type": "error", "message": f"事件流错误: {str(e)}"})
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )