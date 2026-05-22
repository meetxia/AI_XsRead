/**
 * admin-backend / codes export (smoke)
 *
 * 验证激活码批次的导出端点（CSV / TXT）以及作废、创建、列表等关键路由的鉴权门
 * —— 无 token 必须被 authMiddleware 拦下，绝不能裸奔到 controller 或撞 SQL。
 *
 * Track: 链路优化（管理端激活码 Phase 1）
 *
 * Response.error 风格：HTTP 200 + body.code 表示错误码
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(48);
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'b'.repeat(48);
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'root';
process.env.DB_NAME = process.env.DB_NAME || 'ai_xsread_test';

const request = require('supertest');
const app = require('../src/app');

describe('admin-backend / codes export (smoke)', () => {
  test('GET /api/admin/codes/batches 无 token 返回 code 401', async () => {
    const res = await request(app).get('/api/admin/codes/batches');
    expect(res.body?.code).toBe(401);
  });

  test('POST /api/admin/codes/batches 无 token 返回 code 401（不会触达 controller）', async () => {
    const res = await request(app)
      .post('/api/admin/codes/batches')
      .send({ code_type: 'monthly', count: 10 });
    expect(res.body?.code).toBe(401);
  });

  test('GET /api/admin/codes/batches/1/export 无 token 返回 code 401', async () => {
    const res = await request(app).get('/api/admin/codes/batches/1/export');
    expect(res.body?.code).toBe(401);
  });

  test('GET /api/admin/codes/batches/1/export.txt 无 token 返回 code 401', async () => {
    const res = await request(app).get('/api/admin/codes/batches/1/export.txt');
    expect(res.body?.code).toBe(401);
  });

  test('GET /api/admin/codes/batches/abc/export.txt 无 token 也是 401（authMiddleware 先生效）', async () => {
    // 即使 ID 是非法字符串，也应该被 authMiddleware 截住而不是走到 controller 里 400
    const res = await request(app).get('/api/admin/codes/batches/abc/export.txt');
    expect(res.body?.code).toBe(401);
  });

  test('POST /api/admin/codes/void 无 token 返回 code 401', async () => {
    const res = await request(app)
      .post('/api/admin/codes/void')
      .send({ code_ids: [1, 2, 3] });
    expect(res.body?.code).toBe(401);
  });

  test('GET /api/admin/codes/redemptions 无 token 返回 code 401', async () => {
    const res = await request(app).get('/api/admin/codes/redemptions');
    expect(res.body?.code).toBe(401);
  });
});
