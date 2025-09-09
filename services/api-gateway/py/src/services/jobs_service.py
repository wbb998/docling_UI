# -*- coding: utf-8 -*-
"""
任务服务实现
负责管理异步任务的状态和结果
"""

import time
from typing import Dict, Any, Optional

class JobsService:
    """任务管理服务类"""
    
    def __init__(self):
        """初始化服务"""
        self.jobs: Dict[str, Dict[str, Any]] = {}
    
    def create_job(self, job_id: str, task_info: Dict[str, Any]) -> None:
        """
        创建新任务
        
        Args:
            job_id: 任务ID
            task_info: 任务信息
        """
        self.jobs[job_id] = task_info
    
    def update_job(self, job_id: str, updates: Dict[str, Any]) -> None:
        """
        更新任务信息
        
        Args:
            job_id: 任务ID
            updates: 更新的字段
        """
        if job_id in self.jobs:
            self.jobs[job_id].update(updates)
            self.jobs[job_id]["updated_at"] = time.time()
    
    def get_status(self, job_id: str) -> Dict[str, Any]:
        """
        获取任务状态
        
        Args:
            job_id: 任务ID
            
        Returns:
            任务状态信息
        """
        if job_id not in self.jobs:
            return {
                "code": "E404_JOB_NOT_FOUND",
                "message": f"任务 {job_id} 不存在",
                "details": {}
            }
        
        job = self.jobs[job_id]
        return {
            "code": "SUCCESS",
            "message": "获取状态成功",
            "data": {
                "job_id": job_id,
                "status": job.get("status", "unknown"),
                "progress": job.get("progress", 0),
                "message": job.get("message", ""),
                "created_at": job.get("created_at"),
                "updated_at": job.get("updated_at")
            }
        }
    
    def get_result(self, job_id: str) -> Dict[str, Any]:
        """
        获取任务结果
        
        Args:
            job_id: 任务ID
            
        Returns:
            任务结果
        """
        if job_id not in self.jobs:
            return {
                "code": "E404_JOB_NOT_FOUND",
                "message": f"任务 {job_id} 不存在",
                "details": {}
            }
        
        job = self.jobs[job_id]
        
        if job.get("status") != "completed":
            return {
                "code": "E400_JOB_NOT_COMPLETED",
                "message": f"任务 {job_id} 尚未完成，当前状态: {job.get('status', 'unknown')}",
                "details": {
                    "current_status": job.get("status"),
                    "progress": job.get("progress", 0)
                }
            }
        
        return {
            "code": "SUCCESS",
            "message": "获取结果成功",
            "data": {
                "job_id": job_id,
                "status": job.get("status"),
                "result": job.get("result", {}),
                "processing_time": job.get("updated_at", 0) - job.get("created_at", 0)
            }
        }
    
    def cancel_job(self, job_id: str) -> Dict[str, Any]:
        """
        取消任务
        
        Args:
            job_id: 任务ID
            
        Returns:
            取消结果
        """
        if job_id not in self.jobs:
            return {
                "code": "E404_JOB_NOT_FOUND",
                "message": f"任务 {job_id} 不存在",
                "details": {}
            }
        
        job = self.jobs[job_id]
        
        if job.get("status") in ["completed", "failed", "cancelled"]:
            return {
                "code": "E400_JOB_CANNOT_CANCEL",
                "message": f"任务 {job_id} 无法取消，当前状态: {job.get('status')}",
                "details": {"current_status": job.get("status")}
            }
        
        self.update_job(job_id, {
            "status": "cancelled",
            "message": "任务已取消"
        })
        
        return {
            "code": "SUCCESS",
            "message": "任务取消成功",
            "data": {
                "job_id": job_id,
                "status": "cancelled"
            }
        }
    
    def list_jobs(self) -> Dict[str, Any]:
        """
        列出所有任务
        
        Returns:
            任务列表
        """
        jobs_list = []
        for job_id, job_info in self.jobs.items():
            jobs_list.append({
                "job_id": job_id,
                "status": job_info.get("status", "unknown"),
                "progress": job_info.get("progress", 0),
                "created_at": job_info.get("created_at"),
                "updated_at": job_info.get("updated_at")
            })
        
        return {
            "code": "SUCCESS",
            "message": "获取任务列表成功",
            "data": {
                "jobs": jobs_list,
                "total": len(jobs_list)
            }
        }