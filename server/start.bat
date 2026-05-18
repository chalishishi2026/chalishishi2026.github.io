@echo off
chcp 65001 >nul
title 肆顾门后台管理服务

echo ========================================
echo     肆顾门后台管理服务
echo ========================================
echo.

cd /d "%~dp0"

REM 设置 Node.js 路径（根据实际安装位置）
set PATH=E:\nodejs;%PATH%

REM 检查 Node.js
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请确认安装路径 E:\nodejs
    echo 或修改 start.bat 中的 PATH 设置
    pause
    exit /b 1
)

echo [OK] Node.js 版本:
node --version
echo.

REM 安装依赖
if not exist "node_modules" (
    echo [提示] 正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

echo.
echo [提示] 启动服务器...
echo.
echo 访问地址: http://localhost:3000/admin.html
echo 按 Ctrl+C 停止服务
echo.

node server.js

pause
