---
最后更新日期: 2026-05-18
---

# 个人中心 MVP 优化设计文档

## 1. 背景

`/profile` 路由（`ai-xsread-vue3/src/views/ProfilePage.vue`）当前承载用户卡、阅读统计、勋章 / 想法 / 划线 / 书签 / 关注作者 / 会员中心入口、设置面板、退出登录等。审计后发现存在大量「点了没反应 / 死链 / 占位」的功能：

- 顶部铃铛按钮无 `@click`
- 用户卡「编辑」按钮无 `@click`，且无对应编辑页
- 设置区「阅读偏好 / 通知 / 帮助与反馈 / 关于」全部是 `<a href="#">`
- `useUserStats` 中 `joinDays` 永远是 0（后端 `/api/user/statistics` 未返回该字段）
- `userStore.uploadAvatar` 已封装但 ProfilePage 没暴露入口
- 桌面端快捷入口 4 列 × 2 排只填 7 个，最后一格为空
- 「关注作者」快捷入口的 `v-if="!followingAuthors.length"` 写反

**已由其它 Track 完成、不在本设计范围内**：

- 修改密码全链路（Track A）：后端 `POST /api/auth/change-password` + SecurityPage 内置弹窗
- `userStore.refreshAccessToken` 接通真实接口（Track A）
- 路由守卫真正生效（Track A）

本设计聚焦上述未解决问题的 MVP 修复 + Track A 修改密码体验小补丁（强制重登 + 弹窗组件化）。

## 2. 范围

### 2.1 做（7 项 MVP 必做）

1. **编辑资料**：昵称、头像上传、阅读口味标签
2. **修改密码**：旧密码 + 新密码 + 二次确认
3. **阅读偏好**：字号 / 行距 / 主题 / 翻页方式 / 护眼，服务端持久化
4. **通知中心（轻量）**：列表、单条已读、全部已读、铃铛红点
5. **帮助与反馈**：静态 FAQ + 联系方式
6. **关于 MOMO 小说**：版本号、团队介绍、用户协议 / 隐私政策（同页锚点）
7. **ProfilePage 现有问题修复**

### 2.2 不做

- 注销账号
- 绑定手机 / 绑定邮箱
- 登录设备管理
- 邮箱 / 短信找回密码
- 反馈表单后台
- 通知分类 / 后台发送
- 通知轮询

不做的入口在 `SecurityPage.vue` 中**直接删除**，不留死链。

## 3. 架构

### 3.1 路由

`ai-xsread-vue3/src/router/index.js` 新增 5 条（不再单独建 `/profile/change-password`，复用 Track A 已落地的 `/security` 弹窗）：

```js
{ path: '/profile/edit',            name: 'profile-edit',     component: () => import('@/views/profile/ProfileEditPage.vue'),     meta: { title: '编辑资料',   requiresAuth: true } },
{ path: '/profile/preferences',     name: 'profile-prefs',    component: () => import('@/views/profile/PreferencesPage.vue'),     meta: { title: '阅读偏好',   requiresAuth: true } },
{ path: '/profile/notifications',   name: 'notifications',    component: () => import('@/views/profile/NotificationsPage.vue'),   meta: { title: '通知中心',   requiresAuth: true } },
{ path: '/about/help',              name: 'help',             component: () => import('@/views/profile/HelpPage.vue'),            meta: { title: '帮助与反馈' } },
{ path: '/about',                   name: 'about',            component: () => import('@/views/profile/AboutPage.vue'),           meta: { title: '关于 MOMO小说' } },
```

`SecurityPage.vue` 已由 Track A 落地修改密码弹窗，本次不再清理"绑定手机 / 邮箱 / 设备管理 / 注销账号"4 项——Track A 已把它们改成"即将开放"提示，对运营更友好，保留。

### 3.2 前端文件清单

```
ai-xsread-vue3/src/
├── views/profile/
│   ├── ProfileEditPage.vue          # 新增 - 编辑资料（昵称 / 头像 / 口味标签）
│   ├── PreferencesPage.vue          # 新增 - 阅读偏好
│   ├── NotificationsPage.vue        # 新增 - 通知中心
│   ├── HelpPage.vue                 # 新增 - 帮助与反馈（静态）
│   └── AboutPage.vue                # 新增 - 关于（静态）
├── components/profile/
│   ├── AvatarUploader.vue           # 新增 - 头像上传
│   ├── InterestTagPicker.vue        # 新增 - 口味标签选择器
│   ├── NotificationItem.vue         # 新增 - 通知列表项
│   ├── ChangePasswordDialog.vue     # 新增 - 把 SecurityPage 现有弹窗抽组件
│   └── PasswordStrengthBar.vue      # 新增 - 密码强度指示
├── api/
│   ├── notifications.js             # 新增
│   ├── preferences.js               # 新增
│   └── auth.js                      # Track A 已加 changePassword，不动
├── stores/
│   ├── notification.js              # 新增 - 未读数 + 列表
│   └── preferences.js               # 新增 - 偏好同步
├── router/index.js                  # 改 - 新增 5 条路由
└── views/
    ├── ProfilePage.vue              # 改 - 修复死链与逻辑
    └── SecurityPage.vue             # 改 - 把内置弹窗改为引用 ChangePasswordDialog 组件
```

### 3.3 后端文件清单

```
backend/src/
├── routes/
│   ├── notifications.js             # 新增
│   ├── user.js                      # 改 - 挂 preferences GET/PUT
│   └── index.js                     # 改 - 挂 /notifications
├── controllers/
│   ├── notificationController.js    # 新增
│   ├── preferenceController.js      # 新增
│   └── userController.js            # 改 - statistics 补 joinDays（changePassword 已由 Track A 在 authController 实现）
└── database/migrations/
    ├── 202605180001__add-notifications-table.sql
    └── 202605180002__add-user-preferences-table.sql
```

迁移文件命名遵循 Track D 已统一的 `^(\d{12})__(.+)\.sql$` 规则，`migrate.js` 自动执行。

### 3.4 数据库迁移

**`notifications` 表**：

```sql
CREATE TABLE notifications (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NOT NULL,
  type         VARCHAR(32) NOT NULL,
  title        VARCHAR(128) NOT NULL,
  content      VARCHAR(500) NOT NULL,
  link         VARCHAR(255) DEFAULT NULL,
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at      DATETIME DEFAULT NULL,
  KEY idx_user_unread (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`type` 取值：`system | membership | achievement`。

**`user_preferences` 表**：

```sql
CREATE TABLE user_preferences (
  user_id        BIGINT UNSIGNED PRIMARY KEY,
  font_size      TINYINT NOT NULL DEFAULT 16,
  line_height    DECIMAL(3,1) NOT NULL DEFAULT 1.8,
  theme          VARCHAR(16) NOT NULL DEFAULT 'cream',
  page_mode      VARCHAR(16) NOT NULL DEFAULT 'scroll',
  eye_protection TINYINT(1) NOT NULL DEFAULT 0,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`users` 表无变更。`joinDays` 在 `getUserStatistics` 控制器内通过 `DATEDIFF(NOW(), users.created_at)` 计算，不入库。

迁移脚本通过 `mysql -u toefl_user -p ai_xsread < <file>` 执行。

### 3.5 接口契约

所有接口沿用 `{ code, message, data, timestamp }` 响应格式。

```
PUT  /api/user/profile
  body: { nickname?, bio?, gender?, birthday? }   # 已存在，复用

POST /api/auth/change-password                     # Track A 已落地，本设计复用，不重写
  body: { oldPassword, newPassword }
  200: { code: 200, message: '修改成功', data: null }
  400: oldPassword 错误 / newPassword 不合规

GET  /api/user/preferences                         # 新增
  200: data = { fontSize, lineHeight, theme, pageMode, eyeProtection }

PUT  /api/user/preferences                         # 新增
  body: { fontSize?, lineHeight?, theme?, pageMode?, eyeProtection? }
  200: data = 完整偏好对象

GET  /api/user/interest-tags                       # 已有，复用
POST /api/user/interest-tags                       # 已有，复用

GET  /api/notifications?page&pageSize&onlyUnread   # 新增
  200: data = { list: [...], total, page, pageSize }

GET  /api/notifications/unread-count               # 新增
  200: data = { count }

POST /api/notifications/:id/read                   # 新增
  200: data = null

POST /api/notifications/read-all                   # 新增
  200: data = { affected }
```

接口契约是 4 路子代理之间的唯一耦合点，任何修改必须先在此处更新。

## 4. UI / 交互

### 4.1 编辑资料 `/profile/edit`

- 顶部圆形头像 + 「更换头像」按钮（点击触发文件选择）
- 昵称输入框（1–24 字）
- 阅读口味标签（最多 5 个，复用 onboarding 的标签集）
- 底部「保存」按钮（昵称为空 / 与当前一致 / 上传中均 disabled）

数据流：

```
mounted    → 用 userStore.userInfo 填充昵称、头像
           → getMyInterestTags() 填充标签
头像选择   → store.uploadAvatar(file) → 立即更新 userInfo.avatar
保存点击   → updateUserInfo({ nickname }) → saveInterestTags(tags) → router.back()
```

校验：头像 ≤ 2MB、jpg/png/webp；昵称 1–24 字。

### 4.2 修改密码（复用 Track A 已有实现 + 补"强制重登"）

Track A（2026-05-18-Track-A 报告）已完成：

- 后端：`POST /api/auth/change-password`（`backend/src/controllers/authController.js:303-363` + `backend/src/routes/auth.js:22`），bcrypt 校验旧密码、新密码 ≥ 6 位、新旧不同
- 前端 API：`ai-xsread-vue3/src/api/auth.js:50-56`
- 前端 store：`ai-xsread-vue3/src/stores/user.js:245-263` 已替换 TODO
- UI：`SecurityPage.vue` 内置轻量 `<dialog>` 弹窗，含旧/新/确认三字段 + 校验

**本次只做两件小事**：

1. 把 SecurityPage 内的弹窗抽成 `components/profile/ChangePasswordDialog.vue`（独立组件，便于将来复用）
2. 在弹窗的"修改成功"分支补一段：`userStore.logout()` → `router.push('/login')` → toast「密码已更新，请重新登录」

校验保持 Track A 的：新密码 ≥ 6 位、与旧密码不同、与确认密码一致。`PasswordStrengthBar` 仍创建（弱 / 中 / 强），但只显示强度提示，不强行卡保存——避免与 Track A 现有规则冲突。

**不再创建** `views/profile/ChangePasswordPage.vue`。`/profile/change-password` 路由从设计中**移除**——所有修改密码入口统一走 `/security`。

### 4.3 阅读偏好 `/profile/preferences`

- 字号：滑块 12–24
- 行距：分档按钮 1.4 / 1.6 / 1.8 / 2.0 / 2.2
- 主题：3 个色块按钮（米 / 夜 / 护眼）
- 翻页方式：segmented（滚动 / 分页）
- 护眼模式：switch
- 顶部固定「预览段落」实时反映当前设置

数据策略：服务端 `user_preferences` 是 truth，本地 `readingSettings` 是缓存。

```
登录后首次进入阅读器 / 偏好页：
  GET /api/user/preferences → 写 readingSettings + localStorage
偏好页修改：
  本地立即生效 → 防抖 500ms PUT /api/user/preferences
未登录：
  仅 localStorage，不发请求
```

### 4.4 通知中心 `/profile/notifications`

- 列表：未读条目左侧 4px 红点 + 加粗标题；类型 icon（system 喇叭 / membership 星 / achievement 勋章）；标题 + 摘要 + 相对时间
- 点击单条 → POST `/notifications/:id/read` → 跳 `link`（若有）
- 右上「全部已读」按钮 → POST `/read-all`
- 空态：「暂时还没有通知」+ 一句温柔文案

铃铛红点策略（不轮询）：

- App.vue 挂载且 `isLogin` 时拉一次 `unread-count`
- 登录态变化（登录 / 登出）时拉一次
- 进入 `/profile` 时拉一次
- 进入 `/profile/notifications` 时拉一次

种子数据：迁移时给所有现存用户插一条欢迎通知，避免首次空态。

### 4.5 帮助与反馈 `/about/help`（静态）

3 段：FAQ 折叠面板（5–8 个常见问题）→ 联系方式（邮箱 + 客服微信）→ 反馈引导。

### 4.6 关于 MOMO 小说 `/about`（静态）

App logo + slogan + 当前版本号 + 团队介绍一段 + 用户协议 / 隐私政策（页内锚点）。

### 4.7 ProfilePage 修复

| 位置 | 修改 |
|---|---|
| 顶部铃铛 | `@click="router.push('/profile/notifications')"` + 红点徽章（基于 notification store） |
| 用户卡「编辑」 | `@click="router.push('/profile/edit')"` |
| 关注作者快捷入口 | 始终显示，去掉 `v-if`；`FollowingAuthorList` 在有数据时才显示 |
| 桌面端 7 入口 | 固定 8 入口：书架 / 历史 / 勋章 / 想法 / 划线 / 书签 / 关注作者 / 编辑资料 |
| `joinDays = 0` | 后端 `getUserStatistics` SQL 增加 `DATEDIFF(NOW(), u.created_at) AS joinDays` |
| 设置区 4 个 `<a href="#">` | 改成 `<RouterLink>` 指对应路由 |

### 4.8 SecurityPage 清理

删除：绑定手机 / 绑定邮箱 / 登录设备管理 / 注销账号 4 行。
保留：修改密码（跳 `/profile/change-password`）。
底部说明文案改为：「目前仅支持修改密码，更多账号安全功能将后续上线」。

## 5. 测试策略

| 层级 | 工具 | 范围 |
|---|---|---|
| 后端单元 | Jest | `changePassword` / `getUserPreferences` / `updateUserPreferences` / `notifications.list` / `markRead` / `markAllRead` / `unreadCount`，覆盖正常 + 校验失败 + 鉴权失败 |
| 前端组件 | Vitest（项目已有则用） | `PasswordStrengthBar` / `AvatarUploader` 边界行为 |
| E2E | 浏览器 MCP（主 agent 手动） | 按 §6 验收清单跑一遍 |

不做：可视化回归、性能压测、跨浏览器矩阵。

## 6. 验收清单

### 6.1 编辑资料

- [ ] 进入时昵称、头像、口味标签均填回当前值
- [ ] 昵称 0/25 字、与当前一致 → 保存按钮 disabled
- [ ] 头像 > 2MB / 非 jpg/png/webp → 前端拦截并 toast
- [ ] 头像上传成功后 ProfilePage 头像立刻刷新
- [ ] 标签选满 5 个后第 6 个不可选
- [ ] 保存成功 toast + 返回上一页，ProfilePage 显示已更新

### 6.2 修改密码（Track A 已实现接口与基础弹窗，本次只验弹窗组件化 + 强制重登）

- [ ] SecurityPage 改为引用 `ChangePasswordDialog` 组件后，原弹窗交互不变（旧/新/确认三字段、长度与一致性校验、成功 toast）
- [ ] 新密码与旧密码一致 → 拒绝（沿用 Track A 校验）
- [ ] 强度条三档颜色正确切换（仅显示，不卡保存）
- [ ] **新增**：成功后 1 秒内 token 清空 + 跳 `/login` + toast「密码已更新，请重新登录」

### 6.3 阅读偏好

- [ ] 未登录进入 → 只存 localStorage，不发请求
- [ ] 已登录修改 → 立刻预览生效，500ms 后看到 PUT 请求落地
- [ ] 偏好页修改后进入阅读器 → 设置自动应用
- [ ] 阅读器内修改 → 偏好页打开值同步

### 6.4 通知中心

- [ ] 空态文案正确显示
- [ ] 未读条目左侧红点 + 加粗标题
- [ ] 点击 → 红点消失 + 跳到 `link`
- [ ] 「全部已读」后铃铛红点立即消失
- [ ] ProfilePage 铃铛红点反映真实未读数（> 0 显示，= 0 隐藏）

### 6.5 帮助 / 关于

- [ ] 静态内容显示，无报错，无死链

### 6.6 ProfilePage 修复

- [ ] 铃铛、「编辑」按钮可点击并跳转
- [ ] 桌面端 8 个快捷入口排成 2 × 4 整齐网格
- [ ] `joinDays` 数字正确（创建当天 = 0 天，第二天 = 1 天）
- [ ] SecurityPage 中"修改密码"项触发的弹窗与组件化前体验一致；成功后强制重登

## 7. 子代理分派

按「接口契约先锁定 → 子代理彼此不抢同一文件」分派。

| Agent | 职责 | 主要文件 | 依赖 |
|---|---|---|---|
| **A — 后端 API + 迁移** | preferences GET/PUT、notifications 4 接口、statistics 补 joinDays、2 个 SQL 迁移、Jest 单测（changePassword 已由 Track A 完成，本 Agent 不再做） | `backend/src/controllers/{userController,preferenceController,notificationController}.js`、`backend/src/routes/{user,notifications,index}.js`、`backend/database/migrations/202605180001__*.sql`、`202605180002__*.sql` | 无 |
| **B — 编辑资料 + 改密弹窗组件化** | ProfileEditPage / AvatarUploader / InterestTagPicker / PasswordStrengthBar / 把 SecurityPage 内置弹窗抽成 ChangePasswordDialog 组件 + 加"改密成功后强制重新登录" | `views/profile/ProfileEditPage.vue`、`components/profile/{AvatarUploader,InterestTagPicker,PasswordStrengthBar,ChangePasswordDialog}.vue`、`views/SecurityPage.vue`（仅替换弹窗为组件引用） | 无（Track A 已完成 change-password 接口） |
| **C — 阅读偏好 + 通知中心** | PreferencesPage / NotificationsPage / NotificationItem / 两个 store / 两个 api 文件 | `views/profile/{PreferencesPage,NotificationsPage}.vue`、`components/profile/NotificationItem.vue`、`api/{preferences,notifications}.js`、`stores/{preferences,notification}.js` | A 的 preferences / notifications 契约 |
| **D — 静态页 + ProfilePage 修复 + 联调收尾** | HelpPage / AboutPage、修 ProfilePage（铃铛 / 编辑 / 关注作者逻辑 / 8 入口 / 设置区链接）、铃铛接 notification store | `views/profile/{HelpPage,AboutPage}.vue`、`views/ProfilePage.vue` | B、C 的页面落地后串联 |

**调度顺序**：

1. **第 0 步（主 agent）**：先创建 5 个空白页文件 + 把 `router/index.js` 5 条新路由挂上 + ProfilePage 内 4 个 `<a href="#">` 改 RouterLink + 铃铛 / 编辑按钮挂 click + 关注作者反逻辑修复 + 桌面端 8 入口。这一步单独 commit，避免后续子代理改路由互相打架
2. **第一波（并行）**：A、B、C 同时启动。A 接口跑通后 C 切换到真接口
3. **第二波**：A、B、C 完成 → 派 D 收尾（静态页 + ProfilePage 与 notification store 接通铃铛红点）
4. **第三波**：主 agent 用浏览器 MCP 跑 §6 验收清单

**冲突预防**：

- 每个 agent 改的文件清单互不重叠
- `router/index.js` 仅由主 agent 在第 0 步动一次，子代理不再改
- B/C 写页面时，路由占位文件已存在；子代理只需替换占位组件内容

## 8. 已知风险

- **修改密码强制重新登录**：体验上会打断，但避免旧 token 在他设备继续可用。
- **通知不轮询**：仅在进入 `/profile`、`/profile/notifications`、登录态变化时拉未读数；及时性较弱但 MVP 够用。
- **阅读偏好双源一致性**：服务端 `user_preferences` 与本地 `readingSettings` 双源；约定服务端为 truth，登录后首次拉取覆盖本地，离线/未登录回退 localStorage。
