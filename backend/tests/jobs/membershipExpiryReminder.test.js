/**
 * 会员到期提醒任务单元测试
 *
 * 验证：
 * 1. 三档（1 天 / 3 天 / 7 天）剩余天数的用户都会被命中
 * 2. 永久会员（vip_level=3）和已停用（vip_status=0）的用户跳过（不在 SQL 范围内）
 * 3. 重复执行幂等（已存在相同 token 的 notifications 记录就跳过）
 * 4. 不在三档窗口内的用户不会被命中
 */

const {
  runMembershipExpiryReminder,
  REMINDER_DAYS
} = require('../../src/jobs/membershipExpiryReminder');

const FIXED_NOW = new Date('2026-06-01T09:00:00');

/**
 * 构造一个 mock pool：
 *   - 对 SELECT users 按 daysLeft 返回不同结果
 *   - 对 SELECT 1 FROM notifications 返回 existingTokens 集合里包含的就是已存在
 *   - 对 INSERT INTO notifications 累加到 inserted 数组
 */
function buildPool({ usersByDaysLeft = {}, existingTokens = [] } = {}) {
  const inserted = [];
  const queries = [];

  const pool = {
    query: jest.fn(async (sql, params) => {
      queries.push({ sql, params });

      if (/SELECT id, vip_expires_at\s+FROM users/i.test(sql)) {
        // 通过 start 参数倒推 daysLeft
        const startStr = params[0];
        const start = new Date(startStr.replace(' ', 'T'));
        const today = new Date(FIXED_NOW.getFullYear(), FIXED_NOW.getMonth(), FIXED_NOW.getDate());
        const daysLeft = Math.round((start.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        const users = usersByDaysLeft[daysLeft] || [];
        return [users, []];
      }

      if (/SELECT 1 FROM notifications/i.test(sql)) {
        // params[1] = '%[reminder:userId-expiresAt-daysLeft]%'
        const pattern = params[1];
        const matched = existingTokens.some((t) => pattern.includes(t));
        return [matched ? [{ '1': 1 }] : [], []];
      }

      if (/INSERT INTO notifications/i.test(sql)) {
        inserted.push({ sql, params });
        return [{ insertId: inserted.length, affectedRows: 1 }, []];
      }

      return [[], []];
    })
  };

  return { pool, inserted, queries };
}

describe('runMembershipExpiryReminder', () => {
  it('三档（1/3/7 天）的用户都被命中并写入 notifications', async () => {
    const expires1 = new Date(FIXED_NOW);
    expires1.setDate(expires1.getDate() + 1);
    expires1.setHours(10, 0, 0, 0);

    const expires3 = new Date(FIXED_NOW);
    expires3.setDate(expires3.getDate() + 3);
    expires3.setHours(15, 0, 0, 0);

    const expires7 = new Date(FIXED_NOW);
    expires7.setDate(expires7.getDate() + 7);
    expires7.setHours(20, 0, 0, 0);

    const { pool, inserted } = buildPool({
      usersByDaysLeft: {
        1: [{ id: 101, vip_expires_at: expires1 }],
        3: [{ id: 102, vip_expires_at: expires3 }],
        7: [{ id: 103, vip_expires_at: expires7 }]
      }
    });

    const result = await runMembershipExpiryReminder({ pool, now: FIXED_NOW });

    expect(result.scheduled).toBe(3);
    expect(result.skipped).toBe(0);
    expect(inserted).toHaveLength(3);

    // 校验内容里包含日期 + 剩余天数 + 续费链接
    const contents = inserted.map((row) => row.params[2]);
    expect(contents.some((c) => c.includes('剩余 1 天'))).toBe(true);
    expect(contents.some((c) => c.includes('剩余 3 天'))).toBe(true);
    expect(contents.some((c) => c.includes('剩余 7 天'))).toBe(true);

    // 链接为 /profile/membership
    inserted.forEach((row) => {
      expect(row.params[3]).toBe('/profile/membership');
    });
  });

  it('幂等：同一个用户 + 同一个到期日 + 同一个 daysLeft，重复运行不会重复写入', async () => {
    const expires3 = new Date(FIXED_NOW);
    expires3.setDate(expires3.getDate() + 3);
    expires3.setHours(15, 0, 0, 0);

    const userId = 200;
    const expiresUnix = Math.floor(expires3.getTime() / 1000);
    const existingToken = `[reminder:${userId}-${expiresUnix}-3]`;

    const { pool, inserted } = buildPool({
      usersByDaysLeft: {
        3: [{ id: userId, vip_expires_at: expires3 }]
      },
      existingTokens: [existingToken]
    });

    const result = await runMembershipExpiryReminder({ pool, now: FIXED_NOW });

    expect(result.scheduled).toBe(0);
    expect(result.skipped).toBe(1);
    expect(inserted).toHaveLength(0);
  });

  it('永久会员 / 已停用的用户：SQL where 已限制（vip_level IN (1,2) AND vip_status=1），mock pool 返回空', async () => {
    // 该测试用例确认：当 mock 不返回任何用户时，job 安静跳过
    const { pool, inserted, queries } = buildPool({ usersByDaysLeft: {} });

    const result = await runMembershipExpiryReminder({ pool, now: FIXED_NOW });

    expect(result.scheduled).toBe(0);
    expect(result.skipped).toBe(0);
    expect(inserted).toHaveLength(0);

    // 校验真实 SQL 包含正确的 where 子句
    const userQueries = queries.filter((q) => /FROM users/i.test(q.sql));
    expect(userQueries).toHaveLength(REMINDER_DAYS.length);
    userQueries.forEach((q) => {
      expect(q.sql).toMatch(/vip_status\s*=\s*1/);
      expect(q.sql).toMatch(/vip_level\s+IN\s*\(\s*1\s*,\s*2\s*\)/);
    });
  });

  it('落在三档窗口外的用户不会被命中（mock 仅返回 1/3/7 档）', async () => {
    // 模拟：DB 里有一个剩余 5 天的用户。SQL 的 BETWEEN 限制不会查询它，mock 在 daysLeft=5 时不会被请求。
    const { pool, inserted, queries } = buildPool({ usersByDaysLeft: {} });

    const result = await runMembershipExpiryReminder({ pool, now: FIXED_NOW });
    expect(result.scheduled).toBe(0);

    // 仅扫了 [1, 3, 7] 三档，不会扫描 [2, 4, 5, 6] 等
    const userQueries = queries.filter((q) => /FROM users/i.test(q.sql));
    expect(userQueries).toHaveLength(3);
  });

  it('入参校验：未传 pool 抛错', async () => {
    await expect(runMembershipExpiryReminder({})).rejects.toThrow(TypeError);
  });
});
