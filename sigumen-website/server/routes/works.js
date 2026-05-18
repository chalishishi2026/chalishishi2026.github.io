/**
 * 作品管理路由
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 数据文件路径
const WORKS_FILE = path.join(__dirname, '../data/works.json');
const NOTIFICATIONS_FILE = path.join(__dirname, '../data/notifications.json');

// 读取作品数据
function getWorks() {
  const data = fs.readFileSync(WORKS_FILE, 'utf-8');
  return JSON.parse(data);
}

// 保存作品数据
function saveWorks(works) {
  fs.writeFileSync(WORKS_FILE, JSON.stringify(works, null, 2), 'utf-8');
}

// 读取通知数据
function getNotifications() {
  try {
    const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// 保存通知数据
function saveNotifications(notifications) {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf-8');
}

// 创建通知
function createNotification(userId, workId, workTitle, type, message) {
  const notifications = getNotifications();
  const notification = {
    id: `notif_${uuidv4().slice(0, 8)}`,
    userId,
    workId,
    workTitle,
    type, // 'approval' 审核通过, 'rejection' 审核拒绝
    message,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(notification);
  saveNotifications(notifications);
  return notification;
}

// 获取所有作品
router.get('/', (req, res) => {
  try {
    const works = getWorks();
    const { type, status, keyword, userId } = req.query;

    let result = works;

    // 用户筛选（获取指定用户的所有作品）
    if (userId) {
      result = result.filter(w => w.userId === userId);
    }

    // 类型筛选
    if (type && type !== '全部') {
      result = result.filter(w => w.type === type);
    }

    // 状态筛选
    if (status && status !== '全部') {
      result = result.filter(w => w.status === status);
    }

    // 关键词搜索
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(w =>
        w.title.toLowerCase().includes(kw) ||
        (w.summary && w.summary.toLowerCase().includes(kw))
      );
    }

    // 按创建时间倒序
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get works error:', error);
    res.json({ success: false, message: '获取失败' });
  }
});

// 获取单条作品
router.get('/:id', (req, res) => {
  try {
    const works = getWorks();
    const work = works.find(w => w.id === req.params.id);

    if (!work) {
      return res.json({ success: false, message: '作品不存在' });
    }

    res.json({ success: true, data: work });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// 获取用户通知
router.get('/notifications/:userId', (req, res) => {
  try {
    const notifications = getNotifications();
    const userNotifications = notifications.filter(n => n.userId === req.params.userId);
    res.json({ success: true, data: userNotifications });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// 标记通知已读
router.put('/notifications/:id/read', (req, res) => {
  try {
    const notifications = getNotifications();
    const index = notifications.findIndex(n => n.id === req.params.id);

    if (index !== -1) {
      notifications[index].read = true;
      saveNotifications(notifications);
    }

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: '操作失败' });
  }
});

// 添加作品
router.post('/', (req, res) => {
  try {
    const { title, type, language, summary, content, contentHtml, cover, audioUrl, audioFiles, tags, source, reprint, status, userId, authorName } = req.body;

    if (!title || !type) {
      return res.json({ success: false, message: '标题和类型不能为空' });
    }

    const works = getWorks();
    const newWork = {
      id: `works_${uuidv4().slice(0, 8)}`,
      userId: userId || 'anonymous',
      authorName: authorName || '匿名用户',
      title,
      type,
      language: language || '',
      summary: summary || '',
      content: content || '',
      contentHtml: contentHtml || content || '',
      cover: cover || '',
      audioUrl: audioUrl || '',
      audioFiles: audioFiles || [],
      tags: tags || '',
      source: source || '',
      reprint: reprint || '',
      status: status || 'pending',
      rejectionReason: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: status === 'pending' ? new Date().toISOString() : null
    };

    works.unshift(newWork);
    saveWorks(works);

    res.json({
      success: true,
      data: newWork,
      message: status === 'draft' ? '草稿已保存' : '作品已提交，等待审核'
    });
  } catch (error) {
    console.error('Add work error:', error);
    res.json({ success: false, message: '添加失败' });
  }
});

// 更新作品
router.put('/:id', (req, res) => {
  try {
    const works = getWorks();
    const index = works.findIndex(w => w.id === req.params.id);

    if (index === -1) {
      return res.json({ success: false, message: '作品不存在' });
    }

    const {
      title, type, language, summary, content, contentHtml,
      cover, audioUrl, audioFiles, tags, source, reprint, status,
      userId, authorName, rejectionReason
    } = req.body;

    // 如果是从拒绝状态重新提交，改为待审核
    const newStatus = (works[index].status === 'rejected' && status === 'draft')
      ? 'pending'
      : (status || works[index].status);

    works[index] = {
      ...works[index],
      title: title || works[index].title,
      type: type || works[index].type,
      language: language || works[index].language,
      summary: summary || works[index].summary,
      content: content || works[index].content,
      contentHtml: contentHtml || works[index].contentHtml || works[index].content,
      cover: cover || works[index].cover,
      audioUrl: audioUrl || works[index].audioUrl,
      audioFiles: audioFiles || works[index].audioFiles || [],
      tags: tags || works[index].tags,
      source: source || works[index].source,
      reprint: reprint || works[index].reprint,
      status: newStatus,
      rejectionReason: rejectionReason || '',
      userId: userId || works[index].userId,
      authorName: authorName || works[index].authorName,
      updatedAt: new Date().toISOString(),
      submittedAt: (works[index].status === 'rejected' && newStatus === 'pending')
        ? new Date().toISOString()
        : works[index].submittedAt
    };

    saveWorks(works);

    res.json({
      success: true,
      data: works[index],
      message: newStatus === 'pending' ? '作品已重新提交，等待审核' : '更新成功'
    });
  } catch (error) {
    console.error('Update work error:', error);
    res.json({ success: false, message: '更新失败' });
  }
});

// 删除作品
router.delete('/:id', (req, res) => {
  try {
    const works = getWorks();
    const index = works.findIndex(w => w.id === req.params.id);

    if (index === -1) {
      return res.json({ success: false, message: '作品不存在' });
    }

    const deleted = works.splice(index, 1)[0];
    saveWorks(works);

    res.json({ success: true, message: '删除成功', data: deleted });
  } catch (error) {
    console.error('Delete work error:', error);
    res.json({ success: false, message: '删除失败' });
  }
});

// 审核通过
router.post('/:id/approve', (req, res) => {
  try {
    const works = getWorks();
    const index = works.findIndex(w => w.id === req.params.id);

    if (index === -1) {
      return res.json({ success: false, message: '作品不存在' });
    }

    works[index].status = 'approved';
    works[index].updatedAt = new Date().toISOString();
    saveWorks(works);

    // 创建通知
    createNotification(
      works[index].userId,
      works[index].id,
      works[index].title,
      'approval',
      `您的作品《${works[index].title}》已审核通过，已在原创剧本馆展示！`
    );

    res.json({ success: true, message: '审核通过', data: works[index] });
  } catch (error) {
    console.error('Approve work error:', error);
    res.json({ success: false, message: '操作失败' });
  }
});

// 审核拒绝（支持拒绝原因）
router.post('/:id/reject', (req, res) => {
  try {
    const works = getWorks();
    const index = works.findIndex(w => w.id === req.params.id);

    if (index === -1) {
      return res.json({ success: false, message: '作品不存在' });
    }

    const { reason } = req.body;
    const rejectionReason = reason || '作品不符合要求，请修改后重新提交';

    works[index].status = 'rejected';
    works[index].rejectionReason = rejectionReason;
    works[index].updatedAt = new Date().toISOString();
    saveWorks(works);

    // 创建通知
    createNotification(
      works[index].userId,
      works[index].id,
      works[index].title,
      'rejection',
      `您的作品《${works[index].title}》未通过审核。原因：${rejectionReason}`
    );

    res.json({
      success: true,
      message: '已拒绝',
      data: works[index],
      rejectionReason
    });
  } catch (error) {
    console.error('Reject work error:', error);
    res.json({ success: false, message: '操作失败' });
  }
});

module.exports = router;
