# 会员体系 — 任务清单

> 文档日期：2026-05-17  
> 配套：requirements.md、design.md

依赖关系：流 1（数据库 + 工具）→ 流 2（用户端后端 API）+ 流 4（管理后台后端 API）可并行；流 3（用户端前端）依赖流 2；流 5（管理后台前端）依赖流 4；流 6 是收尾验证 + 上线。

---

## 流 1 — 数据库迁移与公共工具（必须先完成）

### T1.1 数据库迁移文件
- [ ] 创建 `backend/database/migrations/202605171100__user_membership_fields.sql`
  - users 表加 `vip_level`、`vip_expires_at`、`vip_status` 三列与索引
- [ ] 创建 `202605171101__novel_is_vip.sql`
  - novels 表加 `is_vip` 列与索引
- [ ] 创建 `202605171102__create_code_batches.sql`
- [ ] 创建 `202605171103__create_activation_codes.sql`
- [ ] 创建 `202605171104__create_code_redemption_logs.sql`
- [ ] 创建 `202605171105__create_code_admin_logs.sql`
- [ ] 创建 `202605171106__create_system_contact.sql`（含 INSERT id=1 兜底行）
- 验证：本地 `npm run dev` 启动后 migrations 表新增 7 条记录

### T1.2 加密工具模块
- [ ] 新增 `backend/src/utils/codeCrypto.js`，导出 `encrypt(plain) / decrypt(buf) / lookupHash(plain)`
- [ ] 写单元测试 `backend/tests/utils/codeCrypto.test.js`
  - 加密 → 解密回环 = 原文
  - 同一输入两次加密结果不同（IV 随机）
  - 不同输入 lookup_hash 不同
- 验证：`npm run test -- codeCrypto`

### T1.3 激活码生成器
- [ ] 新增 `backend/src/utils/codeGenerator.js`：`generateCode() / formatForDisplay() / normalizeInput()`
- [ ] 单元测试：批量生成 10000 次，验证字符集合规、长度都是 16、无重复
- 验证：`npm run test -- codeGenerator`

### T1.4 续期算法
- [ ] 新增 `backend/src/services/membershipService.js`，导出 `computeNewMembership / isMember / loadMembership`
- [ ] 单元测试覆盖 R-2 的全部 12 种状态转换
- 验证：`npm run test -- membershipService`

---

## 流 2 — 用户端后端 API（依赖流 1）

### T2.1 会员状态查询
- [ ] 新增 `backend/src/controllers/membershipController.js`
  - `getMyMembership(req, res)`：返回 vip_level / vip_expires_at / days_remaining / is_active / is_permanent / vip_status
- [ ] 在 `backend/src/routes/user.js` 注册：`GET /membership`（已挂在 `/api/user`，所以路径 `/api/user/membership`）

### T2.2 激活接口
- [ ] 在 membershipController 增加 `activateCode(req, res)`：
  - 校验 code 格式
  - 用 lookup_hash 查 codes 表
  - 事务：更新 codes / batch / users / 写 redemption_log
  - 限流：activateLimiter（5 次/小时/用户）
- [ ] 路由：`POST /api/user/membership/activate`
- [ ] 集成测试：覆盖成功、过期码、已使用、永久会员激活、限流

### T2.3 客服信息公开 API
- [ ] 新增 `backend/src/controllers/systemController.js`
- [ ] `GET /api/system/contact`（公开，无须登录）
- [ ] 在 `routes/index.js` 注册（前置于子路由，避免被 authenticate 误拦）

### T2.4 注册接口扩展
- [ ] 修改 `backend/src/controllers/authController.js` 的 register
  - 接收可选 `activation_code` 字段
  - 注册成功后异步调用激活逻辑（失败不阻断注册）
  - 响应增加 `activation_status`: `success | failed | not_provided` 与 `activation_message`
- [ ] 集成测试：合法码立即激活；非法码注册成功但提示

### T2.5 章节内容试读截断
- [ ] 修改 `backend/src/services/novelService.js` 的 `getChapterContent` 与 `getNovelPageByChars`
  - 加载 novel.is_vip
  - 调用 `isMember(userId)`
  - 非会员 + VIP 书 → 截断到 1500 字符 + 返回 `truncated: true, vip_required: true, trial_length: 1500`
- [ ] 修改 `backend/src/services/novelService.js` 的 `getNovelDetail`
  - 响应里附 `is_vip` 字段
- [ ] 修改 `getChapterList`：每章节附 `is_vip`（继承自 novel）
- [ ] 集成测试：免费书全文；VIP 书匿名截断；VIP 书会员全文；VIP 书过期会员截断

---

## 流 4 — 管理后台后端 API（依赖流 1，与流 2 并行）

### T4.1 admin-backend 引入加密工具
- [ ] admin-backend 项目引用 `backend/src/utils/codeCrypto.js`、`codeGenerator.js`、`membershipService.js`
- [ ] 注意：admin-backend 是独立 npm 包，建议把上述工具复制一份到 `admin-backend/src/utils/`，避免跨项目相对引用；同时提取到一个 `shared` 工具目录共享（择一）
  - **决策**：先复制（代价小、不引入构建复杂度），后续可重构
- [ ] 确保 admin-backend 的 `.env` 也配置了与 backend 同样的 `JWT_SECRET`，否则加密 key 不一致会导致两边读不通

### T4.2 批次创建接口
- [ ] 新增 `admin-backend/src/controllers/codeController.js`
  - `createBatch(req, res)`：参数校验 `count: 1-1000`、`code_type: enum`
  - 事务内：插入 batch + 批量 INSERT codes（用 mysql 多值 INSERT 一次写入）
  - 同时去重（虽然概率极低，但补一道：插入失败 → 重新生成那条）
  - 返回明文 codes 数组（一次性）
  - 写 admin_log
- [ ] 路由 `POST /api/admin/codes/batches`，加 admin auth
- [ ] 单元测试：生成 100 个 → 全部入库 + 全部 lookup_hash 唯一

### T4.3 批次列表与详情
- [ ] `GET /api/admin/codes/batches`：分页列表，每行带统计
- [ ] `GET /api/admin/codes/batches/:id`：详情 + 码列表（按 status 分页），码字段返回 `code_preview` 脱敏

### T4.4 批次 CSV 导出
- [ ] `GET /api/admin/codes/batches/:id/export`
  - 逐行流式 res.write（避免大批次一次性占内存）
  - 行格式：`明文激活码,类型,状态,激活用户名,激活时间,生成时间`
  - Header: `Content-Disposition: attachment; filename="batch-{batch_no}.csv"`
  - 加 BOM `\ufeff` 让 Excel 正确识别 UTF-8

### T4.5 作废激活码
- [ ] `POST /api/admin/codes/void`：批量作废 unused
- [ ] 校验：拒绝 status != 'unused' 的码
- [ ] 写 admin_log + 更新 batch.void_count

### T4.6 激活记录查询
- [ ] `GET /api/admin/codes/redemptions`：分页 + 过滤 user_id / batch_id / 时间范围

### T4.7 停用 / 恢复用户会员
- [ ] `POST /api/admin/users/:id/membership/disable` 设 vip_status=0
- [ ] `POST /api/admin/users/:id/membership/enable` 恢复
- [ ] 写 admin_log

### T4.8 客服信息维护
- [ ] `GET /api/admin/system/contact`
- [ ] `PUT /api/admin/system/contact`（接收 qq、wechat、notice）
- [ ] `POST /api/admin/system/contact/qrcode`（multipart 上传二维码到 backend/uploads/contact/）
  - 注意：admin-backend 上传到 user backend 共用的 uploads 目录（路径 `/www/wwwroot/xs.momofx.cn/backend/uploads/contact/`），生产环境二者共用一个 uploads
  - 本地开发时 admin-backend 也写到 `backend/uploads/contact/`

### T4.9 admin-frontend 路由 / nginx 反代准备
- [ ] 检查 admin-frontend 是否已部署在 xs.momofx.cn 子路径或独立子域名
  - 现有 ecosystem 显示 admin-backend PM2 在跑 8001 端口
  - 需要确认 admin-frontend 当前怎么访问，本任务可能需要 nginx 配置补充

---

## 流 3 — 用户端前端（依赖流 2）

### T3.1 会员 store
- [ ] 新增 `ai-xsread-vue3/src/stores/membership.js`
  - state: `level / expiresAt / isActive / daysRemaining / isPermanent`
  - actions: `fetch()`、`activate(code)`
  - 在 userStore.isLogin 变 true 时自动 fetch

### T3.2 API 封装
- [ ] 新增 `ai-xsread-vue3/src/api/membership.js`
  - `getMembership() / activateCode(code) / getContact()`

### T3.3 公共组件
- [ ] `components/membership/MembershipBadge.vue` 等级徽章（月卡 / 年卡 / 永久 / 普通）
- [ ] `components/membership/ActivateForm.vue` 16 位输入框（自动分组、自动转大写、粘贴智能裁剪）
- [ ] `components/membership/MembershipWall.vue` 会员墙（含权益、激活按钮、客服 CTA）
- [ ] `components/membership/ContactCard.vue` 客服信息（QQ / 微信 / 二维码）
- [ ] `components/membership/Countdown.vue` 到期倒计时（小于 7 天显示红色警告）

### T3.4 个人中心新增"会员中心"
- [ ] `views/MembershipPage.vue`
- [ ] 路由 `/profile/membership`，meta.requiresAuth=true
- [ ] 内容：当前会员状态卡片 + 激活表单 + 三档介绍 + 客服卡片
- [ ] ProfilePage 加"会员中心"快捷入口

### T3.5 注册页激活码可选字段
- [ ] 修改 `views/RegisterPage.vue`：底部加可折叠的"我有激活码"区
- [ ] 注册成功后根据后端 `activation_status` 弹 toast：
  - success：欢迎成为月卡/年卡/永久会员
  - failed：注册成功但激活码失败：{原因}，可在个人中心重试
  - not_provided：欢迎加入

### T3.6 详情页 VIP 角标
- [ ] 修改 `views/NovelDetailPage.vue`：novel.is_vip=1 时显示"VIP 会员"角标
- [ ] 非会员点"开始阅读"也允许进入（试读会承担拦截）；按钮文案保持"开始阅读"

### T3.7 阅读页会员墙
- [ ] 修改 `views/ReadingPage.vue`：检测响应中的 `vip_required + truncated`
- [ ] 触发后：
  - 在内容底部覆盖 MembershipWall 组件（淡入 + 半透明渐变）
  - 滚动锁定到截断点
  - 已登录用户：墙内提供激活表单（直接激活成功后刷新内容）
  - 游客：墙内"立即登录" + "注册即可激活"按钮

### T3.8 会员墙 → 激活成功 → 自动重读章节
- [ ] 激活成功后 emit('activated')，ReadingPage 重新拉取章节内容并解锁

### T3.9 个人中心倒计时
- [ ] ProfilePage 在已登录态卡片显示：
  - 普通用户："开通会员"小按钮
  - 月卡 / 年卡 < 7 天：红色提示 "还剩 X 天，前往续费"
  - 月卡 / 年卡 ≥ 7 天：灰色提示 "{level} · 还剩 X 天"
  - 永久："永久会员"金色徽章

---

## 流 5 — 管理后台前端（依赖流 4）

### T5.1 admin-frontend API 封装
- [ ] `admin-frontend/src/api/code.js`：批次 CRUD、码作废、导出、激活记录
- [ ] `admin-frontend/src/api/system.js`：客服信息

### T5.2 激活码管理菜单
- [ ] 路由 `/codes/batches`、`/codes/batches/:id`、`/codes/redemptions`
- [ ] 侧边栏菜单项

### T5.3 批次列表页
- [ ] 表格列：批次号 / 类型 / 总数 / 已用 / 作废 / 剩余 / 创建人 / 创建时间 / 操作
- [ ] 操作：详情 / 导出 CSV
- [ ] 支持搜索 + 类型过滤

### T5.4 新建批次弹窗
- [ ] 表单：类型（下拉）、数量（input）、备注（input）
- [ ] 数量 > 100 时弹二次确认
- [ ] 提交后在弹窗里展示生成结果（明文码列表 + 一键复制 + 立即下载 CSV 按钮）
- [ ] 关闭弹窗时再次提示"码只展示这一次，记得保存"

### T5.5 批次详情页
- [ ] 顶部统计卡片
- [ ] 码列表表格：脱敏码、状态、激活用户、激活时间
- [ ] 多选 → 批量作废按钮
- [ ] 右上角"导出 CSV"按钮

### T5.6 激活记录查询页
- [ ] 表格 + 过滤器（用户名搜索 / 批次过滤 / 时间范围）

### T5.7 用户管理页扩展
- [ ] 列表新增"会员状态"列（普通 / 月卡剩 X 天 / 年卡剩 X 天 / 永久 / 已停用）
- [ ] 新增操作列按钮："停用会员" / "恢复会员"
- [ ] 弹窗确认 + reason 输入

### T5.8 系统设置 → 客服信息
- [ ] 新页面 `/system/contact`
- [ ] 表单：QQ、微信、提示文案、二维码上传
- [ ] 上传二维码用 multipart，后端会写到 backend/uploads/contact/ 并返回相对路径

### T5.9 小说管理页扩展
- [ ] 既有小说列表加"VIP"开关列
- [ ] 编辑表单加 `is_vip` 切换
- [ ] 批量勾选 → 批量设 VIP / 取消 VIP

---

## 流 6 — 测试 / 上线 / 文档

### T6.1 本地端到端测试
- [ ] 起 backend / admin-backend / ai-xsread-vue3 / admin-frontend 四个服务
- [ ] 跑一次手动用例矩阵（见 requirements §8）
- [ ] 用 Playwright 写一个新版 audit 脚本（参考之前的 tmp-audit-user.mjs）
  - 覆盖会员激活完整链路
  - 覆盖 VIP 书匿名 / 会员 / 过期会员的内容长度差异

### T6.2 增量上线
- [ ] 先 `python backend/scripts/deploy.py --backend`（数据库迁移会自动跑）
- [ ] 等后端就绪后部署 admin-backend（按现有 ecosystem PM2 流程）
- [ ] 部署 ai-xsread-vue3：`python backend/scripts/deploy.py --frontend`
- [ ] 部署 admin-frontend
- [ ] 服务器上手动跑：
  - 用 admin 创建一个测试批次（5 个月卡）
  - 用普通用户激活其中 1 个
  - 验证 VIP 书全文可读
  - 验证客服信息显示

### T6.3 文档
- [ ] 写交付报告 `docs/AI完成后报告文档/2026-05-17-会员体系交付报告.md`
- [ ] 更新 `docs/项目总文档/2026-05-17-项目现状总览.md`，加会员体系章节
- [ ] 在 `AGENTS.md` 加一节"会员体系运营手册"，说明：
  - 如何登录后台生成码
  - 如何作废
  - 如何调整 VIP 书
  - 如何处理客服疑问

### T6.4 Git 提交
- [ ] 多次提交：每条流一个 commit，提交信息中文 + 多行
- 推荐分支：`feat/membership-system`，全部完成后合并 main

---

## 时间预估

| 流 | 估算工时 |
|---|---|
| 流 1 数据库 + 工具 | 3-4 小时 |
| 流 2 用户端 API | 4-5 小时 |
| 流 3 用户端前端 | 6-8 小时 |
| 流 4 管理后台 API | 5-6 小时 |
| 流 5 管理后台前端 | 5-7 小时 |
| 流 6 测试 + 上线 | 2-3 小时 |
| **合计** | **25-33 小时**（一个工作日 8 小时算约 4 天） |

如果只做 MVP（先不做停用会员、不做客服管理后端、不做 VIP 切换批量操作），可压缩到约 16 小时。

---

## 上线前检查清单

- [ ] 数据库迁移在生产顺利执行（看 deploy.py 日志中的"新应用 7 个迁移"）
- [ ] AES_KEY 在 production 与 admin-backend 一致（基于 JWT_SECRET）
- [ ] PM2 reload xsread-backend / xsread-admin-backend 正常
- [ ] /api/user/membership 200
- [ ] /api/system/contact 200（即便客服信息为空）
- [ ] 后台生成 1 个月卡测试通
- [ ] 前端 ProfilePage、ReadingPage、NovelDetailPage 三个 VIP 触点测试通
- [ ] 限流：手动连续激活 6 次第 6 次返回 429
