@echo off
chcp 65001 >nul
title 文字之境 - 开发环境启动

echo ===============================================
echo      文字之境 - 开发环境启动脚本
echo ===============================================
echo.

echo 检查 Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js！
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [成功] Node.js 版本: %NODE_VERSION%
echo.

echo 正在启动所有服务...
echo.

echo [1/4] 启动用户端后端服务 (localhost:8005)...
start "用户端后端 (8005)" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul

echo [2/4] 启动管理后台后端服务 (localhost:8001)...
start "管理后台后端 (8001)" cmd /k "cd /d %~dp0admin-backend && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/4] 启动用户端前端应用 (localhost:3008)...
start "用户端前端 (3008)" cmd /k "cd /d %~dp0ai-xsread-vue3 && npm run dev"
timeout /t 3 /nobreak >nul

echo [4/4] 启动管理后台前端应用 (localhost:3010)...
start "管理后台前端 (3010)" cmd /k "cd /d %~dp0admin-frontend && npm run dev"

echo.
echo ===============================================
echo      所有服务启动完成！
echo ===============================================
echo.
echo 服务访问地址：
echo   - 用户端前端：  http://localhost:3008
echo   - 管理后台前端：http://localhost:3010
echo   - 用户端API：   http://localhost:8005
echo   - 管理后台API： http://localhost:8001
echo.
echo 提示：
echo   1. 每个服务会在独立的窗口中运行
echo   2. 关闭窗口即可停止对应服务
echo   3. 如需查看日志，请查看对应的服务窗口
echo.
echo 按任意键关闭此窗口...
pause >nul

