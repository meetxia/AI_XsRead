/**
 * admin-backend / auth (smoke)
 *
 * 这些用例只走中间件路径（参数校验 / 鉴权失败），不依赖真实数据库。
 * Track: 管理端 Sprint 2 / T-6.1
 *
 * 注意：admin-backend 的 Response.error 风格是把业务错误码放在 body.code，
 * HTTP status 只在 5xx 时跟着升到 500，其他都是 200。所以断言走 body.code。
 */

// 必须在 require app 前设置环境变量，因为 src/config/index.js 会强校验
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(48);
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'b'.repeat(48);
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'root';
process.env.DB_NAME = process.env.DB_NAME || 'ai_xsread_test';

const request = require('supertest');
const app = require('../src/app');

describe('admin-backend / auth (smoke)', () => {
  test('POST /api/admin/login 缺密码返回 code 400', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin' });
    expect(res.body?.code).toBe(400);
  });

  test('POST /api/admin/login 缺用户名返回 code 400', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ password: 'whatever' });
    expect(res.body?.code).toBe(400);
  });

  test('GET /api/admin/profile 无 token 返回 code 401', async () => {
    const res = await request(app).get('/api/admin/profile');
    expect(res.body?.code).toBe(401);
  });

  test('GET /api/admin/profile 错误 token 返回 code 401', async () => {
    const res = await request(app)
      .get('/api/admin/profile')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.body?.code).toBe(401);
  });

  test('GET /api/admin/profile token 格式错误返回 code 401', async () => {
    const res = await request(app)
      .get('/api/admin/profile')
      .set('Authorization', 'NotBearer token');
    expect(res.body?.code).toBe(401);
  });

  test('POST /api/admin/refresh-token 无 refreshToken 返回 code 400', async () => {
    const res = await request(app)
      .post('/api/admin/refresh-token')
      .send({});
    expect(res.body?.code).toBe(400);
  });
});
