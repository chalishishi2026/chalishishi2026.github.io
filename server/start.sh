#!/bin/bash
# 肆顾门后台管理服务启动脚本

echo "正在启动肆顾门后台管理服务..."

cd "$(dirname "$0")"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 启动服务
echo ""
echo "启动服务器..."
node server.js
