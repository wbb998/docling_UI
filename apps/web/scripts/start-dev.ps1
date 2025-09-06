# 说明: 启动开发服务器前先释放端口（Windows PowerShell 7）
# 用法: ./scripts/start-dev.ps1

param(
  [int]$Port = 5173  # 默认端口
)

try {
  Write-Host "=== Docling Web 前端开发服务器启动 ===" -ForegroundColor Cyan
  
  # 步骤1: 释放端口
  Write-Host "步骤1: 释放端口 $Port ..." -ForegroundColor Yellow
  & "$PSScriptRoot/kill-port.ps1" -Port $Port
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "端口释放失败，但继续启动..."
  }
  
  # 步骤2: 启动开发服务器
  Write-Host "步骤2: 启动 Vite 开发服务器..." -ForegroundColor Yellow
  npm run dev
  
} catch {
  Write-Error "启动开发服务器时发生错误：$($_.Exception.Message)"
  exit 1
}