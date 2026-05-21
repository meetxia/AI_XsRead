# MOMO小说 AI-XsRead

最后更新日期：2026-05-21

AI-XsRead（MOMO小说）是面向女性用户的小说阅读平台，前后端分离，由 4 个子工程组成：用户前端、用户后端、管理前端、管理后端。当前主链路（首页、搜索、阅读、书架、个人中心、上传、评论、段评、划线、关注作者、会员激活、SEO）均已落地；管理端具备数据看板、内容、章节、用户、评论、激活码、系统设置、上传等模块；用户端 Sprint 1（安全加固 + 闸门恢复 + 迁移收口）与管理端 Sprint 2（默认密码 + JWT + SQL 注入治理 + 构建闸门恢复 + Nginx）均已完成。

## 项目结构

```text
AI-XsRead/
├── ai-xsread-vue3/          # 用户前端 Vue 3 + Vite + TailwindCSS（端口 3008）
├── backend/                 # 用户后端 Express + MySQL2 + JWT + Redis（端口 8005）
├── admin-frontend/          # 管理前端 Vue 3 + Vite + Element Plus + ECharts（端口 3010）
├── admin-backend/           # 管理后端 Express + MySQL2 + JWT（端口 8001）
├── data/                    # TXT 小说数据源（35+ 部）
├── docs/                    # 项目文档（含项目总文档 / 核心文档 / 交付报告）
├── docx/                    # 历史文档迁移来源
├── nginx.conf               # 用户域 + admin 子域两个 server block
├── ecosystem.config.js      # PM2 进程定义
├── deploy-guide.md          # 唯一权威部署文档
└── AGENTS.md                # 协作与项目规范
```

## 当前端口

| 系统 | 本地地址 | 说明 |
| --- | --- | --- |
| 用户前端 | `http://localhost:3008` | Vite 开发服务器 |
| 用户后端 | `http://localhost:8005` | 用户 API，健康检查 `/api/health` |
| 管理前端 | `http://localhost:3010` | 后台管理界面 |
| 管理后端 | `http://localhost:8001` | 管理 API，健康检查 `/health` |

代理关系：

- `ai-xsread-vue3`：`/api`、`/uploads` 代理到 `http://localhost:8005`
- `admin-frontend`：`/api` 代理到 `http://localhost:8001`

注意：`backend/.env.example` 中写的 `PORT=8001` 是历史遗留模板值，**真实代码默认 `PORT=8005`**。`.env` 必须显式写 `PORT=8005`。

## 本地快速启动

先准备 MySQL 8.0 并建库 `ai_xsread`，再分别启动四个服务。

```powershell
# 用户后端：localhost:8005
cd E:\momo-ruanjiansheji\AI-XsRead\backend
copy .env.example .env   # 编辑：DB_USER / DB_PASSWORD / JWT_SECRET / JWT_REFRESH_SECRET / PORT=8005
npm install
npm run dev
```

```powershell
# 管理后端：localhost:8001
cd E:\momo-ruanjiansheji\AI-XsRead\admin-backend
copy .env.example .env   # 编辑：DB_USER / DB_PASSWORD / JWT_SECRET / JWT_REFRESH_SECRET
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

用户后端：

```env
PORT=8005
DB_DATABASE=ai_xsread
JWT_SECRET=<32 位以上随机字符串>
JWT_REFRESH_SECRET=<另一个 32 位以上随机字符串>
CORS_ORIGIN=http://localhost:3008
```

管理后端：

```env
PORT=8001
DB_NAME=ai_xsread          # admin-backend 默认变量名是 DB_NAME，也兼容 DB_DATABASE
JWT_SECRET=<32 位以上随机字符串>
JWT_REFRESH_SECRET=<另一个 32 位以上随机字符串>
CORS_ORIGIN=http://localhost:3010
```

前端统一：

```env
VITE_APP_BASE_API=/api
```

JWT 密钥生成：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`。`JWT_SECRET` 与 `JWT_REFRESH_SECRET` 必须是两个不同的强随机串，长度 ≥ 32。

## 数据库与初始化

基础初始化 + 自动迁移：

```powershell
# 一次性初始化：导入基础表
mysql -u <user> -p ai_xsread < E:\momo-ruanjiansheji\AI-XsRead\backend\database\init_step1.sql

# 启动用户后端时会自动跑迁移流水线（包括管理端 5 张表）
cd E:\momo-ruanjiansheji\AI-XsRead\backend
npm run dev
```

迁移机制：`backend/database/migrations/` 下文件名遵循 `^\d{12}__描述.sql$` 时间戳格式，启动时 `migrate.js` 自动按序执行。**SQL 必须幂等**（`IF NOT EXISTS` / `ON DUPLICATE KEY`）。详见 `docs/项目总文档/2026-05-21-数据库与迁移现状说明.md`。

管理员账号初始化：

```powershell
cd E:\momo-ruanjiansheji\AI-XsRead\admin-backend
node scripts/init-admin.js
```

执行后会生成 20 位随机密码并写入 `admin-backend/.admin-credentials`（mode 0o600）。**首次部署后运维必须读取该文件后销毁**，并妥善保管初始密码。`.gitignore` 已忽略此文件，不会进仓库。如果 admin 账号已存在，脚本不会重置密码，避免误覆盖生产环境凭据。

旧版 `admin/admin123` 默认密码已彻底废除（管理端 Sprint 2 / T-2.1 / T-2.2）。

导入 `data/` 下的 TXT 小说：

```powershell
cd E:\momo-ruanjiansheji\AI-XsRead\backend
node scripts/import-txt-novels.js
```

用户端登录后也提供 TXT 上传页：`http://localhost:3008/upload`。

## 测试、构建与部署

```powershell
# 用户后端测试（Jest，42 套件 / 251 通过）
cd E:\momo-ruanjiansheji\AI-XsRead\backend
npm test

# 用户前端测试（Vitest，23 套件 / 107 通过）+ 构建
cd E:\momo-ruanjiansheji\AI-XsRead\ai-xsread-vue3
npm test
npm run build

# 管理后端测试（Jest + Supertest，10 条 smoke）
cd E:\momo-ruanjiansheji\AI-XsRead\admin-backend
npm test

# 管理前端测试（Vitest，5 条静态守护）+ 构建
cd E:\momo-ruanjiansheji\AI-XsRead\admin-frontend
npm test
npm run build
```

CI（`.github/workflows/ci.yml`）已恢复全闸门，4 个子工程的 `npm test` / `npm run build` 全部强制必绿，不再 `continue-on-error`。

部署：唯一受支持的工具是 `backend/scripts/deploy.py`（rsync `--checksum` 增量 + PM2 reload + 自动迁移诊断）。**首次部署或目标路径变化必须先 `--dry-run`**。完整流程见根目录 `deploy-guide.md`。

## 主要文档入口

- [文档地图](docs/README.md)
- [项目现状总览（2026-05-21）](docs/项目总文档/2026-05-21-项目现状总览.md)
- [接口与路由速查总表（2026-05-21）](docs/项目总文档/2026-05-21-接口与路由速查总表.md)
- [数据库与迁移现状说明（2026-05-21）](docs/项目总文档/2026-05-21-数据库与迁移现状说明.md)
- [功能能力矩阵（2026-05-21）](docs/项目总文档/2026-05-21-功能能力矩阵.md)
- [本地快速启动总览](docs/02-快速启动指南/2026-05-17-本地快速启动总览.md)
- [部署手册（唯一权威）](deploy-guide.md)
- [项目规范与协作说明](AGENTS.md)
- [后台功能 Backlog](docs/项目总文档/2026-05-21-后台功能Backlog.md)

## 近期重大里程碑

- **2026-05-21** — 管理端 Sprint 2 完成（默认密码 + JWT 双密钥 + SQL 注入治理 + Nginx + 构建闸门恢复，22/26 项绿牌）
- **2026-05-20** — 用户端 Sprint 1 完成（闸门恢复 + 安全加固 + 个人中心迁移收口，14 项硬改动 + 3 闸门绿牌）
- **2026-05-19** — 个人中心 MVP 收尾联调（Agent A/B/C/D 4 份交付报告）
- **2026-05-18** — Tracks A–D 工程化基线（CI / 缓存 / 定时任务 / 迁移命名规范）
- **2026-05-17** — V1.0 前端 Vue3 移植 + 微信读书/晋江对标升级 + 用户系统完善 + 会员激活码系统 + SEO 优化

完整时间线见 [docs/AI完成后报告文档/](docs/AI完成后报告文档/)。
