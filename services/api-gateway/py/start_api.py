#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API网关启动脚本
用于开发环境快速启动API服务
"""

import sys
import os
import uvicorn

# 添加项目根目录到Python路径
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
sys.path.insert(0, project_root)

# 添加当前目录到Python路径
current_dir = os.path.dirname(__file__)
sys.path.insert(0, current_dir)

if __name__ == "__main__":
    print("🚀 启动 Docling API 网关服务...")
    print(f"📁 项目根目录: {project_root}")
    print(f"📁 当前目录: {current_dir}")
    
    try:
        # 导入应用
        from src.main import app
        
        # 启动服务
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("请确保已安装必要的依赖: pip install fastapi uvicorn")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        sys.exit(1)