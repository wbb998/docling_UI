# 说明：强制释放指定端口（Windows PowerShell 7）
# 用法：.\scripts\win\kill-port.ps1 -Port 8000

param(  # 定义脚本参数
  [Parameter(Mandatory = $true)]  # 标记为必填
  [int]$Port  # 端口号
)

# 确保 UTF-8 输出，避免中文乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8  # 设置控制台编码为 UTF-8

# 查找占用端口的进程并结束
$connections = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue  # 获取监听该端口的连接
if ($null -ne $connections) {  # 如果找到了连接
  foreach ($c in $connections) {  # 遍历连接
    $pid = $c.OwningProcess  # 获取进程 PID
    Write-Host "终止进程 PID=$pid (占用端口 $Port)..."  # 打印要终止的信息
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue  # 强制终止进程
  }
} else {
  Write-Host "端口 $Port 未被占用。"  # 未占用提示
}