# -*- coding: utf-8 -*-
# 说明：控制器接收路由传入的请求体，做基础校验后交由服务层处理。

from ..services.convert_service import ConvertService  # 导入服务层实现

_service = ConvertService()  # 创建服务实例（可注入适配器等依赖）

def handle_convert(payload: dict, jobs_service) -> dict:  # 定义控制器函数，接收请求体与任务服务
    # 基础保护：若 payload 非字典，直接返回中文错误
    if not isinstance(payload, dict):  # 判断类型
        return {"code": "E001_INVALID_INPUT", "message": "请求体格式错误：应为 JSON 对象。", "details": {}}  # 返回统一错误

    # 调用服务层处理，内部包含组合规则校验与任务编排
    return _service.process(payload, jobs_service)  # 返回服务层的处理结果