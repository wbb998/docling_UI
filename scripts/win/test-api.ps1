# 简单的API测试脚本
param(
    [string]$BaseUrl = "http://localhost:8000"
)

Write-Host "=== Docling UI API 测试 ===" -ForegroundColor Green

# 测试1: Minimal - 基础转换
Write-Host "`n--- 测试1: Minimal 基础转换 ---" -ForegroundColor Cyan
try {
    $payload1 = @{
        target = "conversion"
        output_format = "markdown"
    } | ConvertTo-Json
    
    Write-Host "发送请求: $payload1" -ForegroundColor Gray
    $response1 = Invoke-RestMethod -Uri "$BaseUrl/convert" -Method POST -Body $payload1 -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ 测试1成功: job_id = $($response1.job_id)" -ForegroundColor Green
} catch {
    Write-Host "❌ 测试1失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试2: Custom - 自定义配置
Write-Host "`n--- 测试2: Custom 自定义配置 ---" -ForegroundColor Cyan
try {
    $payload2 = @{
        target = "conversion"
        output_format = "markdown"
        pipeline_options = @{
            do_ocr = $true
            do_table_structure = $true
        }
        from_formats = @("pdf")
    } | ConvertTo-Json -Depth 10
    
    Write-Host "发送请求: $payload2" -ForegroundColor Gray
    $response2 = Invoke-RestMethod -Uri "$BaseUrl/convert" -Method POST -Body $payload2 -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ 测试2成功: job_id = $($response2.job_id)" -ForegroundColor Green
} catch {
    Write-Host "❌ 测试2失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试3: Chunking - 分块模式
Write-Host "`n--- 测试3: Chunking 分块模式 ---" -ForegroundColor Cyan
try {
    $payload3 = @{
        target = "chunking"
        output_format = "json"
        chunking_options = @{
            tokenizer = "tiktoken"
            max_tokens = 512
        }
    } | ConvertTo-Json -Depth 10
    
    Write-Host "发送请求: $payload3" -ForegroundColor Gray
    $response3 = Invoke-RestMethod -Uri "$BaseUrl/convert" -Method POST -Body $payload3 -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ 测试3成功: job_id = $($response3.job_id)" -ForegroundColor Green
} catch {
    Write-Host "❌ 测试3失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试4: Extraction - 提取模式
Write-Host "`n--- 测试4: Extraction 提取模式 ---" -ForegroundColor Cyan
try {
    $payload4 = @{
        target = "extraction"
        output_format = "json"
        extraction_options = @{
            extract_tables = $true
            extract_images = $true
        }
    } | ConvertTo-Json -Depth 10
    
    Write-Host "发送请求: $payload4" -ForegroundColor Gray
    $response4 = Invoke-RestMethod -Uri "$BaseUrl/convert" -Method POST -Body $payload4 -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ 测试4成功: job_id = $($response4.job_id)" -ForegroundColor Green
} catch {
    Write-Host "❌ 测试4失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试5: Picture - 图片处理
Write-Host "`n--- 测试5: Picture 图片处理 ---" -ForegroundColor Cyan
try {
    $payload5 = @{
        target = "conversion"
        output_format = "markdown"
        vlm_options = @{
            enabled = $true
            model_type = "local"
        }
    } | ConvertTo-Json -Depth 10
    
    Write-Host "发送请求: $payload5" -ForegroundColor Gray
    $response5 = Invoke-RestMethod -Uri "$BaseUrl/convert" -Method POST -Body $payload5 -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ 测试5成功: job_id = $($response5.job_id)" -ForegroundColor Green
} catch {
    Write-Host "❌ 测试5失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 测试完成 ===" -ForegroundColor Green