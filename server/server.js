/**
 * 肆顾门后台管理 API 服务器
 * Node.js + Express + JSON 文件存储
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// 引入路由
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const teamRoutes = require('./routes/team');
const worksRoutes = require('./routes/works');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务（上传的图片等）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 托管前端页面（重要！）
app.use(express.static(path.join(__dirname, '..')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/works', worksRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 统计接口
app.get('/api/stats', (req, res) => {
  const news = require('./data/news.json');
  const team = require('./data/team.json');
  const works = require('./data/works.json');

  const pendingWorks = works.filter(w => w.status === 'pending').length;

  res.json({
    news: news.length,
    team: team.length,
    works: works.length,
    pendingWorks
  });
});

// 手动触发资讯爬取
app.post('/api/news/crawl', async (req, res) => {
  try {
    const { githubToken, repoPath } = req.body || {};
    const updaterPath = path.join(__dirname, 'news-updater.js');

    // 使用 child_process 执行爬虫脚本
    const { spawn } = require('child_process');
    const args = [];
    if (githubToken) args.push(githubToken);
    if (repoPath) args.push(repoPath);

    const proc = spawn('node', [updaterPath, ...args], {
      cwd: path.join(__dirname),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, message: '资讯更新成功', output: stdout });
      } else {
        res.json({ success: false, message: '资讯更新失败', error: stderr, output: stdout });
      }
    });

    // 60秒超时
    setTimeout(() => {
      proc.kill();
      res.json({ success: false, message: '执行超时（60秒）' });
    }, 60000);

  } catch (error) {
    console.error('Crawl error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: err.message || '服务器错误' });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║     肆顾门后台管理 API 服务                      ║
║     访问地址: http://localhost:${PORT}             ║
║     管理后台: http://localhost:${PORT}/admin.html  ║
╚═══════════════════════════════════════════════╝
  `);
});
