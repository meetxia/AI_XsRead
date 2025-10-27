const db = require('../config/database');
const Response = require('../utils/response');

/**
 * 评论管理控制器
 */
class CommentController {
  /**
   * 获取评论列表
   */
  static async getList(req, res, next) {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        novelId
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      
      let whereClause = '1=1';
      const params = [];

      if (status !== undefined && status !== '') {
        whereClause += ' AND c.status = ?';
        params.push(parseInt(status));
      }

      if (novelId) {
        whereClause += ' AND c.novel_id = ?';
        params.push(novelId);
      }

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM comments c WHERE ${whereClause}`,
        params
      );

      const total = countResult[0].total;

      const [comments] = await db.query(
        `SELECT 
          c.*,
          u.username,
          u.avatar,
          n.title as novel_title
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN novels n ON c.novel_id = n.id
        WHERE ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );

      return Response.page(res, comments, total, parseInt(page), parseInt(pageSize));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 审核评论（通过）
   */
  static async approve(req, res, next) {
    try {
      const { id } = req.params;

      const [comments] = await db.query('SELECT * FROM comments WHERE id = ?', [id]);
      
      if (comments.length === 0) {
        return Response.error(res, '评论不存在', 404);
      }

      await db.query('UPDATE comments SET status = 1 WHERE id = ?', [id]);

      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
         VALUES (?, ?, 'approve', 'comment', ?, ?)`,
        [req.user.id, req.user.username, id, '审核通过评论']
      );

      return Response.success(res, null, '审核通过');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 审核评论（拒绝/屏蔽）
   */
  static async reject(req, res, next) {
    try {
      const { id } = req.params;

      const [comments] = await db.query('SELECT * FROM comments WHERE id = ?', [id]);
      
      if (comments.length === 0) {
        return Response.error(res, '评论不存在', 404);
      }

      await db.query('UPDATE comments SET status = 0 WHERE id = ?', [id]);

      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
         VALUES (?, ?, 'reject', 'comment', ?, ?)`,
        [req.user.id, req.user.username, id, '屏蔽评论']
      );

      return Response.success(res, null, '已屏蔽');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除评论
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const [comments] = await db.query('SELECT * FROM comments WHERE id = ?', [id]);
      
      if (comments.length === 0) {
        return Response.error(res, '评论不存在', 404);
      }

      await db.query('DELETE FROM comments WHERE id = ?', [id]);

      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
         VALUES (?, ?, 'delete', 'comment', ?, ?)`,
        [req.user.id, req.user.username, id, '删除评论']
      );

      return Response.success(res, null, '删除成功', 204);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CommentController;

