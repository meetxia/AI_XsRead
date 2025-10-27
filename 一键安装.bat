@echo off
chcp 65001 >nul
echo ========================================
echo    文字之境 - 一键安装脚本
echo ========================================
echo.

echo 正在启动安装程序...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

echo.
echo ========================================
echo    安装完成！
echo ========================================
echo.
echo 按任意键退出...
pause >nul

