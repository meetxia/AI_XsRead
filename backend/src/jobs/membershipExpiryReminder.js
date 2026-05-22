/**
 * 会员到期提醒定时任务
 *
 * 触发条件：每天 8:00 扫描所有"明天 / 3 天后 / 7 天后到期"的月卡 / 年卡会员，
 * 写入一条 type='membership' 通知。永久会员（vip_level=3）不参与；vip_status=0
 * 已停用的用户不再续费提醒。
 *
 * 幂等性：通过在 content 末尾嵌入机器可识别的 token
 * `[reminder:userId-expiresAtUnix-daysLeft]` 来去重，重复执行不会重复发送。
 *
 * 接口：
 *   - runMembershipExpiryReminder({ pool, now? }): 纯异步函数，可被测试 / 手工触发
 *   - scheduleMembershipExpiryReminder({ pool, cronExpr? }): 用 node-cron 注册
 */

const cron = require('node-cron');

const REMINDER_DAYS = [1, 3, 7];

/**
 * 给定目标剩余天数 daysLeft，构造该用户的提醒 SQL 数据
 */
function buildReminderContent({ userId, expiresAt, daysLeft }) {
  // 用本地"日历日期"展示，避免在不同时区显示成"前一天"
  const dateLabel = formatDate(expiresAt);
  const tail = `[reminder:${userId}-${Math.floor(expiresAt.getTime() / 1000)}-${daysLeft}]`;
  return {
    title: '会员即将到期',
    content: `您的会员将于 ${dateLabel} 到期，剩余 ${daysLeft} 天，立即续费可享受不间断的会员权益。${tail}`,
    link: '/profile/membership',
    token: tail
  };
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 构造区间 [now + (daysLeft) 天, now + (daysLeft+1) 天) 的查询参数
 *
 * "明天到期"=：到期时刻落在 now+1 ~ now+2 之间（精确到天）
 * 也即 [00:00 of (today+daysLeft), 00:00 of (today+daysLeft+1))
 */
function dayRange(now, daysLeft) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() + daysLeft);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function toMysqlDateTime(date) {
  const y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${M}-${d} ${h}:${m}:${s}`;
}

/**
 * 主入口：扫描 + 写入通知
 *
 * @param {Object} options
 * @param {Object} options.pool - mysql2 promise pool（必需）
 * @param {Date}   [options.now] - 当前时间，便于测试（默认 new Date()）
 * @returns {Promise<{ scheduled: number, skipped: number }>}
 */
async function runMembershipExpiryReminder({ pool, now = new Date() } = {}) {
  if (!pool) throw new TypeError('runMembershipExpiryReminder: pool 必须传入');

  let scheduled = 0;
  let skipped = 0;

  for (const daysLeft of REMINDER_DAYS) {
    const { start, end } = dayRange(now, daysLeft);

    // 仅扫描 vip_level IN (1, 2)（月卡 / 年卡）+ status=1
    // 永久会员 vip_level=3 自然被排除
    const [users] = await pool.query(
      `SELECT id, vip_expires_at
         FROM users
        WHERE vip_status = 1
          AND vip_level IN (1, 2)
          AND vip_expires_at >= ?
          AND vip_expires_at < ?`,
      [toMysqlDateTime(start), toMysqlDateTime(end)]
    );

    for (const u of users) {
      const expiresAt = u.vip_expires_at instanceof Date
        ? u.vip_expires_at
        : new Date(u.vip_expires_at);
      if (Number.isNaN(expiresAt.getTime())) {
        skipped += 1;
        continue;
      }

      const { title, content, link, token } = buildReminderContent({
        userId: u.id,
        expiresAt,
        daysLeft
      });

      // 幂等：同一个 token 已经存在就不再写入
      const [exists] = await pool.query(
        `SELECT 1 FROM notifications
          WHERE user_id = ?
            AND type = 'membership'
            AND content LIKE ?
          LIMIT 1`,
        [u.id, `%${token}%`]
      );

      if (exists.length > 0) {
        skipped += 1;
        continue;
      }

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, content, link, is_read)
         VALUES (?, 'membership', ?, ?, ?, 0)`,
        [u.id, title, content, link]
      );
      scheduled += 1;
    }
  }

  return { scheduled, skipped };
}

/**
 * 注册 cron：每天 8:00 跑一次
 *
 * @param {Object} options
 * @param {Object} options.pool
 * @param {string} [options.cronExpr='0 8 * * *']
 * @param {boolean} [options.runOnStart=true] - 启动时立即跑一次
 * @returns {{ task: import('node-cron').ScheduledTask, stop: () => void }}
 */
function scheduleMembershipExpiryReminder({
  pool,
  cronExpr = '0 8 * * *',
  runOnStart = true
} = {}) {
  if (!pool) throw new TypeError('scheduleMembershipExpiryReminder: pool 必须传入');

  const handler = async () => {
    try {
      const result = await runMembershipExpiryReminder({ pool });
      console.log(
        `[membershipExpiryReminder] scheduled=${result.scheduled} skipped=${result.skipped}`
      );
    } catch (err) {
      console.error('[membershipExpiryReminder] 任务失败:', err.message);
    }
  };

  const task = cron.schedule(cronExpr, handler);
  if (runOnStart) {
    // 立即试运行一次（catch 已在 handler 内，无需 .catch）
    setImmediate(handler);
  }
  return {
    task,
    stop: () => task.stop()
  };
}

module.exports = {
  runMembershipExpiryReminder,
  scheduleMembershipExpiryReminder,
  REMINDER_DAYS
};
