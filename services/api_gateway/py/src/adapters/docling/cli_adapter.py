# -*- coding: utf-8 -*-
# 说明：docling CLI 适配器，仅构建命令字符串（不执行）。

from typing import Dict, Any  # 导入类型提示

def build_cli_command(args: Dict[str, Any]) -> str:  # 定义构建命令的函数
    parts = ["docling", "convert"]  # 基础命令
    for k, v in args.items():  # 遍历参数字典
        if isinstance(v, bool):  # 布尔参数
            if v:  # 仅当为 True 时追加
                parts.append(f"--{k}")  # 追加布尔开关
        elif isinstance(v, list):  # 列表参数
            for item in v:  # 遍历列表
                parts.append(f"--{k}")  # 添加参数名
                parts.append(str(item))  # 添加参数值
        else:  # 其余标量
            parts.append(f"--{k}")  # 添加参数名
            parts.append(str(v))  # 添加参数值
    return " ".join(parts)  # 拼接为字符串返回