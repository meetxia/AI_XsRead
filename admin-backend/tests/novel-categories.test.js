/**
 * admin-backend / novels categories
 *
 * 回归目标：管理后台小说列表页加载分类时，不应再被误路由到小说详情，
 * 更不应弹出“小说不存在”这种误导性提示。
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

describe('admin-backend / novels categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/admin/novels/categories 返回分类列表，而不是误报小说不存在', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/admin/novels/categories');

    expect(res.body?.code).toBe(200);
    expect(res.body?.message).toBe('success');
    expect(Array.isArray(res.body?.data)).toBe(true);
  });
});
