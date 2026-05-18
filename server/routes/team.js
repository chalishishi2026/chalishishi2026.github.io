/**
 * 团队管理路由
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 数据文件路径
const DATA_FILE = path.join(__dirname, '../data/team.json');

// 读取数据
function getTeam() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// 保存数据
function saveTeam(team) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(team, null, 2), 'utf-8');
}

// 获取所有团队成员
router.get('/', (req, res) => {
  try {
    const team = getTeam();
    const { category, keyword } = req.query;

    let result = team;

    // 分类筛选
    if (category && category !== '全部') {
      result = result.filter(t => t.category === category);
    }

    // 关键词搜索
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(kw) ||
        t.position.toLowerCase().includes(kw) ||
        t.bio.toLowerCase().includes(kw)
      );
    }

    // 按排序字段
    result.sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get team error:', error);
    res.json({ success: false, message: '获取失败' });
  }
});

// 获取单条成员
router.get('/:id', (req, res) => {
  try {
    const team = getTeam();
    const member = team.find(t => t.id === req.params.id);

    if (!member) {
      return res.json({ success: false, message: '成员不存在' });
    }

    res.json({ success: true, data: member });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// 添加成员
router.post('/', (req, res) => {
  try {
    const { name, position, category, bio, avatar } = req.body;

    if (!name || !position) {
      return res.json({ success: false, message: '姓名和职位不能为空' });
    }

    const team = getTeam();
    const newMember = {
      id: `team_${uuidv4().slice(0, 8)}`,
      name,
      position,
      category: category || '核心团队',
      bio: bio || '',
      avatar: avatar || 'assets/images/avatar-default.png',
      order: team.length + 1,
      createdAt: new Date().toISOString()
    };

    team.push(newMember);
    saveTeam(team);

    res.json({ success: true, data: newMember, message: '添加成功' });
  } catch (error) {
    console.error('Add team member error:', error);
    res.json({ success: false, message: '添加失败' });
  }
});

// 更新成员
router.put('/:id', (req, res) => {
  try {
    const team = getTeam();
    const index = team.findIndex(t => t.id === req.params.id);

    if (index === -1) {
      return res.json({ success: false, message: '成员不存在' });
    }

    const { name, position, category, bio, avatar, order } = req.body;

    team[index] = {
      ...team[index],
      name: name || team[index].name,
      position: position || team[index].position,
      category: category || team[index].category,
      bio: bio || team[index].bio,
      avatar: avatar || team[index].avatar,
      order: order || team[index].order
    };

    saveTeam(team);

    res.json({ success: true, data: team[index], message: '更新成功' });
  } catch (error) {
    console.error('Update team member error:', error);
    res.json({ success: false, message: '更新失败' });
  }
});

// 删除成员
router.delete('/:id', (req, res) => {
  try {
    const team = getTeam();
    const index = team.findIndex(t => t.id === req.params.id);

    if (index === -1) {
      return res.json({ success: false, message: '成员不存在' });
    }

    const deleted = team.splice(index, 1)[0];
    saveTeam(team);

    res.json({ success: true, message: '删除成功', data: deleted });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.json({ success: false, message: '删除失败' });
  }
});

module.exports = router;
