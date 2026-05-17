/**
 * 小说 API 集成测试
 *
 * 集成测试需要一个真实可用的 MySQL `ai_xsread_test` schema。
 * 在没有数据库的环境（CI / 本地纯单测）下：
 *   - 默认行为：`beforeAll` 探测数据库；探测失败时整个 suite 静默跳过，
 *     并在控制台输出一行 `console.warn` 说明原因；
 *   - 设置环境变量 `INTEGRATION_DB_REQUIRED=1` 时，探测失败将抛错使
 *     suite 失败（用于 CI 强制要求集成 DB 的场景）。
 *
 * 详细的本地搭建方法见 `backend/tests/README.md`。
 */
const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/database');

const DB_PROBE_TIMEOUT_MS = 1000;

/**
 * 在 `DB_PROBE_TIMEOUT_MS` 内对数据库做一次最小可达性探测：
 *   1. 拿到一个连接；
 *   2. 跑 `SELECT 1`；
 *   3. 跑 `SELECT 1 FROM novels LIMIT 1` 验证 schema 已经初始化。
 * 任意一步失败 / 超时即视为"集成 DB 不可用"，返回 { ok: false, reason }。
 */
async function probeIntegrationDatabase() {
  let connection;
  const probe = (async () => {
    connection = await pool.getConnection();
    await connection.query('SELECT 1');
    // 至少需要 init_step1.sql 中的 novels 表存在，否则集成测试无意义
    await connection.query('SELECT 1 FROM novels LIMIT 1');
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
      // ignore release errors
    }
  }
}

describe('Novels API Integration Tests', () => {
  let dbAvailable = false;
  let dbSkipReason = '';

  beforeAll(async () => {
    const result = await probeIntegrationDatabase();
    dbAvailable = result.ok === true;
    dbSkipReason = result.reason || '';

    if (!dbAvailable) {
      const message =
        `[Novels API Integration Tests] 集成数据库不可达，整套用例将被跳过。\n` +
        `  原因：${dbSkipReason}\n` +
        `  本地启用方法见 backend/tests/README.md，` +
        `或设置 INTEGRATION_DB_REQUIRED=1 以让 CI 在缺少 DB 时直接失败。`;

      if (process.env.INTEGRATION_DB_REQUIRED === '1') {
        // CI 模式：强制要求集成 DB，可达性失败应当让 suite 红
        throw new Error(message);
      }

      // 默认模式：仅警告，不让 suite 失败
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  });

  // 测试后清理
  afterAll(async () => {
    // 清理测试数据
    if (pool && pool.end) {
      try {
        await pool.end();
      } catch (_) {
        // pool 可能已关闭或从未真正连接，忽略
      }
    }
  });

  /**
   * 仅在数据库可达时执行真正的断言；不可达时直接 return，使 it 用例
   * 显示为 passed（实际为"已跳过"，原因已在 beforeAll 中 warn 过）。
   */
  const runWithDb = (fn) => async () => {
    if (!dbAvailable) {
      return;
    }
    return fn();
  };

  describe('GET /api/novels', () => {
    it('应该返回小说列表', runWithDb(async () => {
      const response = await request(app)
        .get('/api/novels')
        .query({ page: 1, pageSize: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    }));

    it('应该支持分类筛选', runWithDb(async () => {
      const response = await request(app)
        .get('/api/novels')
        .query({ categoryId: 1, page: 1, pageSize: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
    }));

    it('应该支持排序', runWithDb(async () => {
      const response = await request(app)
        .get('/api/novels')
        .query({
          sortBy: 'views',
          order: 'DESC',
          page: 1,
          pageSize: 20
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);

      // 验证排序
      const novels = response.body.data;
      if (novels.length > 1) {
        for (let i = 0; i < novels.length - 1; i++) {
          expect(novels[i].views).toBeGreaterThanOrEqual(novels[i + 1].views);
        }
      }
    }));
  });

  describe('GET /api/novels/:id', () => {
    it('应该返回小说详情', runWithDb(async () => {
      const response = await request(app)
        .get('/api/novels/1');

      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 200);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('title');
        expect(response.body.data).toHaveProperty('author');
      } else {
        // 如果小说不存在，应该返回 404
        expect(response.status).toBe(404);
      }
    }));

    it('小说不存在时应该返回 404', runWithDb(async () => {
      const response = await request(app)
        .get('/api/novels/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code');
    }));
  });

  describe('GET /api/novels/recommend', () => {
    it('应该返回推荐小说列表', runWithDb(async () => {
      const response = await request(app)
        .get('/api/novels/recommend')
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    }));
  });

  describe('GET /api/novels/:id/chapters', () => {
    it('应该返回小说的章节列表', runWithDb(async () => {
      const response = await request(app)
        .get('/api/novels/1/chapters')
        .query({ page: 1, pageSize: 50 });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    }));
  });

  describe('GET /api/chapters/:id', () => {
    it('应该返回章节内容', runWithDb(async () => {
      const response = await request(app)
        .get('/api/chapters/1');

      if (response.status === 200) {
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('title');
        expect(response.body.data).toHaveProperty('content');
      }
    }));
  });

  describe('GET /api/novels/search', () => {
    it('应该根据关键词搜索小说', runWithDb(async () => {
      const response = await request(app)
        .get('/api/novels/search')
        .query({ keyword: '测试', page: 1, pageSize: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 200);
      expect(Array.isArray(response.body.data)).toBe(true);
    }));

    it('没有关键词时应该返回错误', runWithDb(async () => {
      const response = await request(app)
        .get('/api/novels/search')
        .query({ page: 1, pageSize: 20 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code');
    }));
  });

  describe('GET /api/categories', () => {
    it('应该返回分类列表', runWithDb(async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    }));
  });
});
