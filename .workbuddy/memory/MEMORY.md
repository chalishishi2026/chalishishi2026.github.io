# MEMORY.md - 肆顾门数字文化网站

## 项目信息
- **项目路径**: `E:\WorkBuddy2026\2026-05-10-task-18\sigumen-website\`
- **技术栈**: HTML5 + CSS3 + Vanilla JS（无框架）
- **CDN**: Font Awesome 6.4.0, Mammoth.js (docx解析)

## 已完成功能

### 1. 导航按钮修复
- 修复所有页面导航链接点击无反应问题
- 修改 `assets/js/main.js` 的 `initNavigation` 函数

### 2. 创作中心简化 + 文档上传功能
- **文件**: `submit.html`
- **新功能**:
  - 简化界面设计，采用卡片式快捷操作
  - 支持拖拽/点击上传 `.doc` 和 `.docx` 文件
  - 使用 mammoth.js 将 docx 自动转换为可浏览的 HTML
  - 文档内容实时预览
  - 表单包含作品类型：广播剧、有声书、短剧、**PIA剧**

### 3. 原创剧本馆添加 PIA 剧分类
- **文件**: `works.html`, `assets/js/main.js`
- 在筛选栏新增 "PIA剧" 按钮
- 在 `getTypeText()` 函数中添加 `'pia': 'PIA剧'` 映射

## 页面列表
- `index.html` - 首页
- `news.html` - 行业资讯
- `team.html` - 团队风采
- `works.html` - 原创剧本馆（包含广播剧/有声书/短剧/PIA剧筛选）
- `submit.html` - 创作者中心（简化版 + 文档上传）
- `admin.html` - **管理后台页面**

## CloudBase 管理后台

### 云函数（cloudfunctions/）
- `admin-login/` - 管理员登录验证
- `news-manager/` - 资讯增删改查
- `team-manager/` - 团队成员增删改查
- `works-manager/` - 作品增删改查 + 审核

### 数据库集合
- `admins` - 管理员账号
- `news` - 资讯数据
- `team` - 团队成员
- `works` - 作品数据

### 默认管理员
- 用户名: admin
- 密码: admin123

### 部署文档
- `ADMIN_DEPLOY.md` - 详细部署指南
