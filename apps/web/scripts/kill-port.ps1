# 说明: 启动前强制释放指定端口（Windows PowerShell 7）
# 用法: ./kill-port.ps1 -Port 5173
param(
  [int]$Port = 5173  # 默认端口(如 Vite: 5173)
)
try {
  Write-Host "尝试释放端口 $Port ..." -ForegroundColor Yellow  # 提示信息
  $lines = netstat -ano | Select-String ":$Port\s+.*LISTENING" # 查找监听该端口的进程
  if (-not $lines) {
    Write-Host "未发现占用端口 $Port 的进程，无需释放。" -ForegroundColor Green  # 正常提示
    exit 0  # 正常退出
  }
  $pids = @()
  foreach ($line in $lines) {
    $cols = ($line.ToString() -split "\s+") | Where-Object { $_ -ne "" } # 拆分列
    $pid = [int]$cols[-1]  # 最后一列为PID
    if ($pids -notcontains $pid) { $pids += $pid } # 去重
  }
  foreach ($pid in $pids) {
    Write-Host "终止进程 PID=$pid (占用端口 $Port)..." -ForegroundColor Yellow  # 操作提示
    Stop-Process -Id $pid -Force -ErrorAction Stop  # 强制终止
  }
  Write-Host "端口 $Port 已成功释放。" -ForegroundColor Green  # 成功提示
  exit 0  # 正常退出
}
catch {
  Write-Error "释放端口时发生错误（中文提示）：$($_.Exception.Message)"  # 中文错误提示
  exit 1  # 异常退出
}