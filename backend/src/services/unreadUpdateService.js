/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Requirement 24: 书架封面"关注更新"红点
 * Task 28.4
 *
 * 提供两个核心能力：
 *   1) attachUnreadUpdate(rows, options?)
 *      给一组书架行 [{ novel_id, last_seen_chapter_id, ... }] 计算 hasUnreadUpdate。
 *      规则：hasUnreadUpdate = MAX(chapters.id WHERE chapters.novel_id = row.novel_id)
 *                              > (row.last_seen_chapter_id || 0)
 *      使用一次批量 SQL 完成 N 个 novelId 的最大章节号聚合，避免 N+1 查询。
 *   2) markChapterAsRead(userId, novelId, chapterId, options?)
 *      在用户阅读到新章节时单调推进 bookshelf.last_seen_chapter_id：
 *      UPDATE bookshelf SET last_seen_chapter_id = GREATEST(COALESCE(...,0), ?)
 *      WHERE user_id = ? AND novel_id = ?
 *      该函数禁止递减 last_seen_chapter_id（GREATEST 兜底）。
 */

const { pool: defaultPool } = require('../config/database');

function safePositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function safeNonNegativeInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * 批量计算并附加 hasUnreadUpdate 字段
 *
 * @param {Array<Object>} rows  书架行（必须含 novel_id 与 last_seen_chapter_id）
 * @param {{ db?: { query: Function } }} [options]
 * @returns {Promise<Array<Object>>} 与输入同序、同长度的新数组，每行带 hasUnreadUpdate
 */
async function attachUnreadUpdate(rows, options = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const db = options.db || defaultPool;

  const novelIds = [
    ...new Set(
      rows
        .map(row => safePositiveInt(row && row.novel_id))
        .filter(id => id !== null)
    )
  ];

  if (novelIds.length === 0) {
    return rows.map(row => ({ ...row, hasUnreadUpdate: false }));
  }

  const placeholders = novelIds.map(() => '?').join(',');
  const sql = `SELECT novel_id, MAX(id) AS latest_chapter_id
               FROM chapters
               WHERE novel_id IN (${placeholders})
               GROUP BY novel_id`;
  const [latestRows] = await db.query(sql, novelIds);

  const latestMap = new Map();
  for (const row of latestRows || []) {
    const novelId = safePositiveInt(row.novel_id);
    if (novelId === null) continue;
    const latest = safeNonNegativeInt(row.latest_chapter_id);
    latestMap.set(novelId, latest);
  }

  return rows.map(row => {
    const novelId = safePositiveInt(row && row.novel_id);
    const latest = novelId !== null ? (latestMap.get(novelId) || 0) : 0;
    const lastSeen = safeNonNegativeInt(row && row.last_seen_chapter_id);
    return { ...row, hasUnreadUpdate: latest > lastSeen };
  });
}

/**
 * 单调推进 bookshelf.last_seen_chapter_id（read-monotonic）
 *
 * @param {number} userId
 * @param {number} novelId
 * @param {number} chapterId
 * @param {{ db?: { query: Function } }} [options]
 * @returns {Promise<{ updated: number }>}
 */
async function markChapterAsRead(userId, novelId, chapterId, options = {}) {
  const uId = safePositiveInt(userId);
  const nId = safePositiveInt(novelId);
  const cId = safePositiveInt(chapterId);
  if (!uId || !nId || !cId) {
    return { updated: 0 };
  }

  const db = options.db || defaultPool;

  try {
    const [result] = await db.query(
      `UPDATE bookshelf
         SET last_seen_chapter_id = GREATEST(COALESCE(last_seen_chapter_id, 0), ?),
             updated_at = NOW()
       WHERE user_id = ? AND novel_id = ?`,
      [cId, uId, nId]
    );
    return { updated: result?.affectedRows || 0 };
  } catch (error) {
    // 列不存在等场景下忽略，红点功能为渐进式增强
    if (error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054)) {
      return { updated: 0 };
    }
    throw error;
  }
}

module.exports = {
  attachUnreadUpdate,
  markChapterAsRead
};
