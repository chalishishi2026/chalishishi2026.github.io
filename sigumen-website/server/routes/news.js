/**
 * 资讯管理路由
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 数据文件路径
const DATA_FILE = path.join(__dirname, '../data/news.json');

// 读取数据
function getNews() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// 保存数据
function saveNews(news) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(news, null, 2), 'utf-8');
}

// 获取所有资讯
router.get('/', (req, res) => {
  try {
    const news = getNews();
    const { category, keyword } = req.query;

    let result = news;

    // 分类筛选
    if (category && category !== '全部') {
      result = result.filter(n => n.category === category);
    }

    // 关键词搜索
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(kw) ||
        n.summary.toLowerCase().includes(kw)
      );
    }

    // 按日期倒序
    result.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get news error:', error);
    res.json({ success: false, message: '获取失败' });
  }
});

// 获取单条资讯
router.get('/:id', (req, res) => {
  try {
    const news = getNews();
    const item = news.find(n => n.id === req.params.id);

    if (!item) {
      return res.json({ success: false, message: '资讯不存在' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// 添加资讯
router.post('/', (req, res) => {
  try {
    const { title, category, summary, content, image } = req.body;

    if (!title || !category) {
      return res.json({ success: false, message: '标题和分类不能为空' });
    }

    const news = getNews();
    const newItem = {
      id: `news_${uuidv4().slice(0, 8)}`,
      title,
      category,
      summary: summary || '',
      content: content || '',
      image: image || '',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    news.unshift(newItem);
    saveNews(news);

    res.json({ success: true, data: newItem, message: '添加成功' });
  } catch (error) {
    console.error('Add news error:', error);
    res.json({ success: false, message: '添加失败' });
  }
});

// 更新资讯
router.put('/:id', (req, res) => {
  try {
    const news = getNews();
    const index = news.findIndex(n => n.id === req.params.id);

    if (index === -1) {
      return res.json({ success: false, message: '资讯不存在' });
    }

    const { title, category, summary, content, image, date } = req.body;

    news[index] = {
      ...news[index],
      title: title || news[index].title,
      category: category || news[index].category,
      summary: summary || news[index].summary,
      content: content || news[index].content,
      image: image || news[index].image,
      date: date || news[index].date
    };

    saveNews(news);

    res.json({ success: true, data: news[index], message: '更新成功' });
  } catch (error) {
    console.error('Update news error:', error);
    res.json({ success: false, message: '更新失败' });
  }
});

// 删除资讯
router.delete('/:id', (req, res) => {
  try {
    const news = getNews();
    const index = news.findIndex(n => n.id === req.params.id);

    if (index === -1) {
      return res.json({ success: false, message: '资讯不存在' });
    }

    const deleted = news.splice(index, 1)[0];
    saveNews(news);

    res.json({ success: true, message: '删除成功', data: deleted });
  } catch (error) {
    console.error('Delete news error:', error);
    res.json({ success: false, message: '删除失败' });
  }
});

module.exports = router;
