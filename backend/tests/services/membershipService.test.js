/**
 * membershipService 单元测试 — 续期算法 12 种状态转换 + isMember/loadMembership
 *
 * R-2 续期表（来自 requirements.md §5）：
 * | 当前状态        | 月卡(+30)               | 年卡(+365)              | 永久                |
 * |-----------------|--------------------------|--------------------------|---------------------|
 * | 非会员/已过期    | now+30, level=1          | now+365, level=2         | 永久, level=3       |
 * | 月卡未过期       | 剩余+30, level=1         | 剩余+365, level=2        | 永久, level=3       |
 * | 年卡未过期       | 剩余+30, level=2         | 剩余+365, level=2        | 永久, level=3       |
 * | 永久            | 拒绝                     | 拒绝                     | 拒绝                |
 */

const {
  computeNewMembership,
  MembershipConflictError,
  isMember,
  loadMembership,
  PERMANENT_SENTINEL
} = require('../../src/services/membershipService');

const NOW = new Date('2026-05-17T12:00:00Z');
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const MONTHLY_CARD = { code_type: 'monthly', duration_days: 30 };
const YEARLY_CARD = { code_type: 'yearly', duration_days: 365 };
const PERMANENT_CARD = { code_type: 'permanent', duration_days: 99999 };

function daysBetween(later, earlier) {
  return Math.round((later.getTime() - earlier.getTime()) / ONE_DAY_MS);
}

describe('membershipService.computeNewMembership', () => {
  // ============================================================
  // 第 1 行：非会员 / 已过期
  // ============================================================
  describe('当前是非会员 / 已过期', () => {
    const cases = [
      { name: '从未开通', current: { vip_level: 0, vip_expires_at: null } },
      {
        name: '已过期',
        current: { vip_level: 1, vip_expires_at: new Date(NOW.getTime() - ONE_DAY_MS) }
      }
    ];

    for (const { name, current } of cases) {
      it(`${name} + 月卡 → now+30，level=1`, () => {
        const r = computeNewMembership(current, MONTHLY_CARD, NOW);
        expect(r.vip_level).toBe(1);
        expect(daysBetween(r.vip_expires_at, NOW)).toBe(30);
        expect(r.days_added).toBe(30);
      });

      it(`${name} + 年卡 → now+365，level=2`, () => {
        const r = computeNewMembership(current, YEARLY_CARD, NOW);
        expect(r.vip_level).toBe(2);
        expect(daysBetween(r.vip_expires_at, NOW)).toBe(365);
        expect(r.days_added).toBe(365);
      });

      it(`${name} + 永久 → 永久日期，level=3`, () => {
        const r = computeNewMembership(current, PERMANENT_CARD, NOW);
        expect(r.vip_level).toBe(3);
        expect(r.vip_expires_at.toISOString().startsWith('2099-')).toBe(true);
        expect(r.days_added).toBeNull();
      });
    }
  });

  // ============================================================
  // 第 2 行：月卡未过期
  // ============================================================
  describe('当前月卡未过期（剩余 10 天）', () => {
    const expiresAt = new Date(NOW.getTime() + 10 * ONE_DAY_MS);
    const current = { vip_level: 1, vip_expires_at: expiresAt };

    it('月卡 + 月卡 → 剩余+30，level=1', () => {
      const r = computeNewMembership(current, MONTHLY_CARD, NOW);
      expect(r.vip_level).toBe(1);
      expect(daysBetween(r.vip_expires_at, NOW)).toBe(40); // 10 + 30
    });

    it('月卡 + 年卡 → 剩余+365，level=2 升级', () => {
      const r = computeNewMembership(current, YEARLY_CARD, NOW);
      expect(r.vip_level).toBe(2);
      expect(daysBetween(r.vip_expires_at, NOW)).toBe(375); // 10 + 365
    });

    it('月卡 + 永久 → level=3，到期 2099', () => {
      const r = computeNewMembership(current, PERMANENT_CARD, NOW);
      expect(r.vip_level).toBe(3);
      expect(r.vip_expires_at.toISOString().startsWith('2099-')).toBe(true);
    });
  });

  // ============================================================
  // 第 3 行：年卡未过期
  // ============================================================
  describe('当前年卡未过期（剩余 100 天）', () => {
    const expiresAt = new Date(NOW.getTime() + 100 * ONE_DAY_MS);
    const current = { vip_level: 2, vip_expires_at: expiresAt };

    it('年卡 + 月卡 → 剩余+30，level 保留为 2（不降级）', () => {
      const r = computeNewMembership(current, MONTHLY_CARD, NOW);
      expect(r.vip_level).toBe(2); // 不降级到 1
      expect(daysBetween(r.vip_expires_at, NOW)).toBe(130);
    });

    it('年卡 + 年卡 → 剩余+365，level=2', () => {
      const r = computeNewMembership(current, YEARLY_CARD, NOW);
      expect(r.vip_level).toBe(2);
      expect(daysBetween(r.vip_expires_at, NOW)).toBe(465);
    });

    it('年卡 + 永久 → level=3', () => {
      const r = computeNewMembership(current, PERMANENT_CARD, NOW);
      expect(r.vip_level).toBe(3);
    });
  });

  // ============================================================
  // 第 4 行：永久会员
  // ============================================================
  describe('当前是永久会员', () => {
    const current = { vip_level: 3, vip_expires_at: new Date(PERMANENT_SENTINEL) };

    it('永久 + 月卡 → 抛 MembershipConflictError', () => {
      expect(() => computeNewMembership(current, MONTHLY_CARD, NOW)).toThrow(MembershipConflictError);
    });

    it('永久 + 年卡 → 抛错', () => {
      expect(() => computeNewMembership(current, YEARLY_CARD, NOW)).toThrow(MembershipConflictError);
    });

    it('永久 + 永久 → 抛错', () => {
      expect(() => computeNewMembership(current, PERMANENT_CARD, NOW)).toThrow(MembershipConflictError);
    });
  });

  // ============================================================
  // 入参校验
  // ============================================================
  describe('入参校验', () => {
    it('未知 code_type 抛错', () => {
      expect(() =>
        computeNewMembership({ vip_level: 0 }, { code_type: 'lifetime', duration_days: 1 }, NOW)
      ).toThrow(TypeError);
    });

    it('duration_days 不是正整数抛错', () => {
      expect(() =>
        computeNewMembership({ vip_level: 0 }, { code_type: 'monthly', duration_days: 0 }, NOW)
      ).toThrow(TypeError);

      expect(() =>
        computeNewMembership({ vip_level: 0 }, { code_type: 'yearly', duration_days: -10 }, NOW)
      ).toThrow(TypeError);
    });
  });
});

// ============================================================
// isMember / loadMembership：用 mock pool
// ============================================================
function mockPool(rows) {
  return {
    query: jest.fn(async () => [rows, []])
  };
}

describe('membershipService.isMember', () => {
  it('userId 为 null/undefined 返回 false', async () => {
    expect(await isMember(null)).toBe(false);
    expect(await isMember(undefined)).toBe(false);
  });

  it('vip_status=0 即便永久也返回 false', async () => {
    const pool = mockPool([{ vip_level: 3, vip_expires_at: new Date(PERMANENT_SENTINEL), vip_status: 0 }]);
    expect(await isMember(1, { pool })).toBe(false);
  });

  it('vip_level=3 永久会员返回 true', async () => {
    const pool = mockPool([{ vip_level: 3, vip_expires_at: new Date(PERMANENT_SENTINEL), vip_status: 1 }]);
    expect(await isMember(1, { pool })).toBe(true);
  });

  it('月卡未过期返回 true', async () => {
    const future = new Date(Date.now() + 86400000);
    const pool = mockPool([{ vip_level: 1, vip_expires_at: future, vip_status: 1 }]);
    expect(await isMember(1, { pool })).toBe(true);
  });

  it('月卡已过期返回 false', async () => {
    const past = new Date(Date.now() - 86400000);
    const pool = mockPool([{ vip_level: 1, vip_expires_at: past, vip_status: 1 }]);
    expect(await isMember(1, { pool })).toBe(false);
  });

  it('用户不存在返回 false', async () => {
    const pool = mockPool([]);
    expect(await isMember(999, { pool })).toBe(false);
  });

  it('从未开通返回 false', async () => {
    const pool = mockPool([{ vip_level: 0, vip_expires_at: null, vip_status: 1 }]);
    expect(await isMember(1, { pool })).toBe(false);
  });
});

describe('membershipService.loadMembership', () => {
  it('永久会员', async () => {
    const pool = mockPool([{ vip_level: 3, vip_expires_at: new Date(PERMANENT_SENTINEL), vip_status: 1 }]);
    const m = await loadMembership(1, { pool });
    expect(m.is_permanent).toBe(true);
    expect(m.is_active).toBe(true);
    expect(m.days_remaining).toBeNull();
    expect(m.vip_level_label).toBe('永久会员');
  });

  it('月卡剩 5 天', async () => {
    const future = new Date(Date.now() + 5 * 86400000);
    const pool = mockPool([{ vip_level: 1, vip_expires_at: future, vip_status: 1 }]);
    const m = await loadMembership(1, { pool });
    expect(m.is_permanent).toBe(false);
    expect(m.is_active).toBe(true);
    expect(m.days_remaining).toBeGreaterThanOrEqual(5);
    expect(m.days_remaining).toBeLessThanOrEqual(6);
    expect(m.vip_level_label).toBe('月卡会员');
  });

  it('已过期', async () => {
    const past = new Date(Date.now() - 86400000);
    const pool = mockPool([{ vip_level: 1, vip_expires_at: past, vip_status: 1 }]);
    const m = await loadMembership(1, { pool });
    expect(m.is_active).toBe(false);
    expect(m.days_remaining).toBe(0);
  });

  it('被管理员停用 → is_active=false 但仍能看到等级', async () => {
    const future = new Date(Date.now() + 100 * 86400000);
    const pool = mockPool([{ vip_level: 2, vip_expires_at: future, vip_status: 0 }]);
    const m = await loadMembership(1, { pool });
    expect(m.is_active).toBe(false);
    expect(m.vip_level).toBe(2);
    expect(m.vip_status).toBe(0);
  });

  it('userId 为空返回 null', async () => {
    expect(await loadMembership(null)).toBeNull();
  });
});

// ============================================================
// effective_level / effective_level_label：自然回落
// ============================================================
describe('membershipService.loadMembership.effective_level', () => {
  it('永久会员 → effective_level=3 / 永久会员', async () => {
    const pool = mockPool([{ vip_level: 3, vip_expires_at: new Date(PERMANENT_SENTINEL), vip_status: 1 }]);
    const m = await loadMembership(1, { pool });
    expect(m.effective_level).toBe(3);
    expect(m.effective_level_label).toBe('永久会员');
  });

  it('月卡未过期 + status=1 → effective_level=1', async () => {
    const future = new Date(Date.now() + 5 * 86400000);
    const pool = mockPool([{ vip_level: 1, vip_expires_at: future, vip_status: 1 }]);
    const m = await loadMembership(1, { pool });
    expect(m.effective_level).toBe(1);
    expect(m.effective_level_label).toBe('月卡会员');
  });

  it('年卡未过期 + status=1 → effective_level=2', async () => {
    const future = new Date(Date.now() + 100 * 86400000);
    const pool = mockPool([{ vip_level: 2, vip_expires_at: future, vip_status: 1 }]);
    const m = await loadMembership(1, { pool });
    expect(m.effective_level).toBe(2);
    expect(m.effective_level_label).toBe('年卡会员');
  });

  it('月卡已过期 → effective_level=0 / 普通用户（vip_level 仍保留 1 用于历史展示）', async () => {
    const past = new Date(Date.now() - 86400000);
    const pool = mockPool([{ vip_level: 1, vip_expires_at: past, vip_status: 1 }]);
    const m = await loadMembership(1, { pool });
    expect(m.is_active).toBe(false);
    expect(m.vip_level).toBe(1);
    expect(m.effective_level).toBe(0);
    expect(m.effective_level_label).toBe('普通用户');
  });

  it('年卡已过期 → effective_level=0', async () => {
    const past = new Date(Date.now() - 86400000);
    const pool = mockPool([{ vip_level: 2, vip_expires_at: past, vip_status: 1 }]);
    const m = await loadMembership(1, { pool });
    expect(m.effective_level).toBe(0);
    expect(m.effective_level_label).toBe('普通用户');
  });

  it('月卡未过期但 status=0（被停用） → effective_level=0', async () => {
    const future = new Date(Date.now() + 5 * 86400000);
    const pool = mockPool([{ vip_level: 1, vip_expires_at: future, vip_status: 0 }]);
    const m = await loadMembership(1, { pool });
    expect(m.is_active).toBe(false);
    expect(m.vip_level).toBe(1);
    expect(m.effective_level).toBe(0);
    expect(m.effective_level_label).toBe('普通用户');
  });

  it('普通用户从未开通 → effective_level=0', async () => {
    const pool = mockPool([{ vip_level: 0, vip_expires_at: null, vip_status: 1 }]);
    const m = await loadMembership(1, { pool });
    expect(m.effective_level).toBe(0);
    expect(m.effective_level_label).toBe('普通用户');
  });
});
