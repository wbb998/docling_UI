# -*- coding: utf-8 -*-
# 说明：服务层负责参数组合校验与命令构建，真实执行可交由后台 Worker 完成。

import uuid  # 导入 uuid 生成唯一任务ID
from typing import Dict, Any  # 导入类型提示
from ..adapters.docling.mappers.convert_mapper import map_request_to_cli  # UI→CLI 参数映射
from ..adapters.docling.cli_adapter import build_cli_command  # 构建 docling CLI 命令

class ConvertService:  # 定义转换服务类
    def process(self, payload: Dict[str, Any], jobs_service) -> Dict[str, Any]:  # 主处理流程
        # 读取关键参数
        to_formats = payload.get("to_formats")  # 转换目标格式
        chunking_strategy = payload.get("chunking_strategy")  # 分块策略
        extraction_schema = payload.get("extraction_schema")  # 信息提取 Schema
        enable_remote = payload.get("enable_remote_services", False)  # 远程能力开关
        pic_opts = payload.get("picture_description_options", {})  # 图片描述参数

        # 组合/依赖规则校验（与文档一致）
        if (chunking_strategy or extraction_schema) and to_formats:  # 同时存在冲突
            return {"code": "E001_INVALID_INPUT", "message": "参数冲突：分块/提取固定输出 JSON，请移除 to_formats。", "details": {"conflicts": ["to_formats"]}}  # 中文错误

        if isinstance(pic_opts, dict) and pic_opts.get("type") == "remote" and not enable_remote:  # 远程依赖未启用
            return {"code": "E001_INVALID_INPUT", "message": "参数依赖缺失：远程图片描述需要 enable_remote_services=true。", "details": {"missing": ["enable_remote_services"]}}  # 中文错误

        # 生成任务 ID 并登记
        job_id = str(uuid.uuid4())  # 生成唯一ID
        jobs_service.create(job_id)  # 创建任务

        # 构建 docling 命令（仅构建字符串，不执行）
        cli_args = map_request_to_cli(payload)  # 映射为 CLI 参数字典
        cli_cmd = build_cli_command(cli_args)  # 构建命令字符串

        # 写入排队状态并返回
        jobs_service.set_status(job_id, {"state": "queued", "cmd": cli_cmd})  # 更新状态
        return {"job_id": job_id, "status": "queued"}  # 返回异步任务信息