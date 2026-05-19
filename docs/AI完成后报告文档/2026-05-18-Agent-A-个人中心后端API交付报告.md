---
最后更新日期: 2026-05-19
Track: Agent A
范围: 个人中心 MVP 后端 API + 数据库迁移
设计依据: docs/superpowers/specs/2026-05-18-profile-center-mvp-design.md
---

# Agent A — 个人中心后端 API 交付报告

## 一、完成内容

按设计文档 §3.3 / §3.4 / §3.5 范围实现以下后端能力：

1. `getUserStatistics` 响应补 `joinDays`（基于 `users.created_at` 即时计算，不入库）
2. 用户阅读偏好 `GET /api/user/preferences` / `PUT /api/user/preferences`
3. 通知中心 4 接口 `GET /api/notifications`、`GET /api/notifications/unread-count`、`POST /api/notifications/:id/read`、`POST /api/notifications/read-all`
4. 两份新迁移：`user_preferences` 表 / `notifications` 表（含全量用户欢迎种子数据）
5. Jest 单测两份，覆盖正常路径、参数校验失败、越权防护、DB 异常、模块加载

不在本次范围（已由其它 Track 完成或属于其它 Agent）：

- `authController.changePassword` 与 `routes/auth.js`（Track A）
- `userController.js` 中除 `getUserStatistics` 外的其它函数
- 现有迁移文件（仅新增，未重命名也未修改）
- 前端 (`ai-xsread-vue3/`) 与管理端 (`admin-*`) 任何文件
- `app.js`（保留 Track D 启动钩子）

## 二、涉及文件清单

### 新增

| 文件 | 关键说明 |
|---|---|
| `backend/src/controllers/preferenceController.js` | 偏好控制器；`validateAndNormalize` L66-114；`getMyPreferences` L124-156；`updateMyPreferences` L165-237；`__test__` 暴露 L243-249 |
| `backend/src/controllers/notificationController.js` | 通知控制器；`rowToDto` L23-34；`list` L40-79；`unreadCount` L84-95；`markRead`（含越权校验） L102-131；`markAllRead` L136-148 |
| `backend/src/routes/notifications.js` | 通知路由；`router.use(authenticate)` L21；4 条路由 L24-32 |
| `backend/database/migrations/202605180001__add-user-preferences-table.sql` | `user_preferences` 建表（IF NOT EXISTS） |
| `backend/database/migrations/202605180002__add-notifications-table.sql` | `notifications` 建表 + 全量用户欢迎种子（NOT EXISTS 守卫，幂等） |
| `backend/tests/controllers/preferenceController.test.js` | preferences 单测，覆盖校验/读默认/更新/校验失败/DB 异常/空 body |
| `backend/tests/controllers/notificationController.test.js` | notifications 单测，覆盖列表/分页上限/未读计数/越权/重复已读/markAllRead/DB 异常 |

### 改动

| 文件 | 关键行号 | 修改 |
|---|---|---|
| `backend/src/controllers/userController.js` | L548-558（新增 joinDays SQL）/ L560-561（响应字段） | `getUserStatistics` 增加 `DATEDIFF(NOW(), users.created_at)` 计算并写入响应顶层 `joinDays` |
| `backend/src/routes/user.js` | L6（require preferenceController）/ L65-67（挂 GET/PUT preferences） | 在 `authenticate` 已 `router.use` 的前提下挂偏好读写 |
| `backend/src/routes/index.js` | L19（require）/ L82（注册前缀） | 挂 `${API_PREFIX}/notifications` |

## 三、契约说明

所有响应沿用 `{ code, message, data, timestamp }` 格式（`utils/response.js`）。

### `GET /api/user/statistics`

新增字段：`data.joinDays:number`（与现有字段并列于 data 顶层，不破坏其它字段）。

### `GET /api/user/preferences`

```json
{
  "code": 200,
  "data": {
    "fontSize": 16,
    "lineHeight": 1.8,
    "theme": "cream",
    "pageMode": "scroll",
    "eyeProtection": false
  }
}
```

无记录时自动写入默认值后返回（INSERT … ON DUPLICATE KEY UPDATE 幂等）。

### `PUT /api/user/preferences`

请求体接受任意子集；服务端仅更新出现的字段，其它保持原值。

校验规则：

- `fontSize` 整数 12–24
- `lineHeight` 数值 1.4–2.2（自动归一到 1 位小数）
- `theme` ∈ {cream, night, eye}
- `pageMode` ∈ {scroll, page}
- `eyeProtection` 接受布尔 / 0 / 1 / "true" / "false"

任一字段非法 → 400，且不写库。

### `GET /api/notifications`

Query：`page`（默认 1）、`pageSize`（默认 20，最大 100）、`onlyUnread`（0|1）。

```json
{
  "code": 200,
  "data": {
    "list": [
      { "id": 1, "type": "system", "title": "...", "content": "...", "link": null, "isRead": false, "createdAt": "...", "readAt": null }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

排序策略：未读优先，再按 `created_at DESC, id DESC`。

### `GET /api/notifications/unread-count`

```json
{ "code": 200, "data": { "count": 3 } }
```

### `POST /api/notifications/:id/read`

校验 `notifications.user_id = req.user.id` 防越权；通知不存在或属于他人 → 404；已读 → 直接返回 200 不重复写。

### `POST /api/notifications/read-all`

```json
{ "code": 200, "data": { "affected": 7 } }
```

## 四、安全 / 边界

- 所有偏好与通知接口均挂在 `authenticate` 之后（preferences 借 `routes/user.js` 顶部 `router.use(authenticate)`；notifications 在 `routes/notifications.js` 顶部 `router.use(authenticate)`）。
- 写接口（`PUT /preferences`、`POST /:id/read`、`POST /read-all`）走项目现有 `writeRateLimiter`，与书架/书签等写接口一致。
- `markRead` 先 `SELECT ... AND user_id = ?` 校验所属，再 UPDATE，杜绝越权读他人通知。
- 通知中心 SQL 子句一律带 `user_id = ?`，避免索引误用其它用户的数据。
- 偏好 `lineHeight` DECIMAL(3,1)：服务端归一为一位小数，避免精度漂移。

## 五、测试结果

| 项 | 状态 | 说明 |
|---|---|---|
| `node -c` 语法自检 | 未在沙箱执行 | 当前会话 Bash 不允许执行 `node`；已通过人工对照保证语法正确 |
| 迁移执行 (`mysql -u … < migration.sql`) | 未在沙箱执行 | 沙箱无 MySQL 客户端权限；建议运维或集成环境执行 |
| Jest 单测 | 已编写（未在沙箱运行） | `tests/controllers/preferenceController.test.js`、`tests/controllers/notificationController.test.js`，使用 `jest.mock` 拦截 `pool.query`，理论上 0 依赖 MySQL，可直接 `npm test` 运行 |

单测覆盖矩阵：

| 控制器 | 正常路径 | 参数校验失败 | 鉴权/越权 | DB 异常 |
|---|---|---|---|---|
| `preferenceController` | get / patch / 空 body 读 | fontSize 越界、lineHeight 越界、theme 白名单外、pageMode 白名单外、eyeProtection 非法 | 通过 `req.user.id` 控制（mock res，无中间件） | get/update 均有 5xx 分支测试 |
| `notificationController` | list（含分页上限）、unreadCount、markRead 已读/未读、markAllRead | id 非整数 | 越权 → 404 | list/markAllRead 5xx 分支 |

## 六、已知问题 / 未解项

1. **没有跑迁移与 jest**：当前会话的 Bash 沙箱不允许执行 `node` 与 `mysql`，因此两份迁移与两份单测的"实际运行"未在本次完成。建议主线程或 CI 环境跑：
   - `mysql -u toefl_user -p ai_xsread < backend/database/migrations/202605180001__add-user-preferences-table.sql`
   - `mysql -u toefl_user -p ai_xsread < backend/database/migrations/202605180002__add-notifications-table.sql`
   - `cd backend && npm test -- tests/controllers/preferenceController.test.js tests/controllers/notificationController.test.js`
   迁移本身遵循 Track D `^(\d{12})__(.+)\.sql$` 命名规则，`migrate.js` 应可在启动时自动拾取。
2. **种子欢迎通知"幂等"基于 (user_id, type='system', title='欢迎来到 MOMO 小说') 的 NOT EXISTS 子查询**：若运营后续手动改这两个常量，重复执行迁移会再次插入；属于设计妥协，无强一致需求时可接受。
3. **偏好的 `users.id` 类型**：`init_step1.sql` 中是 `INT UNSIGNED`，但项目演进后已被 patch 升到 `BIGINT UNSIGNED`（设计文档 §3.4 明示）。本次新表 `user_preferences.user_id`、`notifications.user_id` 均使用 `BIGINT UNSIGNED`，与 BIGINT 升级后的 schema 对齐。如目标库仍是 INT UNSIGNED，建议在执行新迁移前先确认 `users.id` 类型，避免外键约束/隐式转换问题（这两张表未声明显式外键，仅靠应用层约束）。
4. **`writeRateLimiter` 默认窗 60s/30 次**：通知逐条已读在极端"全部已读"实现下需要点 N 次单条接口；本次提供了独立 `read-all` 端点，前端应优先使用，以避免触发限流。

## 七、curl 示例

```bash
TOKEN="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # 登录后拿到
HOST="http://localhost:8005"

# 1. 用户统计（验证 joinDays）
curl -s -H "Authorization: $TOKEN" "$HOST/api/user/statistics" | jq '.data.joinDays'

# 2. 读偏好（首次会自动写默认行）
curl -s -H "Authorization: $TOKEN" "$HOST/api/user/preferences"

# 3. 改偏好（部分字段）
curl -s -X PUT \
     -H "Authorization: $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"fontSize":18,"theme":"night","eyeProtection":true}' \
     "$HOST/api/user/preferences"

# 4. 通知列表（仅未读）
curl -s -H "Authorization: $TOKEN" \
     "$HOST/api/notifications?page=1&pageSize=20&onlyUnread=1"

# 5. 未读计数
curl -s -H "Authorization: $TOKEN" "$HOST/api/notifications/unread-count"

# 6. 单条已读（替换 :id 为真实通知 id）
curl -s -X POST -H "Authorization: $TOKEN" "$HOST/api/notifications/123/read"

# 7. 全部已读
curl -s -X POST -H "Authorization: $TOKEN" "$HOST/api/notifications/read-all"
```

## 八、文件路径速查（绝对路径）

- `e:/momo-ruanjiansheji/AI-XsRead/backend/src/controllers/preferenceController.js`
- `e:/momo-ruanjiansheji/AI-XsRead/backend/src/controllers/notificationController.js`
- `e:/momo-ruanjiansheji/AI-XsRead/backend/src/routes/notifications.js`
- `e:/momo-ruanjiansheji/AI-XsRead/backend/src/routes/user.js`（修改）
- `e:/momo-ruanjiansheji/AI-XsRead/backend/src/routes/index.js`（修改）
- `e:/momo-ruanjiansheji/AI-XsRead/backend/src/controllers/userController.js`（仅 `getUserStatistics` 行 L548-561 修改）
- `e:/momo-ruanjiansheji/AI-XsRead/backend/database/migrations/202605180001__add-user-preferences-table.sql`
- `e:/momo-ruanjiansheji/AI-XsRead/backend/database/migrations/202605180002__add-notifications-table.sql`
- `e:/momo-ruanjiansheji/AI-XsRead/backend/tests/controllers/preferenceController.test.js`
- `e:/momo-ruanjiansheji/AI-XsRead/backend/tests/controllers/notificationController.test.js`
