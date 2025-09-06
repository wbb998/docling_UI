# 说明：本地开发启动脚本（先 kill-port 再启动 uvicorn）
# 用法：.\scripts\win\start-dev.ps1

# 确保 UTF-8 输出，避免中文乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8  # 设置控制台编码

# 配置默认端口（可按需调整）
$port = 8000  # 网关服务端口

# 先释放端口
& "$PSScriptRoot\kill-port.ps1" -Port $port  # 调用同目录的 kill 脚本释放端口

# 激活虚拟环境（如有），此处留空示意
# & .\.venv\Scripts\Activate.ps1  # 激活 Python 虚拟环境

# 启动 FastAPI（uvicorn），指定应用模块路径
uvicorn services.api_gateway.py.src.main:app --host 0.0.0.0 --port $port --reload  # 启动开发服务器

# 提示：如未安装 uvicorn，请先执行：pip install uvicorn fastapi