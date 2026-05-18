# 肆顾门资讯自动抓取系统

## 功能说明

自动从互联网抓取行业相关资讯，添加到管理后台数据库，实时更新前端网站显示。

### 核心特性

- ✅ **定时抓取**：可配置每天自动执行
- ✅ **智能去重**：根据标题判断，避免重复添加
- ✅ **历史保留**：只新增不删除，保留所有历史资讯
- ✅ **来源配置**：可自定义多个资讯来源和关键词

---

## 使用方式

### 方式一：手动执行（立即抓取一次）

**双击运行：**
```
sigumen-website\server\crawler\run-crawler.bat
```
选择 `[1] 立即执行一次抓取`

---

### 方式二：后台自动抓取服务

**双击运行：**
```
sigumen-website\server\crawler\run-crawler.bat
```
选择 `[2] 启动后台自动抓取服务`

服务会持续运行，定时抓取资讯。按 `Ctrl+C` 可停止。

---

### 方式三：Windows定时任务（推荐）

自动在每天指定时间执行，无需手动运行。

**配置定时任务（只需运行一次）：**
```
cd sigumen-website\server\crawler
node setup-scheduled-task.js
```

**查看定时任务状态：**
```
node setup-scheduled-task.js --check
```

**删除定时任务：**
```
node setup-scheduled-task.js --delete
```

---

### 方式四：WorkBuddy自动化

在WorkBuddy中创建自动化任务：

1. 创建自动化任务（参考 `自动化配置示例.md`）
2. 设置执行频率（如每天早上8点）
3. WorkBuddy会自动执行抓取

---

## 查看结果

### 前端网站
打开 `http://localhost:3000/news.html` 查看资讯列表

### 管理后台
1. 打开 `http://localhost:3000/admin.html`
2. 登录后点击左侧「资讯管理」
3. 可以看到自动抓取的资讯（标记为 `auto` 图标）
4. 可手动编辑、删除或置顶

### 数据文件
```
sigumen-website\server\data\news.json
```

---

## 添加新的资讯来源

编辑 `news-crawler.js`，找到 `CONFIG.SOURCES` 配置：

```javascript
SOURCES: [
  {
    name: '网站名称',
    url: 'https://example.com',
    keywords: ['关键词1', '关键词2'],
    category: '分类名称'
  },
  // 添加更多来源...
]
```

---

## 自定义抓取逻辑

`fetchSampleNews()` 函数返回示例数据。要实现真正的网络抓取，需要：

1. 使用 `axios` 或 `node-fetch` 请求目标网站
2. 使用 `cheerio` 或 `jsdom` 解析HTML
3. 提取标题、摘要、链接等内容

示例（需要安装额外依赖）：
```javascript
const axios = require('axios');
const cheerio = require('cheerio');

async function fetchFromWebsite() {
  const response = await axios.get('https://目标网站.com');
  const $ = cheerio.load(response.data);

  const news = [];
  $('.news-item').each((i, el) => {
    news.push({
      title: $(el).find('.title').text(),
      summary: $(el).find('.desc').text(),
      source: '网站名称',
      sourceUrl: $(el).find('a').attr('href'),
      category: '分类'
    });
  });

  return news;
}
```

---

## 故障排除

### 问题：抓取成功但网站没更新

**原因**：后端服务器可能需要重启才能读取最新数据

**解决**：重启服务器
```
cd sigumen-website\server
node server.js
```

### 问题：定时任务不执行

**检查**：
1. 打开"任务计划程序"查看任务状态
2. 确认Node.js路径正确
3. 尝试手动运行一次脚本测试

### 问题：资讯重复添加

**原因**：抓取脚本运行多次

**解决**：确保任务计划只配置了一次，或使用去重功能

---

## 文件结构

```
sigumen-website/
└── server/
    ├── crawler/
    │   ├── news-crawler.js          # 抓取脚本
    │   ├── run-crawler.bat          # Windows启动器
    │   └── setup-scheduled-task.js # 定时任务配置
    └── data/
        └── news.json                # 资讯数据文件
```
