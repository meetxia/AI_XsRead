/**
 * Feature: membership-system / Flow 2
 * 集成测试：用户端会员 API
 *
 * 覆盖：
 *   1. GET  /api/user/membership            已登录返回 vip_level=0
 *   2. POST /api/user/membership/activate    成功激活后立即 GET 看到新到期日
 *   3. POST 激活已使用的码 → 404
 *   4. POST 永久会员再激活 → 409
 *   5. POST 第 6 次激活 → 429
 *   6. GET  /api/system/contact              公开可访问
 *
 * 与 novelStatus.test.js 一致：beforeAll 探测 MySQL，不可达时整个 suite 静默
 * 跳过；INTEGRATION_DB_REQUIRED=1 时强制要求 DB 必须可达。
 *
 * 默认 DB 选择：
 *   - tests/setup.js 会把 DB_DATABASE 指向 ai_xsread_test（若 TEST_DB_DATABASE 未设置）
 *   - 但流 1 的迁移只跑在 ai_xsread；为了 `npx jest tests/integration/membership.test.js`
 *     一条命令开箱即用，本文件在最顶端将 DB 默认指向 backend/.env 中的开发库（即 ai_xsread）
 *   - 任何 TEST_DB_* 环境变量仍会被尊重（CI 可强制使用独立测试库）
 */

// ---- 必须在 require app/config 之前设置好 DB 凭证 -----------------------
(() => {
  const path = require('path');
  const fs = require('fs');
  const dotenv = require('dotenv');
  let fileEnv = {};
  try {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      fileEnv = dotenv.parse(fs.readFileSync(envPath));
    }
  } catch (_) {
    // ignore
  }
  process.env.DB_HOST = process.env.TEST_DB_HOST || fileEnv.DB_HOST || '127.0.0.1';
  process.env.DB_PORT = process.env.TEST_DB_PORT || fileEnv.DB_PORT || '3306';
  process.env.DB_USER = process.env.TEST_DB_USER || fileEnv.DB_USER || 'root';
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || fileEnv.DB_PASSWORD || '';
  process.env.DB_DATABASE = process.env.TEST_DB_DATABASE || fileEnv.DB_DATABASE || 'ai_xsread';
  if (fileEnv.ACTIVATION_CODE_SECRET) {
    process.env.ACTIVATION_CODE_SECRET = fileEnv.ACTIVATION_CODE_SECRET;
  }
  // setup.js 已经强制写了一组 DB_*，上面覆盖完毕；此处确保不会再被覆盖
})();
// ----------------------------------------------------------------------

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = require('../../src/app');
const { pool } = require('../../src/config/database');
const config = require('../../src/config');

const codeGenerator = require('../../src/utils/codeGenerator');
const { encrypt, lookupHash } = require('../../src/utils/codeCrypto');

const DB_PROBE_TIMEOUT_MS = 1500;

async function probeIntegrationDatabase() {
  let connection;
  const probe = (async () => {
    connection = await pool.getConnection();
    await connection.query('SELECT 1');
    // 流 1 已迁移：activation_codes / code_batches / users.vip_level 必须存在
    await connection.query('SELECT 1 FROM activation_codes LIMIT 1');
    await connection.query('SELECT vip_level FROM users LIMIT 1');
    return { ok: true };
  })();

  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`数据库探测超时（>${DB_PROBE_TIMEOUT_MS}ms）`)),
      DB_PROBE_TIMEOUT_MS
    )
  );

  try {
    return await Promise.race([probe, timeout]);
  } catch (err) {
    return { ok: false, reason: err.message || String(err) };
  } finally {
    try {
      if (connection && typeof connection.release === 'function') {
        connection.release();
      }
    } catch (_) {
      // ignore
    }
  }
}

function signToken({ id, username = 'tester', role = 'user', email = 'tester@example.com' }) {
  return jwt.sign({ id, username, email, role }, config.jwt.secret, { expiresIn: '1h' });
}

/**
 * 在 DB 中插入一条 activation_code，返回 { id, plain }
 */
async function insertActivationCode({ batchId, codeType = 'monthly', durationDays = 30 }) {
  const plain = codeGenerator.generateCode();
  const enc = encrypt(plain);
  const hash = lookupHash(plain);
  const preview = codeGenerator.buildPreview(plain);
  const [result] = await pool.query(
    `INSERT INTO activation_codes
      (batch_id, code_encrypted, code_lookup_hash, code_preview, code_type, duration_days, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'unused', NOW())`,
    [batchId, enc, hash, preview, codeType, durationDays]
  );
  return { id: result.insertId, plain };
}

/**
 * 创建一个临时批次（关联到一个临时 admin id；如果没有 admin_users 表也允许 0 占位）
 */
async function ensureTestBatch(codeType = 'monthly', durationDays = 30) {
  const batchNo = `BTEST-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const [r] = await pool.query(
    `INSERT INTO code_batches
      (batch_no, name, code_type, duration_days, total_count, used_count, void_count, created_by, created_at)
     VALUES (?, '集成测试批次', ?, ?, 0, 0, 0, 0, NOW())`,
    [batchNo, codeType, durationDays]
  );
  return { id: r.insertId, batch_no: batchNo };
}

/**
 * 创建一个临时测试用户，返回 { id, token, username }
 */
async function createTestUser(suffix = '') {
  const username = `mtest_${Date.now().toString(36)}${suffix}_${Math.floor(Math.random() * 1e6).toString(36)}`.slice(0, 20);
  const email = `${username}@local.test`;
  const password = await bcrypt.hash('test-pass-12345', 4);
  const [r] = await pool.query(
    `INSERT INTO users (username, email, password, role, vip_level, vip_status, created_at)
     VALUES (?, ?, ?, 'user', 0, 1, NOW())`,
    [username, email, password]
  );
  const id = r.insertId;
  const token = signToken({ id, username, email });
  return { id, username, email, token };
}

describe('Membership API Integration', () => {
  let dbAvailable = false;
  let dbSkipReason = '';

  // 用于追踪需要清理的测试数据
  const createdUserIds = [];
  const createdBatchIds = [];
  const createdCodeIds = [];

  beforeAll(async () => {
    const probe = await probeIntegrationDatabase();
    dbAvailable = probe.ok === true;
    dbSkipReason = probe.reason || '';
    if (!dbAvailable) {
      const message =
        '[membership.test] 集成数据库不可达，需要 DB 的用例将被跳过。\n' +
        `  原因：${dbSkipReason}`;
      if (process.env.INTEGRATION_DB_REQUIRED === '1') {
        throw new Error(message);
      }
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  });

  afterAll(async () => {
    if (!dbAvailable) {
      try {
        await pool.end();
      } catch (_) {
        // ignore
      }
      return;
    }
    // 清理测试数据：先删 redemption_logs / codes / batches / users
    try {
      if (createdCodeIds.length > 0) {
        await pool.query(
          `DELETE FROM code_redemption_logs WHERE code_id IN (${createdCodeIds.map(() => '?').join(',')})`,
          createdCodeIds
        );
        await pool.query(
          `DELETE FROM activation_codes WHERE id IN (${createdCodeIds.map(() => '?').join(',')})`,
          createdCodeIds
        );
      }
      if (createdBatchIds.length > 0) {
        await pool.query(
          `DELETE FROM code_batches WHERE id IN (${createdBatchIds.map(() => '?').join(',')})`,
          createdBatchIds
        );
      }
      if (createdUserIds.length > 0) {
        await pool.query(
          `DELETE FROM code_redemption_logs WHERE user_id IN (${createdUserIds.map(() => '?').join(',')})`,
          createdUserIds
        );
        await pool.query(
          `DELETE FROM users WHERE id IN (${createdUserIds.map(() => '?').join(',')})`,
          createdUserIds
        );
      }
    } catch (cleanupErr) {
      // eslint-disable-next-line no-console
      console.warn('[membership.test] 清理失败：', cleanupErr.message);
    } finally {
      try {
        await pool.end();
      } catch (_) {
        // ignore
      }
    }
  });

  // 公开端点：不依赖任何 seed，只要表存在
  describe('GET /api/system/contact', () => {
    test('公开可访问，返回 200 + qq/wechat/qrcode_url/notice 字段', async () => {
      if (!dbAvailable) return;
      const res = await request(app).get('/api/system/contact');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('code', 200);
      expect(res.body).toHaveProperty('data');
      const data = res.body.data;
      expect(data).toHaveProperty('qq');
      expect(data).toHaveProperty('wechat');
      expect(data).toHaveProperty('qrcode_url');
      expect(data).toHaveProperty('notice');
    });
  });

  describe('GET /api/user/membership', () => {
    test('未登录 → 401', async () => {
      if (!dbAvailable) return;
      const res = await request(app).get('/api/user/membership');
      expect(res.status).toBe(401);
    });

    test('已登录新用户 → 返回 vip_level=0', async () => {
      if (!dbAvailable) return;
      const user = await createTestUser('-q');
      createdUserIds.push(user.id);

      const res = await request(app)
        .get('/api/user/membership')
        .set('Authorization', `Bearer ${user.token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data).toMatchObject({
        vip_level: 0,
        is_active: false,
        is_permanent: false,
        vip_status: 1
      });
      expect(res.body.data).toHaveProperty('vip_level_label');
    });
  });

  describe('POST /api/user/membership/activate', () => {
    test('成功激活月卡后立即 GET 看到新到期日 + level=1', async () => {
      if (!dbAvailable) return;
      const user = await createTestUser('-a');
      createdUserIds.push(user.id);

      const batch = await ensureTestBatch('monthly', 30);
      createdBatchIds.push(batch.id);
      const code = await insertActivationCode({ batchId: batch.id, codeType: 'monthly', durationDays: 30 });
      createdCodeIds.push(code.id);

      // 激活
      const activateRes = await request(app)
        .post('/api/user/membership/activate')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ code: codeGenerator.formatForDisplay(code.plain) });

      expect(activateRes.status).toBe(200);
      expect(activateRes.body.code).toBe(200);
      expect(activateRes.body.data.vip_level).toBe(1);
      expect(activateRes.body.data.is_active).toBe(true);
      expect(activateRes.body.data.days_added).toBe(30);

      // 立即 GET 验证
      const meRes = await request(app)
        .get('/api/user/membership')
        .set('Authorization', `Bearer ${user.token}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.vip_level).toBe(1);
      expect(meRes.body.data.is_active).toBe(true);
      expect(meRes.body.data.days_remaining).toBeGreaterThan(28);
      expect(meRes.body.data.days_remaining).toBeLessThanOrEqual(31);
      expect(meRes.body.data.vip_expires_at).toBeTruthy();

      // codes 表已经被标记为 used
      const [usedRows] = await pool.query(
        'SELECT status, used_by FROM activation_codes WHERE id = ?',
        [code.id]
      );
      expect(usedRows[0].status).toBe('used');
      expect(Number(usedRows[0].used_by)).toBe(user.id);

      // batch.used_count + 1
      const [batchRows] = await pool.query(
        'SELECT used_count FROM code_batches WHERE id = ?',
        [batch.id]
      );
      expect(Number(batchRows[0].used_count)).toBe(1);

      // redemption_log 写入了一条
      const [logRows] = await pool.query(
        'SELECT channel, vip_level_after FROM code_redemption_logs WHERE code_id = ?',
        [code.id]
      );
      expect(logRows.length).toBe(1);
      expect(logRows[0].channel).toBe('profile');
      expect(Number(logRows[0].vip_level_after)).toBe(1);
    });

    test('激活已使用的码 → 404', async () => {
      if (!dbAvailable) return;
      const user1 = await createTestUser('-u');
      const user2 = await createTestUser('-v');
      createdUserIds.push(user1.id, user2.id);

      const batch = await ensureTestBatch('monthly', 30);
      createdBatchIds.push(batch.id);
      const code = await insertActivationCode({ batchId: batch.id, codeType: 'monthly', durationDays: 30 });
      createdCodeIds.push(code.id);

      // user1 先激活
      const first = await request(app)
        .post('/api/user/membership/activate')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ code: code.plain });
      expect(first.status).toBe(200);

      // user2 再激活同一个码 → 404
      const second = await request(app)
        .post('/api/user/membership/activate')
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ code: code.plain });
      expect(second.status).toBe(404);
    });

    test('永久会员再激活 → 409', async () => {
      if (!dbAvailable) return;
      const user = await createTestUser('-p');
      createdUserIds.push(user.id);

      // 直接 SQL 把用户置为永久会员
      await pool.query(
        `UPDATE users SET vip_level = 3, vip_expires_at = '2099-12-31 23:59:59', vip_status = 1 WHERE id = ?`,
        [user.id]
      );

      const batch = await ensureTestBatch('monthly', 30);
      createdBatchIds.push(batch.id);
      const code = await insertActivationCode({ batchId: batch.id, codeType: 'monthly', durationDays: 30 });
      createdCodeIds.push(code.id);

      const res = await request(app)
        .post('/api/user/membership/activate')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ code: code.plain });

      expect(res.status).toBe(409);

      // 确认事务回滚：码仍然 unused
      const [rows] = await pool.query(
        'SELECT status FROM activation_codes WHERE id = ?',
        [code.id]
      );
      expect(rows[0].status).toBe('unused');
    });

    test('1 小时内第 6 次激活 → 429（前 5 次允许，第 6 次被限流挡掉）', async () => {
      if (!dbAvailable) return;
      const user = await createTestUser('-r');
      createdUserIds.push(user.id);

      const batch = await ensureTestBatch('monthly', 30);
      createdBatchIds.push(batch.id);

      const statuses = [];
      // 前 5 次都用"无效格式"（不打到 DB，但仍应被限流计数）
      for (let i = 0; i < 5; i += 1) {
        const r = await request(app)
          .post('/api/user/membership/activate')
          .set('Authorization', `Bearer ${user.token}`)
          .send({ code: 'INVALID-CODE-NOT-16' });
        statuses.push(r.status);
      }
      // 第 6 次必须 429
      const sixth = await request(app)
        .post('/api/user/membership/activate')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ code: 'INVALID-CODE-NOT-16' });
      expect(sixth.status).toBe(429);

      // 前 5 次应该都不是 429
      statuses.forEach(s => expect(s).not.toBe(429));
    });
  });
});
