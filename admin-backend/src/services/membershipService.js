/**
 * 会员服务（admin-backend 精简版）
 *
 * 这一份是从 backend/src/services/membershipService.js 复制过来的纯函数子集，
 * 仅保留 admin-backend 用得到的部分：
 *   - computeNewMembership：续期算法（纯函数）
 *   - MembershipConflictError：永久会员冲突
 *   - PERMANENT_SENTINEL / CODE_TYPE_TO_LEVEL / CODE_TYPE_TO_DAYS / LEVEL_LABELS
 *
 * 删去了 isMember / loadMembership：admin 端没有"自动按会员看 VIP"的需求；
 * 而且 admin-backend 的 db 引用方式（`module.exports = pool`）与 backend 不同，
 * 直接复用 isMember 会走错连接池。
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

class MembershipConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MembershipConflictError';
    this.code = 'PERMANENT_ALREADY';
  }
}

function toDate(input) {
  if (!input) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toMysqlDateTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function computeNewMembership(current, card, now = new Date()) {
  const currentLevel = Number(current?.vip_level || 0);
  const currentExpires = toDate(current?.vip_expires_at);

  if (currentLevel === 3) {
    throw new MembershipConflictError('您已是永久会员，无需激活');
  }

  if (!card || !CODE_TYPE_TO_LEVEL[card.code_type]) {
    throw new TypeError('computeNewMembership: card.code_type 必须是 monthly/yearly/permanent');
  }

  if (card.code_type === 'permanent') {
    return {
      vip_level: 3,
      vip_expires_at: new Date(PERMANENT_SENTINEL),
      days_added: null
    };
  }

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

module.exports = {
  PERMANENT_SENTINEL,
  CODE_TYPE_TO_LEVEL,
  CODE_TYPE_TO_DAYS,
  LEVEL_LABELS,
  MembershipConflictError,
  computeNewMembership,
  toMysqlDateTime
};
