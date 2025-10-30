# 快速导入数据 - phpMyAdmin 方式

> 最简单快速的数据导入方法

---

## 🚀 三步导入数据

### 步骤 1: 打开 phpMyAdmin

在浏览器中访问：
```
http://127.0.0.1/phpmyadmin/
```

**登录信息：**
- 用户名: `toefl_user`
- 密码: `mojz168168-`

---

### 步骤 2: 选择数据库

1. 点击左侧的 `ai_xsread` 数据库
2. 如果数据库不存在，先创建：
   - 点击 "新建"
   - 数据库名: `ai_xsread`
   - 排序规则: `utf8mb4_unicode_ci`
   - 点击 "创建"

---

### 步骤 3: 导入 SQL 文件

#### 3.1 初始化数据表（如果还没做）

1. 点击顶部 "导入" 标签
2. 点击 "选择文件"
3. 选择文件：
   ```
   H:\momo-ruanjiansheji\AI_XsRead\docx\database_init.sql
   ```
4. 点击页面底部 "执行" 按钮
5. 等待执行完成（应该创建 12 张表）

#### 3.2 导入测试数据

1. 再次点击 "导入" 标签
2. 点击 "选择文件"
3. 选择文件：
   ```
   H:\momo-ruanjiansheji\AI_XsRead\docx\seed_data_complete.sql
   ```
4. 点击 "执行" 按钮
5. 等待执行完成

---

## ✅ 验证导入成功

### 检查数据表

在 phpMyAdmin 左侧点击 `ai_xsread` 数据库，应该看到以下表：

| 表名 | 预期记录数 |
|------|-----------|
| users | 7 条 |
| categories | 6 条 |
| novels | 10 条 |
| chapters | 50+ 条 |

### 查看具体数据

点击任意表名（如 `users`），点击 "浏览" 标签，应该能看到数据。

---

## 🔑 测试账号

所有测试账号的密码都是：**123456**

| 用户名 | 邮箱 | 角色 |
|--------|------|------|
| reader001 | reader001@example.com | 普通用户 |
| reader002 | reader002@example.com | 普通用户 |
| reader003 | reader003@example.com | 普通用户 |
| author001 | author001@example.com | 作者 |
| author002 | author002@example.com | 作者 |
| author003 | author003@example.com | 作者 |
| admin | admin@example.com | 管理员 |

---

## 🎯 下一步：前端环境配置

### 创建前端 .env 文件

在前端项目根目录 `ai-xsread-vue3` 中：

#### 创建 `.env.development` 文件：

```powershell
cd H:\momo-ruanjiansheji\AI_XsRead\ai-xsread-vue3
notepad .env.development
```

**复制以下内容：**
```env
# 开发环境配置
VITE_APP_TITLE=文字之境-开发环境
VITE_APP_BASE_API=http://localhost:8000
VITE_APP_PORT=3008
```

保存并关闭。

#### 创建 `.env` 文件：

```powershell
notepad .env
```

**复制以下内容：**
```env
# 通用环境配置
VITE_APP_TITLE=文字之境
VITE_APP_BASE_API=http://localhost:8000
```

保存并关闭。

---

## 🚀 启动项目测试

### 1. 启动后端（终端1）

```powershell
cd H:\momo-ruanjiansheji\AI_XsRead\backend
npm run dev
```

应该看到：
```
🚀 文字之境后端服务启动成功！
📍 服务地址: http://localhost:8000
```

### 2. 启动前端（终端2 - 新窗口）

```powershell
cd H:\momo-ruanjiansheji\AI_XsRead\ai-xsread-vue3
pnpm run dev
```

应该看到：
```
➜  Local:   http://localhost:3008/
```

---

## 🧪 测试 API

### 在浏览器测试

#### 1. 测试后端健康检查
```
http://localhost:8000/api/health
```

#### 2. 测试获取小说列表
```
http://localhost:8000/api/novels
```

#### 3. 测试获取分类列表
```
http://localhost:8000/api/novels/categories
```

#### 4. 测试登录（使用 Postman 或浏览器开发者工具）

```bash
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "username": "reader001",
  "password": "123456"
}
```

### 在前端测试

访问前端页面：
```
http://localhost:3008
```

应该能看到：
- 首页加载正常
- 可以浏览小说列表
- 可以查看小说详情
- 可以登录（reader001 / 123456）

---

## 🐛 常见问题

### 问题1: SQL 执行报错

如果看到 "Duplicate entry" 错误，说明数据已存在。

**解决方案：** 清空数据后重新导入

在 phpMyAdmin 的 SQL 标签中执行：
```sql
DELETE FROM reading_history;
DELETE FROM reading_progress;
DELETE FROM bookshelf;
DELETE FROM user_likes;
DELETE FROM comments;
DELETE FROM chapters;
DELETE FROM novels;
DELETE FROM categories;
DELETE FROM users;
```

然后重新导入 `seed_data_complete.sql`。

### 问题2: 登录失败

如果登录时提示"用户名或密码错误"，可能是密码哈希问题。

**快速解决方案：** 在 phpMyAdmin 中手动创建一个测试用户

在 SQL 标签中执行：
```sql
-- 先生成密码哈希（密码：123456）
-- 在后端运行: node scripts/generate-password.js

-- 然后插入测试用户（用生成的哈希替换下面的密码）
INSERT INTO users (username, email, password, role) VALUES
('testuser', 'test@test.com', '$2b$10$生成的哈希值', 'user');
```

### 问题3: 前端无法连接后端

检查：
1. 后端服务是否启动（http://localhost:8000）
2. 前端 .env 文件是否创建
3. 浏览器开发者工具 Network 标签查看请求

---

## 📊 导入的完整数据

### 用户数据 (7个)
- 3个普通用户（reader001-003）
- 3个作者（author001-003）
- 1个管理员（admin）

### 分类数据 (6个)
- 都市言情、古风穿越、玄幻修仙
- 悬疑推理、科幻未来、青春校园

### 小说数据 (10本)
- 每本小说包含完整信息
- 统计数据（浏览、点赞、收藏）
- 5个章节（前2章免费）

### 章节数据 (50章)
- 每本小说至少5章
- 包含完整内容
- 可供阅读测试

---

## ✅ 完成标志

当你能够：
- ✅ 在 phpMyAdmin 中看到所有数据
- ✅ 后端服务启动成功
- ✅ 前端服务启动成功
- ✅ API 返回正确的数据
- ✅ 可以使用测试账号登录

就说明一切准备就绪了！

---

**🎉 现在可以愉快地进行前后端联调测试了！**

*最后更新: 2025-10-27*

