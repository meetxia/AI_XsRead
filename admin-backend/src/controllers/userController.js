const db = require('../config/database');
const Response = require('../utils/response');

/**
 * 用户管理控制器
 */
class UserController {
  /**
   * 获取用户列表
   */
  static async getList(req, res, next) {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        keyword
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      
      let whereClause = '1=1';
      const params = [];

      if (status !== undefined && status !== '') {
        whereClause += ' AND status = ?';
        params.push(parseInt(status));
      }

      if (keyword) {
        whereClause += ' AND (username LIKE ? OR email LIKE ? OR id = ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, keyword);
      }

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
        params
      );

      const total = countResult[0].total;

      const [users] = await db.query(
        `SELECT 
          id, username, email, avatar, gender, birthday, bio,
          role, status, created_at, updated_at,
          (SELECT COUNT(*) FROM bookshelf WHERE user_id = users.id) as total_books,
          (SELECT SUM(reading_time) FROM bookshelf WHERE user_id = users.id) as reading_time
        FROM users
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );

      return Response.page(res, users, total, parseInt(page), parseInt(pageSize));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户详情
   */
  static async getDetail(req, res, next) {
    try {
      const { id } = req.params;

      const [users] = await db.query(
        `SELECT 
          id, username, email, avatar, nickname, gender, birthday, bio,
          role, status, last_login_time, last_login_ip, created_at, updated_at
        FROM users WHERE id = ?`,
        [id]
      );

      if (users.length === 0) {
        return Response.error(res, '用户不存在', 404);
      }

      // 获取阅读统计
      const [stats] = await db.query(
        `SELECT 
          COUNT(DISTINCT novel_id) as total_books,
          SUM(reading_time) as total_reading_time
        FROM bookshelf WHERE user_id = ?`,
        [id]
      );

      const user = users[0];
      user.stats = stats[0];

      return Response.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新用户状态
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (status === undefined) {
        return Response.error(res, '状态不能为空', 400);
      }

      const [users] = await db.query('SELECT username FROM users WHERE id = ?', [id]);
      
      if (users.length === 0) {
        return Response.error(res, '用户不存在', 404);
      }

      await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
         VALUES (?, ?, 'update_status', 'user', ?, ?)`,
        [
          req.user.id,
          req.user.username,
          id,
          `修改用户状态: ${users[0].username} -> ${status === 1 ? '启用' : '禁用'}`
        ]
      );

      return Response.success(res, null, '更新成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户统计
   */
  static async getStatistics(req, res, next) {
    try {
      const { id } = req.params;

      // 阅读统计
      const [readingStats] = await db.query(
        `SELECT 
          COUNT(DISTINCT CASE WHEN type = 'reading' THEN novel_id END) as reading_books,
          COUNT(DISTINCT CASE WHEN type = 'finished' THEN novel_id END) as finished_books,
          COUNT(DISTINCT novel_id) as total_books,
          SUM(reading_time) as total_reading_time
        FROM bookshelf WHERE user_id = ?`,
        [id]
      );

      // 互动统计
      const [interactionStats] = await db.query(
        `SELECT 
          (SELECT COUNT(*) FROM comments WHERE user_id = ?) as comment_count,
          (SELECT COUNT(*) FROM user_likes WHERE user_id = ?) as like_count,
          (SELECT COUNT(*) FROM bookshelf WHERE user_id = ? AND type = 'collected') as collection_count`,
        [id, id, id]
      );

      const stats = {
        ...readingStats[0],
        ...interactionStats[0]
      };

      return Response.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;

