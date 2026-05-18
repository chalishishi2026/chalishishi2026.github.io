@echo off
chcp 65001 >nul
title 肆顾门资讯抓取工具

echo.
echo ========================================
echo    肆顾门资讯自动抓取工具
echo ========================================
echo.
echo 请选择操作：
echo   [1] 立即执行一次抓取
echo   [2] 启动后台自动抓取服务（持续运行）
echo   [3] 查看当前资讯数量
echo   [0] 退出
echo.
echo ========================================
echo.

set /p choice=请输入选项 (1/2/3/0):

if "%choice%"=="1" (
    echo.
    echo 正在执行抓取任务...
    node "%~dp0news-crawler.js" --once
    echo.
    pause
) else if "%choice%"=="2" (
    echo.
    echo 正在启动后台服务...
    echo 按 Ctrl+C 可停止服务
    echo.
    node "%~dp0news-crawler.js" --daemon
) else if "%choice%"=="3" (
    echo.
    echo 正在读取资讯数据...
    node -e "const f=require('./data/news.json');console.log('\n当前资讯库共有 '+f.length+' 条资讯\n');" 2>nul || echo 数据文件不存在
    echo.
    pause
) else if "%choice%"=="0" (
    exit
) else (
    echo.
    echo 无效选项，请重新运行
    echo.
    pause
)
