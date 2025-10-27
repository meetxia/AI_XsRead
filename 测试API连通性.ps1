# 文字之境 - API连通性测试脚本
# 测试所有后端API接口是否正常响应

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "     文字之境 - API连通性测试" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 定义测试结果统计
$successCount = 0
$failCount = 0

# 测试API接口的函数
function Test-ApiEndpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET"
    )
    
    Write-Host "测试: $Name" -ForegroundColor Cyan
    Write-Host "  URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200) {
            Write-Host "  ✓ 成功 (状态码: $statusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ⚠ 警告 (状态码: $statusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -match "无法连接") {
            Write-Host "  ✗ 失败: 无法连接到服务器" -ForegroundColor Red
        } elseif ($errorMsg -match "404") {
            Write-Host "  ✗ 失败: 接口不存在 (404)" -ForegroundColor Red
        } else {
            Write-Host "  ✗ 失败: $errorMsg" -ForegroundColor Red
        }
        return $false
    }
    
    Write-Host ""
}

Write-Host "开始测试后端服务..." -ForegroundColor Yellow
Write-Host ""

# ========== 用户端后端 (8005) ==========
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  用户端后端 API (localhost:8005)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8005"

# 测试健康检查
if (Test-ApiEndpoint "健康检查" "$baseUrl/api/health") { $successCount++ } else { $failCount++ }

# 测试小说列表
if (Test-ApiEndpoint "获取小说列表" "$baseUrl/api/novels") { $successCount++ } else { $failCount++ }

# 测试推荐小说
if (Test-ApiEndpoint "获取推荐小说" "$baseUrl/api/novels/recommend") { $successCount++ } else { $failCount++ }

# 测试搜索接口（需要参数，测试会返回400，但能证明服务在运行）
Write-Host "测试: 小说搜索接口" -ForegroundColor Cyan
Write-Host "  URL: $baseUrl/api/novels/search?keyword=test" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/novels/search?keyword=test" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "  ✓ 搜索接口响应正常" -ForegroundColor Green
    $successCount++
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "  ✓ 搜索接口响应正常 (参数验证工作正常)" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ✗ 搜索接口异常" -ForegroundColor Red
        $failCount++
    }
}
Write-Host ""

# ========== 管理后台后端 (8001) ==========
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  管理后台后端 API (localhost:8001)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$adminBaseUrl = "http://localhost:8001"

# 测试根路径
if (Test-ApiEndpoint "API根路径" "$adminBaseUrl/") { $successCount++ } else { $failCount++ }

# 测试管理后台API路径（无认证会返回401，但能证明服务在运行）
Write-Host "测试: 管理员信息接口" -ForegroundColor Cyan
Write-Host "  URL: $adminBaseUrl/api/admin/profile" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$adminBaseUrl/api/admin/profile" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "  ✓ 接口响应正常" -ForegroundColor Green
    $successCount++
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "  ✓ 接口响应正常 (需要认证，符合预期)" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ✗ 接口异常" -ForegroundColor Red
        $failCount++
    }
}
Write-Host ""

# ========== 测试结果汇总 ==========
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  测试结果汇总" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$totalTests = $successCount + $failCount
$successRate = if ($totalTests -gt 0) { [math]::Round(($successCount / $totalTests) * 100, 2) } else { 0 }

Write-Host "  总测试数: $totalTests" -ForegroundColor White
Write-Host "  成功: $successCount" -ForegroundColor Green
Write-Host "  失败: $failCount" -ForegroundColor Red
Write-Host "  成功率: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✓ 所有API接口测试通过！系统运行正常。" -ForegroundColor Green
} elseif ($failCount -le 2) {
    Write-Host "⚠ 部分API接口测试失败，请检查对应的服务。" -ForegroundColor Yellow
} else {
    Write-Host "✗ 多个API接口测试失败，请检查服务是否正常启动。" -ForegroundColor Red
}

Write-Host ""
Write-Host "故障排查建议：" -ForegroundColor Yellow
Write-Host "  1. 确保所有后端服务已启动（backend、admin-backend）" -ForegroundColor White
Write-Host "  2. 检查 .env 配置文件是否正确" -ForegroundColor White
Write-Host "  3. 确认MySQL数据库服务已启动" -ForegroundColor White
Write-Host "  4. 查看后端服务的日志输出" -ForegroundColor White
Write-Host "  5. 检查防火墙是否阻止了端口访问" -ForegroundColor White
Write-Host ""
Write-Host "按回车键关闭此窗口..." -ForegroundColor Gray
Read-Host

