/**
 * 推荐服务 — wechat-jjwxc-parity-upgrade Property 17
 *
 * 推荐管线：四个加权打分分支（参考 design.md "推荐管线（含冷启动）" 章节）。
 *   - guest：score = 0.5 * popularity + 0.5 * freshness
 *   - cold (新注册 / interest tags only)：score = jaccard(novelTags, interestTags)
 *   - cold (低活跃 30 天 history < 3)：score = 0.6 * tagSim + 0 * cf + 0.3 * durationFit + 0.1 * freshness
 *   - warm：score = 0.4 * tagSim + 0.3 * durationFit + 0.2 * cf + 0.1 * freshness
 *
 * 所有 sub-score 归一化到 [0, 1]，详见 README inside this file.
 *
 * 不变量（被 Property 17 守住）：
 *   1. 每条 list 项的 score ∈ [0, 1]
 *   2. strategy 分支由 (userId, last30dHistoryCount, hasInterestTags) 决定
 *   3. 候选集去重后 < 10 时，从 fallbackTop(20) 兜底补齐
 *   4. 冷启动分支 cf 权重恒为 0
 *
 * 任何子查询失败都会被 try/catch 兜底为 fallbackTop(20)，但 strategy 字段保持原值。
 */
const { pool } = require('../config/database');
const memoryCache = require('../utils/memoryCache');

const HALF_LIFE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 60_000;
const CANDIDATE_POOL_MULTIPLIER = 5;
const CANDIDATE_POOL_MIN = 50;
const CF_READER_LIMIT = 50;
const FALLBACK_PAD_THRESHOLD = 10;
const FALLBACK_PAD_FETCH = 20;

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function positiveInt(value, fallback = 20) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function buildNovelSelectColumns() {
  return `n.id, n.title, n.author, n.cover, n.description, n.category_id,
          n.status, n.views, n.likes, n.rating, n.word_count, n.chapter_count,
          n.collections, n.is_recommended, n.is_hot, n.last_chapter_title,
          n.last_update_time, n.updated_at, c.name AS category_name`;
}

async function fetchCandidates(limit) {
  const poolSize = Math.max(limit * CANDIDATE_POOL_MULTIPLIER, CANDIDATE_POOL_MIN);
  const [rows] = await pool.query(
    `SELECT ${buildNovelSelectColumns()}
     FROM novels n
     LEFT JOIN categories c ON c.id = n.category_id
     ORDER BY n.rating DESC, n.views DESC, n.updated_at DESC
     LIMIT ?`,
    [poolSize]
  );
  return Array.isArray(rows) ? rows : [];
}

async function fallbackTop(limit) {
  const [rows] = await pool.query(
    `SELECT ${buildNovelSelectColumns()}
     FROM novels n
     LEFT JOIN categories c ON c.id = n.category_id
     ORDER BY n.rating DESC, n.views DESC, n.updated_at DESC
     LIMIT ?`,
    [limit]
  );
  return Array.isArray(rows) ? rows : [];
}

async function getHistoryCount(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM reading_history
     WHERE user_id = ? AND read_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
    [userId]
  );
  return Number(rows?.[0]?.total || 0);
}

async function fetchInterestTags(userId) {
  try {
    const [rows] = await pool.query(
      `SELECT tag, weight FROM user_interest_tags
       WHERE user_id = ? ORDER BY weight DESC LIMIT 20`,
      [userId]
    );
    return new Set((rows || []).map((r) => r.tag));
  } catch (error) {
    return new Set();
  }
}

async function fetchNovelTagMap(novelIds) {
  const map = new Map();
  if (!novelIds.length) return map;
  const placeholders = novelIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT nt.novel_id, t.name AS tag
     FROM novel_tags nt
     JOIN tags t ON t.id = nt.tag_id
     WHERE nt.novel_id IN (${placeholders})`,
    novelIds
  );
  for (const r of rows || []) {
    if (!map.has(r.novel_id)) map.set(r.novel_id, new Set());
    map.get(r.novel_id).add(r.tag);
  }
  return map;
}

async function fetchRecentTagSet(userId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT t.name AS tag
     FROM (
       SELECT novel_id FROM bookshelf WHERE user_id = ?
       UNION
       SELECT novel_id FROM reading_history
         WHERE user_id = ? AND read_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     ) AS recent
     JOIN novel_tags nt ON nt.novel_id = recent.novel_id
     JOIN tags t ON t.id = nt.tag_id`,
    [userId, userId]
  );
  return new Set((rows || []).map((r) => r.tag));
}

async function fetchCategoryDurationShares(userId) {
  const [rows] = await pool.query(
    `SELECT n.category_id AS categoryId, SUM(rh.duration) AS dur
     FROM reading_history rh
     JOIN novels n ON n.id = rh.novel_id
     WHERE rh.user_id = ? AND rh.read_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY n.category_id`,
    [userId]
  );
  const map = new Map();
  const total = (rows || []).reduce((sum, r) => sum + Number(r.dur || 0), 0);
  if (total <= 0) return map;
  for (const r of rows || []) {
    map.set(r.categoryId, Number(r.dur || 0) / total);
  }
  return map;
}

async function fetchCfMap(userId) {
  const map = new Map();
  // 1) 用户最近 30 天阅读的最近一本小说
  const [recentRows] = await pool.query(
    `SELECT novel_id FROM reading_history
     WHERE user_id = ? AND read_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     ORDER BY read_time DESC LIMIT 1`,
    [userId]
  );
  if (!recentRows?.length) return map;
  const recentNovelId = recentRows[0].novel_id;

  // 2) 也读过这本书的其他读者（LIMIT 50，限制工作量）
  const [readers] = await pool.query(
    `SELECT DISTINCT user_id FROM reading_history
     WHERE novel_id = ? AND user_id <> ? LIMIT ?`,
    [recentNovelId, userId, CF_READER_LIMIT]
  );
  const readerIds = (readers || []).map((r) => r.user_id);
  if (!readerIds.length) return map;

  // 3) 这些读者读过的其他作品出现次数
  const placeholders = readerIds.map(() => '?').join(',');
  const [reads] = await pool.query(
    `SELECT novel_id, COUNT(DISTINCT user_id) AS cnt
     FROM reading_history WHERE user_id IN (${placeholders})
     GROUP BY novel_id`,
    readerIds
  );
  const totalReaders = readerIds.length;
  for (const r of reads || []) {
    map.set(r.novel_id, Math.min(1, Number(r.cnt || 0) / totalReaders));
  }
  return map;
}

function jaccard(setA, setB) {
  if (!setA || !setB) return 0;
  if (!setA.size && !setB.size) return 0;
  let inter = 0;
  for (const x of setA) if (setB.has(x)) inter += 1;
  const union = setA.size + setB.size - inter;
  return union > 0 ? inter / union : 0;
}

function freshnessScore(updatedAt) {
  if (!updatedAt) return 0;
  const ts =
    updatedAt instanceof Date ? updatedAt.getTime() : Date.parse(updatedAt);
  if (!Number.isFinite(ts)) return 0;
  const ageDays = Math.max(0, (Date.now() - ts) / MS_PER_DAY);
  return clamp01(Math.pow(0.5, ageDays / HALF_LIFE_DAYS));
}

function buildPopularityMap(candidates) {
  const map = new Map();
  if (!candidates.length) return map;
  const ratings = candidates.map((c) => Number(c.rating || 0));
  const views = candidates.map((c) => Number(c.views || 0));
  const minR = Math.min(...ratings);
  const maxR = Math.max(...ratings);
  const minV = Math.min(...views);
  const maxV = Math.max(...views);
  for (const c of candidates) {
    const r =
      maxR > minR ? (Number(c.rating || 0) - minR) / (maxR - minR) : 0.5;
    const v =
      maxV > minV ? (Number(c.views || 0) - minV) / (maxV - minV) : 0.5;
    map.set(c.id, clamp01(0.5 * r + 0.5 * v));
  }
  return map;
}

function dedupeById(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function decorateFallback(rows) {
  return rows.map((row) => ({
    ...row,
    score: 0,
    scoreBreakdown: { fallback: true }
  }));
}

async function padWithFallback(list, limit) {
  if (list.length >= FALLBACK_PAD_THRESHOLD) return list;
  try {
    const top = await fallbackTop(FALLBACK_PAD_FETCH);
    const seen = new Set(list.map((i) => i.id));
    const additions = decorateFallback(top.filter((i) => !seen.has(i.id)));
    return [...list, ...additions].slice(0, limit);
  } catch (error) {
    return list.slice(0, limit);
  }
}

function scoreGuest(candidates) {
  const popularity = buildPopularityMap(candidates);
  return candidates
    .map((c) => {
      const popScore = popularity.get(c.id) ?? 0;
      const freshScore = freshnessScore(c.updated_at || c.last_update_time);
      const score = clamp01(0.5 * popScore + 0.5 * freshScore);
      return {
        ...c,
        score,
        scoreBreakdown: {
          popularity: popScore,
          freshness: freshScore,
          tagSim: 0,
          durationFit: 0,
          cf: 0
        }
      };
    })
    .sort((a, b) => b.score - a.score);
}

function scoreColdInterestOnly(candidates, novelTagMap, interestTags) {
  return candidates
    .map((c) => {
      const novelTags = novelTagMap.get(c.id) || new Set();
      const tagSim = clamp01(jaccard(novelTags, interestTags));
      return {
        ...c,
        score: tagSim,
        scoreBreakdown: {
          tagSim,
          cf: 0,
          durationFit: 0,
          freshness: 0,
          popularity: 0
        }
      };
    })
    .sort((a, b) => b.score - a.score);
}

function scoreColdLowActive(candidates, ctx) {
  const { novelTagMap, recentTagSet, durationShares } = ctx;
  return candidates
    .map((c) => {
      const novelTags = novelTagMap.get(c.id) || new Set();
      const tagSim = clamp01(jaccard(novelTags, recentTagSet));
      const durationFit = clamp01(durationShares.get(c.category_id) || 0);
      const freshScore = freshnessScore(c.updated_at || c.last_update_time);
      const score = clamp01(
        0.6 * tagSim + 0 * 0 + 0.3 * durationFit + 0.1 * freshScore
      );
      return {
        ...c,
        score,
        scoreBreakdown: {
          tagSim,
          cf: 0,
          durationFit,
          freshness: freshScore,
          popularity: 0
        }
      };
    })
    .sort((a, b) => b.score - a.score);
}

function scoreWarm(candidates, ctx) {
  const { novelTagMap, recentTagSet, durationShares, cfMap } = ctx;
  return candidates
    .map((c) => {
      const novelTags = novelTagMap.get(c.id) || new Set();
      const tagSim = clamp01(jaccard(novelTags, recentTagSet));
      const durationFit = clamp01(durationShares.get(c.category_id) || 0);
      const cf = clamp01(cfMap.get(c.id) || 0);
      const freshScore = freshnessScore(c.updated_at || c.last_update_time);
      const score = clamp01(
        0.4 * tagSim + 0.3 * durationFit + 0.2 * cf + 0.1 * freshScore
      );
      return {
        ...c,
        score,
        scoreBreakdown: {
          tagSim,
          cf,
          durationFit,
          freshness: freshScore,
          popularity: 0
        }
      };
    })
    .sort((a, b) => b.score - a.score);
}

function decideStrategy({ userId, historyCount, hasInterestTags }) {
  if (!userId) return 'guest';
  if (historyCount === 0 && hasInterestTags) return 'cold';
  if (historyCount < 3) return 'cold';
  return 'warm';
}

async function recommend(userId = null, options = {}) {
  const limit = Math.min(positiveInt(options.limit, 20), 50);
  const cacheKey = `recommend:${userId || 'guest'}:${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  let strategy = userId ? 'warm' : 'guest';
  let list = [];

  try {
    if (!userId) {
      strategy = 'guest';
      const candidates = await fetchCandidates(limit);
      list = scoreGuest(candidates);
    } else {
      const [historyCount, interestTags] = await Promise.all([
        getHistoryCount(userId),
        fetchInterestTags(userId)
      ]);
      const hasInterestTags = interestTags.size > 0;
      strategy = decideStrategy({ userId, historyCount, hasInterestTags });

      const candidates = await fetchCandidates(limit);
      const candidateIds = candidates.map((c) => c.id);
      const novelTagMap = await fetchNovelTagMap(candidateIds);

      if (historyCount === 0 && hasInterestTags) {
        list = scoreColdInterestOnly(candidates, novelTagMap, interestTags);
      } else if (historyCount < 3) {
        const [recentTagSet, durationShares] = await Promise.all([
          fetchRecentTagSet(userId),
          fetchCategoryDurationShares(userId)
        ]);
        list = scoreColdLowActive(candidates, {
          novelTagMap,
          recentTagSet,
          durationShares
        });
      } else {
        const [recentTagSet, durationShares, cfMap] = await Promise.all([
          fetchRecentTagSet(userId),
          fetchCategoryDurationShares(userId),
          fetchCfMap(userId)
        ]);
        list = scoreWarm(candidates, {
          novelTagMap,
          recentTagSet,
          durationShares,
          cfMap
        });
      }
    }

    list = dedupeById(list);
    list = await padWithFallback(list, limit);
  } catch (error) {
    // 任一子查询失败：降级为 fallbackTop(20)，strategy 保持当前值
    try {
      const top = await fallbackTop(FALLBACK_PAD_FETCH);
      list = decorateFallback(top).slice(0, limit);
    } catch (_inner) {
      list = list.slice(0, limit);
    }
  }

  const result = {
    strategy,
    list,
    pagination: {
      page: 1,
      pageSize: list.length,
      total: list.length,
      totalPages: 1
    }
  };
  memoryCache.set(cacheKey, result, CACHE_TTL_MS);
  return result;
}

function clearCache() {
  memoryCache.clear();
}

module.exports = {
  clearCache,
  recommend,
  // exposed for testing only
  __internals: {
    clamp01,
    jaccard,
    freshnessScore,
    buildPopularityMap,
    decideStrategy,
    HALF_LIFE_DAYS,
    FALLBACK_PAD_THRESHOLD,
    FALLBACK_PAD_FETCH
  }
};
