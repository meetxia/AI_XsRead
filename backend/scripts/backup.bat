@echo off
REM ============================================
REM 文字之境 - 数据库备份脚本 (Windows版本)
REM 开发者: 开发者C
REM 创建日期: 2025-10-27
REM 版本: v1.0
REM ============================================

setlocal enabledelayedexpansion

REM ============================================
REM 配置参数
REM ============================================
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=root123
set DB_NAME=ai_xsread
set BACKUP_DIR=H:\momo-ruanjiansheji\AI_XsRead\backend\backups
set MYSQL_BIN=mysql
set MYSQLDUMP_BIN=mysqldump

REM 生成时间戳
for /f "tokens=1-4 delims=/ " %%a in ("%date%") do (
    set DATE_Y=%%a
    set DATE_M=%%b
    set DATE_D=%%c
)
for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
    set TIME_H=%%a
    set TIME_M=%%b
    set TIME_S=%%c
)
set TIMESTAMP=%DATE_Y%%DATE_M%%DATE_D%_%TIME_H%%TIME_M%%TIME_S%
set TIMESTAMP=%TIMESTAMP: =0%

REM ============================================
REM 创建备份目录
REM ============================================
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%BACKUP_DIR%\full" mkdir "%BACKUP_DIR%\full"
if not exist "%BACKUP_DIR%\logs" mkdir "%BACKUP_DIR%\logs"

set LOG_FILE=%BACKUP_DIR%\logs\backup_%TIMESTAMP%.log
set BACKUP_FILE=%BACKUP_DIR%\full\full_%TIMESTAMP%.sql

echo ============================================ >> "%LOG_FILE%"
echo 数据库备份开始 >> "%LOG_FILE%"
echo 时间: %date% %time% >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"

REM ============================================
REM 全量备份
REM ============================================
echo [%time%] 开始全量备份... >> "%LOG_FILE%"
echo 正在备份数据库 %DB_NAME%...

%MYSQLDUMP_BIN% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% ^
    --single-transaction ^
    --quick ^
    --lock-tables=false ^
    --routines ^
    --triggers ^
    --events ^
    --hex-blob ^
    %DB_NAME% > "%BACKUP_FILE%" 2>> "%LOG_FILE%"

if %errorlevel% equ 0 (
    echo [%time%] 全量备份成功 >> "%LOG_FILE%"
    echo 备份成功！文件: %BACKUP_FILE%
) else (
    echo [%time%] 全量备份失败 >> "%LOG_FILE%"
    echo 备份失败！请检查日志: %LOG_FILE%
    exit /b 1
)

REM ============================================
REM 压缩备份文件
REM ============================================
echo [%time%] 开始压缩备份文件... >> "%LOG_FILE%"
echo 正在压缩备份文件...

REM 使用7z压缩 (如果已安装)
where 7z >nul 2>&1
if %errorlevel% equ 0 (
    7z a -tgzip "%BACKUP_FILE%.gz" "%BACKUP_FILE%" >nul 2>> "%LOG_FILE%"
    if %errorlevel% equ 0 (
        del "%BACKUP_FILE%"
        echo [%time%] 压缩成功，原文件已删除 >> "%LOG_FILE%"
        echo 压缩完成！
    ) else (
        echo [%time%] 压缩失败 >> "%LOG_FILE%"
        echo 压缩失败，保留原文件
    )
) else (
    echo [%time%] 未安装7z，跳过压缩 >> "%LOG_FILE%"
    echo 提示: 安装7-Zip可自动压缩备份文件
)

REM ============================================
REM 获取备份文件大小
REM ============================================
if exist "%BACKUP_FILE%.gz" (
    for %%F in ("%BACKUP_FILE%.gz") do set FILE_SIZE=%%~zF
    set BACKUP_PATH=%BACKUP_FILE%.gz
) else (
    for %%F in ("%BACKUP_FILE%") do set FILE_SIZE=%%~zF
    set BACKUP_PATH=%BACKUP_FILE%
)

set /a FILE_SIZE_MB=%FILE_SIZE%/1024/1024
echo [%time%] 备份文件大小: %FILE_SIZE_MB% MB >> "%LOG_FILE%"

REM ============================================
REM 清理旧备份 (保留7天)
REM ============================================
echo [%time%] 开始清理旧备份... >> "%LOG_FILE%"
echo 正在清理7天前的备份...

forfiles /P "%BACKUP_DIR%\full" /M *.sql* /D -7 /C "cmd /c del @path" 2>nul
if %errorlevel% equ 0 (
    echo [%time%] 旧备份清理完成 >> "%LOG_FILE%"
) else (
    echo [%time%] 没有需要清理的旧备份 >> "%LOG_FILE%"
)

REM ============================================
REM 备份验证
REM ============================================
echo [%time%] 开始验证备份文件... >> "%LOG_FILE%"
echo 正在验证备份...

if exist "%BACKUP_PATH%" (
    REM 检查文件大小
    if %FILE_SIZE% gtr 1024 (
        echo [%time%] 备份验证通过 >> "%LOG_FILE%"
        echo 验证通过！
    ) else (
        echo [%time%] 备份文件过小，可能有问题 >> "%LOG_FILE%"
        echo 警告: 备份文件过小！
    )
) else (
    echo [%time%] 备份文件不存在 >> "%LOG_FILE%"
    echo 错误: 备份文件不存在！
    exit /b 1
)

REM ============================================
REM 生成备份报告
REM ============================================
echo ============================================ >> "%LOG_FILE%"
echo 备份完成报告 >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"
echo 数据库: %DB_NAME% >> "%LOG_FILE%"
echo 备份文件: %BACKUP_PATH% >> "%LOG_FILE%"
echo 文件大小: %FILE_SIZE_MB% MB >> "%LOG_FILE%"
echo 完成时间: %date% %time% >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"

echo.
echo ============================================
echo 备份完成!
echo ============================================
echo 备份文件: %BACKUP_PATH%
echo 文件大小: %FILE_SIZE_MB% MB
echo 日志文件: %LOG_FILE%
echo ============================================

endlocal

