# Docling UI 测试运行脚本
# 用于在Windows环境下运行各种类型的测试

param(
    [string]$TestType = "all",  # all, unit, integration, e2e, coverage
    [switch]$Watch = $false,    # 是否启用监听模式
    [switch]$Coverage = $false, # 是否生成覆盖率报告
    [switch]$Verbose = $false   # 是否显示详细输出
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan
        "White" = [ConsoleColor]::White
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

# 检查Node.js和npm
function Test-Prerequisites {
    Write-ColorOutput "检查测试环境..." "Blue"
    
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✓ Node.js版本: $nodeVersion" "Green"
    }
    catch {
        Write-ColorOutput "✗ 未找到Node.js，请先安装Node.js" "Red"
        exit 1
    }
    
    try {
        $npmVersion = npm --version
        Write-ColorOutput "✓ npm版本: $npmVersion" "Green"
    }
    catch {
        Write-ColorOutput "✗ 未找到npm" "Red"
        exit 1
    }
}

# 安装测试依赖
function Install-TestDependencies {
    Write-ColorOutput "检查并安装测试依赖..." "Blue"
    
    Set-Location "apps/web"
    
    # 检查是否需要安装依赖
    if (-not (Test-Path "node_modules")) {
        Write-ColorOutput "安装项目依赖..." "Yellow"
        npm install
    }
    
    # 检查测试相关依赖
    $testDeps = @(
        "vitest",
        "@testing-library/react",
        "@testing-library/jest-dom",
        "@testing-library/user-event",
        "jsdom"
    )
    
    foreach ($dep in $testDeps) {
        try {
            npm list $dep --depth=0 2>$null | Out-Null
            Write-ColorOutput "✓ $dep 已安装" "Green"
        }
        catch {
            Write-ColorOutput "安装 $dep..." "Yellow"
            npm install --save-dev $dep
        }
    }
    
    Set-Location "../.."
}

# 运行单元测试
function Run-UnitTests {
    Write-ColorOutput "运行单元测试..." "Blue"
    
    Set-Location "apps/web"
    
    $args = @("run", "test:unit")
    
    if ($Watch) {
        $args += "--watch"
    }
    
    if ($Coverage) {
        $args += "--coverage"
    }
    
    if ($Verbose) {
        $args += "--reporter=verbose"
    }
    
    npm @args
    
    Set-Location "../.."
}

# 运行集成测试
function Run-IntegrationTests {
    Write-ColorOutput "运行集成测试..." "Blue"
    
    Set-Location "apps/web"
    
    $args = @("run", "test:integration")
    
    if ($Watch) {
        $args += "--watch"
    }
    
    if ($Coverage) {
        $args += "--coverage"
    }
    
    npm @args
    
    Set-Location "../.."
}

# 运行端到端测试
function Run-E2ETests {
    Write-ColorOutput "运行端到端测试..." "Blue"
    
    # 检查后端服务是否运行
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
        Write-ColorOutput "✓ 后端服务正在运行" "Green"
    }
    catch {
        Write-ColorOutput "⚠ 后端服务未运行，启动测试服务..." "Yellow"
        Start-TestServices
    }
    
    Set-Location "apps/web"
    
    $args = @("run", "test:e2e")
    
    if ($Coverage) {
        $args += "--coverage"
    }
    
    npm @args
    
    Set-Location "../.."
}

# 启动测试服务
function Start-TestServices {
    Write-ColorOutput "启动测试服务..." "Blue"
    
    # 启动后端服务（测试模式）
    Start-Process powershell -ArgumentList "-Command", "cd services/api-gateway/py; $env:TESTING='true'; python -m uvicorn src.main:app --host 0.0.0.0 --port 8000" -WindowStyle Hidden
    
    # 等待服务启动
    $maxAttempts = 30
    $attempt = 0
    
    do {
        Start-Sleep -Seconds 1
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput "✓ 后端服务启动成功" "Green"
                break
            }
        }
        catch {
            # 继续等待
        }
    } while ($attempt -lt $maxAttempts)
    
    if ($attempt -eq $maxAttempts) {
        Write-ColorOutput "✗ 后端服务启动失败" "Red"
        exit 1
    }
}

# 生成覆盖率报告
function Generate-CoverageReport {
    Write-ColorOutput "生成覆盖率报告..." "Blue"
    
    Set-Location "apps/web"
    
    npm run test:coverage
    
    # 打开覆盖率报告
    if (Test-Path "coverage/index.html") {
        Write-ColorOutput "✓ 覆盖率报告已生成: coverage/index.html" "Green"
        
        # 询问是否打开报告
        $openReport = Read-Host "是否打开覆盖率报告? (y/N)"
        if ($openReport -eq "y" -or $openReport -eq "Y") {
            Start-Process "coverage/index.html"
        }
    }
    
    Set-Location "../.."
}

# 清理测试环境
function Clear-TestEnvironment {
    Write-ColorOutput "清理测试环境..." "Blue"
    
    Set-Location "apps/web"
    
    # 清理覆盖率报告
    if (Test-Path "coverage") {
        Remove-Item -Recurse -Force "coverage"
        Write-ColorOutput "✓ 已清理覆盖率报告" "Green"
    }
    
    # 清理测试结果
    if (Test-Path "test-results") {
        Remove-Item -Recurse -Force "test-results"
        Write-ColorOutput "✓ 已清理测试结果" "Green"
    }
    
    Set-Location "../.."
}

# 显示测试统计
function Show-TestStatistics {
    Write-ColorOutput "测试统计信息:" "Blue"
    
    Set-Location "apps/web"
    
    if (Test-Path "test-results/results.json") {
        $results = Get-Content "test-results/results.json" | ConvertFrom-Json
        
        Write-ColorOutput "总测试数: $($results.numTotalTests)" "White"
        Write-ColorOutput "通过: $($results.numPassedTests)" "Green"
        Write-ColorOutput "失败: $($results.numFailedTests)" "Red"
        Write-ColorOutput "跳过: $($results.numPendingTests)" "Yellow"
        Write-ColorOutput "执行时间: $($results.testResults[0].perfStats.runtime)ms" "White"
    }
    
    Set-Location "../.."
}

# 主函数
function Main {
    Write-ColorOutput "=== Docling UI 测试套件 ===" "Cyan"
    Write-ColorOutput "测试类型: $TestType" "White"
    
    # 检查先决条件
    Test-Prerequisites
    
    # 安装依赖
    Install-TestDependencies
    
    # 根据测试类型运行相应测试
    switch ($TestType.ToLower()) {
        "unit" {
            Run-UnitTests
        }
        "integration" {
            Run-IntegrationTests
        }
        "e2e" {
            Run-E2ETests
        }
        "coverage" {
            Generate-CoverageReport
        }
        "clean" {
            Clear-TestEnvironment
        }
        "all" {
            Write-ColorOutput "运行完整测试套件..." "Blue"
            Run-UnitTests
            Run-IntegrationTests
            Run-E2ETests
            if ($Coverage) {
                Generate-CoverageReport
            }
            Show-TestStatistics
        }
        default {
            Write-ColorOutput "未知的测试类型: $TestType" "Red"
            Write-ColorOutput "支持的类型: all, unit, integration, e2e, coverage, clean" "Yellow"
            exit 1
        }
    }
    
    Write-ColorOutput "=== 测试完成 ===" "Green"
}

# 错误处理
trap {
    Write-ColorOutput "测试过程中发生错误: $_" "Red"
    exit 1
}

# 运行主函数
Main