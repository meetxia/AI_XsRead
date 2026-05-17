# 用户系统完善 — 任务清单

> 文档日期：2026-05-17  
> 配套：`plan.md`

## 流 A — 后端 API（独立于前端，可一人单独跑）

### A1. 解决 /api/health 等公开接口被 401 的问题（P0-2）
- **改动**：
  - 编辑 `backend/src/routes/index.js`：
    1. 把 `router.get('/api/health', …)` 和 `router.get('/', …)` 的注册位置**移到**所有 `router.use(...)` 之前
    2. 把 `bookmarkRoutes` 的挂载从 `router.use('/api', bookmarkRoutes)` 改成 `router.use('/api/user', bookmarkRoutes)`，并同步修改 `backend/src/routes/bookmarks.js` 内部路径前缀（去掉 `/user`）
- **验证**：
  - `curl http://127.0.0.1:8005/api/health` → 200 + `{status:'healthy'}`
  - `curl http://127.0.0.1:8005/api/user/bookmarks` → 401（保持原行为）
  - 已登录 token 调 `/api/user/bookmarks` → 200

### A2. 让 /api/novels/:id/status 支持匿名（P1-1 后端）
- **改动**：`backend/src/routes/novels.js` 把第 388-393 行 `authenticate` 换成 `optionalAuth`
- **改动**：`backend/src/controllers/novelController.js` 在 `getNovelStatus` 里，如果 `req.user` 为空就返回 `{ inBookshelf:false, liked:false, collected:false, rating:null }`，不查表
- **验证**：
  - 匿名 `curl http://127.0.0.1:8005/api/novels/1/status` → 200 + 全 false
  - 登录态结果不变

### A3. avatar 改为相对路径（P1-5 后端）
- **改动**：搜索 `backend/src/controllers/userController.js`、`authController.js` 中所有拼接 `req.get('host')` + `/uploads/...` 的地方，改成只返回 `/uploads/xxx.jpg`
- **数据库迁移**：写一个新的 `database/migrations/202605171000__normalize_avatar_paths.sql`，把 `users.avatar` 中已写入的绝对 URL 用 `SUBSTRING_INDEX` 截成相对路径
- **验证**：
  - 注册 → 返回 avatar 形如 `/uploads/avatars/xxx.svg`
  - 登录拿到的 user.avatar 同样
  - 老用户 avatar 跑迁移后也变成相对路径

### A4. 部署脚本附带迁移摘要测试
- 已在前一步实现，验证 `python backend/scripts/deploy.py --backend --dry-run` 输出能列出最新迁移版本即可

---

## 流 B — 前端体验（独立于后端逻辑，但完成后需要后端到位才能联调）

### B1. axios 拦截器：未登录态 401 不跳转（P1-1 前端）
- **改动**：`ai-xsread-vue3/src/api/request.js` 的 `handleUnauthorized`：
  - 当 `localStorage.getItem('token')` 不存在时，**不**调 `window.location.href = ...`，直接清空可能残留的 user 信息后 reject
  - 只有"原本带 token、token 失效"才执行跳转
- **验证**：
  - 匿名打开 `/novel/1` 不再跳转回 `/login`
  - 已登录 token 被改坏后访问 `/profile` → 跳转 `/login?returnUrl=...`

### B2. ProfilePage 区分登录/未登录（P1-2）
- **改动**：`ai-xsread-vue3/src/views/ProfilePage.vue`：
  - 引入 `useUserStore`，根据 `userStore.isLoggedIn` 切换两套渲染分支
  - 未登录分支：展示"立即登录解锁同步"卡片 + 引导按钮
  - 已登录分支：调用 `/api/auth/me` 拿真数据，删掉 `阮宁/@ningning` 假数据
- **验证**：
  - 匿名 `/profile` 看到的是登录引导，不再有假名字
  - 登录后刷新 → 真实昵称、真实头像

### B3. 清理 console 调试日志（P1-4）
- **改动**：`ai-xsread-vue3/src/api/request.js`：把 4 处 `console.log('🔑/⚠️ ...')` 用 `if (import.meta.env.DEV)` 包起来
- **验证**：`npm run build` 后 grep 产物里没有 `🔑`

### B4. avatar 兼容旧绝对地址（P1-5 前端）
- **改动**：`ai-xsread-vue3/src/utils/avatar.js` 和 `src/components/common/AppHeader.vue`：
  - 在判断 `http(s)://...` 之前，先把形如 `https?://[^/]+/uploads/` 的前缀去掉，仅保留 `/uploads/...`
- **验证**：直接构造一个 `http://127.0.0.1:8005/uploads/avatars/x.svg` 喂入 `getUserAvatarUrl`，输出 `/uploads/avatars/x.svg`

### B5. 登录页 / 注册页 完善返回链接处理
- **改动**：登录后跳回 `?returnUrl=` 指定的页面而不是固定 `/`；注册成功后自动登录并跳 `/`
- 已存在 `useReturnUrl.js`，确认逻辑无 bug 即可（流 B 收尾时再回归一次）

---

## 流 C — 运维 / Nginx（独立，最小改动）

### C1. 生产 Nginx 添加 SPA fallback（P0-1）
- **改动**：在服务器上创建 `/www/server/panel/vhost/nginx/extension/xs.momofx.cn/spa-fallback.conf`：

```nginx
# Vue Router history 模式 fallback
# /api/、/uploads/、/.well-known/ 已被 location ^~ 抢占，不受影响
location / {
    try_files $uri $uri/ /index.html;
}
```

- **验证**：
  - `curl -skI https://xs.momofx.cn/bookshelf` → 200（不再 404）
  - `curl -skI https://xs.momofx.cn/api/novels` → 200
  - `curl -skI https://xs.momofx.cn/random/path/that/does/not/exist` → 200（fallback 到 index.html）

### C2. 把 nginx 配置文件备份到仓库
- **改动**：把 `spa-fallback.conf` 内容也保存到 `backend/scripts/server-conf/xs.momofx.cn/spa-fallback.conf`，并加 README 说明部署位置；future 服务器迁移时可一键重建

---

## 收尾任务（D，串行）

### D1. 全部三流合并后做线上回归
1. 启动本地 dev 跑一次 `tmp-audit-user.mjs`（脚本临时建到 `ai-xsread-vue3/`，跑完删除），全部 0 ERR + 0 4xx
2. `python backend/scripts/deploy.py --all` 一键上线
3. Playwright 把 BASE 切到 `https://xs.momofx.cn/` 再跑一次同样脚本
4. 把审计报告写到 `docs/AI完成后报告文档/2026-05-17-用户系统完善交付报告.md`

### D2. Git 提交
- 提交信息（多行）：

```
feat(用户系统): 修复深链 404 与 401 误拦截，完善登录态分支

- 后端：/api/health、/api/user/bookmarks 路由顺序调整，公开接口不再被 authenticate 误拦
- 后端：/api/novels/:id/status 改 optionalAuth，匿名用户可看详情
- 后端：avatar 全部输出相对路径，新迁移规范化历史数据
- 前端：axios 拦截器对未登录态 401 不再硬跳登录
- 前端：ProfilePage 真正区分登录/未登录两种渲染
- 前端：清理生产环境调试日志
- 运维：Nginx 增加 SPA fallback 修复刷新 404
```
