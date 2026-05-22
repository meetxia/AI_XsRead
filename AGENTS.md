# AGENTS.md

> 最后更新日期：2026-05-21

## 项目概述

**MOMO小说**（AI-XsRead）是一个面向女性用户的小说阅读平台，采用前后端分离架构，包含用户端和管理后台两套独立系统。

- **产品定位**：女性向小说阅读平台
- **核心功能**：小说阅读、书架管理、阅读进度同步、评论与段评、划线书签、关注作者、上传 TXT、会员激活、后台内容管理、激活码、系统设置、SEO
- **内容方向**：都市言情、古风穿越、悬疑推理、治愈系、奇幻冒险
- **当前版本**：用户端 Sprint 1（2026-05-20）+ 管理端 Sprint 2（2026-05-21）双 Sprint 完成，**具备整站对外发布能力**，仅待 staging 真实演练

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 用户前端 | Vue 3 + Vite + TailwindCSS + Pinia | Vue 3.5 / Vite 7 / TailwindCSS 3.4 |
| 管理前端 | Vue 3 + Vite + Element Plus + ECharts + SCSS | Vue 3.5 / Element Plus 2.11 / ECharts 6 |
| 用户后端 | Express + MySQL2 + JWT + Redis | Express 4.18 / MySQL2 3.6 |
| 管理后端 | Express + MySQL2 + JWT | Express 5.1 / MySQL2 3.15 |
| 数据库 | MySQL 8.0 | utf8mb4 / utf8mb4_unicode_ci / 共享库 `ai_xsread`（25+ 张迁移管理的表） |
| 构建工具 | Vite 7 + Terser + Gzip/Brotli 压缩 | - |
| 测试 | Jest（用户/管理后端）+ Vitest（用户/管理前端）+ Playwright（E2E） | - |
| 部署 | rsync `--checksum` 增量 + PM2 + Nginx + 自动迁移流水线 | `backend/scripts/deploy.py` 唯一权威 |
| CI | GitHub Actions（4 子工程 build + test 全闸门必绿） | `.github/workflows/ci.yml` |

## 项目结构

```
AI-XsRead/
├── ai-xsread-vue3/          # 用户前端（端口 3008）
│   ├── src/
│   │   ├── views/           # 24 个页面（含 profile 子目录 5 个页面）
│   │   ├── components/      # 46+ 组件（common/novel/reading/profile/search）
│   │   ├── composables/     # 组合式函数（手势/键盘/进度/设置/主题/计时/TTS）
│   │   ├── stores/          # Pinia 状态（bookshelf/theme/user）
│   │   ├── api/             # API 请求封装（含 request.js DEV 日志脱敏）
│   │   ├── router/          # 路由配置（含 profile 子路由）
│   │   └── assets/          # 静态资源
│   └── vite.config.js       # 代理 /api、/uploads → localhost:8005
│
├── backend/                  # 用户后端（端口 8005）
│   ├── src/
│   │   ├── controllers/     # 15 个控制器：auth/novel/chapter/user/comment/upload/author/
│   │   │                    #              bookmark/highlight/paragraphComment/interestTag/
│   │   │                    #              achievement/notification/preference/membership/system
│   │   ├── routes/          # 16 个路由模块（含 seo/notifications/system）
│   │   ├── middlewares/     # 认证（JWT HS256 锁定）/ 错误处理 / 日志 / 限流（含登录注册专项 10/15min）
│   │   ├── services/        # 业务服务
│   │   ├── config/          # 数据库 / 应用配置
│   │   └── utils/           # 工具函数（含 jwt.js 双密钥）
│   ├── database/
│   │   ├── init_step1.sql   # 基础初始化（12 张表）
│   │   ├── migrations/      # 25 个迁移文件（202605170800 → 202605200001）
│   │   ├── optimization.sql # 复合索引
│   │   ├── triggers.sql     # 评论数 / 书架统计同步
│   │   └── procedures.sql
│   ├── cache/               # 缓存管理
│   ├── scripts/             # deploy.py（唯一部署工具）/ migrate.js / import-txt-novels.js
│   └── jobs/                # node-cron 定时任务
│
├── admin-frontend/           # 管理前端（端口 3010）
│   ├── src/
│   │   ├── views/           # 7 个模块（Dashboard/Content/Users/Comments/Analytics/Settings/Login）
│   │   ├── components/      # Layout 等组件
│   │   ├── __tests__/       # Vitest 静态守护（login.test.js / request.test.js）
│   │   ├── stores/          # 状态管理
│   │   └── router/          # 路由（含权限守卫）
│   └── vite.config.js       # 代理 /api → localhost:8001
│
├── admin-backend/            # 管理后端（端口 8001）
│   ├── src/
│   │   ├── controllers/     # 10 个控制器：auth/dashboard/novel/chapter/user/comment/
│   │   │                    #              code/contact/membershipAdmin/config
│   │   ├── routes/          # 10 个路由模块（含 codes/system）
│   │   ├── middlewares/     # 含 errorHandler 字典化错误码 + 生产 5xx 文案统一
│   │   └── services/        # 含 uploadService（MIME 严格白名单，拒绝 SVG）
│   ├── scripts/             # init-admin.js（随机密码 + .admin-credentials）
│   └── tests/               # auth.test.js / security.test.js（10 条 smoke）
│
├── data/                     # 35+ 部小说 TXT 文件
├── docs/                     # 项目文档（项目总文档 / 核心文档 / 快速启动 / 数据库脚本 / AI完成后报告 / 历史归档）
├── docx/                     # 历史文档迁移来源
├── nginx.conf                # 用户域 + admin 子域 server block + HSTS / X-Frame / Permissions-Policy
├── ecosystem.config.js       # PM2 进程定义（xsread-backend / xsread-admin-backend）
├── deploy-guide.md           # 唯一权威部署文档
└── AGENTS.md                 # 本文件
```

## 开发命令

### 用户前端
```bash
cd ai-xsread-vue3
npm install
npm run dev          # 启动开发服务器（端口 3008）
npm run build        # 生产构建
npm run preview      # 预览构建结果
```

### 用户后端
```bash
cd backend
npm install
npm run dev          # nodemon 热重载（端口 8005）
npm start            # 生产启动
npm run test         # Jest（42 套件 / 251 通过）
```

### 管理前端
```bash
cd admin-frontend
npm install
npm run dev          # 启动开发服务器（端口 3010）
npm test             # Vitest（5 条静态守护）
npm run build        # 生产构建
```

### 管理后端
```bash
cd admin-backend
npm install
npm run dev          # nodemon 热重载（端口 8001）
npm start            # 生产启动
npm test             # Jest + Supertest（10 条 smoke）
node scripts/init-admin.js  # 初始化管理员账号（生成 .admin-credentials 随机密码文件）
```

### 数据库

```bash
# 1. 基础初始化（仅一次性）
mysql -u <user> -p ai_xsread < backend/database/init_step1.sql

# 2. 启动用户后端时自动跑迁移流水线（25+ 个迁移文件，含管理端 5 张表）
cd backend && npm run dev
```

迁移文件命名 `^\d{12}__描述.sql$`，由 `backend/database/migrations/migrate.js` 自动按时间戳顺序执行。SQL 必须**幂等**（`IF NOT EXISTS` / `ON DUPLICATE KEY`）。详见 `docs/项目总文档/2026-05-21-数据库与迁移现状说明.md`。

## 管理员账号与默认密码

**旧版 `admin/admin123` 默认密码已彻底废除**（管理端 Sprint 2 / T-2.1 / T-2.2，2026-05-21）。

首次部署执行：

```bash
cd admin-backend
node scripts/init-admin.js
```

脚本行为：
- 不再硬编码密码，使用 `crypto.randomBytes` 生成 20 位强随机密码
- bcrypt rounds 12（旧版 10）
- 凭证写入 `admin-backend/.admin-credentials`（mode 0o600）
- 如果 admin 账号已存在，**不会重置密码**（避免误操作生产）
- `.gitignore` 已忽略 `.admin-credentials`，不进仓库

**运维必须**：首次部署后 SSH 到服务器读取 `.admin-credentials` 内容，妥善记录后销毁该文件。

## 代码规范

- 使用 ESLint + Prettier 保持代码风格一致
- Vue 组件使用 `<script setup>` 组合式 API
- 组件命名使用 PascalCase，文件命名使用 PascalCase
- API 请求统一封装在 `api/` 目录
- 响应格式统一：`{ code, message, data, timestamp }`

## 代码模块化与单文件行数约束（重要）

1. **单个代码文件不超过 1000 行**
2. 超过 500 行的文件应考虑拆分
3. 组件职责单一，避免"上帝组件"
4. 公共逻辑提取到 composables 或 utils

## 设计系统

- **用户端**：TailwindCSS 自定义主题，支持多主题切换（玫瑰/薰衣草等）
- **管理端**：Element Plus 组件库 + 自定义 SCSS 变量
- **图标**：SVG 图标系统（SvgIcon 组件）
- **响应式**：移动端优先，底部导航栏适配
- **阅读体验**：护眼模式、字体大小调节、翻页动效、手势操作

## Git Commit Requirements

- 提交记录使用中文，信息要具体，不要只有短标题。
- 提交前检查 `git diff`，确认没有带入无关文件、密钥、日志或临时产物。
- 不要擅自提交用户或其他代理的并行改动，除非它们是当前任务必需且已确认。
- 推荐多行提交信息格式：`类型: 简述\n\n详细说明`

## Superpowers 使用规则

1. 当前环境已安装 `superpowers`，AI 应在合适时优先利用它提供的方法论型 skills。
2. 用户不需要主动说英文 skill 名；如果用户用大白话表达需求，AI 应主动判断是否适合调用 `superpowers`。
3. 尤其在以下场景，AI 应优先考虑使用：
   - 需求还没想清楚：优先考虑 `brainstorming`
   - 需要拆步骤或执行计划：优先考虑 `writing-plans`
   - 遇到 bug、报错、结果不对：优先考虑 `systematic-debugging`
   - 任务收尾前做核对：优先考虑 `verification-before-completion`
4. 如果当前任务明显不需要 `superpowers`，可以不使用，但不要因为用户没说英文名就忽略它。

## 浏览器 MCP / Playwright 协作规则

1. 浏览器 MCP / in-app browser 默认视为单实例共享资源，通常只允许一个 agents 窗口负责控制。
2. 多个 agents 并行工作时，不要让多个窗口同时抢占同一个浏览器 MCP 会话。
3. 需要并行浏览器验证、截图、交互测试或自动化回归时，改用 Playwright 独立 context。
4. 使用 Playwright 并行验证时，每个 agent 应使用独立的 browser context；如需启动独立 Chrome 实例，应分配不同的 `user-data-dir`、端口和临时 profile，避免互相占用。
5. 推荐分工：主 agents 窗口负责浏览器 MCP 的人工式验收；其他 agents 使用 Playwright 独立 context 执行自动化检查。

## 部署规则

> 唯一权威部署文档：根目录 `deploy-guide.md`。本节是简版速查与底线纪律，详细流程请看 `deploy-guide.md`。

### 唯一部署工具

1. **唯一受支持的部署工具是 `backend/scripts/deploy.py`**。该脚本基于 rsync `--checksum` 真增量上传 + PM2 reload + 自动迁移诊断。
2. 不得用以下方式部署：scp 全量、宝塔文件管理器手动改、`rsync -av` 不带 `--checksum`、git pull 后忘了 `npm ci` / `pm2 reload`。这些方式都已发生过故障。
3. 部署前必须先 `--dry-run` 一次（首次部署或目标路径变化时强制要求），确认 ssh / rsync / pm2 命令构造正确再真跑。

### 部署涉及的进程与端口（不要乱改）

- 用户后端 PM2 进程名：`xsread-backend`，端口 `8005`，目录 `/www/wwwroot/xs.momofx.cn/backend`
- 管理后端 PM2 进程名：`xsread-admin-backend`，端口 `8001`，目录 `/www/wwwroot/xs.momofx.cn/admin-backend`
- 用户前端 dist：`/www/wwwroot/xs.momofx.cn/ai-xsread-vue3/dist`
- 管理前端 dist：`/www/wwwroot/xs.momofx.cn/admin-frontend/dist`
- 站点 PM2 配置：`/www/wwwroot/xs.momofx.cn/ecosystem.config.js`

任何改动以上项的需求，必须同步更新 `deploy.py` 默认值、`ecosystem.config.js`、`nginx.conf`、`deploy-guide.md` 四处。

### 部署前必备动作

1. **数据库必须备份**（mysqldump --single-transaction）。无备份不得执行迁移类部署，违反者后果自负。
2. 备份当前 `git rev-parse HEAD` 与 `.env` 文件，作为回滚依据。
3. 本机至少跑通：`node -c backend/src/app.js`、`cd ai-xsread-vue3 && npm run build`、`cd admin-frontend && npm run build`。

### 部署排障备忘（2026-05-22）

1. 生产后端 `.env` 的数据库名键是 `DB_DATABASE`，不一定是文档示例里的 `DB_NAME`；备份脚本读取前先确认键名，且不要打印敏感值。
2. 在 Windows PowerShell 里执行远端 SSH 备份命令时，`$(date ...)`、`$1` 等容易被本地提前展开；复杂远端脚本优先用 `ssh ... 'bash -s'` 传 stdin，或用 Node `spawn` 传 LF 脚本。
3. `pm2 logs xsread-backend` 里可能存在部署前历史定时任务报错；部署验收要区分“部署后新错误”和“部署前既有噪音”。2026-05-22 后代码已移除对 `sp_batch_update_views` 等存储过程的运行时依赖，新部署后不应再出现同类新错误。
4. 线上 MySQL 不一定支持 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`；新增字段/索引迁移优先用普通 `ADD COLUMN` / `ADD INDEX`，重复字段/索引交给 `migrate.js` 的兼容忽略逻辑处理。
5. Nginx 的 `/uploads` 静态目录要用 `location ^~ /uploads/` + 带尾斜杠的 `alias .../uploads/`，否则 `.jpg` 等正则 location 可能抢先匹配，导致管理端封面 404。
6. 如果 `https://xs.momofx.cn/api/health` 返回管理端风格 `{"status":"ok"}`，优先检查用户域 443 server block 是否真实生效，避免 HTTPS 请求落到其他默认站点。

### 数据库迁移规范

1. 文件名严格遵循 `^\d{12}__描述.sql$`，如 `202605200900__add_user_phone.sql`。不符合此规则的 SQL 不会被自动执行（这正是 legacy 文件应有的状态）。
2. SQL 必须**幂等**：用 `IF NOT EXISTS` / `ON DUPLICATE KEY UPDATE`。重复字段或重复键的错误（`ER_DUP_FIELDNAME` / `ER_DUP_KEYNAME` / `ER_TABLE_EXISTS_ERROR`）已被 `migrate.js` 内置忽略，可放心写。
3. **不得使用 `DELIMITER //`**：`splitSqlStatements` 不识别此指令，会切碎存储过程定义。如需复杂逻辑改用 `INSERT IGNORE` / `ON DUPLICATE KEY` 或在应用层处理。
4. **不得直接激活 legacy SQL**：历史上未成功执行过的 SQL 文件（往往与当前 schema 不兼容，如外键类型不一致）必须保持 `.archived` 等扩展名归档，**不得**改名为时间戳形式让其进入迁移序列。重命名 legacy SQL 这件事 2026-05-18 已经导致一次 server boot 失败回归，参见 commit `036c15f`。
5. 新增迁移**必须**在 staging 环境验证一次再上线。

### 环境变量管理

1. `.env` 文件**永远不被 git 跟踪**，也不会被 deploy.py 同步覆盖。生产环境改 .env 必须 SSH 上服务器手动改 + `pm2 restart`。
2. 新增配置项必须同步更新 `backend/.env.example` / `admin-backend/.env.example`，方便后人对照补齐。
3. 关键变量（`DB_PASSWORD` / `JWT_SECRET`）的值不得出现在 commit、日志、文档、聊天记录中。

### 管理端访问入口

管理前端 dist 上传到服务器后**默认无访问入口**，必须在 Nginx 额外配置 `admin.xs.momofx.cn` 子域名（当前推荐/示例口径）或 `/admin/` 子路径 server block。具体配置见 `deploy-guide.md` §6。

### 部署后强制验收清单

每次部署后必须依序确认：
1. `pm2 status` 两个进程都是 `online`
2. `pm2 logs xsread-backend` 看到 "✅ 数据库迁移完成" 与 "⏰ 定时任务已启动"
3. `curl /api/health` 返回 200
4. 浏览器无痕模式访问首页 + 关键链路无 500
5. 在 `docs/AI完成后报告文档/` 写一份"YYYY-MM-DD-XX 上线部署报告"，至少包含：commit 范围、迁移版本、验证结果、回滚预案

### 回滚纪律

1. 回滚操作（`git reset --hard`、`mysql < backup.sql`）属于高风险操作，**必须先停服务**（`pm2 stop`）再执行，否则可能产生写入丢失。
2. 回滚后必须重新 `npm ci --omit=dev`，因为 `package.json` 也回退了。
3. 回滚成功后 24 小时内须在 `docs/AI完成后报告文档/` 写复盘报告，说明根因与后续改进。

## 文档规则

### 文档存放位置

```
docs/
├── 项目总文档/                          # 正式项目文档
├── AI完成后报告文档/                     # AI 子代理交付报告
└── NovelOS_Lite_项目标准文档/            # 项目标准规范（编号命名，不加日期）
```

如有其他分类需求，可在 `docs/项目总文档/` 或 `docs/AI完成后报告文档/` 下新建子文件夹。

### 文件命名规则

1. AI 新建阶段性文档时，**文件名必须以日期+名称命名**。  
   格式：`YYYY-MM-DD-文档名称.md`  
   示例：`2026-05-14-Agent2小说设定中心交付报告.md`
2. 标准规范类文档（如 `docs/NovelOS_Lite_项目标准文档/`）使用编号命名，不加日期前缀。

### 文档内容规则

1. 新建文档正文开头必须写：`文档日期` 或 `最后更新日期` 或 `最后确认日期`。
2. 长期说明类文档如果文件名不带日期，正文开头也必须补日期。
3. AI 子代理完成任务后，必须在 `docs/AI完成后报告文档/` 中写入交付报告，包含：
   - 完成了什么
   - 涉及的文件列表
   - 测试结果
   - 已知问题
   - 后续建议

## 文档口径优先级

当多个文档口径冲突时，按以下顺序判断：

1. 日期更近的阶段报告或交付包
2. 当前代码实现
3. 长期说明类文档
4. 过程文档或提示词资料

## 文档读取说明

### 关键参考文档索引（按优先级）

A 级 — 当前事实入口：

```
docs/项目总文档/2026-05-21-项目现状总览.md         # 项目能干什么、四端边界、最近里程碑
docs/项目总文档/2026-05-21-接口与路由速查总表.md   # 当前所有路由（用户/管理 × 前端/后端）
docs/项目总文档/2026-05-21-数据库与迁移现状说明.md # 25+ 迁移文件 + 表分层 + 命名规则
docs/项目总文档/2026-05-21-功能能力矩阵.md         # 项目能力名片
docs/项目总文档/2026-05-21-后台功能Backlog.md      # 未做 / 治理项 / 决策记录
docs/01-核心文档/2026-05-21-数据库设计文档.md      # 字段级表结构（含会员 / 激活码 / 通知 / 偏好 / 管理端表）
deploy-guide.md                                    # 唯一权威部署手册
```

B 级 — 阶段交付报告（追溯改动用）：

```
docs/AI完成后报告文档/2026-05-21-管理端Sprint2完成报告.md
docs/AI完成后报告文档/2026-05-20-用户端Sprint1完成报告.md
docs/AI完成后报告文档/2026-05-20-审查报告-00-负责人总报告.md  # 6 份深度审查的入口
docs/AI完成后报告文档/2026-05-19-Agent-D-个人中心收尾联调交付报告.md
```

C 级 — 历史归档（仅作参考，不当现状）：

```
docs/历史研究归档/                          # 旧阶段判断
docs/01-核心文档/2026-05-17-*.md            # 上一版核心文档
docx/                                       # 迁移前备份
```
