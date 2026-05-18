#!/bin/bash
# 肆顾门每日资讯自动更新 cron 脚本
# 建议 cron: 每天早上7点执行
# 0 7 * * * /path/to/cron-news.sh >> /var/log/sigumen-news.log 2>&1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR"
LOG_FILE="/tmp/sigumen-news-updater.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始执行资讯更新" >> "$LOG_FILE"

cd "$SERVER_DIR"

# 执行爬虫（不传token参数则只更新本地文件不上传GitHub）
node news-updater.js >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 更新完成" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 更新失败，退出码: $EXIT_CODE" >> "$LOG_FILE"
fi

exit $EXIT_CODE
