# 文字之境 - 环境配置文件创建脚本
# 自动创建所有缺失的 .env 配置文件

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "     文字之境 - 环境配置文件创建工具" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot

# 创建 admin-frontend/.env
Write-Host "[1/2] 检查 admin-frontend/.env..." -ForegroundColor Cyan
$adminFrontendEnv = Join-Path $rootPath "admin-frontend\.env"
if (!(Test-Path $adminFrontendEnv)) {
    @"
VITE_APP_TITLE=文字之境后台管理系统
VITE_APP_BASE_API=http://localhost:8001
"@ | Out-File -FilePath $adminFrontendEnv -Encoding utf8
    Write-Host "  ✓ 已创建 admin-frontend/.env" -ForegroundColor Green
} else {
    Write-Host "  ○ admin-frontend/.env 已存在，跳过" -ForegroundColor Yellow
}

# 创建 admin-backend/.env
Write-Host "[2/2] 检查 admin-backend/.env..." -ForegroundColor Cyan
$adminBackendEnv = Join-Path $rootPath "admin-backend\.env"
if (!(Test-Path $adminBackendEnv)) {
    @"
PORT=8001
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=toefl_user
DB_PASSWORD=mojz168168
DB_NAME=ai_xsread
JWT_SECRET=admin-secret-key-change-in-production-2025
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=2097152
CORS_ORIGIN=http://localhost:3010,http://127.0.0.1:3010
LOG_LEVEL=info
"@ | Out-File -FilePath $adminBackendEnv -Encoding utf8
    Write-Host "  ✓ 已创建 admin-backend/.env" -ForegroundColor Green
} else {
    Write-Host "  ○ admin-backend/.env 已存在，跳过" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "     配置文件创建完成！" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "配置文件状态：" -ForegroundColor Yellow

# 检查所有配置文件
$configs = @(
    @{Path="backend\.env"; Name="用户端后端配置"; Port="8005"},
    @{Path="ai-xsread-vue3\.env"; Name="用户端前端配置"; Port="3008"},
    @{Path="admin-backend\.env"; Name="管理后台后端配置"; Port="8001"},
    @{Path="admin-frontend\.env"; Name="管理后台前端配置"; Port="3010"}
)

foreach ($config in $configs) {
    $fullPath = Join-Path $rootPath $config.Path
    if (Test-Path $fullPath) {
        Write-Host "  ✓ $($config.Name) ($($config.Port)) - 已配置" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($config.Name) ($($config.Port)) - 缺失" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "下一步操作：" -ForegroundColor Yellow
Write-Host "  1. 检查数据库配置是否正确（用户名、密码）" -ForegroundColor White
Write-Host "  2. 确保 MySQL 服务已启动" -ForegroundColor White
Write-Host "  3. 运行 '启动开发环境.bat' 启动所有服务" -ForegroundColor White
Write-Host ""
Write-Host "按回车键关闭此窗口..." -ForegroundColor Gray
Read-Host

