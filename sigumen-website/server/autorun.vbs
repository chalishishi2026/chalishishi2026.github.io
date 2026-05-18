@echo off
chcp 65001 >nul
title 肆顾门后台管理服务 - 后台运行

cd /d "%~dp0"

REM 设置 Node.js 路径
set PATH=E:\nodejs;%PATH%

REM 隐藏命令行窗口后台运行
if "%1"=="hide" goto NodeJava
javaw E:\nodejs\node.exe server.js
exit

:NodeJava
cd /d "%~dp0"
E:\nodejs\node.exe server.js
