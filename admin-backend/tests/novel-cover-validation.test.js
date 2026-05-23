/**
 * 小说封面 URL 输入校验回归守护
 *
 * 曾经管理前端把 blob:https://admin... 临时预览地址保存进 novels.cover，
 * 导致用户前端刷新后封面 404。后端也要拒绝这类不可持久访问的地址。
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(48);
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'b'.repeat(48);
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'root';
process.env.DB_NAME = process.env.DB_NAME || 'ai_xsread_test';

jest.mock('../src/middlewares/auth', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { id: 1, username: 'admin', role: 'super_admin' };
    next();
  },
  adminMiddleware: (req, res, next) => next(),
  superAdminMiddleware: (req, res, next) => next()
}));

jest.mock('../src/config/database', () => ({
  query: jest.fn()
}));

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('admin-backend / novel cover validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/admin/novels 拒绝 blob 临时封面地址', async () => {
    const res = await request(app)
      .post('/api/admin/novels')
      .send({
        title: '测试小说',
        categoryId: 101,
        cover: 'blob:https://admin.xs.momofx.cn/f8cebbd-e6f5',
        description: '这是一段足够长的小说简介，用来触发封面校验。'
      });

    expect(res.body?.code).toBe(400);
    expect(res.body?.message).toMatch(/封面地址/);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('PUT /api/admin/novels/:id 拒绝 blob 临时封面地址且不更新数据库', async () => {
    const res = await request(app)
      .put('/api/admin/novels/1')
      .send({
        cover: 'blob:https://admin.xs.momofx.cn/f8cebbd-e6f5'
      });

    expect(res.body?.code).toBe(400);
    expect(res.body?.message).toMatch(/封面地址/);
    expect(db.query).not.toHaveBeenCalled();
  });
});
