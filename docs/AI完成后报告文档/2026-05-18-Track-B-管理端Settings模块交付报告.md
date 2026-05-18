# Track B 管理端 Settings 系统设置模块交付报告

文档日期：2026-05-18
分支：main
负责人：Track B AI 全栈助手
关联任务：管理端系统设置模块全链路（后端 API + 前端页面）

## 一、完成内容概览

补齐了 admin 端"系统设置"模块的全链路：
- 复用用户后端数据库表 `system_config`（无需新建迁移），新增 4 个 admin REST 接口完成 CRUD。
- 重写 `admin-frontend` 的 Settings 页面，使用 Element Plus Tabs 区分"基础设置"与"联系方式"两个子页。
- 沿用 admin-backend 现有的 `Response` 工具、`authMiddleware` / `adminMiddleware` 鉴权、`code_admin_logs` 审计日志、`mysql2/promise` 连接池，与既有约定一致。

## 二、涉及文件

后端（admin-backend）
- 新建 `admin-backend/src/controllers/configController.js`（259 行）：getAllConfigs / getConfigByKey / updateConfig / batchUpdateConfigs，事务批量 upsert，写 code_admin_logs。
- 修改 `admin-backend/src/routes/system.js`（system.js:1-25）：在 contact 之后挂载 `/configs` 系列路由，写操作走 adminMiddleware。

前端（admin-frontend）
- 新建 `admin-frontend/src/api/system.js`（68 行）：getAllConfigs / getConfigByKey / updateConfig / batchUpdateConfigs / getContact / updateContact / uploadContactQrcode，沿用 `@/utils/request` 风格。
- 重写 `admin-frontend/src/views/Settings/index.vue`（536 行）：双 Tab 表单（基础设置、联系方式）+ 校验 + 二维码上传。

未触动的边界文件：用户前端、`backend/`、其他 admin 模块、Dashboard、Analytics 等控制器，全部未改动。也未新增数据库迁移（按指令复用现有表）。

## 三、API 清单

所有接口前缀 `/api`（admin-backend 8001 端口），需 `Authorization: Bearer <admin_token>`。

| Method | Path | 鉴权 | 入参 | 返回 |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/system/configs` | authMiddleware | 无 | `{ code, data: { list: [{key,value,description,type,updated_at}], map: {key:value} } }` |
| GET | `/api/admin/system/configs/:key` | authMiddleware | path:key | `{ code, data: {key,value,description,type,updated_at} }`，404 表示不存在 |
| PUT | `/api/admin/system/configs/:key` | adminMiddleware | body:`{value, description?, type?}` | `{ code:200, data: 单条最新配置 }` |
| PUT | `/api/admin/system/configs` | adminMiddleware | body:`{configs:[{key,value,description?,type?}]}` 单次 ≤100 项 | `{ code:200, data:{list,updated} }` |

存量复用：`GET/PUT /api/admin/system/contact` 与 `POST /api/admin/system/contact/qrcode`（既有 ContactController，保留不变）。

校验细节：key 限制 `^[A-Za-z0-9_.-]+$`、长度 ≤100；type 仅允许 string/number/boolean/json；批量接口走事务，失败回滚。

## 四、测试与验证

1) `admin-frontend` 构建：当前会话内 Bash 工具被环境拒绝（"Permission to use Bash has been denied"），未能跑 `npm run build`。已对 .vue / .js 进行人工检查：
   - 所有 import（`vue`、`element-plus`、`@element-plus/icons-vue`、`@/api/system`、`@/utils/request`）均在 package.json/项目内已存在；
   - Element Plus 组件 `el-tabs/el-tab-pane/el-form/el-input/el-input-number/el-switch/el-upload/el-icon/el-card/el-button` 在 admin-frontend 其他视图（如 NovelEdit.vue）中已大量使用，类型与版本（2.11.5）兼容；
   - `<script setup>` 语法、`reactive`/`ref`/`onMounted` 用法与 dashboard 等模块一致。
   建议 PM 在本机执行：`cd admin-frontend && npm run build`，预期通过。

2) `admin-backend` 接口冒烟：同样受 Bash 限制未能启动。可在本机执行：
   ```
   cd admin-backend && npm run dev
   curl -H "Authorization: Bearer <token>" http://localhost:8001/api/admin/system/configs
   curl -X PUT -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
        -d '{"configs":[{"key":"site_name","value":"文字之城","type":"string"}]}' \
        http://localhost:8001/api/admin/system/configs
   ```
   静态校验：`system_config` 表结构在 `backend/database/init_step1.sql:109-118` 已定义；`key` 列做了反引号包裹（保留字处理）；事务使用 `conn.beginTransaction/commit/rollback`，符合 mysql2/promise 用法。

3) 手动验收清单（PM 执行）：
   - admin 前端登录 → 侧边栏进入"系统设置" → 看到两个 Tab；
   - 基础设置 Tab：编辑站点名称、上传上限 MB 等字段，点击"保存基础设置" → 提示成功；刷新页面，值保持；
   - 联系方式 Tab：填 QQ/微信/公告，点击"保存联系方式" → 成功；上传 PNG 二维码，预览出现，且数据库 system_contact.qrcode_url 写入；
   - 校验：站点名称留空 → 报错；QQ 输入字母 → 报错；上传 3MB 图片 → 前端拦截。

## 五、已知问题与限制

- 因当前会话 Bash 工具不可用，未能跑 `npm run build` 与 curl 冒烟。所有改动均经过人工对照，未发现明显语法或 import 问题。
- `system_config.value` 字段为 TEXT，前端目前对 boolean/number 进行字符串化序列化（`true/false`、整数字符串）；如果后续需要存 JSON 配置，已支持 type=json，但 UI 暂未提供 JSON 编辑器。
- 没有为 `enable_register` 等做"实际生效"对接（如禁用注册接口），本期只做存储与展示。

## 六、后续建议

- 在用户前端读取 `site_name` / `announcement` 等配置（可在 backend 提供公开 GET 接口或在 SSR 注入），目前用户端仍是硬编码。
- 把 `enable_register` / `enable_comment` 真正下沉到对应中间件（注册接口、评论接口），形成开关闭环。
- 增加单元测试（Jest 或 supertest）覆盖 configController 的事务回滚与权限校验。
- 加一个"重置为默认值"按钮，写入 init_step1.sql 中的预设数据。

## 七、关键证据（file:line）

- 后端控制器：`admin-backend/src/controllers/configController.js:1-259`
- 后端路由：`admin-backend/src/routes/system.js:19-23`
- 数据表定义：`backend/database/init_step1.sql:109-118` 与默认数据 `:222-229`
- 前端 API：`admin-frontend/src/api/system.js:1-69`
- 前端页面：`admin-frontend/src/views/Settings/index.vue:1-536`
- 鉴权中间件：`admin-backend/src/middlewares/auth.js:1-58`
- 统一响应：`admin-backend/src/utils/response.js:1-50`
