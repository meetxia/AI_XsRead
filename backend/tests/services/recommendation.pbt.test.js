/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 17: 推荐打分与冷启动分支
 *
 * Validates: Requirements 19.1, 19.2, 19.6, 19.7
 *
 * 守住的不变量：
 *   1) 任一候选项 score ∈ [0, 1]（每个分支都把分量与最终得分都 clamp 到 0..1）
 *   2) strategy 分支由 (userId, last30dHistoryCount, hasInterestTags) 共同决定：
 *        - 无 userId → 'guest'
 *        - history === 0 && hasInterestTags → 'cold'
 *        - history < 3 → 'cold'
 *        - 否则 → 'warm'
 *   3) 候选去重后 < 10 时从 fallbackTop(20) 兜底到 limit
 *   4) cold 分支的 cf 权重恒为 0
 */
const fc = require('fast-check');

jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn() }
}));

const { pool } = require('../../src/config/database');
const recommendationService = require('../../src/services/recommendationService');

/**
 * 构造一个能根据 SQL 文本派发返回值的伪 pool.query。
 *
 * `fetchCandidates` 与 `fallbackTop` 走同一条 SQL（仅 LIMIT 不同），生产代码中
 * `fetchCandidates` 用 `max(limit*5, 50)` 故 LIMIT ≥ 50，而 `fallbackTop` 固定
 * LIMIT=20。我们以此为 discriminator：LIMIT ≥ 50 时返回 `world.candidates`，
 * LIMIT < 50 时返回 `world.fallback`。
 */
function installFakeDb(world) {
  pool.query.mockImplementation(async (sql, params = []) => {
    const text = String(sql || '');

    // 候选 / fallback：ORDER BY n.rating ... LIMIT ?
    if (
      /FROM novels n/i.test(text) &&
      /ORDER BY n\.rating DESC/i.test(text)
    ) {
      const limit = Number(params[params.length - 1] || 20);
      const dataset =
        limit >= 50 ? world.candidates : world.fallback;
      return [dataset.slice(0, limit)];
    }

    // 30 天 history 计数
    if (/COUNT\(\*\)\s+AS total\s+FROM reading_history/i.test(text)) {
      return [[{ total: world.historyCount ?? 0 }]];
    }

    // 兴趣标签
    if (/FROM user_interest_tags/i.test(text)) {
      return [
        (world.interestTags || []).map((tag) => ({ tag, weight: 1.0 }))
      ];
    }

    // novel -> tags 映射
    if (/FROM novel_tags nt/i.test(text) && /WHERE nt\.novel_id IN/i.test(text)) {
      const ids = new Set(params.map((p) => Number(p)));
      const rows = [];
      for (const [novelId, tags] of Object.entries(world.novelTags || {})) {
        if (!ids.has(Number(novelId))) continue;
        for (const tag of tags) {
          rows.push({ novel_id: Number(novelId), tag });
        }
      }
      return [rows];
    }

    // 最近 30 天 tag 集合（bookshelf + reading_history UNION）
    if (/FROM \(\s*SELECT novel_id FROM bookshelf/i.test(text)) {
      return [
        (world.recentTags || []).map((tag) => ({ tag }))
      ];
    }

    // category 时长占比
    if (/SUM\(rh\.duration\)/i.test(text)) {
      return [
        Object.entries(world.categoryDurations || {}).map(
          ([categoryId, dur]) => ({ categoryId: Number(categoryId), dur })
        )
      ];
    }

    // CF 1) 用户最近一本书
    if (/FROM reading_history/i.test(text) && /ORDER BY read_time DESC LIMIT 1/i.test(text)) {
      return [
        world.cfRecentNovelId != null ? [{ novel_id: world.cfRecentNovelId }] : []
      ];
    }

    // CF 2) 也读过这本书的其他读者
    if (/SELECT DISTINCT user_id FROM reading_history/i.test(text)) {
      return [(world.cfReaders || []).map((id) => ({ user_id: id }))];
    }

    // CF 3) 这些读者读过的其他作品
    if (/SELECT novel_id, COUNT\(DISTINCT user_id\)/i.test(text)) {
      return [
        Object.entries(world.cfReadCounts || {}).map(([novelId, cnt]) => ({
          novel_id: Number(novelId),
          cnt
        }))
      ];
    }

    return [[]];
  });
}

// fast-check arbitraries -------------------------------------------------

const novelArb = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  title: fc.string({ minLength: 1, maxLength: 12 }),
  author: fc.string({ minLength: 1, maxLength: 8 }),
  rating: fc.float({ min: 0, max: 5, noNaN: true }),
  views: fc.integer({ min: 0, max: 100000 }),
  category_id: fc.integer({ min: 1, max: 6 }),
  updated_at: fc
    .integer({ min: 0, max: 365 * 24 * 60 * 60 * 1000 })
    .map((delta) => new Date(Date.now() - delta).toISOString())
});

const candidatesArb = fc
  .uniqueArray(novelArb, {
    minLength: 0,
    maxLength: 18,
    selector: (x) => x.id
  });

const tagArb = fc.constantFrom(
  '古言',
  '现言',
  '纯爱',
  '悬疑',
  '治愈',
  '奇幻',
  '穿越',
  '玄幻'
);

// helpers ---------------------------------------------------------------

function buildFallback(seed) {
  return Array.from({ length: 20 }, (_, i) => ({
    id: 900000 + i + (seed % 1000),
    title: `fb-${i}`,
    author: 'fb',
    rating: 4.5,
    views: 1000,
    category_id: 1,
    updated_at: new Date().toISOString()
  }));
}

beforeEach(() => {
  jest.clearAllMocks();
  recommendationService.clearCache();
});

// --------------------------------------------------------------------------
// Property 17.1: every score is in [0, 1]
// --------------------------------------------------------------------------

describe('[Property 17] 推荐打分与冷启动分支', () => {
  test('每个候选项 score ∈ [0, 1]', async () => {
    await fc.assert(
      fc.asyncProperty(
        candidatesArb,
        fc.option(fc.integer({ min: 1, max: 9999 }), { nil: null }),
        fc.integer({ min: 0, max: 30 }),
        fc.uniqueArray(tagArb, { maxLength: 5 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        async (candidates, userId, historyCount, interestTags, seed) => {
          installFakeDb({
            candidates,
            fallback: buildFallback(seed),
            historyCount,
            interestTags,
            recentTags: interestTags,
            categoryDurations: { 1: 0.5, 2: 0.5 },
            cfRecentNovelId: candidates[0]?.id ?? null,
            cfReaders: [],
            cfReadCounts: {},
            novelTags: Object.fromEntries(
              candidates.map((c, idx) => [c.id, [tagArb.generate?.value ?? '古言']])
            )
          });
          recommendationService.clearCache();

          const result = await recommendationService.recommend(userId, {
            limit: 20
          });

          for (const item of result.list) {
            expect(item.score).toBeGreaterThanOrEqual(0);
            expect(item.score).toBeLessThanOrEqual(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ------------------------------------------------------------------------
  // Property 17.2: strategy branching
  // ------------------------------------------------------------------------

  test("strategy 由 (userId, last30dHistoryCount, hasInterestTags) 决定", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.integer({ min: 1, max: 9999 }), { nil: null }),
        fc.integer({ min: 0, max: 30 }),
        fc.boolean(),
        fc.integer({ min: 0, max: 1_000_000 }),
        async (userId, historyCount, hasInterestTags, seed) => {
          const interestTags = hasInterestTags ? ['古言', '治愈'] : [];
          installFakeDb({
            candidates: [
              {
                id: 1,
                title: 't',
                author: 'a',
                rating: 4.5,
                views: 100,
                category_id: 1,
                updated_at: new Date().toISOString()
              }
            ],
            fallback: buildFallback(seed),
            historyCount,
            interestTags,
            recentTags: interestTags,
            categoryDurations: {},
            cfRecentNovelId: null,
            cfReaders: [],
            cfReadCounts: {},
            novelTags: { 1: ['古言'] }
          });
          recommendationService.clearCache();

          const result = await recommendationService.recommend(userId, {
            limit: 10
          });

          let expected;
          if (userId == null) {
            expected = 'guest';
          } else if (historyCount === 0 && hasInterestTags) {
            expected = 'cold';
          } else if (historyCount < 3) {
            expected = 'cold';
          } else {
            expected = 'warm';
          }
          expect(result.strategy).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ------------------------------------------------------------------------
  // Property 17.3: 候选去重后 < 10 时由 fallbackTop 兜底
  // ------------------------------------------------------------------------

  test("dedup 后候选 < 10 时使用 fallbackTop 兜底", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 9 }),
        fc.option(fc.integer({ min: 1, max: 9999 }), { nil: null }),
        fc.integer({ min: 0, max: 1_000_000 }),
        async (smallCount, userId, seed) => {
          const candidates = Array.from({ length: smallCount }, (_, i) => ({
            id: i + 1,
            title: `t${i}`,
            author: 'a',
            rating: 4.5,
            views: 100,
            category_id: 1,
            updated_at: new Date().toISOString()
          }));

          const fallback = buildFallback(seed);
          installFakeDb({
            candidates,
            fallback,
            historyCount: 5,
            interestTags: [],
            recentTags: [],
            categoryDurations: {},
            cfRecentNovelId: null,
            cfReaders: [],
            cfReadCounts: {},
            novelTags: {}
          });
          recommendationService.clearCache();

          const result = await recommendationService.recommend(userId, {
            limit: 20
          });

          const fallbackIds = new Set(fallback.map((f) => f.id));
          const includesFallback = result.list.some((item) =>
            fallbackIds.has(item.id)
          );

          // 当原始候选不足 10 时一定有 fallback 顶上
          expect(includesFallback).toBe(true);
          // 兜底后总数 ≥ min(候选 + fallback, 10)
          expect(result.list.length).toBeGreaterThanOrEqual(
            Math.min(smallCount + fallback.length, 10)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // ------------------------------------------------------------------------
  // Property 17.4: cold 分支 cf 权重为 0
  // ------------------------------------------------------------------------

  test("cold 分支每个项的 cf 子分量恒为 0", async () => {
    await fc.assert(
      fc.asyncProperty(
        candidatesArb.filter((arr) => arr.length > 0),
        fc.integer({ min: 0, max: 2 }), // 强制 cold
        fc.boolean(),
        fc.integer({ min: 0, max: 1_000_000 }),
        async (candidates, historyCount, withInterest, seed) => {
          const interestTags = withInterest ? ['古言', '治愈'] : [];
          // 当 historyCount === 0 && hasInterestTags 时走 interest-only 冷启动；
          // 否则走低活跃冷启动。无论哪一支，cf 子分量都应为 0。
          installFakeDb({
            candidates,
            fallback: buildFallback(seed),
            historyCount,
            interestTags,
            recentTags: ['古言'],
            categoryDurations: { 1: 0.6, 2: 0.4 },
            // 即使提供 cf 数据也不会被使用
            cfRecentNovelId: candidates[0].id,
            cfReaders: [101, 102, 103],
            cfReadCounts: Object.fromEntries(
              candidates.map((c) => [c.id, 3])
            ),
            novelTags: Object.fromEntries(
              candidates.map((c) => [c.id, ['古言', '治愈']])
            )
          });
          recommendationService.clearCache();

          const result = await recommendationService.recommend(42, {
            limit: 10
          });

          if (result.strategy !== 'cold') return; // skip non-cold runs

          for (const item of result.list) {
            if (item.scoreBreakdown && item.scoreBreakdown.fallback) continue;
            expect(item.scoreBreakdown.cf).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
