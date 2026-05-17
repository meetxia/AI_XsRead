/**
 * 会员管理控制器（admin 端）
 *
 * 端点：
 *   POST /api/admin/users/:id/membership/disable  停用某用户的会员（vip_status=0）
 *   POST /api/admin/users/:id/membership/enable   恢复（vip_status=1）
 *
 * 注意：
 *   - 仅修改 vip_status；不动 vip_level / vip_expires_at（保留追溯）
 *   - 写入 code_admin_logs（与既有 admin_logs 表分开，专门记录会员/激活码相关操作）
 */

const db = require('../config/database');
const Response = require('../utils/response');

async function writeAdminLog(conn, { adminId, action, target, detail, ip }) {
  try {
    await conn.query(
      `INSERT INTO code_admin_logs (admin_id, action, target, detail, ip, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        adminId,
        action,
        target || null,
        detail ? JSON.stringify(detail) : null,
        ip || null
      ]
    );
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[code_admin_logs] 写日志失败：', err.message);
    }
  }
}

class MembershipAdminController {
  /**
   * POST /api/admin/users/:id/membership/disable
   * Body: { reason? }
   */
  static async disableMember(req, res, next) {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId < 1) {
        return Response.error(res, '无效的用户 ID', 400);
      }

      const conn = await db.getConnection();
      try {
        const [users] = await conn.query(
          'SELECT id, vip_level, vip_status FROM users WHERE id = ?',
          [userId]
        );
        if (users.length === 0) {
          return Response.error(res, '用户不存在', 404);
        }

        await conn.query(
          'UPDATE users SET vip_status = 0, updated_at = NOW() WHERE id = ?',
          [userId]
        );

        await writeAdminLog(conn, {
          adminId: req.user.id,
          action: 'disable_member',
          target: `user:${userId}`,
          detail: {
            reason: req.body?.reason || null,
            vip_level: users[0].vip_level
          },
          ip: req.ip
        });
      } finally {
        conn.release();
      }

      return Response.success(res, null, '已停用该用户的会员权益');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/users/:id/membership/enable
   */
  static async enableMember(req, res, next) {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId < 1) {
        return Response.error(res, '无效的用户 ID', 400);
      }

      const conn = await db.getConnection();
      try {
        const [users] = await conn.query(
          'SELECT id FROM users WHERE id = ?',
          [userId]
        );
        if (users.length === 0) {
          return Response.error(res, '用户不存在', 404);
        }

        await conn.query(
          'UPDATE users SET vip_status = 1, updated_at = NOW() WHERE id = ?',
          [userId]
        );

        await writeAdminLog(conn, {
          adminId: req.user.id,
          action: 'enable_member',
          target: `user:${userId}`,
          detail: null,
          ip: req.ip
        });
      } finally {
        conn.release();
      }

      return Response.success(res, null, '已恢复该用户的会员权益');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MembershipAdminController;
