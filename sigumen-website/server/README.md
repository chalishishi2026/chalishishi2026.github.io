# 肆顾门后台管理系统

## 技术架构

- **后端**: Node.js + Express
- **数据存储**: JSON 文件
- **前端**: 原生 HTML/CSS/JavaScript

## 项目结构

```
server/
├── data/           # JSON 数据文件
│   ├── news.json   # 资讯数据
│   ├── team.json   # 团队成员数据
│   ├── works.json  # 作品数据
│   └── admins.json # 管理员账号
├── routes/         # API 路由
│   ├── auth.js     # 认证接口
│   ├── news.js     # 资讯管理
│   ├── team.js     # 团队管理
│   └── works.js    # 作品管理
├── server.js       # 服务器入口
├── package.json    # 依赖配置
└── start.bat       # Windows 启动脚本
```

## 快速启动

### Windows

双击运行 `start.bat`，或命令行执行：

```bash
cd server
npm install
npm start
```

### macOS / Linux

```bash
cd server
chmod +x start.sh
./start.sh
```

## 访问地址

| 服务 | 地址 |
|------|------|
| API 服务 | http://localhost:3000 |
| 管理后台 | http://localhost:3000/admin.html |
| 健康检查 | http://localhost:3000/api/health |

## 默认账号

- **用户名**: admin
- **密码**: admin123

## API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET | /api/auth/verify | 验证登录状态 |
| GET | /api/auth/me | 获取当前用户信息 |
| POST | /api/auth/change-password | 修改密码 |

### 资讯接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/news | 获取资讯列表 |
| GET | /api/news/:id | 获取单条资讯 |
| POST | /api/news | 添加资讯 |
| PUT | /api/news/:id | 更新资讯 |
| DELETE | /api/news/:id | 删除资讯 |

### 团队接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/team | 获取团队成员列表 |
| GET | /api/team/:id | 获取单个成员 |
| POST | /api/team | 添加成员 |
| PUT | /api/team/:id | 更新成员 |
| DELETE | /api/team/:id | 删除成员 |

### 作品接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/works | 获取作品列表 |
| GET | /api/works/:id | 获取单个作品 |
| POST | /api/works | 添加作品 |
| PUT | /api/works/:id | 更新作品 |
| DELETE | /api/works/:id | 删除作品 |
| POST | /api/works/:id/approve | 审核通过 |
| POST | /api/works/:id/reject | 审核拒绝 |

### 统计接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stats | 获取统计数据 |

## 数据字段说明

### 资讯 (news)

```json
{
  "id": "news_xxxxxx",
  "title": "标题",
  "category": "公司动态|项目动态|行业资讯",
  "summary": "摘要",
  "content": "HTML内容",
  "image": "封面图片URL",
  "date": "2026-01-01",
  "createdAt": "ISO时间"
}
```

### 团队成员 (team)

```json
{
  "id": "team_xxxxxx",
  "name": "姓名",
  "position": "职位",
  "category": "核心团队|签约艺人|合作艺人",
  "bio": "简介",
  "avatar": "头像URL",
  "order": 1,
  "createdAt": "ISO时间"
}
```

### 作品 (works)

```json
{
  "id": "works_xxxxxx",
  "title": "标题",
  "type": "游戏|短剧|剧本|有声书",
  "summary": "摘要",
  "content": "HTML内容",
  "cover": "封面URL",
  "audioUrl": "音频URL",
  "status": "pending|approved|rejected",
  "createdAt": "ISO时间"
}
```

## 修改默认密码

编辑 `data/admins.json`：

```json
[
  {
    "id": "admin_001",
    "username": "admin",
    "password": "你的新密码",
    "nickname": "管理员",
    "role": "superadmin"
  }
]
```

## 注意事项

1. 数据存储在 JSON 文件中，适合小规模数据管理
2. 如需备份，复制 `data/` 目录即可
3. 生产环境建议增加数据校验和定期备份
4. 默认端口 3000，如有冲突可在 `server.js` 中修改
