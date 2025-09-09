# Docling UI 回归测试脚本
# 测试四类示例：Minimal/Custom/Chunking/Extraction/Picture

param(
    [string]$BaseUrl = "http://localhost:8000",
    [string]$TestDataPath = "tests/data"
)

Write-Host "=== Docling UI 回归测试开始 ===" -ForegroundColor Green
Write-Host "API地址: $BaseUrl" -ForegroundColor Yellow
Write-Host "测试数据路径: $TestDataPath" -ForegroundColor Yellow

# 检查API服务是否运行
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET -TimeoutSec 5
    Write-Host "✅ API服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "❌ API服务未运行，请先启动后端服务" -ForegroundColor Red
    exit 1
}

# 测试函数：发送转换请求并等待结果
function Test-ConvertRequest {
    param(
        [string]$TestName,
        [string]$FilePath,
        [hashtable]$Params
    )
    
    Write-Host "`n--- 测试: $TestName ---" -ForegroundColor Cyan
    Write-Host "文件: $FilePath" -ForegroundColor Gray
    
    try {
        # 检查文件是否存在
        if (-not (Test-Path $FilePath)) {
            Write-Host "❌ 测试文件不存在: $FilePath" -ForegroundColor Red
            return $false
        }
        
        # 构建multipart/form-data请求
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        
        # 读取文件内容
        $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
        $fileName = [System.IO.Path]::GetFileName($FilePath)
        
        # 构建请求体
        $bodyLines = @()
        $bodyLines += "--$boundary"
        $bodyLines += "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`""
        $bodyLines += "Content-Type: application/octet-stream"
        $bodyLines += ""
        
        # 将文件内容转换为字符串（这里简化处理，实际应该用二进制）
        $bodyLines += [System.Text.Encoding]::UTF8.GetString($fileBytes)
        
        # 添加其他参数
        foreach ($key in $Params.Keys) {
            $bodyLines += "--$boundary"
            $bodyLines += "Content-Disposition: form-data; name=`"$key`""
            $bodyLines += ""
            $bodyLines += $Params[$key]
        }
        
        $bodyLines += "--$boundary--"
        $body = $bodyLines -join $LF
        
        # 发送请求
        $headers = @{
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        }
        
        Write-Host "发送转换请求..." -ForegroundColor Yellow
        $convertResponse = Invoke-RestMethod -Uri "$BaseUrl/api/convert" -Method POST -Body $body -Headers $headers -TimeoutSec 30
        
        $jobId = $convertResponse.job_id
        Write-Host "任务ID: $jobId" -ForegroundColor Green
        
        # 轮询任务状态
        $maxAttempts = 30
        $attempt = 0
        
        do {
            Start-Sleep -Seconds 2
            $attempt++
            
            $statusResponse = Invoke-RestMethod -Uri "$BaseUrl/api/jobs/$jobId/status" -Method GET -TimeoutSec 10
            $status = $statusResponse.status
            
            Write-Host "状态检查 $attempt/$maxAttempts : $status" -ForegroundColor Gray
            
            if ($status -eq "completed") {
                Write-Host "✅ 任务完成" -ForegroundColor Green
                
                # 获取结果
                $resultResponse = Invoke-RestMethod -Uri "$BaseUrl/api/jobs/$jobId/result" -Method GET -TimeoutSec 10
                Write-Host "结果文件数量: $($resultResponse.results.Count)" -ForegroundColor Green
                
                return $true
            } elseif ($status -eq "failed") {
                Write-Host "❌ 任务失败" -ForegroundColor Red
                
                # 获取错误信息
                try {
                    $errorResponse = Invoke-RestMethod -Uri "$BaseUrl/api/jobs/$jobId/result" -Method GET -TimeoutSec 10
                    Write-Host "错误信息: $($errorResponse.error)" -ForegroundColor Red
                } catch {
                    Write-Host "无法获取错误详情" -ForegroundColor Red
                }
                
                return $false
            }
            
        } while ($attempt -lt $maxAttempts -and $status -eq "processing")
        
        if ($status -eq "processing") {
            Write-Host "⚠️ 任务超时" -ForegroundColor Yellow
            return $false
        }
        
    } catch {
        Write-Host "❌ 测试异常: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 测试用例定义
$testCases = @(
    @{
        Name = "Minimal - 基础PDF转换"
        File = "$TestDataPath/pdf/2305.03393v1-pg9.pdf"
        Params = @{
            target = "conversion"
            output_format = "markdown"
        }
    },
    @{
        Name = "Custom - 自定义配置"
        File = "$TestDataPath/pdf/multi_page.pdf"
        Params = @{
            target = "conversion"
            output_format = "markdown"
            pipeline_options = '{"do_ocr": true, "do_table_structure": true}'
            from_formats = '["pdf"]'
        }
    },
    @{
        Name = "Chunking - 分块模式"
        File = "$TestDataPath/pdf/2203.01017v2.pdf"
        Params = @{
            target = "chunking"
            output_format = "json"
            chunking_options = '{"tokenizer": "tiktoken", "max_tokens": 512}'
        }
    },
    @{
        Name = "Extraction - 提取模式"
        File = "$TestDataPath/docx"
        Params = @{
            target = "extraction"
            output_format = "json"
            extraction_options = '{"extract_tables": true, "extract_images": true}'
        }
    },
    @{
        Name = "Picture - 图片处理"
        File = "$TestDataPath/2305.03393v1-pg9-img.png"
        Params = @{
            target = "conversion"
            output_format = "markdown"
            vlm_options = '{"enabled": true, "model_type": "local"}'
        }
    }
)

# 执行测试
$passedTests = 0
$totalTests = $testCases.Count

foreach ($testCase in $testCases) {
    $result = Test-ConvertRequest -TestName $testCase.Name -FilePath $testCase.File -Params $testCase.Params
    if ($result) {
        $passedTests++
    }
}

# 输出测试结果
Write-Host "`n=== 测试结果汇总 ===" -ForegroundColor Green
Write-Host "通过: $passedTests/$totalTests" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })

if ($passedTests -eq $totalTests) {
    Write-Host "🎉 所有测试通过！" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ 部分测试失败，请检查日志" -ForegroundColor Yellow
    exit 1
}