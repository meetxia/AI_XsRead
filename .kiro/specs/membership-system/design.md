# 会员体系 — 技术设计

> 文档日期：2026-05-17  
> 配套：requirements.md、tasks.md

## 1. 数据库设计

### 1.1 修改既有表

```sql
-- 用户表加会员字段
ALTER TABLE users
  ADD COLUMN vip_level TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 普通 1 月卡 2 年卡 3 永久',
  ADD COLUMN vip_expires_at DATETIME NULL COMMENT '会员到期时间；永久会员设 2099-12-31 23:59:59',
  ADD COLUMN vip_status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 正常 0 被管理员停用',
  ADD INDEX idx_vip_expires (vip_expires_at);

-- 小说表加 VIP 标记
ALTER TABLE novels
  ADD COLUMN is_vip TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 免费 1 VIP（整本）',
  ADD INDEX idx_is_vip (is_vip);
```

### 1.2 新增表

```sql
-- 激活码批次
CREATE TABLE code_batches (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_no        VARCHAR(32) NOT NULL COMMENT '业务批次号 B20260517-001',
  name            VARCHAR(120) NULL COMMENT '备注',
  code_type       ENUM('monthly','yearly','permanent') NOT NULL,
  duration_days   INT NOT NULL COMMENT '本批次每张码激活后的天数；永久=99999',
  total_count     INT UNSIGNED NOT NULL,
  used_count      INT UNSIGNED NOT NULL DEFAULT 0,
  void_count      INT UNSIGNED NOT NULL DEFAULT 0,
  created_by      INT UNSIGNED NOT NULL COMMENT 'admin_users.id',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_batch_no (batch_no),
  KEY idx_created_at (created_at),
  KEY idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='激活码批次';

-- 激活码本体
CREATE TABLE activation_codes (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_id          INT UNSIGNED NOT NULL,
  code_encrypted    VARBINARY(255) NOT NULL COMMENT 'AES-256-GCM 加密',
  code_lookup_hash  CHAR(64) NOT NULL COMMENT 'SHA-256(明文)，定位用',
  code_preview      CHAR(8) NOT NULL COMMENT '前 4 + 后 4，用于后台列表脱敏展示',
  code_type         ENUM('monthly','yearly','permanent') NOT NULL,
  duration_days     INT NOT NULL,
  status            ENUM('unused','used','void') NOT NULL DEFAULT 'unused',
  used_by           INT UNSIGNED NULL COMMENT 'users.id',
  used_at           DATETIME NULL,
  void_at           DATETIME NULL,
  void_by           INT UNSIGNED NULL COMMENT 'admin_users.id',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_lookup (code_lookup_hash),
  KEY idx_batch (batch_id),
  KEY idx_status (status),
  KEY idx_used_by (used_by),
  CONSTRAINT fk_codes_batch FOREIGN KEY (batch_id) REFERENCES code_batches(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='激活码';

-- 激活记录（即便 codes.used 也能查），加 IP/UA 便于风控审计
CREATE TABLE code_redemption_logs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code_id     INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  vip_level_before TINYINT(1) NOT NULL,
  vip_level_after  TINYINT(1) NOT NULL,
  expires_before   DATETIME NULL,
  expires_after    DATETIME NULL,
  channel     ENUM('register','profile','reading_wall') NOT NULL,
  ip          VARCHAR(64) NULL,
  user_agent  VARCHAR(255) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
  KEY idx_code (code_id),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='激活记录';

-- 管理员操作日志（生成、作废、停用会员）
CREATE TABLE code_admin_logs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id    INT UNSIGNED NOT NULL,
  action      VARCHAR(40) NOT NULL COMMENT 'generate_batch / void_codes / disable_member / enable_member / update_contact',
  target      VARCHAR(120) NULL COMMENT '目标对象，如 batch_id / user_id',
  detail      JSON NULL,
  ip          VARCHAR(64) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin (admin_id),
  KEY idx_action (action),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志';

-- 客服联系信息（单行表）
CREATE TABLE system_contact (
  id            TINYINT UNSIGNED NOT NULL DEFAULT 1,
  qq            VARCHAR(40) NULL,
  wechat        VARCHAR(40) NULL,
  qrcode_url    VARCHAR(255) NULL COMMENT '二维码图片相对路径 /uploads/contact/xxx.png',
  notice        VARCHAR(255) NULL COMMENT '提示文案，如"工作时间 9:00-22:00"',
  updated_by    INT UNSIGNED NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客服联系';

INSERT INTO system_contact (id) VALUES (1) ON DUPLICATE KEY UPDATE id = id;
```

### 1.3 迁移文件命名

按现有项目惯例：

```
backend/database/migrations/
  202605171100__user_membership_fields.sql
  202605171101__novel_is_vip.sql
  202605171102__create_code_batches.sql
  202605171103__create_activation_codes.sql
  202605171104__create_code_redemption_logs.sql
  202605171105__create_code_admin_logs.sql
  202605171106__create_system_contact.sql
```

## 2. 激活码生成与加密

### 2.1 字符集

```js
// backend/src/utils/codeGenerator.js
const CHARSET = 'ACDEFGHJKLMNPQRSTUVWXYZ234567'; // 去掉 O 0 I 1 B 8 共 29 个安全字符
const CODE_LENGTH = 16;
```

注：实际选 29 字符（不是 30），便于 16 位生成有 29^16 ≈ 1.5e23 种组合，碰撞概率可忽略。

### 2.2 生成

```js
const crypto = require('crypto');

function generateCode() {
  let out = '';
  const bytes = crypto.randomBytes(CODE_LENGTH);
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CHARSET[bytes[i] % CHARSET.length];
  }
  return out; // 形如 K7H2P3MX9YRT4QFW
}

function formatForDisplay(plain) {
  return plain.match(/.{4}/g).join('-'); // K7H2-P3MX-9YRT-4QFW
}

function normalizeInput(input) {
  return String(input).replace(/[\s-]/g, '').toUpperCase();
}
```

### 2.3 加密

```js
// backend/src/utils/codeCrypto.js
const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

function getKey() {
  const secret = process.env.JWT_SECRET || '';
  if (!secret) throw new Error('JWT_SECRET not set');
  return crypto.createHash('sha256').update(secret + ':activation-code').digest(); // 32 bytes
}

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // 存储格式：iv(12) || tag(16) || ciphertext
  return Buffer.concat([iv, tag, enc]);
}

function decrypt(buf) {
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const enc = buf.slice(28);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

function lookupHash(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}
```

### 2.4 批次号

```js
function generateBatchNo() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // 当日序号在事务里查 MAX(seq) + 1
  return `B${today}-${seq.toString().padStart(3, '0')}`;
}
```

## 3. 业务流程

### 3.1 激活流程

```
POST /api/user/membership/activate { code }

1. 标准化 code（去空格/去-/转大写）
2. 长度校验：必须正好 16 位
3. 计算 lookup_hash
4. 查 activation_codes WHERE code_lookup_hash = ? AND status = 'unused'
   → 找不到：返回 404 "激活码无效或已使用"
5. 开事务：
   a. 更新 codes.status = 'used', used_by, used_at
   b. 更新 batch.used_count + 1
   c. 读 user 当前 vip_level / vip_expires_at / vip_status
   d. 计算新过期时间 / 等级（按 R-2 表）
   e. 如果 vip_level=3 永久 → 拒绝（返回 409 "您已是永久会员"，撤销 a/b 步）
   f. 更新 user 记录
   g. 写 redemption_log
6. 提交事务
7. 返回新会员状态
```

### 3.2 续期等级计算

```js
function computeNewMembership(currentLevel, currentExpiresAt, codeType, durationDays) {
  if (currentLevel === 3) {
    throw new MembershipConflictError('您已是永久会员，无需激活');
  }

  if (codeType === 'permanent') {
    return {
      vip_level: 3,
      vip_expires_at: '2099-12-31 23:59:59'
    };
  }

  const now = new Date();
  const base = currentExpiresAt && currentExpiresAt > now ? new Date(currentExpiresAt) : now;
  base.setDate(base.getDate() + durationDays);

  const codeLevel = codeType === 'yearly' ? 2 : 1;
  return {
    vip_level: Math.max(currentLevel, codeLevel),
    vip_expires_at: base
  };
}
```

### 3.3 VIP gating

```js
// backend/src/services/membershipService.js
async function isMember(userId) {
  if (!userId) return false;
  const [rows] = await pool.query(
    'SELECT vip_level, vip_expires_at, vip_status FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) return false;
  const u = rows[0];
  if (u.vip_status === 0) return false; // 被停用
  if (u.vip_level === 3) return true;
  if (!u.vip_expires_at) return false;
  return new Date(u.vip_expires_at) > new Date();
}
```

读章节内容时：

```js
async function getChapterContent(chapterId, userId) {
  const chapter = await loadChapterRaw(chapterId);
  const novel = await loadNovel(chapter.novel_id);

  if (!novel.is_vip) return chapter; // 免费书直接全文

  if (await isMember(userId)) return chapter;

  // 非会员：截断试读
  const TRIAL_LENGTH = 1500;
  if (chapter.content.length > TRIAL_LENGTH) {
    return {
      ...chapter,
      content: chapter.content.slice(0, TRIAL_LENGTH),
      truncated: true,
      trial_length: TRIAL_LENGTH,
      vip_required: true
    };
  }
  return { ...chapter, truncated: false, vip_required: true };
}
```

### 3.4 限流

复用现有 `writeRateLimiter`，在 `/api/user/membership/activate` 路由上挂一个**自定义限流配置**：

```js
const activateLimiter = createWriteRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 小时
  maxWrites: 5,
  // 按用户 ID 限流，匿名按 IP（虽然激活接口需要登录）
});
```

### 3.5 注册时激活（事务无关）

```
POST /api/auth/register { ..., activation_code? }

1. 创建用户（始终成功，假设其他字段都合法）
2. 如果传了 activation_code：
   a. 调激活逻辑
   b. 失败不报错，把错误信息附在响应的 activation_warning 字段
3. 返回登录态 + activation_status
```

## 4. API 详细规格

### 4.1 用户端

#### GET /api/user/membership

```json
{
  "code": 200,
  "data": {
    "vip_level": 1,
    "vip_level_label": "月卡会员",
    "vip_expires_at": "2026-06-17T00:00:00.000Z",
    "days_remaining": 30,
    "is_active": true,
    "is_permanent": false,
    "vip_status": 1
  }
}
```

匿名用户调用：返回 401（前端可以用 isLogin 判断不发请求）。

#### POST /api/user/membership/activate

请求：`{ "code": "K7H2-P3MX-9YRT-4QFW" }`（也接受 `K7H2P3MX9YRT4QFW`）

响应（成功）：

```json
{
  "code": 200,
  "message": "激活成功",
  "data": {
    "vip_level": 1,
    "vip_level_label": "月卡会员",
    "vip_expires_at": "2026-06-17T00:00:00.000Z",
    "days_added": 30
  }
}
```

错误码：
- 400：格式错误
- 401：未登录
- 404：激活码无效或已使用
- 409：已是永久会员
- 429：尝试过于频繁

#### GET /api/system/contact （公开）

```json
{
  "code": 200,
  "data": {
    "qq": "123456789",
    "wechat": "wxxxx",
    "qrcode_url": "/uploads/contact/qr.png",
    "notice": "客服在线时间 9:00-22:00"
  }
}
```

### 4.2 admin 端

挂在 `admin-backend`（端口 8001）。

#### POST /api/admin/codes/batches

```json
{
  "code_type": "monthly",
  "count": 100,
  "name": "2026-05 双 11 营销"
}
```

响应：

```json
{
  "code": 200,
  "data": {
    "batch": {
      "id": 1,
      "batch_no": "B20260517-001",
      "code_type": "monthly",
      "total_count": 100,
      "created_at": "..."
    },
    "codes": [
      "K7H2-P3MX-9YRT-4QFW",
      "..."
    ]
  }
}
```

注：`codes` 字段**只在生成时一次性返回**，提示前端"务必导出保存"，下次列表只能看到 `code_preview` 脱敏版。
（但通过 export 接口也可以再次拿明文，因为加密可逆。）

#### GET /api/admin/codes/batches

分页列表，返回每个批次的统计（total / used / void / 剩余）。

#### GET /api/admin/codes/batches/:id

详情：基本信息 + 激活码列表（脱敏 `K7H2…4QFW` 形式 + 状态）

#### GET /api/admin/codes/batches/:id/export

返回 `Content-Type: text/csv; charset=utf-8` 流式响应，列：

```csv
激活码,类型,状态,激活用户,激活时间,生成时间
K7H2-P3MX-9YRT-4QFW,月卡,unused,,,2026-05-17 22:00:00
```

#### POST /api/admin/codes/void

```json
{ "code_ids": [1, 2, 3], "reason": "测试码作废" }
```

只允许作废 status='unused' 的，已使用的拒绝。

#### GET /api/admin/codes/redemptions

分页查激活记录，可按 user_id / batch_id / start_date / end_date 过滤。

#### POST /api/admin/users/:id/membership/disable

设置 `vip_status = 0`，写日志。

#### POST /api/admin/users/:id/membership/enable

恢复（vip_status = 1）。

#### GET /api/admin/system/contact / PUT /api/admin/system/contact

上传二维码用 `multipart/form-data`，字段同 system_contact 结构。

## 5. 前端方案

### 5.1 用户端（ai-xsread-vue3）

- 新增 store：`stores/membership.js`，缓存 membership 状态、自动在 user.isLogin 时拉取
- 新增组件：
  - `components/membership/MembershipBadge.vue`：显示等级图标（月/年/永久）
  - `components/membership/MembershipWall.vue`：阅读墙
  - `components/membership/ActivateForm.vue`：激活码输入框（4-4-4-4 自动分组）
  - `components/membership/ContactCard.vue`：客服联系卡片
- 新增页面：`views/MembershipPage.vue` 个人中心 → 会员中心
- 修改：
  - `views/RegisterPage.vue` 增加可选激活码字段
  - `views/ReadingPage.vue` 检测 `vip_required + truncated` 切换会员墙
  - `views/NovelDetailPage.vue` 显示 VIP 角标
  - `views/ProfilePage.vue` 已登录态卡片显示会员状态

### 5.2 管理后台（admin-frontend）

- 侧边栏新增"激活码管理"主菜单：
  - 批次列表（含搜索、状态过滤）
  - 新建批次（弹窗或独立页）
  - 批次详情（含导出 CSV 按钮）
  - 激活记录查询
- 用户管理页加"会员状态"列 + "停用 / 启用会员"操作
- 系统设置 → 客服联系（编辑 QQ/微信/二维码）

## 6. 安全与权限

- 激活码生成接口在 admin-backend，复用现有 admin auth 中间件
- 用户激活接口加 activateLimiter（5 次/小时）
- 全局 rate limit 已经在前一轮调到 600/15min，激活码相关 API 不受影响
- AES key 来自 `JWT_SECRET`，生产 .env 已是强随机
- AES 输出存 VARBINARY，不可被 SELECT 文本工具误展示
- 激活码原文只在三处出现：
  1. 生成接口的响应体（一次）
  2. 后台导出 CSV（按需）
  3. 激活时用户输入对照（hash 比对，不读原文）

## 7. 测试用例

### 7.1 后端单元测试
- 续期算法 12 种组合（2 种激活码类型 × 6 种当前状态）
- AES 加密解密回环
- 激活码生成不重复（生成 1 万个查 lookup_hash 唯一）

### 7.2 集成测试
- 完整激活流程
- 重复激活（第二次返回 404）
- 永久会员尝试激活月卡（返回 409）
- 限流触发（同用户 6 次激活返回 429）

### 7.3 端到端
- 游客打开 VIP 书 → 1500 字试读
- 登录后激活 → 立即解锁全文
- 注册时激活 → 注册成功且立即是会员
- admin 生成 100 个 → 导出 → 重新生成同名批次失败（unique 约束）

## 8. 部署影响

- 数据库迁移自动执行（已有 runPendingMigrations 机制）
- 不需要新增 PM2 进程
- admin-backend 需要重启加载新路由
- 前端 ai-xsread-vue3 + admin-frontend 都要 build 重新部署
- 客服二维码需要写到 backend/uploads/contact/，nginx 已经把 /uploads/* 暴露
