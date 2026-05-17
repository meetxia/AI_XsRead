/**
 * 会员控制器（用户端）
 *
 * 端点：
 *   GET  /api/user/membership            查询当前会员状态
 *   POST /api/user/membership/activate   激活激活码
 *
 * 内部导出 `redeemActivationCode`：供注册流程在事务外异步调用，复用核心激活逻辑。
 *
 * 业务规则参考 spec：membership-system/{requirements,design}.md
 *   - 续期算法：复用 services/membershipService.computeNewMembership
 *   - 一码一用 + AES 加密：复用 utils/codeCrypto + utils/codeGenerator
 *   - 限流：在路由层挂 createWriteRateLimiter({ windowMs: 1h, maxWrites: 5 })
 */

const { pool } = require('../config/database');
const Response = require('../utils/response');
const config = require('../config');
const codeGenerator = require('../utils/codeGenerator');
const {
  loadMembership,
  computeNewMembership,
  MembershipConflictError
} = require('../services/membershipService');
const { lookupHash } = require('../utils/codeCrypto');

const ALLOWED_CHANNELS = new Set(['profile', 'reading_wall', 'register']);

/**
 * 自定义错误：用于把"激活失败的具体原因"透传给路由层去映射 HTTP 状态码
 */
class ActivationError extends Error {
  /**
   * @param {string} reason - 错误原因常量
   * @param {string} message - 用户可读消息
   * @param {number} httpStatus - HTTP 状态码
   */
  constructor(reason, message, httpStatus) {
    super(message);
    this.name = 'ActivationError';
    this.reason = reason;
    this.httpStatus = httpStatus;
  }
}

function devLog(...args) {
  if (config.server.env !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[membership]', ...args);
  }
}

/**
 * 把 Date 转为 MySQL DATETIME 格式（本地时区，YYYY-MM-DD HH:mm:ss）
 * mysql2 直接传 Date 在某些时区下行为有歧义，这里走纯字符串以确保可控
 */
function toMysqlDateTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * GET /api/user/membership
 * 返回当前会员状态摘要
 */
const getMyMembership = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return Response.error(res, '请先登录', 401);
    }
    const membership = await loadMembership(userId);
    if (!membership) {
      return Response.error(res, '用户不存在', 404);
    }
    return Response.success(res, membership);
  } catch (error) {
    next(error);
  }
};

/**
 * 核心激活逻辑（不走 Express 中间件，可被注册流程内部复用）
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} params.code 用户输入（未规范化也可）
 * @param {'profile'|'reading_wall'|'register'} [params.channel='profile']
 * @param {string} [params.ip]
 * @param {string} [params.userAgent]
 * @returns {Promise<Object>} 激活结果 { vip_level, vip_level_label, vip_expires_at, days_added, ...membership }
 * @throws {ActivationError} 业务级失败（格式 / 未找到 / 已使用 / 永久 / 已停用等）
 * @throws {Error} 系统级失败
 */
async function redeemActivationCode({ userId, code, channel = 'profile', ip = null, userAgent = null }) {
  if (!userId) {
    throw new ActivationError('UNAUTHORIZED', '请先登录', 401);
  }

  const normalized = codeGenerator.normalizeInput(code);
  if (!codeGenerator.isValidFormat(normalized)) {
    throw new ActivationError('INVALID_FORMAT', '激活码格式错误，应为 16 位字母与数字', 400);
  }

  const safeChannel = ALLOWED_CHANNELS.has(channel) ? channel : 'profile';
  const hash = lookupHash(normalized);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. 锁定激活码记录（FOR UPDATE 防并发激活）
    const [codeRows] = await connection.query(
      `SELECT id, batch_id, code_type, duration_days, status
       FROM activation_codes
       WHERE code_lookup_hash = ?
       FOR UPDATE`,
      [hash]
    );
    if (codeRows.length === 0) {
      throw new ActivationError('CODE_NOT_FOUND', '激活码无效或已使用', 404);
    }
    const codeRow = codeRows[0];
    if (codeRow.status !== 'unused') {
      throw new ActivationError('CODE_NOT_FOUND', '激活码无效或已使用', 404);
    }

    // 2. 锁定用户行
    const [userRows] = await connection.query(
      'SELECT id, vip_level, vip_expires_at, vip_status FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );
    if (userRows.length === 0) {
      throw new ActivationError('USER_NOT_FOUND', '用户不存在', 404);
    }
    const user = userRows[0];

    // 3. 计算新会员状态（永久会员会抛 MembershipConflictError）
    let newMembership;
    try {
      newMembership = computeNewMembership(
        { vip_level: user.vip_level, vip_expires_at: user.vip_expires_at },
        { code_type: codeRow.code_type, duration_days: codeRow.duration_days }
      );
    } catch (err) {
      if (err instanceof MembershipConflictError) {
        throw new ActivationError('PERMANENT_ALREADY', err.message || '您已是永久会员，无需激活', 409);
      }
      throw err;
    }

    const expiresBefore = user.vip_expires_at ? new Date(user.vip_expires_at) : null;
    const expiresAfter = newMembership.vip_expires_at;

    // 4. 更新激活码 → used
    await connection.query(
      `UPDATE activation_codes
       SET status = 'used', used_by = ?, used_at = NOW()
       WHERE id = ? AND status = 'unused'`,
      [userId, codeRow.id]
    );

    // 5. 批次 used_count + 1
    await connection.query(
      'UPDATE code_batches SET used_count = used_count + 1 WHERE id = ?',
      [codeRow.batch_id]
    );

    // 6. 更新 users：vip_level / vip_expires_at；激活成功后自动恢复 vip_status=1
    await connection.query(
      `UPDATE users
       SET vip_level = ?, vip_expires_at = ?, vip_status = 1, updated_at = NOW()
       WHERE id = ?`,
      [newMembership.vip_level, toMysqlDateTime(expiresAfter), userId]
    );

    // 7. 写激活记录
    await connection.query(
      `INSERT INTO code_redemption_logs
        (code_id, user_id, vip_level_before, vip_level_after,
         expires_before, expires_after, channel, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        codeRow.id,
        userId,
        Number(user.vip_level || 0),
        Number(newMembership.vip_level),
        toMysqlDateTime(expiresBefore),
        toMysqlDateTime(expiresAfter),
        safeChannel,
        ip,
        userAgent ? String(userAgent).slice(0, 255) : null
      ]
    );

    await connection.commit();

    devLog(`user ${userId} activated code ${codeRow.id} via ${safeChannel}`);

    // 重新加载完整摘要返回（保持响应字段一致）
    const membership = await loadMembership(userId);
    return {
      ...membership,
      days_added: newMembership.days_added
    };
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {
      // ignore rollback errors
    }
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * POST /api/user/membership/activate
 * Body: { code, channel? }
 */
const activateCode = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return Response.error(res, '请先登录', 401);
    }
    const { code, channel } = req.body || {};
    if (!code) {
      return Response.error(res, '请提供激活码', 400);
    }

    const requestedChannel = channel === 'reading_wall' || channel === 'profile'
      ? channel
      : 'profile';

    const result = await redeemActivationCode({
      userId,
      code,
      channel: requestedChannel,
      ip: req.ip,
      userAgent: req.get('user-agent') || null
    });

    return Response.success(res, result, '激活成功');
  } catch (error) {
    if (error instanceof ActivationError) {
      return Response.error(res, error.message, error.httpStatus);
    }
    next(error);
  }
};

module.exports = {
  getMyMembership,
  activateCode,
  redeemActivationCode,
  ActivationError
};
