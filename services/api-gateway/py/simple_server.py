#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的API服务器
用于快速启动开发环境的API服务
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import uuid
import time
import threading
from typing import Dict, Any

# 创建FastAPI应用
app = FastAPI(title="Docling API Gateway", version="0.1.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 内存存储任务
jobs_storage: Dict[str, Dict[str, Any]] = {}

def validate_convert_params(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    根据后端API接口文档.md规范校验参数
    """
    # 基础校验
    if not isinstance(payload, dict):
        return {
            "valid": False,
            "error_code": "E001_INVALID_INPUT",
            "message": "请求体格式错误：应为 JSON 对象。",
            "details": {}
        }
    
    # 必须参数校验
    if not payload.get("input_sources"):
        return {
            "valid": False,
            "error_code": "E001_INVALID_INPUT",
            "message": "缺少必须参数：input_sources",
            "details": {"missing_params": ["input_sources"]}
        }
    
    # 参数冲突校验
    has_extraction = payload.get("extraction_schema") is not None
    has_chunking = payload.get("chunking_strategy") is not None
    has_to_formats = payload.get("to_formats") is not None
    
    # 提取模式或分块模式与to_formats冲突
    if (has_extraction or has_chunking) and has_to_formats:
        conflict_mode = "信息提取" if has_extraction else "文档分块"
        return {
            "valid": False,
            "error_code": "E001_INVALID_INPUT",
            "message": f"参数组合冲突：已选择{conflict_mode}，输出格式固定为 JSON，请移除 to_formats。",
            "details": {
                "conflicts": ["extraction_schema" if has_extraction else "chunking_strategy", "to_formats"]
            }
        }
    
    # 远程服务依赖校验
    enable_remote = payload.get("enable_remote_services", False)
    
    # 检查图片描述远程配置
    picture_desc_options = payload.get("picture_description_options", {})
    if picture_desc_options.get("type") == "remote" and not enable_remote:
        return {
            "valid": False,
            "error_code": "E001_INVALID_INPUT",
            "message": "使用远程图片描述服务需要启用 enable_remote_services。",
            "details": {"dependency": "enable_remote_services"}
        }
    
    # 检查VLM远程配置
    vlm_options = payload.get("vlm_options", {})
    if vlm_options.get("type") == "remote" and not enable_remote:
        return {
            "valid": False,
            "error_code": "E001_INVALID_INPUT",
            "message": "使用远程VLM服务需要启用 enable_remote_services。",
            "details": {"dependency": "enable_remote_services"}
        }
    
    # 检查输入源格式
    input_sources = payload.get("input_sources", [])
    if not isinstance(input_sources, list) or len(input_sources) == 0:
        return {
            "valid": False,
            "error_code": "E001_INVALID_INPUT",
            "message": "input_sources 必须是非空数组。",
            "details": {"invalid_field": "input_sources"}
        }
    
    # 检查输出格式有效性
    to_formats = payload.get("to_formats", [])
    if to_formats:
        valid_formats = ["markdown", "html", "json", "yaml", "text", "doctags"]
        invalid_formats = [fmt for fmt in to_formats if fmt not in valid_formats]
        if invalid_formats:
            return {
                "valid": False,
                "error_code": "E001_INVALID_INPUT",
                "message": f"不支持的输出格式: {', '.join(invalid_formats)}",
                "details": {
                    "invalid_formats": invalid_formats,
                    "supported_formats": valid_formats
                }
            }
    
    # 检查流水线类型
    pipeline = payload.get("pipeline", "STANDARD")
    if pipeline not in ["STANDARD", "VLM", "ASR"]:
        return {
            "valid": False,
            "error_code": "E001_INVALID_INPUT",
            "message": f"不支持的流水线类型: {pipeline}",
            "details": {
                "invalid_pipeline": pipeline,
                "supported_pipelines": ["STANDARD", "VLM", "ASR"]
            }
        }
    
    # 检查设备类型
    device = payload.get("device", "auto")
    if device not in ["auto", "cpu", "cuda", "mps"]:
        return {
            "valid": False,
            "error_code": "E001_INVALID_INPUT",
            "message": f"不支持的设备类型: {device}",
            "details": {
                "invalid_device": device,
                "supported_devices": ["auto", "cpu", "cuda", "mps"]
            }
        }
    
    return {"valid": True}

@app.get("/healthz")
def health_check():
    """健康检查"""
    return {"status": "ok", "message": "API服务运行正常"}

@app.post("/api/convert")
async def convert_document(request: Request):
    """
    文档转换接口 - 根据后端API接口文档.md规范实现
    支持三种核心任务模式：转换、分块、提取
    """
    try:
        # 解析请求体
        payload = await request.json()
        
        # 参数校验
        validation_result = validate_convert_params(payload)
        if not validation_result["valid"]:
            return {
                "code": validation_result["error_code"],
                "message": validation_result["message"],
                "details": validation_result["details"]
            }
        
        # 生成任务ID
        job_id = str(uuid.uuid4())
        
        # 创建任务记录
        task_info = {
            "job_id": job_id,
            "status": "pending",
            "progress": 0,
            "message": "任务已创建，正在处理...",
            "created_at": time.time(),
            "payload": payload,
            "current_file": None,
            "state": "initializing"
        }
        
        jobs_storage[job_id] = task_info
        
        # 启动后台处理
        threading.Thread(target=simulate_processing, args=(job_id,), daemon=True).start()
        
        return {
            "job_id": job_id,
            "status": "pending",
            "message": "任务创建成功"
        }
        
    except Exception as e:
        return {
            "code": "E5XX_INTERNAL",
            "message": f"服务内部错误: {str(e)}",
            "details": {"error_type": type(e).__name__}
        }

@app.get("/api/jobs/{job_id}/status")
def get_job_status(job_id: str):
    """获取任务状态 - 符合后端API接口文档.md规范"""
    if job_id not in jobs_storage:
        return {
            "code": "E404_JOB_NOT_FOUND",
            "message": f"任务 {job_id} 不存在",
            "details": {}
        }
    
    job = jobs_storage[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "current_file": job.get("current_file"),
        "state": job.get("state", "unknown"),
        "message": job["message"],
        "created_at": job["created_at"],
        "updated_at": job.get("updated_at")
    }

@app.get("/api/jobs/{job_id}/result")
def get_job_result(job_id: str):
    """获取任务结果 - 符合后端API接口文档.md规范"""
    if job_id not in jobs_storage:
        return {
            "code": "E404_JOB_NOT_FOUND",
            "message": f"任务 {job_id} 不存在",
            "details": {}
        }
    
    job = jobs_storage[job_id]
    
    if job["status"] != "completed":
        return {
            "code": "E400_JOB_NOT_COMPLETED",
            "message": f"任务 {job_id} 尚未完成，当前状态: {job['status']}",
            "details": {
                "current_status": job["status"],
                "progress": job["progress"]
            }
        }
    
    # 返回符合API文档的响应格式
    return {
        "status": "completed",
        "results": job.get("results", []),
        "errors": job.get("errors", []),
        "processing_time": job.get("updated_at", 0) - job["created_at"]
    }

@app.get("/api/jobs/{job_id}/events")
def get_job_events(job_id: str):
    """获取任务事件流 - SSE端点（简化实现）"""
    if job_id not in jobs_storage:
        return {
            "code": "E404_JOB_NOT_FOUND",
            "message": f"任务 {job_id} 不存在",
            "details": {}
        }
    
    # 简化实现：返回当前状态信息
    # 实际SSE实现需要使用StreamingResponse
    job = jobs_storage[job_id]
    return {
        "message": "SSE端点已创建，但当前为简化实现",
        "job_status": job["status"],
        "progress": job["progress"]
    }

def simulate_processing(job_id: str):
    """模拟文档处理过程"""
    try:
        # 模拟处理步骤
        steps = [
            (20, "正在解析文档..."),
            (40, "正在提取内容..."),
            (60, "正在转换格式..."),
            (80, "正在生成结果..."),
            (100, "处理完成")
        ]
        
        for progress, message in steps:
            time.sleep(1)  # 模拟处理时间
            
            jobs_storage[job_id].update({
                "status": "running" if progress < 100 else "completed",
                "progress": progress,
                "message": message,
                "updated_at": time.time()
            })
        
        # 添加模拟结果
        jobs_storage[job_id]["result"] = {
            "output_format": "markdown",
            "content": "# 示例文档\n\n这是一个模拟的文档转换结果。\n\n## 内容\n\n文档处理已完成。",
            "metadata": {
                "pages": 1,
                "processing_time": 5.0,
                "file_size": "2.71 MB"
            }
        }
        
    except Exception as e:
        jobs_storage[job_id].update({
            "status": "failed",
            "progress": 0,
            "message": f"处理失败: {str(e)}",
            "error": str(e),
            "updated_at": time.time()
        })

if __name__ == "__main__":
    print("🚀 启动简单API服务器...")
    print("📍 服务地址: http://localhost:8000")
    print("🔍 健康检查: http://localhost:8000/healthz")
    print("📝 API文档: http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )