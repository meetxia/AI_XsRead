/**
 * notificationController 单元测试
 *
 * Track: Agent A (个人中心后端 API + 迁移)
 * 来源：docs/superpowers/specs/2026-05-18-profile-center-mvp-design.md §3.5 / §4.4
 *
 * 覆盖：
 *   - list（含分页 / onlyUnread）
 *   - unreadCount
 *   - markRead（正常 / 已读再标 / 越权 / id 非法）
 *   - markAllRead（含 affected）
 *   - 模块加载与导出 handler
 *
 * 通过 jest.mock 拦截 ../../src/config/database 的 pool，无需真实 MySQL。
 */

jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

const { pool } = require('../../src/config/database');
const notificationController = require('../../src/controllers/notificationController');
const { rowToDto } = notificationController.__test__;

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('notificationController', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  describe('module exports', () => {
    test('导出 list / unreadCount / markRead / markAllRead', () => {
      expect(typeof notificationController.list).toBe('function');
      expect(typeof notificationController.unreadCount).toBe('function');
      expect(typeof notificationController.markRead).toBe('function');
      expect(typeof notificationController.markAllRead).toBe('function');
    });
  });

  describe('rowToDto', () => {
    test('字段驼峰映射 + isRead 转布尔', () => {
      const dto = rowToDto({
        id: '12',
        type: 'system',
        title: '欢迎',
        content: 'hi',
        link: null,
        is_read: 1,
        created_at: '2026-05-18T00:00:00Z',
        read_at: '2026-05-18T01:00:00Z'
      });
      expect(dto).toEqual({
        id: 12,
        type: 'system',
        title: '欢迎',
        content: 'hi',
        link: null,
        isRead: true,
        createdAt: '2026-05-18T00:00:00Z',
        readAt: '2026-05-18T01:00:00Z'
      });
    });
  });

  // -----------------------------------------------------------------
  // list
  // -----------------------------------------------------------------
  describe('list', () => {
    test('默认参数 → 返回未压缩列表 + total', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 2 }]]) // count
        .mockResolvedValueOnce([[
          { id: 1, type: 'system', title: 't1', content: 'c1', link: null, is_read: 0, created_at: 't', read_at: null },
          { id: 2, type: 'membership', title: 't2', content: 'c2', link: '/m', is_read: 1, created_at: 't', read_at: 't2' }
        ]]);

      const req = { user: { id: 1 }, query: {} };
      const res = makeRes();
      await notificationController.list(req, res);

      expect(pool.query).toHaveBeenCalledTimes(2);
      const payload = res.json.mock.calls[0][0];
      expect(payload.code).toBe(200);
      expect(payload.data.total).toBe(2);
      expect(payload.data.list).toHaveLength(2);
      expect(payload.data.list[0]).toMatchObject({ id: 1, isRead: false });
      expect(payload.data.list[1]).toMatchObject({ id: 2, isRead: true, link: '/m' });
      expect(payload.data.page).toBe(1);
      expect(payload.data.pageSize).toBe(20);
    });

    test('onlyUnread=1 → 拼出 is_read = 0 子句', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[]]);

      const req = { user: { id: 1 }, query: { onlyUnread: '1' } };
      const res = makeRes();
      await notificationController.list(req, res);

      const countSql = pool.query.mock.calls[0][0];
      expect(countSql).toMatch(/is_read = 0/);
    });

    test('pageSize > 上限 → 截断到 100', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[]]);

      const req = { user: { id: 1 }, query: { pageSize: '9999' } };
      const res = makeRes();
      await notificationController.list(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.data.pageSize).toBe(100);
    });

    test('DB 异常 → 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('boom'));
      const req = { user: { id: 1 }, query: {} };
      const res = makeRes();
      await notificationController.list(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // -----------------------------------------------------------------
  // unreadCount
  // -----------------------------------------------------------------
  describe('unreadCount', () => {
    test('返回 count', async () => {
      pool.query.mockResolvedValueOnce([[{ cnt: 5 }]]);
      const req = { user: { id: 1 } };
      const res = makeRes();
      await notificationController.unreadCount(req, res);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data).toEqual({ count: 5 });
    });
  });

  // -----------------------------------------------------------------
  // markRead
  // -----------------------------------------------------------------
  describe('markRead', () => {
    test('id 非法 → 400', async () => {
      const req = { user: { id: 1 }, params: { id: 'abc' } };
      const res = makeRes();
      await notificationController.markRead(req, res);
      expect(pool.query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('通知不属于当前用户（越权） → 404', async () => {
      pool.query.mockResolvedValueOnce([[]]); // SELECT 不到
      const req = { user: { id: 2 }, params: { id: '999' } };
      const res = makeRes();
      await notificationController.markRead(req, res);
      expect(pool.query).toHaveBeenCalledTimes(1);
      const sql = pool.query.mock.calls[0][0];
      expect(sql).toMatch(/user_id = \?/);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('已读 → 不重复 UPDATE', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1, is_read: 1 }]]);
      const req = { user: { id: 1 }, params: { id: '1' } };
      const res = makeRes();
      await notificationController.markRead(req, res);
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('未读 → 写已读', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 1, is_read: 0 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      const req = { user: { id: 1 }, params: { id: '1' } };
      const res = makeRes();
      await notificationController.markRead(req, res);
      expect(pool.query).toHaveBeenCalledTimes(2);
      const updateSql = pool.query.mock.calls[1][0];
      expect(updateSql).toMatch(/UPDATE notifications/);
      expect(updateSql).toMatch(/is_read = 1/);
      expect(updateSql).toMatch(/user_id = \?/);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // -----------------------------------------------------------------
  // markAllRead
  // -----------------------------------------------------------------
  describe('markAllRead', () => {
    test('返回 affected', async () => {
      pool.query.mockResolvedValueOnce([{ affectedRows: 7 }]);
      const req = { user: { id: 1 } };
      const res = makeRes();
      await notificationController.markAllRead(req, res);
      const payload = res.json.mock.calls[0][0];
      expect(payload.code).toBe(200);
      expect(payload.data).toEqual({ affected: 7 });
      const sql = pool.query.mock.calls[0][0];
      expect(sql).toMatch(/UPDATE notifications/);
      expect(sql).toMatch(/is_read = 1/);
      expect(sql).toMatch(/is_read = 0/); // WHERE only未读
    });

    test('DB 异常 → 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('boom'));
      const req = { user: { id: 1 } };
      const res = makeRes();
      await notificationController.markAllRead(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
