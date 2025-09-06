# -*- coding: utf-8 -*-
# 说明：最小内存版任务服务，生产可替换为 Redis/数据库。

from typing import Dict, Any  # 导入类型提示
import time  # 导入时间模块用于时间戳

class JobsService:  # 定义任务服务类
    def __init__(self):  # 构造函数
        self._store: Dict[str, Dict[str, Any]] = {}  # 内存字典存储任务信息

    def create(self, job_id: str) -> None:  # 创建任务占位
        self._store[job_id] = {"state": "created", "created_at": time.time()}  # 初始化任务状态

    def set_status(self, job_id: str, status: Dict[str, Any]) -> None:  # 设置状态
        if job_id in self._store:  # 检查任务是否存在
            self._store[job_id].update(status)  # 更新状态字段
            self._store[job_id]["updated_at"] = time.time()  # 记录更新时间

    def set_result(self, job_id: str, result: Dict[str, Any]) -> None:  # 设置结果
        if job_id in self._store:  # 检查存在
            self._store[job_id]["result"] = result  # 写入结果
            self._store[job_id]["state"] = "finished"  # 标记完成
            self._store[job_id]["updated_at"] = time.time()  # 更新时间戳

    def get_status(self, job_id: str) -> Dict[str, Any]:  # 获取状态
        return self._store.get(job_id, {"state": "not_found"})  # 返回状态或未找到

    def get_result(self, job_id: str) -> Dict[str, Any]:  # 获取结果
        return self._store.get(job_id, {"state": "not_found"})  # 返回结果或未找到