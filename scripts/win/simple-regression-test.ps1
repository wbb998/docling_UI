# Docling UI 简化回归测试脚本
# 测试四类示例：Minimal/Custom/Chunking/Extraction/Picture

param(
    [string]$BaseUrl = "http://localhost:8000"
)

Write-Host "=== Docling UI 回归测试开始 ===" -ForegroundColor Green
Write-Host "API地址: $BaseUrl" -ForegroundColor Yellow

# 测试函数：发送JSON请求并等待结果
function Test-ConvertAPI {
    param(
        [string]$TestName,
        [hashtable]$Payload
    )
    
    Write-Host "`n--- 测试: $TestName ---" -ForegroundColor Cyan
    
    try {
        # 转换为JSON
        $jsonPayload = $Payload | ConvertTo-Json -Depth 10
        Write-Host "请求参数: $jsonPayload" -ForegroundColor Gray
        
        # 发送POST请求
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        Write-Host "发送转换请求..." -ForegroundColor Yellow
        $convertResponse = Invoke-RestMethod -Uri "$BaseUrl/convert" -Method POST -Body $jsonPayload -Headers $headers -TimeoutSec 30
        
        $jobId = $convertResponse.job_id
        Write-Host "任务ID: $jobId" -ForegroundColor Green
        
        # 轮询任务状态
        $maxAttempts = 15
        $attempt = 0
        
        do {
            Start-Sleep -Seconds 2
            $attempt++
            
            $statusResponse = Invoke-RestMethod -Uri "$BaseUrl/jobs/$jobId/status" -Method GET -TimeoutSec 10
            $status = $statusResponse.status
            
            Write-Host "状态检查 $attempt/$maxAttempts : $status" -ForegroundColor Gray
            
            if ($status -eq "completed") {
                Write-Host "✅ 任务完成" -ForegroundColor Green
                
                # 获取结果
                $resultResponse = Invoke-RestMethod -Uri "$BaseUrl/jobs/$jobId/result" -Method GET -TimeoutSec 10
                if ($resultResponse.results) {
                    Write-Host "结果文件数量: $($resultResponse.results.Count)" -ForegroundColor Green
                } else {
                    Write-Host "结果: $($resultResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Green
                }
                
                return $true
            } elseif ($status -eq "failed") {
                Write-Host "❌ 任务失败" -ForegroundColor Red
                
                # 获取错误信息
                try {
                    $errorResponse = Invoke-RestMethod -Uri "$BaseUrl/jobs/$jobId/result" -Method GET -TimeoutSec 10
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
        Name = "Minimal - 基础转换（无文件）";
        Payload = @{
            target = "conversion";
            output_format = "markdown"
        }
    };
    @{
        Name = "Custom - 自定义配置";
        Payload = @{
            target = "conversion";
            output_format = "markdown";
            pipeline_options = @{
                do_ocr = $true;
                do_table_structure = $true
            };
            from_formats = @("pdf")
        }
    };
    @{
        Name = "Chunking - 分块模式";
        Payload = @{
            target = "chunking";
            output_format = "json";
            chunking_options = @{
                tokenizer = "tiktoken";
                max_tokens = 512
            }
        }
    };
    @{
        Name = "Extraction - 提取模式";
        Payload = @{
            target = "extraction";
            output_format = "json";
            extraction_options = @{
                extract_tables = $true;
                extract_images = $true
            }
        }
    };
    @{
        Name = "Picture - 图片处理";
        Payload = @{
            target = "conversion";
            output_format = "markdown";
            vlm_options = @{
                enabled = $true;
                model_type = "local"
            }
        }
    }
)

# 执行测试
$passedTests = 0
$totalTests = $testCases.Count

foreach ($testCase in $testCases) {
    $result = Test-ConvertAPI -TestName $testCase.Name -Payload $testCase.Payload
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