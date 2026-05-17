/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 11: 列表排序不变量（互动质量降序 / 时间降序 / 软删除不混入）
 * Validates: Requirements 1.2, 22.7, 26.5, 27.3, 28.3, 35.1, 15.3, 11.4
 *
 * 任务 26.7 — 列表排序的核心不变量：
 *   1) score = likes + replyCount × 2 + min(content_length / 50, 5) 严格非递增
 *   2) score 平局时按 created_at 降序稳定排序（同 created_at 退而求其次按 id 降序）
 *   3) deleted_at IS NOT NULL 的项整体被排除
 */

const fc = require('fast-check');
const { interactionScore } = require('../../src/utils/interactionScore');

/**
 * 纯函数版"列表排序"：与服务端 SQL 排序条款语义一致。
 *
 * @param {Array<{
 *   id: number, likes: number, replyCount: number, content_length: number,
 *   created_at: number, deleted_at: number|null
 * }>} items
 * @returns {Array<typeof items[0] & { score: number }>}
 */
function sortByQuality(items) {
  return items
    .filter((it) => it.deleted_at == null)
    .map((it) => ({
      ...it,
      score: interactionScore({
        likes: it.likes,
        replyCount: it.replyCount,
        content: 'x'.repeat(Math.max(0, it.content_length))
      })
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.created_at !== a.created_at) return b.created_at - a.created_at;
      return b.id - a.id;
    });
}

const itemArb = fc.record({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  likes: fc.integer({ min: 0, max: 1000 }),
  replyCount: fc.integer({ min: 0, max: 200 }),
  content_length: fc.integer({ min: 0, max: 600 }),
  created_at: fc.integer({ min: 1_700_000_000_000, max: 1_800_000_000_000 }),
  deleted_at: fc.option(fc.integer({ min: 1, max: 1_800_000_000_000 }), { nil: null })
});

describe('[Property 11] list sort invariants', () => {
  test('adjacent scores are non-increasing after sort', () => {
    fc.assert(
      fc.property(
        fc
          .uniqueArray(itemArb, { selector: (x) => x.id, minLength: 0, maxLength: 30 }),
        (items) => {
          const sorted = sortByQuality(items);
          for (let i = 0; i + 1 < sorted.length; i += 1) {
            expect(sorted[i].score).toBeGreaterThanOrEqual(sorted[i + 1].score);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('tie-breaker by created_at desc is stable', () => {
    fc.assert(
      fc.property(
        fc
          .uniqueArray(itemArb, { selector: (x) => x.id, minLength: 2, maxLength: 30 })
          .map((items) =>
            // 强制所有 score 相等：把 likes/replyCount/content_length 全归零
            items.map((it) => ({
              ...it,
              likes: 0,
              replyCount: 0,
              content_length: 0,
              deleted_at: null
            }))
          ),
        (items) => {
          const sorted = sortByQuality(items);
          for (let i = 0; i + 1 < sorted.length; i += 1) {
            // 同分时严格按 created_at 降序，再按 id 降序
            const a = sorted[i];
            const b = sorted[i + 1];
            if (a.created_at === b.created_at) {
              expect(a.id).toBeGreaterThan(b.id);
            } else {
              expect(a.created_at).toBeGreaterThan(b.created_at);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('soft-deleted items never appear in the sorted list', () => {
    fc.assert(
      fc.property(
        fc
          .uniqueArray(itemArb, { selector: (x) => x.id, minLength: 1, maxLength: 30 })
          .map((items) =>
            // 强制至少把一半软删除
            items.map((it, idx) =>
              idx % 2 === 0 ? { ...it, deleted_at: 1_750_000_000_000 } : { ...it, deleted_at: null }
            )
          ),
        (items) => {
          const sorted = sortByQuality(items);
          for (const item of sorted) {
            expect(item.deleted_at).toBeNull();
          }
          // 软删除项一定不在结果中
          const deletedIds = new Set(
            items.filter((i) => i.deleted_at != null).map((i) => i.id)
          );
          for (const item of sorted) {
            expect(deletedIds.has(item.id)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all-deleted input returns empty list', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 1, maxLength: 20 }),
        (items) => {
          const allDeleted = items.map((it) => ({ ...it, deleted_at: 1_750_000_000_000 }));
          expect(sortByQuality(allDeleted)).toEqual([]);
        }
      ),
      { numRuns: 50 }
    );
  });
});
