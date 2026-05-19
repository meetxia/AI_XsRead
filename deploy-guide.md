# MOMO 小说部署指南

> 最后更新日期：2026-05-19
> 适用站点：`xs.momofx.cn`（腾讯云 OpenCloudOS + 宝塔面板 + Node.js 18+ + PM2 + MySQL 8.0）
> 唯一权威：所有部署操作以本文档为准。`backend/scripts/deploy.py` 是唯一受支持的部署工具。
> 历史文档：`DEPLOYMENT_COMPLETE.md` / `DEPLOYMENT_ISSUES_AND_SOLUTIONS.md` / `FINAL_DEPLOYMENT_STEPS.md` 仅作为问题排查参考，**不再作为部署流程依据**。

---

## 1. 部署架构总览

```
本地（Windows）                                 服务器（xs.momofx.cn）
─────────────────                              ──────────────────────
ai-xsread-vue3/dist     ──rsync──►  /www/wwwroot/xs.momofx.cn/ai-xsread-vue3/dist     →  Nginx 80/443
backend/                ──rsync──►  /www/wwwroot/xs.momofx.cn/backend                 →  PM2: xsread-backend (8005)
admin-frontend/dist     ──rsync──►  /www/wwwroot/xs.momofx.cn/admin-frontend/dist     →  Nginx admin.* / /admin
admin-backend/          ──rsync──►  /www/wwwroot/xs.momofx.cn/admin-backend           →  PM2: xsread-admin-backend (8001)
backend/uploads/...     ──rsync──►  /www/wwwroot/xs.momofx.cn/backend/uploads
```

| 进程 / 站点 | 端口 | 说明 |
|------------|------|------|
| Nginx 主站 | 80/443 | 用户前端 + `/api` 反代到 8005 + `/uploads` 静态 |
| Nginx 管理站 | 80/443 | admin-frontend dist + `/api` 反代到 8001（独立 server block） |
| `xsread-backend`（PM2） | 8005 | 用户后端，启动时自动跑数据库迁移 + 定时任务 |
| `xsread-admin-backend`（PM2） | 8001 | 管理后端，独立进程独立日志 |

---

## 2. 部署工具

**唯一推荐工具：`backend/scripts/deploy.py`**

它做了以下事：
- 本地 `npm install` + `npm run build`（前端）
- rsync 增量上传（用 `--checksum` 真按内容比对，**npm build 全量重生成 mtime 也不会全量重传**）
- 远端 `npm ci --omit=dev`
- PM2 reload（不存在则 start）
- 部署后 curl `/api/health` 健康检查
- **自动记录数据库 migrations 表的 diff**：列出本次新应用了哪些迁移版本

**不要使用**：`scp` 全量上传 / 宝塔文件管理器手动改 / 直接 `rsync -av` 不带 `--checksum`。这些方式都已证明会漏文件、覆盖 `.env` 或破坏 `uploads/`。

---

## 3. 标准部署流程

### 3.1 部署前检查（每次必做）

**本机（Windows）：**

```bash
cd e:/momo-ruanjiansheji/AI-XsRead

# ① 确保依赖完整
cd backend && npm install && cd ..

# ② 本地最终验证（语法 + 构建）
node -c backend/src/app.js
cd ai-xsread-vue3 && npm run build && cd ..
cd admin-frontend && npm run build && cd ..

# ③ 推送到 GitHub（防止本地丢失）
git status
git push origin main
```

**服务器（SSH 上去）：**

```bash
cd /www/wwwroot/xs.momofx.cn
mkdir -p backups

# ① 数据库备份（最关键，不可省）
mysqldump --single-transaction --routines -u toefl_user -p ai_xsread \
  > backups/ai_xsread_before_$(date +%Y%m%d_%H%M%S).sql

# ② 当前 commit 与 .env 备份
git log --oneline -1 > backups/before-deploy-commit.txt
[ -f backend/.env ] && cp backend/.env backups/backend.env.backup
[ -f admin-backend/.env ] && cp admin-backend/.env backups/admin-backend.env.backup

# ③ 确认服务器 Node、PM2 在位
node -v && pm2 -v && which mysql
```

> ⚠️ 如果 `mysqldump` 报权限错（如 LOCK TABLES denied），先用宝塔面板的"备份数据库"功能备份一次，再继续。**绝对不要跳过备份**。

### 3.2 推荐部署命令（按场景选）

**场景 A：完整部署（用户端 + 管理端 + 图片）**

```bash
# 在本机执行
python backend/scripts/deploy.py --all-with-admin
```

**场景 B：只更新某一部分**

```bash
python backend/scripts/deploy.py --backend          # 只更新用户后端（含迁移）
python backend/scripts/deploy.py --frontend         # 只更新用户前端
python backend/scripts/deploy.py --admin            # 只更新管理前后端
python backend/scripts/deploy.py --admin-frontend   # 只更新管理前端
python backend/scripts/deploy.py --admin-backend    # 只更新管理后端
python backend/scripts/deploy.py --images           # 只更新图片资源
```

**场景 C：dry-run 看会做什么（不真实执行）**

```bash
python backend/scripts/deploy.py --all-with-admin --dry-run
```

打印所有 ssh / rsync / pm2 命令但不执行。**首次跑完整部署前建议先 dry-run 一次**。

**场景 D：监听本地 dist 变化自动部署（开发联调用）**

```bash
python backend/scripts/deploy.py --watch
```

监听 `ai-xsread-vue3/dist`，每 5 秒检查变化，有变化就增量部署一次前端。

### 3.3 部署期间脚本会自动做的事

1. **本地构建** → ai-xsread-vue3 + admin-frontend → `dist/`
2. **rsync 增量上传**（按 hash 比对，没变的不传）
3. **远端 `npm ci --omit=dev`** 安装生产依赖
4. **PM2 reload**：xsread-backend + xsread-admin-backend（首次会改用 `start`）
5. **后端启动自动 `runPendingMigrations`**：跑所有未应用的迁移
6. **健康检查**：curl `127.0.0.1:8005/api/health` 与 `127.0.0.1:8001/api/health`
7. **打印迁移 diff**：列出本次新应用了哪些 migration

整个流程预计 **5-10 分钟**（首次稍慢，后续 rsync 增量很快）。

---

## 4. 部署后验证清单

按顺序跑，每条都要过。

### 4.1 服务器进程态

```bash
ssh root@xs.momofx.cn
pm2 status
# 期望：xsread-backend 与 xsread-admin-backend 都是 online 且 restart 数稳定

pm2 logs xsread-backend --lines 30 --nostream
# 期望关键三行：
#   ✅ 数据库迁移完成，最新版本: 202605180002（或更新版本号）
#   ⏰ 定时任务已启动                                   ← node-cron 装上才有
#   🚀 MOMO小说后端服务启动成功！

pm2 logs xsread-admin-backend --lines 20 --nostream
# 期望：监听 8001 + 无未捕获异常
```

### 4.2 接口冒烟

```bash
# 用户后端
curl -s http://127.0.0.1:8005/api/health | head -c 300
# 期望：{"code":200,"data":{"status":"healthy","db":"up","migrations":{"latestVersion":"...","total":N}}}

curl -s "http://127.0.0.1:8005/api/novels/recommend?limit=12" | head -c 300
# 期望：{"code":200,"data":{"strategy":"guest","list":[...]}}

# 管理后端
curl -s http://127.0.0.1:8001/api/health | head -c 200
# 期望：200 + healthy
```

### 4.3 浏览器最终验证

无痕模式打开（避免缓存干扰）：

| 入口 | URL | 期望 |
|------|-----|------|
| 用户首页 | `https://xs.momofx.cn/` | 正常加载，控制台无 500 |
| 路由守卫 | 退出后访问 `/profile` | 自动跳 `/login` |
| 修改密码 | 登录后 → 个人中心 → 账号安全 → 修改密码 | 弹窗能改成功 |
| 阅读进度同步 | A 设备读 N 章 → B 设备登录同账号打开同书 | 自动跳到 N 章 |
| 管理端 | `https://admin.momofx.cn/` 或 `/admin/` | 登录 → 看板 / 设置 / 数据统计正常 |

---

## 5. 出问题怎么办

### 5.1 后端启动失败

```bash
ssh root@xs.momofx.cn
pm2 logs xsread-backend --lines 100 --nostream
```

**常见症状 → 处理：**

| 症状 | 原因 | 修复 |
|------|------|------|
| `Migration XXX failed` | 新迁移与现有 schema 不兼容 | 看下文 5.2 回滚数据库 |
| `Cannot find module 'node-cron'` | 服务器 npm ci 没装上 | `cd backend && npm install node-cron --save && pm2 restart xsread-backend` |
| `Cannot find module 'lru-cache'` 或 `'ioredis'` | 同上 | `cd backend && npm install` 重新装 |
| `EADDRINUSE :::8005` | 8005 端口被占用 | `lsof -i:8005` 找到进程 kill 掉再 `pm2 restart` |
| `ER_ACCESS_DENIED` | 数据库账号密码不对 | 检查 `backend/.env` 的 `DB_USER` / `DB_PASSWORD` |

### 5.2 数据库迁移失败 → 回滚

**在服务器执行：**

```bash
cd /www/wwwroot/xs.momofx.cn

# ① 停服务
pm2 stop xsread-backend xsread-admin-backend

# ② 还原数据库（用最近一次备份）
ls -lt backups/*.sql | head -3   # 找最新备份
mysql -u toefl_user -p ai_xsread < backups/ai_xsread_before_<时间戳>.sql

# ③ 回滚代码
git reset --hard $(awk '{print $1}' backups/before-deploy-commit.txt)

# ④ 重装依赖（package.json 退回了）
cd backend && npm ci --omit=dev && cd ..
cd admin-backend && npm ci --omit=dev && cd ..

# ⑤ 重启
pm2 start ecosystem.config.js
pm2 save
```

### 5.3 前端白屏

```bash
# 检查 dist 就绪
ls /www/wwwroot/xs.momofx.cn/ai-xsread-vue3/dist/index.html

# 检查 Nginx 配置
nginx -t && nginx -s reload

# 看 Nginx 错误日志
tail -50 /www/wwwlogs/xs.momofx.cn_error.log
```

如果 dist 在但白屏，浏览器 **Ctrl+F5** 强刷或清缓存（多半是 service worker 或 HTML 缓存）。

---

## 6. Nginx 配置

**主站 `xs.momofx.cn`** 配置见根目录 `nginx.conf`。关键点：

- 网站根目录：`/www/wwwroot/xs.momofx.cn/ai-xsread-vue3/dist`
- `/api` 反代 → `http://127.0.0.1:8005`
- `/uploads` alias → `/www/wwwroot/xs.momofx.cn/backend/uploads`
- SPA fallback：`try_files $uri $uri/ /index.html;`
- 缓存策略：HTML 不缓存、带 hash 的 JS/CSS 一年、图片字体 30 天

**管理站 `admin.momofx.cn`**（推荐独立子域名）：

```nginx
server {
    listen 443 ssl;
    server_name admin.momofx.cn;

    ssl_certificate     /www/server/panel/vhost/cert/admin.momofx.cn/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/admin.momofx.cn/privkey.pem;

    root /www/wwwroot/xs.momofx.cn/admin-frontend/dist;
    index index.html;

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ /\. { deny all; }
}

# HTTP 跳 HTTPS
server {
    listen 80;
    server_name admin.momofx.cn;
    return 301 https://$server_name$request_uri;
}
```

配置完后：
1. DNS 加 `admin.momofx.cn` A 记录指向服务器 IP
2. 宝塔面板申请 Let's Encrypt SSL
3. `nginx -t && nginx -s reload`

---

## 7. 环境变量管理

`.env` 文件**绝对不会被 deploy.py 同步覆盖**（在排除列表里）。要改环境变量必须直接在服务器上改：

```bash
ssh root@xs.momofx.cn
cd /www/wwwroot/xs.momofx.cn/backend
vi .env

# 改完重启
pm2 restart xsread-backend
```

**.env 示例位于 `backend/.env.example` 与 `admin-backend/.env.example`**。新增配置项时建议同步更新两个 example 文件，方便后人对照。

**关键环境变量**：

| 变量 | 必填 | 说明 |
|------|------|------|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | 是 | 数据库连接 |
| `JWT_SECRET` | 是 | JWT 签名密钥，**生产必须改成 32+ 位强随机** |
| `PORT` | 是 | backend=8005，admin-backend=8001 |
| `NODE_ENV` | 是 | 生产固定 `production` |
| `ENABLE_SCHEDULED_JOBS` | 否 | 设 `false` 可关定时任务，默认开启 |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | 否 | Redis 缓存，没装 Redis 不影响主服务 |

---

## 8. 数据库迁移规则（必读）

backend 启动时会自动跑 `runPendingMigrations`：

- 扫描 `backend/database/migrations/` 下符合 `^\d{12}__.+\.sql$` 命名的文件
- 与 `migrations` 表对比，跳过已应用版本
- 每条迁移在事务里执行，失败回滚
- 已应用版本写入 `migrations(version, description, applied_at)` 表

**新增迁移规范**：
1. 文件名严格按 `YYYYMMDDHHMI__描述.sql`，例如 `202605200900__add_user_phone.sql`
2. SQL 必须**幂等**：用 `IF NOT EXISTS` / `ON DUPLICATE KEY UPDATE`，且依赖 migrate.js 的 `BENIGN_IDEMPOTENCY_ERRORS`（自动忽略 `ER_DUP_FIELDNAME` / `ER_DUP_KEYNAME` / `ER_TABLE_EXISTS_ERROR`）
3. **不要用 `DELIMITER //`**：`splitSqlStatements` 不识别此指令，会把存储过程切碎报 syntax error
4. **不要在迁移里写废弃 schema**：如 `INT` 字段引用 `BIGINT UNSIGNED` 主键的外键，会触发 errno 150。先 `DESC` 当前表确认字段类型再写
5. 历史不能执行的 legacy SQL 用 `.archived` 扩展名归档，**不要**让它们进入迁移序列

---

## 9. PM2 维护命令

```bash
pm2 list                          # 看所有进程
pm2 status                        # 同上简版
pm2 logs xsread-backend           # 实时日志
pm2 logs xsread-backend --lines 100 --nostream   # 最近 100 行不阻塞
pm2 restart xsread-backend        # 重启单个
pm2 reload xsread-backend         # 平滑重启（推荐生产用）
pm2 stop xsread-backend           # 停止
pm2 delete xsread-backend         # 删除
pm2 monit                         # 资源监控面板
pm2 save                          # 保存当前进程列表到开机自启
pm2 startup                       # 配置开机自启（首次部署时跑一次）
```

---

## 10. 默认账号

**管理员**（通过 `admin-backend/scripts/init-admin.js` 初始化）：
- 账号：`admin`
- 密码：`admin123`
- **生产环境必须立即修改**

---

## 11. 部署速查表

| 我要... | 命令 |
|--------|------|
| 全量部署（用户端+管理端+图片） | `python backend/scripts/deploy.py --all-with-admin` |
| 只发布前端改动 | `python backend/scripts/deploy.py --frontend` |
| 后端有改动+迁移 | `python backend/scripts/deploy.py --backend` |
| 只更新管理端 | `python backend/scripts/deploy.py --admin` |
| 看会做什么但不执行 | 上面任何命令加 `--dry-run` |
| 监听 dist 自动部署 | `python backend/scripts/deploy.py --watch` |
| 跳过本地 npm build | 加 `--skip-frontend-build` |
| 强制重新装本地依赖 | 加 `--install-frontend-deps` |
| 部署到非默认路径（危险） | 加 `--allow-unsafe-remote-path` |

---

## 12. 部署日志归档

每次重要部署后，建议按 AGENTS.md 文档规范在 `docs/AI完成后报告文档/` 写一份简报：

```markdown
# YYYY-MM-DD-XX 上线部署报告

> 文档日期：YYYY-MM-DD

## 上线内容
- 涉及 commit：xxx ~ xxx
- 涉及 Track：A / B / C / D
- 数据库迁移：202605xxxxxx 系列

## 验证结果
- pm2 status：✅
- /api/health：✅
- 关键功能浏览器验收：✅
- 已知问题：...

## 回滚预案
- 数据库备份位置：backups/ai_xsread_before_xxx.sql
- 部署前 commit：xxx
```

---

## 历史排查文档（仅作问题查询用）

> 这些文档是 2025-11 至 2026-05 的历史排查记录，**不再作为部署流程依据**，但保留作为问题查询参考。

- `DEPLOYMENT_COMPLETE.md` — 早期 V1.0 部署完成验收（2025-11-01）
- `DEPLOYMENT_ISSUES_AND_SOLUTIONS.md` — 1290 行的问题汇编，遇到具体报错可全文搜索
- `FINAL_DEPLOYMENT_STEPS.md` — 早期最后一公里步骤记录
- `FIX_SUMMARY.md` — 历次部署修复总结

如果以上历史文档与本文档冲突，**以本文档为准**。

---

*本文档由项目经理 AI 维护。每次部署流程或服务器架构发生变更时，必须同步更新本文档与 `AGENTS.md` 中的"部署规则"章节。*
