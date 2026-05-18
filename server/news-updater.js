/**
 * 肆顾门每日资讯自动更新脚本
 * 功能：抓取多个来源的资讯 → 更新news.json → 自动提交到GitHub
 * 用法: node news-updater.js [github_token] [repo_path]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// ============== 配置 ==============
const CONFIG = {
  DATA_FILE: path.join(__dirname, '../data/news.json'),
  NEWS_DIR: path.join(__dirname, '../../'),  // 网站根目录
  COMMIT_MSG: '[自动] 每日资讯更新 ' + new Date().toLocaleString('zh-CN'),
};

const SOURCES = [
  { name: '36氪', url: 'https://36kr.com/feed', type: 'rss', category: '创业投资' },
  { name: '虎嗅', url: 'https://www.huxiu.com/rss/feed.xml', type: 'rss', category: '商业科技' },
  { name: '创业邦', url: 'https://www.cyzone.cn/rss/', type: 'rss', category: '创业投资' },
  { name: '少数派', url: 'https://sspai.com/feed', type: 'rss', category: '数字工具' },
  { name: '抽屉新热榜', url: 'https://dig.chuti.me/rss/', type: 'rss', category: '综合热点' }
];

// ============== HTTP请求封装 ==============
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ============== RSS解析（简化版） ==============
function parseRSS(xml, source) {
  const items = [];
  const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (const item of itemMatches.slice(0, 15)) {
    const getTag = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/${tag}>|<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i'));
      return m ? (m[1] || m[2] || '').trim() : '';
    };

    const title = getTag('title');
    const link = getTag('link');
    const description = getTag('description');
    const pubDate = getTag('pubDate') || getTag('dc:date') || '';
    const dateMatch = pubDate.match(/(\d{4})[-\/](\d{2})[-\/](\d{2})/);
    const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : today;

    if (!title || !link) continue;
    // 过滤太旧的资讯
    if (date < twoDaysAgo) continue;

    const summary = description
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .substring(0, 300);

    const id = 'news_' + uuidv4().replace(/-/g, '').slice(0, 8);

    items.push({
      id,
      title,
      category: source.category,
      summary: summary + (summary.length >= 300 ? '...' : ''),
      content: summary + ` <a href="${link}" target="_blank">查看全文</a>`,
      image: '',
      source: source.name,
      sourceUrl: link,
      date,
      createdAt: new Date().toISOString(),
      isAutoCrawled: true
    });
  }
  return items;
}

// ============== 主爬取流程 ==============
async function crawlAllSources() {
  console.log('[' + new Date().toLocaleString('zh-CN') + '] 开始抓取资讯...\n');
  const allNews = [];
  const errors = [];

  for (const source of SOURCES) {
    try {
      console.log(`▶ 抓取 ${source.name}...`);
      const xml = await fetchUrl(source.url);
      const items = parseRSS(xml, source);
      console.log(`  ✓ 获取 ${items.length} 条 (${source.category})`);
      allNews.push(...items);
    } catch (err) {
      console.log(`  ✗ ${source.name} 失败: ${err.message}`);
      errors.push({ source: source.name, error: err.message });
    }
  }

  return { news: allNews, errors };
}

// ============== 更新数据文件 ==============
function updateNewsData(newItems) {
  let existingNews = [];
  if (fs.existsSync(CONFIG.DATA_FILE)) {
    try {
      existingNews = JSON.parse(fs.readFileSync(CONFIG.DATA_FILE, 'utf8'));
    } catch (e) { existingNews = []; }
  }

  // 合并去重（按title去重，保留最新的）
  const existingTitles = new Set(existingNews.map(n => n.title));
  const trulyNew = newItems.filter(n => !existingTitles.has(n.title));

  if (trulyNew.length === 0) {
    console.log('\n📰 没有新资讯（全部已存在）');
    return false;
  }

  // 新资讯放前面
  const merged = [...trulyNew, ...existingNews];
  fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`\n✅ 已更新资讯：新增 ${trulyNew.length} 条，合计 ${merged.length} 条`);
  return true;
}

// ============== Git自动提交 ==============
async function gitCommitPush(githubToken, repoPath) {
  if (!githubToken || !repoPath) {
    console.log('\n⚠ 未提供 GitHub token 或仓库路径，跳过自动提交');
    console.log('   如需自动提交，请提供参数: node news-updater.js <github_token> <repo_path>');
    return;
  }

  try {
    const { execSync } = require('child_process');
    process.chdir(repoPath);

    // 检查是否有变更
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status.trim()) {
      console.log('\n📂 没有文件变更，无需提交');
      return;
    }

    execSync('git config user.email "bot@sigumen.com"');
    execSync('git config user.name "Sigumen Bot"');
    execSync('git add .');
    execSync(`git commit -m "${CONFIG.COMMIT_MSG}"`);
    execSync(`git push origin main`, { env: { ...process.env, GITHUB_TOKEN: githubToken } });
    console.log('\n🚀 已推送到 GitHub');
  } catch (err) {
    console.log('\n⚠ Git提交失败:', err.message);
    // 尝试使用HTTPS + token方式推送
    try {
      const { execSync } = require('child_process');
      process.chdir(repoPath);
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
      if (match && !remoteUrl.includes(githubToken)) {
        const newUrl = `https://${githubToken}@github.com/${match[1]}.git`;
        execSync(`git remote set-url origin ${newUrl}`);
        execSync('git push origin main --force');
        console.log('🚀 已通过token推送');
      }
    } catch (e2) {
      console.log('  token推送也失败:', e2.message);
    }
  }
}

// ============== 入口 ==============
async function main() {
  const githubToken = process.argv[2] || process.env.GITHUB_TOKEN || '';
  const repoPath = process.argv[3] || path.join(__dirname, '../../');

  console.log('═══════════════════════════════════════════');
  console.log('  肆顾门每日资讯自动更新');
  console.log('═══════════════════════════════════════════\n');

  const { news, errors } = await crawlAllSources();

  if (news.length === 0) {
    console.log('\n❌ 所有来源抓取失败，请检查网络');
    process.exit(1);
  }

  const updated = updateNewsData(news);

  if (updated) {
    await gitCommitPush(githubToken, repoPath);
  }

  if (errors.length > 0) {
    console.log('\n部分来源抓取失败:', errors.map(e => `${e.source}: ${e.error}`).join(', '));
  }

  console.log('\n完成！');
}

main().catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});
