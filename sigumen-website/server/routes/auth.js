/**
 * 认证路由
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 数据文件路径
const DATA_FILE = path.join(__dirname, '../data/admins.json');

// 读取管理员数据
function getAdmins() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// 保存管理员数据
function saveAdmins(admins) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(admins, null, 2), 'utf-8');
}

// 登录
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: '请输入用户名和密码' });
    }

    const admins = getAdmins();
    const admin = admins.find(a => a.username === username);

    if (!admin) {
      return res.json({ success: false, message: '用户名不存在' });
    }

    if (admin.password !== password) {
      return res.json({ success: false, message: '密码错误' });
    }

    // 返回成功（不含密码）
    const { password: _, ...adminInfo } = admin;
    res.json({
      success: true,
      data: adminInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: '登录失败' });
  }
});

// 验证登录状态
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({ success: false, message: '未登录' });
    }

    // 简化验证：前端存储的是 admin info
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: '验证失败' });
  }
});

// 获取当前管理员信息
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({ success: false, message: '未登录' });
    }

    const admins = getAdmins();
    const adminId = authHeader.replace('Bearer ', '');
    const admin = admins.find(a => a.id === adminId);

    if (!admin) {
      return res.json({ success: false, message: '用户不存在' });
    }

    const { password: _, ...adminInfo } = admin;
    res.json({ success: true, data: adminInfo });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// 修改密码
router.post('/change-password', (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.json({ success: false, message: '请先登录' });
    }

    const admins = getAdmins();
    const adminId = authHeader.replace('Bearer ', '');
    const adminIndex = admins.findIndex(a => a.id === adminId);

    if (adminIndex === -1) {
      return res.json({ success: false, message: '用户不存在' });
    }

    if (admins[adminIndex].password !== oldPassword) {
      return res.json({ success: false, message: '原密码错误' });
    }

    admins[adminIndex].password = newPassword;
    saveAdmins(admins);

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    res.json({ success: false, message: '修改失败' });
  }
});

module.exports = router;
