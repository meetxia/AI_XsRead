/**
 * 系统级公开端点控制器
 * - GET /api/system/contact 客服联系信息（无须登录）
 */

const { pool } = require('../config/database');
const Response = require('../utils/response');

/**
 * GET /api/system/contact
 * 返回 system_contact id=1 的兜底行
 */
const getContact = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT qq, wechat, qrcode_url, notice FROM system_contact WHERE id = 1 LIMIT 1'
    );
    const row = rows[0] || {};
    return Response.success(res, {
      qq: row.qq || null,
      wechat: row.wechat || null,
      qrcode_url: row.qrcode_url || null,
      notice: row.notice || null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContact
};
