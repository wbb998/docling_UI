# -*- coding: utf-8 -*-
# 说明：将 UI 请求体映射为 docling CLI 参数的最小示例映射。

from typing import Dict, Any  # 导入类型提示

def map_request_to_cli(payload: Dict[str, Any]) -> Dict[str, Any]:  # 定义映射函数
    args: Dict[str, Any] = {}  # 初始化参数字典

    # 输入源：列表 → 多个 --input
    for src in payload.get("input_sources", []) or []:  # 遍历输入源
        args.setdefault("input", [])  # 确保存在列表
        args["input"].append(src)  # 追加一个输入

    # 输出格式：数组 → 多个 --to
    for fmt in payload.get("to_formats", []) or []:  # 遍历格式
        args.setdefault("to", [])  # 确保存在列表
        args["to"].append(fmt)  # 追加目标格式

    # 强制 JSON 的功能：分块/提取（仅示意，真实映射可更细）
    if payload.get("chunking_strategy"):  # 若配置了分块策略
        args["chunking_strategy"] = payload["chunking_strategy"]  # 映射原样
    if payload.get("extraction_schema"):  # 若配置了提取 Schema
        args["extraction_schema"] = "inline"  # 示例：告知 CLI 使用内联 Schema

    # 性能与日志
    if payload.get("num_threads") is not None:  # 线程数
        args["num_threads"] = payload["num_threads"]  # 映射
    if payload.get("page_batch_size") is not None:  # 分页批处理
        args["page_batch_size"] = payload["page_batch_size"]  # 映射
    if payload.get("verbosity"):  # 日志级别
        args["verbosity"] = payload["verbosity"]  # 映射

    # 图片描述相关
    pic_opts = payload.get("picture_description_options") or {}  # 取图片描述配置
    if pic_opts:  # 若存在配置
        args["do_picture_description"] = True  # 打开功能
        if pic_opts.get("type"):  # 模型类型（local/remote）
            args["picture_type"] = pic_opts["type"]  # 映射
        if pic_opts.get("model"):  # 模型名称
            args["picture_model"] = pic_opts["model"]  # 映射
        if pic_opts.get("prompt"):  # 提示词
            args["picture_prompt"] = pic_opts["prompt"]  # 映射
    if payload.get("images_scale") is not None:  # 图片缩放倍数
        args["images_scale"] = payload["images_scale"]  # 映射
    if payload.get("generate_picture_images") is not None:  # 是否落盘图片
        args["generate_picture_images"] = payload["generate_picture_images"]  # 映射

    # 其他通用参数（示意）
    if payload.get("output"):  # 输出目录
        args["output"] = payload["output"]  # 映射
    if payload.get("to_html_split_pages"):  # HTML 分页
        args["to_html_split_pages"] = True  # 映射布尔开关

    return args  # 返回 CLI 参数字典