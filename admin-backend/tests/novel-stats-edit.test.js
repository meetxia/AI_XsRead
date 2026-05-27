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

describe('admin-backend novel stats editing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/admin/novels writes initial stat fields when creating a novel', async () => {
    db.query
      .mockResolvedValueOnce([{ insertId: 321 }])
      .mockResolvedValueOnce([[{ id: 9 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/admin/novels')
      .send({
        title: '新书热度可编辑',
        categoryId: 101,
        cover: '/uploads/images/covers/test.jpg',
        description: '这是一段足够长的小说简介，用来验证管理后台创建时保存数据统计字段。',
        tags: ['甜宠'],
        views: 12345,
        likes: 456,
        collections: 678,
        rating: 4.7,
        ratingCount: 89
      });

    expect(res.body?.code).toBe(201);
    const insertCall = db.query.mock.calls.find(([sql]) => /INSERT INTO novels/i.test(sql));
    expect(insertCall[0]).toMatch(/views, likes, collections/);
    expect(insertCall[0]).toMatch(/rating, rating_count/);
    expect(insertCall[1]).toEqual(expect.arrayContaining([12345, 456, 678, 4.7, 89]));
  });

  test('PUT /api/admin/novels/:id updates initial stat fields', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 7, title: '旧书名' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/admin/novels/7')
      .send({
        views: 98765,
        likes: 8765,
        collections: 4321,
        rating: 5.8,
        rating_count: 654,
        tags: []
      });

    expect(res.body?.code).toBe(200);
    const updateCall = db.query.mock.calls.find(([sql]) => /UPDATE novels SET/i.test(sql));
    expect(updateCall[0]).toMatch(/views = COALESCE\(\?, views\)/);
    expect(updateCall[0]).toMatch(/likes = COALESCE\(\?, likes\)/);
    expect(updateCall[0]).toMatch(/collections = COALESCE\(\?, collections\)/);
    expect(updateCall[0]).toMatch(/rating = COALESCE\(\?, rating\)/);
    expect(updateCall[0]).toMatch(/rating_count = COALESCE\(\?, rating_count\)/);
    expect(updateCall[1]).toEqual(expect.arrayContaining([98765, 8765, 4321, 5, 654]));
  });
});
