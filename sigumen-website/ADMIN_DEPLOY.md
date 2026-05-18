# 肆顾门管理后台部署指南

## 新架构：Node.js + Express + JSON

后台已改用 **Node.js + Express + JSON 文件存储**，无需云服务，本地即可运行。

---

## 快速部署

### 1. 安装依赖

```bash
cd sigumen-website/server
npm install
```

### 2. 启动服务

```bash
npm start
```

或双击运行 `start.bat` (Windows)

### 3. 访问后台

打开浏览器访问：**http://localhost:3000/admin.html**

---

## 默认管理员账号

| 账号 | 密码 |
|------|------|
| admin | admin123 |

---

## 管理功能

| 模块 | 功能 |
|------|------|
| 仪表盘 | 统计资讯/团队/作品数量，待审核数量 |
| 资讯管理 | 添加/编辑/删除资讯，支持分类筛选 |
| 团队管理 | 添加/编辑/删除团队成员 |
| 作品管理 | 添加/编辑/删除作品，审核通过/拒绝 |

---

## 数据存储

数据存储在 `server/data/` 目录的 JSON 文件中：

- `news.json` - 资讯数据
- `team.json` - 团队成员
- `works.json` - 作品数据
- `admins.json` - 管理员账号

**备份提示**：复制整个 `data/` 目录即可备份所有数据。

---

## 修改密码

编辑 `server/data/admins.json`：

```json
{
  "password": "你的新密码"
}
```

---

## 端口修改

如需修改端口，编辑 `server/server.js`：

```javascript
const PORT = process.env.PORT || 3000;  // 改成其他端口
```

---

## 项目结构

```
sigumen-website/
├── server/
│   ├── data/           # JSON 数据文件
│   ├── routes/        # API 路由
│   ├── server.js      # 服务入口
│   ├── package.json
│   ├── README.md
│   └── start.bat      # Windows 启动脚本
├── admin.html         # 管理后台页面
├── index.html         # 网站首页
└── ...
```

---

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/auth/login | POST | 管理员登录 |
| /api/news | GET/POST | 资讯管理 |
| /api/news/:id | GET/PUT/DELETE | 单条资讯操作 |
| /api/team | GET/POST | 团队管理 |
| /api/team/:id | GET/PUT/DELETE | 单条成员操作 |
| /api/works | GET/POST | 作品管理 |
| /api/works/:id | GET/PUT/DELETE | 单条作品操作 |
| /api/works/:id/approve | POST | 审核通过 |
| /api/works/:id/reject | POST | 审核拒绝 |
| /api/stats | GET | 统计数据 |
