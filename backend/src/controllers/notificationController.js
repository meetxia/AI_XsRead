/**
 * 通知中心控制器
 *
 * 来源：docs/superpowers/specs/2026-05-18-profile-center-mvp-design.md §3.5 / §4.4
 * Track: Agent A
 *
 * 端点：
 *   GET  /api/notifications?page&pageSize&onlyUnread        -> list
 *   GET  /api/notifications/unread-count                    -> unreadCount
 *   POST /api/notifications/:id/read                        -> markRead
 *   POST /api/notifications/read-all                        -> markAllRead
 *
 * 安全：
 *   markRead 必须校验 notifications.user_id = req.user.id，防止越权读他人通知。
 */
const { pool } = require('../config/database');
const Response = require('../utils/response');

const MAX_PAGE_SIZE = 100;

function rowToDto(row) {
  return {
    id: Number(row.id),
    type: row.type,
    title: row.title,
    content: row.content,
    link: row.link || null,
    isRead: Number(row.is_read) === 1,
    createdAt: row.created_at,
    readAt: row.read_at || null
  };
}

/**
 * GET /api/notifications
 * Query: page, pageSize, onlyUnread (0|1)
 */
async function list(req, res) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const onlyUnreadRaw = String(req.query.onlyUnread || '').toLowerCase();
    const onlyUnread = onlyUnreadRaw === '1' || onlyUnreadRaw === 'true';

    const whereClauses = ['user_id = ?'];
    const whereParams = [userId];
    if (onlyUnread) {
      whereClauses.push('is_read = 0');
    }
    const whereSql = whereClauses.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM notifications WHERE ${whereSql}`,
      whereParams
    );
    const total = Number(countRows[0]?.total || 0);

    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      `SELECT id, type, title, content, link, is_read, created_at, read_at
       FROM notifications
       WHERE ${whereSql}
       ORDER BY is_read ASC, created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, pageSize, offset]
    );

    return Response.success(res, {
      list: rows.map(rowToDto),
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('List notifications error:', error);
    return Response.error(res, '获取通知列表失败', 500);
  }
}

/**
 * GET /api/notifications/unread-count
 */
async function unreadCount(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    const count = Number(rows[0]?.cnt || 0);
    return Response.success(res, { count });
  } catch (error) {
    console.error('Unread count error:', error);
    return Response.error(res, '获取未读数失败', 500);
  }
}

/**
 * POST /api/notifications/:id/read
 *
 * 越权防护：UPDATE 子句必带 user_id 校验；不存在或非自己 -> 404。
 */
async function markRead(req, res) {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.error(res, '通知 ID 无效', 400);
    }

    // 越权校验：先 SELECT 看是否属于当前用户
    const [rows] = await pool.query(
      'SELECT id, is_read FROM notifications WHERE id = ? AND user_id = ? LIMIT 1',
      [id, userId]
    );
    if (rows.length === 0) {
      return Response.error(res, '通知不存在', 404);
    }

    if (Number(rows[0].is_read) === 1) {
      // 已读不重复写
      return Response.success(res, null, '已读');
    }

    await pool.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return Response.success(res, null, '已读');
  } catch (error) {
    console.error('Mark notification read error:', error);
    return Response.error(res, '标记已读失败', 500);
  }
}

/**
 * POST /api/notifications/read-all
 */
async function markAllRead(req, res) {
  try {
    const userId = req.user.id;
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return Response.success(res, { affected: Number(result?.affectedRows || 0) }, '全部已读');
  } catch (error) {
    console.error('Mark all read error:', error);
    return Response.error(res, '全部已读失败', 500);
  }
}

module.exports = {
  list,
  unreadCount,
  markRead,
  markAllRead,
  // 暴露给单测
  __test__: {
    rowToDto,
    MAX_PAGE_SIZE
  }
};
