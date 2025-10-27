# 文字之境 - 开发环境启动脚本
# 使用方法：右键此文件 -> 使用 PowerShell 运行

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "     文字之境 - 开发环境启动脚本" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js 是否安装
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 未检测到 Node.js，请先安装 Node.js！" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""
Write-Host "正在启动所有服务..." -ForegroundColor Yellow
Write-Host ""

# 启动用户端后端服务 (端口: 8005)
Write-Host "[1/4] 启动用户端后端服务 (localhost:8005)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$PSScriptRoot\backend'; Write-Host '用户端后端服务 - 端口 8005' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 3

# 启动管理后台后端服务 (端口: 8001)
Write-Host "[2/4] 启动管理后台后端服务 (localhost:8001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$PSScriptRoot\admin-backend'; Write-Host '管理后台后端服务 - 端口 8001' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 3

# 启动用户端前端应用 (端口: 3008)
Write-Host "[3/4] 启动用户端前端应用 (localhost:3008)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$PSScriptRoot\ai-xsread-vue3'; Write-Host '用户端前端应用 - 端口 3008' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 3

# 启动管理后台前端应用 (端口: 3010)
Write-Host "[4/4] 启动管理后台前端应用 (localhost:3010)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$PSScriptRoot\admin-frontend'; Write-Host '管理后台前端应用 - 端口 3010' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "     所有服务启动完成！" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务访问地址：" -ForegroundColor Yellow
Write-Host "  - 用户端前端：  http://localhost:3008" -ForegroundColor White
Write-Host "  - 管理后台前端：http://localhost:3010" -ForegroundColor White
Write-Host "  - 用户端API：   http://localhost:8005" -ForegroundColor White
Write-Host "  - 管理后台API： http://localhost:8001" -ForegroundColor White
Write-Host ""
Write-Host "提示：" -ForegroundColor Yellow
Write-Host "  1. 每个服务会在独立的窗口中运行" -ForegroundColor Gray
Write-Host "  2. 关闭窗口即可停止对应服务" -ForegroundColor Gray
Write-Host "  3. 如需查看日志，请查看对应的服务窗口" -ForegroundColor Gray
Write-Host ""
Write-Host "按回车键关闭此窗口..." -ForegroundColor Gray
Read-Host

