/**
 * 肆顾门资讯抓取器 - 多来源版本
 * 支持从多个高质量来源抓取完整文章内容
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// ============== 配置区域 ==============

const CONFIG = {
  // 数据文件
  DATA_FILE: path.join(__dirname, '../data/news.json'),

  // 更新间隔（毫秒）- 每周一次
  INTERVAL: 7 * 24 * 60 * 60 * 1000,

  // 来源配置
  SOURCES: [
    // --- 36氪 ---
    {
      name: '36氪',
      url: 'https://36kr.com/feed',
      type: 'rss',
      category: '创业投资'
    },
    // --- 虎嗅 ---
    {
      name: '虎嗅',
      url: 'https://www.huxiu.com/rss/feed.xml',
      type: 'rss',
      category: '商业科技'
    },
    // --- 创业邦 ---
    {
      name: '创业邦',
      url: 'https://www.cyzone.cn/rss/',
      type: 'rss',
      category: '创业投资'
    },
    // --- 少数派 ---
    {
      name: '少数派',
      url: 'https://sspai.com/feed',
      type: 'rss',
      category: '数字工具'
    },
    // --- 抽屉新热榜 ---
    {
      name: '抽屉新热榜',
      url: 'https://dig.chuti.me/rss/',
      type: 'rss',
      category: '综合热点'
    }
  ]
};

// ============== 工具函数 ==============

/**
 * 简单的HTTP GET请求
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // 处理重定向
        httpGet(res.headers.location).then(resolve).catch(reject);
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('请求超时'));
    });
  });
}

/**
 * 简单的XML解析（用于RSS）
 */
function parseXML(xml) {
  const items = [];

  // 先提取所有item
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const item = itemMatch[1];

    const getValue = (tag) => {
      // 尝试CDATA
      let match = item.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\/${tag}>`, 'i'));
      if (match) return match[1].trim();

      // 尝试普通标签
      match = item.match(new RegExp(`<${tag}[^>]*>\\s*([\\s\\S]*?)\\s*<\/${tag}>`, 'i'));
      if (match) return match[1].trim();

      return '';
    };

    const title = getValue('title');
    const link = getValue('link');
    const description = getValue('description');
    const pubDate = getValue('pubDate');

    if (title && link) {
      // 清理HTML标签
      const summary = description.replace(/<[^>]+>/g, '').substring(0, 300);
      let date = new Date().toISOString().split('T')[0];
      try {
        if (pubDate) {
          date = new Date(pubDate).toISOString().split('T')[0];
        }
      } catch (e) {}

      items.push({
        title: title.replace(/<!\[CDATA\[|\]\]>/g, ''),
        link,
        summary,
        date
      });
    }
  }

  return items;
}

/**
 * 读取现有资讯
 */
function getNews() {
  try {
    if (!fs.existsSync(CONFIG.DATA_FILE)) return [];
    const data = fs.readFileSync(CONFIG.DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取失败:', error.message);
    return [];
  }
}

/**
 * 保存资讯
 */
function saveNews(news) {
  try {
    fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(news, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('保存失败:', error.message);
    return false;
  }
}

/**
 * 添加单条资讯（带去重）
 */
function addNews(item, sourceName) {
  const news = getNews();

  // 去重检查
  const exists = news.some(n =>
    n.title === item.title ||
    (n.sourceUrl && n.sourceUrl === item.link)
  );

  if (exists) {
    return { added: false, reason: 'duplicate' };
  }

  const newItem = {
    id: `news_${uuidv4().slice(0, 8)}`,
    title: item.title,
    category: item.category || sourceName,
    summary: item.summary || '',
    content: item.content || item.summary || '', // 完整内容
    image: item.image || '',
    source: sourceName,
    sourceUrl: item.link,
    date: item.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    isAutoCrawled: true
  };

  news.unshift(newItem);
  saveNews(news);

  return { added: true, item: newItem };
}

// ============== 抓取函数 ==============

/**
 * 从RSS来源抓取
 */
async function fetchFromRSS(source) {
  try {
    console.log(`\n[${source.name}] 正在抓取RSS...`);
    const xml = await httpGet(source.url);

    if (!xml || xml.length < 100) {
      console.log(`[${source.name}] 返回内容为空`);
      return [];
    }

    const items = parseXML(xml);
    console.log(`[${source.name}] 获取到 ${items.length} 条`);

    return items.map(item => ({
      ...item,
      category: source.category
    }));
  } catch (error) {
    console.log(`[${source.name}] 抓取失败: ${error.message}`);
    return [];
  }
}

/**
 * 从HTML页面抓取
 */
async function fetchFromHTML(source) {
  try {
    console.log(`\n[${source.name}] 正在抓取页面...`);
    const html = await httpGet(source.url);

    if (!html || html.length < 500) {
      console.log(`[${source.name}] 返回内容为空`);
      return [];
    }

    // 简单解析 - 提取链接和标题
    const items = [];
    const linkPattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/a>/gi;
    let match;

    while ((match = linkPattern.exec(html)) !== null && items.length < 20) {
      const href = match[1];
      const text = match[2].replace(/<[^>]+>/g, '').trim();

      // 过滤有效链接
      if (href.startsWith('http') &&
          text.length > 10 &&
          text.length < 100 &&
          !href.includes('#') &&
          !text.includes('更多') &&
          !text.includes('评论')) {

        items.push({
          title: text,
          link: href,
          summary: '',
          date: new Date().toISOString().split('T')[0],
          category: source.category
        });
      }
    }

    console.log(`[${source.name}] 获取到 ${items.length} 条`);
    return items;
  } catch (error) {
    console.log(`[${source.name}] 抓取失败: ${error.message}`);
    return [];
  }
}

/**
 * 主抓取函数
 */
async function crawlNews() {
  console.log('\n' + '═'.repeat(60));
  console.log(`肆顾门资讯抓取任务 - ${new Date().toLocaleString('zh-CN')}`);
  console.log('═'.repeat(60));

  const allItems = [];

  for (const source of CONFIG.SOURCES) {
    try {
      if (source.type === 'rss') {
        const items = await fetchFromRSS(source);
        allItems.push(...items);
      } else if (source.type === 'html') {
        const items = await fetchFromHTML(source);
        allItems.push(...items);
      }

      // 间隔一下，避免请求过快
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.log(`[${source.name}] 错误: ${error.message}`);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`共获取 ${allItems.length} 条资讯，开始处理...\n`);

  // 添加到数据库
  const results = { added: 0, skipped: 0 };
  for (const item of allItems) {
    const result = addNews(item, item.source || '未知来源');
    if (result.added) {
      results.added++;
      console.log(`[+] ${item.title.substring(0, 40)}...`);
    } else {
      results.skipped++;
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('抓取完成！');
  console.log(`  新增: ${results.added} 条`);
  console.log(`  跳过: ${results.skipped} 条`);

  const total = getNews().length;
  console.log(`  总计: ${total} 条资讯\n`);

  return results;
}

// ============== 入口 ==============

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--once') {
    crawlNews().then(() => process.exit(0)).catch(e => {
      console.error(e);
      process.exit(1);
    });
  } else if (args[0] === '--daemon') {
    console.log(`\n服务模式：每 ${CONFIG.INTERVAL / 1000 / 60 / 60 / 24} 天执行一次\n`);
    crawlNews();
    setInterval(crawlNews, CONFIG.INTERVAL);
  } else {
    // 默认单次
    crawlNews().then(() => process.exit(0)).catch(e => {
      console.error(e);
      process.exit(1);
    });
  }
}

module.exports = { crawlNews, addNews, getNews };
