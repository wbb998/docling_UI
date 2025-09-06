# -*- coding: utf-8 -*-
# 说明：转换控制器，做入参基本校验并调用服务层。

from ..services.convert_service import ConvertService  # 导入服务层实现

_service = ConvertService()  # 创建服务实例

def handle_convert(payload: dict, jobs_service) -> dict:  # 控制器主函数
    if not isinstance(payload, dict):  # 类型校验：必须为 JSON 对象
        return {"code": "E001_INVALID_INPUT", "message": "请求体格式错误：应为 JSON 对象。", "details": {}}  # 中文错误返回
    return _service.process(payload, jobs_service)  # 委派给服务层