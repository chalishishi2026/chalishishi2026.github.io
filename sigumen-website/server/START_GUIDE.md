# 肆顾门管理后台使用指南

## 启动方式

### 方式一：双击启动（推荐日常使用）

双击 `server/start.bat`

服务启动后保持窗口开着，关闭即停止。

---

### 方式二：开机自启动

让服务在电脑开机时自动运行，无需手动启动。

#### 添加开机自启动：

1. 按 `Win + R`，输入 `shell:startup`，回车

2. 在打开的文件夹里，右键 → 新建 → 快捷方式

3. 输入路径：
   ```
   E:\nodejs\node.exe "E:\WorkBuddy2026\2026-05-10-task-18\sigumen-website\server\server.js"
   ```

4. 点击下一步，完成

#### 移除开机自启动：

删除 `shell:startup` 文件夹里的那个快捷方式即可。

---

### 方式三：手动命令行启动

```bash
cd E:\WorkBuddy2026\2026-05-10-task-18\sigumen-website\server
E:\nodejs\node server.js
```

---

## 访问地址

| 服务 | 地址 |
|------|------|
| 管理后台 | http://localhost:3000/admin.html |
| API 服务 | http://localhost:3000/api |
| 健康检查 | http://localhost:3000/api/health |

---

## 默认账号

- 用户名：`admin`
- 密码：`admin123`

---

## 快速启动脚本说明

| 文件 | 用途 |
|------|------|
| `start.bat` | 带界面的启动脚本（推荐） |
| `autorun.vbs` | 无窗口后台启动（用于开机自启动） |

---

## 数据存储

数据保存在 `data/` 目录：

- `news.json` - 资讯
- `team.json` - 团队成员
- `works.json` - 作品（包含用户提交）
- `admins.json` - 管理员账号

**备份**：复制整个 `data/` 目录即可。

---

## 查看已提交作品

1. 打开 http://localhost:3000/admin.html
2. 登录后点击左侧"作品管理"
3. 状态为"待审核"的就是用户刚提交的作品
4. 点击"通过"让作品上线，或"拒绝"驳回
