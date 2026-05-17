# 用户系统完善 + 线上 404 修复 — 任务计划

> 文档日期：2026-05-17  
> 站点：xs.momofx.cn（生产）/ localhost:3008 + localhost:8005（开发）  
> 工作流：本地修复 → 本地测试 → rsync 增量上线 → 线上验证

## 1. 本次审计发现的问题清单

按严重程度排序（基于 Playwright 全链路审计 + 后端代码走查）：

### 🔴 P0 阻塞型

| 编号 | 现象 | 根因 |
|---|---|---|
| P0-1 | 线上 `/bookshelf`、`/login`、`/register`、`/profile`、`/novel/*` 等深链刷新返回 **HTTP 404** | 宝塔 Nginx vhost 缺少 SPA fallback（`try_files $uri $uri/ /index.html`） |
| P0-2 | `/api/health` 等理论上无须登录的接口返回 **401** | `routes/index.js` 把 `bookmarkRoutes`、`interestTagRoutes`、`achievementRoutes` 全部挂在 `/api` 根，且这些子路由文件首行就 `router.use(authenticate)`，导致**所有以 `/api/` 开头的请求都先被这些 router 的 `authenticate` 拦截**（包括 `/api/health` 本身） |
| P0-3 | `.env.development` 把 `VITE_APP_BASE_API` 写成 `http://localhost:8001`，而后端实际跑在 8005 | 旧版本残留的端口配置；本次提交已修正为 `/api`（走 Vite proxy） |

### 🟡 P1 体验型

| 编号 | 现象 | 根因 |
|---|---|---|
| P1-1 | 匿名访问 `/novel/:id` 直接被踢回 `/login`（应允许预览详情，下单时再要求登录） | `routes/novels.js` 把 `/novels/:id/status` 用 `authenticate` 而不是 `optionalAuth`；axios 拦截器一遇 401 就 `window.location.href = login` |
| P1-2 | 匿名 `/profile` 没有走真正的"未登录"分支，硬塞了一个"阮宁 @ningning"假用户 | `ProfilePage.vue` 用了 mock 数据兜底，没有按 `userStore.isLoggedIn` 切换 |
| P1-3 | `/api/user/profile`、`/api/user/reading-history`、`/api/user/bookshelf` 等错误响应没有统一区分"未登录" vs "服务异常"，前端拦截器只能粗暴跳登录 | 后端 `Response.error(res, '请先登录', 401)` 的 message 在前端被识别为通用错误 |
| P1-4 | 前端 `request.js` 里有大量 `console.log('🔑 添加 Token...')` 在生产环境也会打印 | 缺少环境分支 |
| P1-5 | 头像 URL 在新代码里只判断 `/uploads/` 前缀，但后端 `/api/auth/register` 返回的 avatar 是 `http://127.0.0.1:8005/uploads/...` 这种**绝对地址** → 在生产打开会跨域 + 找不到 | `userController` 在拼 avatar 完整 URL 时用了 `req.get('host')`，应改成相对路径或基于 `X-Forwarded-Host` |

### 🟢 P2 一致性型

| 编号 | 现象 | 处理建议 |
|---|---|---|
| P2-1 | `migrate.js` 只识别 `\d{12}__name.sql`，那 4 个老的 `003_*` / `create_comments_tables.sql` 等不会跑 | 文档化即可，保留作为兜底 |
| P2-2 | 所有页面都在标题写"AI G E N E R A T E D"占位水印 | UI 调整，后续 sprint |
| P2-3 | `ecosystem.config.js` 的 `error_file` 是相对 `cwd` 的 `../logs/...`，但首次 PM2 创建时用的是 `/root/.pm2/logs/...` | 已在线上工作，留个观察项 |

---

## 2. 修复策略与技术决策

### 2.1 P0-1：SPA fallback（生产 Nginx）
新增 `/www/server/panel/vhost/nginx/extension/xs.momofx.cn/spa-fallback.conf`：

```nginx
# 生效顺序在 api-proxy.conf 之后即可（按文件名字母序加载，spa- 排在 api- 后面没问题）
location / {
    try_files $uri $uri/ /index.html;
}
```

`/api/`、`/uploads/` 已在 `api-proxy.conf` 用 `location ^~` 锁定，不会被这条 fallback 覆盖。

### 2.2 P0-2：解开 `/api/health` 的 401

后端方案二选一：

**方案 A（最小改动）**：把 `/api/health`、`/api/docs`、`/api`-root 等公开端点放到 `routes/index.js` **最前面**，在子路由挂载之前。

**方案 B（更彻底）**：把 `bookmarks.js` / `interestTags.js` / `achievements.js` 三个子路由的挂载路径改成各自独占的子前缀（如 `/api/bookmarks`、`/api/interest-tags`、`/api/achievements`），不再挂在 `/api` 根。这是常规 REST 路由设计，能避免后续再踩坑。

**采用方案 A + 局部方案 B**：health 路由前移；同时把 `bookmarkRoutes` 改挂 `/api/user`（因为它的所有路径都是 `/user/bookmarks`），其他保持不变。

### 2.3 P0-3：本地 .env 已修正
本次提交已把 `.env.development` 改成 `VITE_APP_BASE_API=/api`，配合 Vite proxy。✅

### 2.4 P1-1 / P1-3：401 不再硬跳登录
- 后端：把 `/api/novels/:id/status` 从 `authenticate` 换 `optionalAuth`，未登录返回 `{ inBookshelf:false, liked:false, collected:false }`
- 前端：`request.js` 对**未登录态**（无 token）发出的请求若收到 401 → 直接 reject，不跳转；只有**带 token**的请求收到 401（即 token 过期）才清空并跳登录

### 2.5 P1-2：ProfilePage 真正区分登录态
- 未登录：展示"立即登录"卡片 + 推荐内容，不渲染假资料
- 已登录：从 `userStore` 读取，调用 `/api/auth/me` + `/api/user/profile`

### 2.6 P1-4：清理调试日志
`request.js` 里的 `console.log('🔑 ...')` 用 `if (import.meta.env.DEV)` 包起来。

### 2.7 P1-5：avatar URL 前后端统一
- 后端 `userController` 返回 avatar 时只返回 `/uploads/xxx.jpg`（相对路径）
- 前端逻辑保持现在的"以 `/uploads/` 开头就直接返回"
- 兼容旧数据：前端 `getUserAvatarUrl` 加一个正则，把 `https?://[^/]+/uploads/` 替换为 `/uploads/`

---

## 3. Tasks.md 拆分（按可并行度划分）

详见 `tasks.md`。每个任务标注：
- 并行流（A/B/C）：A 流不依赖其他流；B、C 流之间也可并行；只有"打包验证"是串行收尾
- 影响文件
- 验证方式

后端任务和 Nginx 任务互不阻塞，前端任务依赖后端 API 行为定下来后再调。三条流可并行：
- **流 A（后端）**：P0-2 / P1-1 / P1-3 / P1-5 后端部分
- **流 B（前端）**：P1-1 前端拦截器、P1-2、P1-4、P1-5 前端部分
- **流 C（运维）**：P0-1 Nginx SPA fallback

---

## 4. 上线流程（统一适用）

每条流在自己 push 前都要：

1. 本地后端 + 前端起 dev 模式，点完测试矩阵无报错
2. `python backend/scripts/deploy.py --backend --dry-run`（如改后端）/ `--frontend --dry-run`（如改前端）观察 rsync 增量列表是否合理
3. 真上线：`python backend/scripts/deploy.py --frontend` 或 `--backend` 或 `--all`
4. 浏览器开 `https://xs.momofx.cn/`、`/bookshelf`、`/login` 三处快速 smoke
5. 用 Playwright 跑 `tmp-audit-user.mjs`（单独保留在 docs/AI完成后报告文档）确认 0 个 4xx

收尾：所有流合完后再跑一次 `--all` 全量上线，并保存最终审计报告到 `docs/AI完成后报告文档/2026-05-17-用户系统完善交付报告.md`。
