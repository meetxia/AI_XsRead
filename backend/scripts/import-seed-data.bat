@echo off
chcp 65001 > nul
echo.
echo ========================================
echo 🌱 导入种子数据
echo ========================================
echo.

cd /d "%~dp0.."

echo 📦 检查依赖...
if not exist "node_modules" (
    echo ❌ 依赖未安装，正在安装...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo ✅ 依赖检查完成
echo.
echo ⚙️  开始导入数据...
node scripts/import-seed-data.js

if errorlevel 1 (
    echo.
    echo ❌ 导入失败
    pause
    exit /b 1
)

echo.
echo ✅ 导入完成！
pause

