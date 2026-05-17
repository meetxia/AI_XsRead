# MOMO小说 AI-XsRead

最后更新日期：2026-05-17

AI-XsRead（MOMO小说）是一个面向女性用户的小说阅读平台，采用前后端分离架构，包含用户端和管理后台两套系统。用户端聚焦小说阅读、书架、阅读进度、评论互动和 TXT 上传；管理端聚焦内容、用户、评论、数据看板和系统设置。

## 项目结构

```text
AI-XsRead/
├── ai-xsread-vue3/          # 用户前端，Vue 3 + Vite + TailwindCSS，端口 3008
├── backend/                 # 用户后端，Express + MySQL2 + JWT，端口 8005
├── admin-frontend/          # 管理前端，Vue 3 + Vite + Element Plus，端口 3010
├── admin-backend/           # 管理后端，Express + MySQL2 + JWT，端口 8001
├── data/                    # TXT 小说数据源
├── docs/                    # 当前项目文档
├── docx/                    # 历史文档迁移来源
└── AGENTS.md                # 代理协作与项目规范
```

## 当前端口

| 系统 | 本地地址 | 说明 |
| --- | --- | --- |
| 用户前端 | `http://localhost:3008` | Vite 开发服务器 |
| 用户后端 | `http://localhost:8005` | 用户 API，健康检查：`/api/health` |
| 管理前端 | `http://localhost:3010` | 后台管理界面 |
| 管理后端 | `http://localhost:8001` | 管理 API |

代理关系：

- `ai-xsread-vue3`：`/api` 和 `/uploads` 代理到 `http://localhost:8005`。
- `admin-frontend`：`/api` 代理到 `http://localhost:8001`。

## 本地快速启动

先准备 MySQL 数据库 `ai_xsread`，再分别启动四个服务。

```powershell
# 用户后端：localhost:8005
cd E:\momo-ruanjiansheji\AI-XsRead\backend
npm install
npm run dev
```

```powershell
# 管理后端：localhost:8001
cd E:\momo-ruanjiansheji\AI-XsRead\admin-backend
npm install
npm run dev
```

```powershell
# 用户前端：localhost:3008
cd E:\momo-ruanjiansheji\AI-XsRead\ai-xsread-vue3
npm install
npm run dev
```

```powershell
# 管理前端：localhost:3010
cd E:\momo-ruanjiansheji\AI-XsRead\admin-frontend
npm install
npm run dev
```

## 环境变量要点

用户后端使用：

```env
PORT=8005
DB_DATABASE=ai_xsread
CORS_ORIGIN=http://localhost:3008
```

管理后端使用：

```env
PORT=8001
DB_NAME=ai_xsread
CORS_ORIGIN=http://localhost:3010
```

前端统一使用：

```env
VITE_APP_BASE_API=/api
```

注意：用户后端变量名是 `DB_DATABASE`，管理后端变量名是 `DB_NAME`。这是当前代码的真实差异，不要混用。

## 数据与后台初始化

基础数据库：

```powershell
mysql -u your_database_user -p ai_xsread < E:\momo-ruanjiansheji\AI-XsRead\backend\database\init_step1.sql
```

后台管理表和默认管理员：

```powershell
cd E:\momo-ruanjiansheji\AI-XsRead\admin-backend
node scripts/create-admin-tables.js
node scripts/init-admin.js
```

默认管理员账号：

```text
admin / admin123
```

导入 `data/` 目录下的 TXT 小说：

```powershell
cd E:\momo-ruanjiansheji\AI-XsRead\backend
node scripts/import-txt-novels.js
```

用户端也提供登录后的 TXT 上传页：

```text
http://localhost:3008/upload
```

## 主要文档入口

- [本地快速启动总览](docs/02-快速启动指南/2026-05-17-本地快速启动总览.md)
- [前后端联调与环境配置指南](docs/02-快速启动指南/2026-05-17-前后端联调与环境配置指南.md)
- [数据初始化与 TXT 导入指南](docs/02-快速启动指南/2026-05-17-数据初始化与TXT导入指南.md)
- [UI 组件与交互体验参考](docs/02-快速启动指南/2026-05-17-UI组件与交互体验参考.md)
- [项目规范与协作说明](AGENTS.md)

## 测试与构建

```powershell
# 用户前端测试与构建
cd E:\momo-ruanjiansheji\AI-XsRead\ai-xsread-vue3
npm run test
npm run build
```

```powershell
# 用户后端测试
cd E:\momo-ruanjiansheji\AI-XsRead\backend
npm run test
```

```powershell
# 管理前端构建
cd E:\momo-ruanjiansheji\AI-XsRead\admin-frontend
npm run build
```

管理后端当前 `npm run test` 仍是占位脚本，主要通过接口联调和脚本检查验证。

