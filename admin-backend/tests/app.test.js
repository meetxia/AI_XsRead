const request = require('supertest');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  execute: jest.fn(),
  getConnection: jest.fn()
}));

const app = require('../src/app');

describe('admin backend smoke tests', () => {
  test('GET / returns API metadata', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: 'MOMO小说后台管理API',
      version: '1.0.0',
      status: 'running'
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  test('protected admin API returns 401 without token', async () => {
    const response = await request(app).get('/api/admin/dashboard/overview');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      code: 401,
      message: '未提供认证令牌'
    });
    expect(response.body.timestamp).toEqual(expect.any(Number));
  });

  test('unknown route returns existing 404 response structure', async () => {
    const response = await request(app).get('/api/admin/not-found-for-smoke-test');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      code: 404,
      message: '请求的资源不存在'
    });
    expect(response.body.timestamp).toEqual(expect.any(Number));
  });
});
