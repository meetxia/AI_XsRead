@echo off
REM ============================================
REM 文字之境 - 数据库恢复脚本 (Windows版本)
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

REM ============================================
REM 参数检查
REM ============================================
if "%1"=="" (
    echo 用法: restore.bat [备份文件路径]
    echo 示例: restore.bat %BACKUP_DIR%\full\full_20251027_120000.sql
    echo.
    echo 可用的备份文件:
    dir /B "%BACKUP_DIR%\full\*.sql*"
    exit /b 1
)

set BACKUP_FILE=%1

REM ============================================
REM 文件检查
REM ============================================
if not exist "%BACKUP_FILE%" (
    echo 错误: 备份文件不存在: %BACKUP_FILE%
    exit /b 1
)

echo ============================================
echo 数据库恢复工具
echo ============================================
echo 备份文件: %BACKUP_FILE%
echo 目标数据库: %DB_NAME%
echo ============================================
echo.
echo 警告: 此操作将覆盖现有数据库!
echo.
set /p CONFIRM=确认继续? (y/n): 
if /i not "%CONFIRM%"=="y" (
    echo 操作已取消
    exit /b 0
)

REM ============================================
REM 解压备份文件 (如果是压缩文件)
REM ============================================
set SQL_FILE=%BACKUP_FILE%
if "%BACKUP_FILE:~-3%"==".gz" (
    echo 正在解压备份文件...
    set SQL_FILE=%BACKUP_FILE:~0,-3%
    
    where 7z >nul 2>&1
    if %errorlevel% equ 0 (
        7z x -y "%BACKUP_FILE%" -o"%BACKUP_DIR%\temp" >nul
        if %errorlevel% neq 0 (
            echo 解压失败!
            exit /b 1
        )
        set SQL_FILE=%BACKUP_DIR%\temp\%~n1
    ) else (
        echo 错误: 需要安装7-Zip来解压文件
        exit /b 1
    )
)

REM ============================================
REM 备份当前数据库 (安全措施)
REM ============================================
echo 正在备份当前数据库...
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set SAFETY_BACKUP=%BACKUP_DIR%\safety\safety_backup_%TIMESTAMP%.sql

if not exist "%BACKUP_DIR%\safety" mkdir "%BACKUP_DIR%\safety"

mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% > "%SAFETY_BACKUP%"
if %errorlevel% neq 0 (
    echo 安全备份失败!
    exit /b 1
)
echo 安全备份已创建: %SAFETY_BACKUP%

REM ============================================
REM 恢复数据库
REM ============================================
echo 正在恢复数据库...

%MYSQL_BIN% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%SQL_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo 数据库恢复成功!
    echo ============================================
    echo 恢复时间: %date% %time%
    echo ============================================
) else (
    echo.
    echo ============================================
    echo 数据库恢复失败!
    echo ============================================
    echo 正在尝试回滚到安全备份...
    %MYSQL_BIN% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%SAFETY_BACKUP%"
    if %errorlevel% equ 0 (
        echo 已回滚到恢复前状态
    ) else (
        echo 回滚失败! 请手动恢复: %SAFETY_BACKUP%
    )
    exit /b 1
)

REM ============================================
REM 清理临时文件
REM ============================================
if exist "%BACKUP_DIR%\temp" (
    rd /s /q "%BACKUP_DIR%\temp"
)

REM ============================================
REM 验证恢复
REM ============================================
echo 正在验证恢复结果...
%MYSQL_BIN% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% -e "SELECT '数据库连接正常' AS status; SELECT COUNT(*) AS novel_count FROM %DB_NAME%.novels; SELECT COUNT(*) AS chapter_count FROM %DB_NAME%.chapters;"

endlocal

