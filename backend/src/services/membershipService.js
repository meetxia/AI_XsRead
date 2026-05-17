/**
 * 会员服务（续期算法 + 状态查询）
 *
 * 职责：
 * - computeNewMembership：纯函数，根据当前会员状态 + 新激活码计算新状态
 * - isMember(userId)：查 DB 判断当前是否享会员权益
 * - loadMembership(userId)：查 DB 返回完整会员摘要（前端展示用）
 *
 * 业务规则参考 requirements.md 第 5 节：
 * - 月卡：到期日 = max(now, 当前到期日) + 30 天
 * - 年卡：到期日 = max(now, 当前到期日) + 365 天
 * - 永久：vip_level=3，到期日 = 2099-12-31 23:59:59
 * - vip_level 永远取 max(currentLevel, codeLevel)
 * - 永久会员激活任何码均拒绝
 * - vip_status=0（被停用）即便未到期也不享受权益；激活码仍可正常激活，激活后 vip_status 会被重置为 1
 */

const PERMANENT_SENTINEL = '2099-12-31 23:59:59';

const CODE_TYPE_TO_LEVEL = {
  monthly: 1,
  yearly: 2,
  permanent: 3
};

const CODE_TYPE_TO_DAYS = {
  monthly: 30,
  yearly: 365,
  permanent: 99999
};

const LEVEL_LABELS = {
  0: '普通用户',
  1: '月卡会员',
  2: '年卡会员',
  3: '永久会员'
};

/**
 * 自定义错误：用于业务上"已是永久会员，拒绝激活"
 */
class MembershipConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MembershipConflictError';
    this.code = 'PERMANENT_ALREADY';
  }
}

/**
 * 把 DATETIME 字符串 / Date 转为 Date；NULL/空 → null
 * @param {string|Date|null|undefined} input
 * @returns {Date|null}
 */
function toDate(input) {
  if (!input) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * 把 Date 转为 'YYYY-MM-DD HH:mm:ss'（本地时间）
 * 注意：DB 存储采用本地时区由 mysql2 驱动自行处理
 * 为了确保 mysql2 不做时区转换，统一返回 ISO 字符串再让 mysql2 自己解释
 */
function toMysqlDateTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * 续期核心算法（纯函数）
 *
 * @param {Object} current 当前会员状态
 * @param {number} current.vip_level - 0/1/2/3
 * @param {Date|string|null} current.vip_expires_at - 当前到期时间
 * @param {Object} card 激活的码信息
 * @param {'monthly'|'yearly'|'permanent'} card.code_type
 * @param {number} card.duration_days - 该卡天数（月卡 30 / 年卡 365 / 永久 99999；非永久卡均按此天数累加）
 * @param {Date} [now=new Date()] - 注入"当前时间"便于测试
 * @returns {Object} 新会员状态 { vip_level, vip_expires_at, days_added }
 * @throws {MembershipConflictError} 当前已是永久会员
 */
function computeNewMembership(current, card, now = new Date()) {
  const currentLevel = Number(current?.vip_level || 0);
  const currentExpires = toDate(current?.vip_expires_at);

  if (currentLevel === 3) {
    throw new MembershipConflictError('您已是永久会员，无需激活');
  }

  if (!card || !CODE_TYPE_TO_LEVEL[card.code_type]) {
    throw new TypeError('computeNewMembership: card.code_type 必须是 monthly/yearly/permanent');
  }

  // 永久卡：直接覆盖
  if (card.code_type === 'permanent') {
    return {
      vip_level: 3,
      vip_expires_at: new Date(PERMANENT_SENTINEL),
      days_added: null // 永久卡不计天数
    };
  }

  // 月卡 / 年卡：基于 max(now, 当前到期日) 累加
  const days = Number(card.duration_days);
  if (!Number.isInteger(days) || days < 1) {
    throw new TypeError('computeNewMembership: card.duration_days 必须是正整数');
  }

  const base = currentExpires && currentExpires > now ? new Date(currentExpires) : new Date(now);
  base.setDate(base.getDate() + days);

  const codeLevel = CODE_TYPE_TO_LEVEL[card.code_type];
  return {
    vip_level: Math.max(currentLevel, codeLevel),
    vip_expires_at: base,
    days_added: days
  };
}

/**
 * 判断指定用户当前是否享会员权益
 * @param {number|null} userId
 * @param {Object} [options]
 * @param {Object} [options.pool] 可注入连接池便于测试
 * @returns {Promise<boolean>}
 */
async function isMember(userId, options = {}) {
  if (!userId) return false;
  const pool = options.pool || require('../config/database').pool;
  const [rows] = await pool.query(
    'SELECT vip_level, vip_expires_at, vip_status FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  if (rows.length === 0) return false;
  const u = rows[0];
  if (Number(u.vip_status) === 0) return false; // 被管理员停用
  if (Number(u.vip_level) === 3) return true;
  if (!u.vip_expires_at) return false;
  return new Date(u.vip_expires_at) > new Date();
}

/**
 * 加载完整会员摘要（前端展示用）
 * @param {number|null} userId
 * @param {Object} [options]
 * @returns {Promise<Object|null>}
 */
async function loadMembership(userId, options = {}) {
  if (!userId) return null;
  const pool = options.pool || require('../config/database').pool;
  const [rows] = await pool.query(
    'SELECT vip_level, vip_expires_at, vip_status FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  if (rows.length === 0) return null;
  const u = rows[0];

  const level = Number(u.vip_level || 0);
  // 注意：不能用 `u.vip_status || 1`，因为 vip_status=0 是停用语义，会被 || 当成 falsy 替换为 1
  const status = u.vip_status === undefined || u.vip_status === null ? 1 : Number(u.vip_status);
  const expiresAt = toDate(u.vip_expires_at);
  const now = new Date();
  const isPermanent = level === 3;
  const isActive =
    status === 1 &&
    (isPermanent || (expiresAt !== null && expiresAt > now));

  let daysRemaining = null;
  if (!isPermanent && expiresAt) {
    const diffMs = expiresAt.getTime() - now.getTime();
    daysRemaining = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
  }

  return {
    vip_level: level,
    vip_level_label: LEVEL_LABELS[level] || '普通用户',
    vip_expires_at: expiresAt,
    vip_status: status,
    is_active: isActive,
    is_permanent: isPermanent,
    days_remaining: daysRemaining
  };
}

module.exports = {
  PERMANENT_SENTINEL,
  CODE_TYPE_TO_LEVEL,
  CODE_TYPE_TO_DAYS,
  LEVEL_LABELS,
  MembershipConflictError,
  computeNewMembership,
  isMember,
  loadMembership,
  toMysqlDateTime
};
