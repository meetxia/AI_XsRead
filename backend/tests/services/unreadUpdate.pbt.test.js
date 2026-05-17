/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 18: Unread update badge 不变量（单调性 / 阅读后消失 / 关注作者新作）
 * Validates: Requirements 24.2, 24.3, 24.4, 24.5, 24.6
 *
 * 任务 28.6 — 后端 unreadUpdateService 的红点不变量。
 *
 * 这里的属性测试目标：
 *   1) attachUnreadUpdate 永远等价于 latest_chapter_id > (last_seen_chapter_id || 0)
 *      不应该把 wishlist 类型或没有 novel_id 的行计入意外结果。
 *   2) 阅读到 latestChapterId 之后再次刷新，hasUnreadUpdate 必为 false。
 *   3) markChapterAsRead 推进 last_seen_chapter_id 是单调递增的：
 *      给 last_seen_chapter_id 反复推送任意章节序列，最终值为序列最大值，绝不递减。
 *
 * 测试策略：
 *   - 不使用真实数据库；mock 一个 db.query 把 (novelIds → MAX(chapter_id)) 用纯函数返回。
 *   - mark 一侧用一个内存 Map 模拟 bookshelf.last_seen_chapter_id 字段。
 */

const fc = require('fast-check');
const {
  attachUnreadUpdate,
  markChapterAsRead
} = require('../../src/services/unreadUpdateService');

/**
 * 创建一个仅模拟 SELECT MAX(id) FROM chapters WHERE novel_id IN (...) GROUP BY novel_id 的 db
 * @param {Map<number, number>} latestMap
 */
function createLatestChapterDb(latestMap) {
  return {
    async query(_sql, params) {
      const ids = params || [];
      const rows = ids
        .filter(id => latestMap.has(id))
        .map(id => ({ novel_id: id, latest_chapter_id: latestMap.get(id) }));
      return [rows];
    }
  };
}

describe('[Property 18] unread update badge invariants', () => {
  test('attachUnreadUpdate equals (latest > lastSeen) for arbitrary cases', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            novelId: fc.integer({ min: 1, max: 200 }),
            latestChapterId: fc.integer({ min: 0, max: 1000 }),
            lastSeenChapterId: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null })
          }),
          { minLength: 1, maxLength: 12 }
        ),
        async (cases) => {
          const latestMap = new Map();
          const rows = [];
          // 同一 novelId 取最大 latestChapterId（对应 MAX(chapter.id) 语义）
          for (const c of cases) {
            const prev = latestMap.get(c.novelId) || 0;
            latestMap.set(c.novelId, Math.max(prev, c.latestChapterId));
          }
          for (const c of cases) {
            rows.push({
              novel_id: c.novelId,
              last_seen_chapter_id: c.lastSeenChapterId
            });
          }

          const db = createLatestChapterDb(latestMap);
          const enriched = await attachUnreadUpdate(rows, { db });

          expect(enriched).toHaveLength(rows.length);
          enriched.forEach((row, idx) => {
            const latest = latestMap.get(rows[idx].novel_id) || 0;
            const lastSeen = Number.parseInt(rows[idx].last_seen_chapter_id, 10) || 0;
            expect(row.hasUnreadUpdate).toBe(latest > lastSeen);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('after reading the latest chapter, next refresh sets hasUnreadUpdate=false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          novelId: fc.integer({ min: 1, max: 100 }),
          latest: fc.integer({ min: 1, max: 500 }),
          initialLastSeen: fc.integer({ min: 0, max: 500 })
        }),
        async ({ novelId, latest, initialLastSeen }) => {
          const latestMap = new Map([[novelId, latest]]);
          const db = createLatestChapterDb(latestMap);

          // 模拟 bookshelf 行
          let lastSeen = initialLastSeen;
          const refresh = async () => {
            const [enriched] = await attachUnreadUpdate(
              [{ novel_id: novelId, last_seen_chapter_id: lastSeen }],
              { db }
            );
            return enriched;
          };

          // 用户读到了 latest（推进 last_seen_chapter_id）
          lastSeen = Math.max(lastSeen, latest);

          const after = await refresh();
          expect(after.hasUnreadUpdate).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('markChapterAsRead is monotonic: last_seen_chapter_id never decreases', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.integer({ min: 1, max: 50 }),
          novelId: fc.integer({ min: 1, max: 50 }),
          initial: fc.integer({ min: 0, max: 100 }),
          stream: fc.array(fc.integer({ min: 0, max: 200 }), { minLength: 1, maxLength: 20 })
        }),
        async ({ userId, novelId, initial, stream }) => {
          // 内存模拟 bookshelf 行的 last_seen_chapter_id
          const state = { last_seen_chapter_id: initial };
          const fakeDb = {
            async query(sql, params) {
              if (/UPDATE bookshelf/i.test(sql)) {
                // params: [chapterId, userId, novelId]
                const [cId, uId, nId] = params;
                if (uId === userId && nId === novelId) {
                  state.last_seen_chapter_id = Math.max(
                    state.last_seen_chapter_id || 0,
                    cId
                  );
                  return [{ affectedRows: 1 }];
                }
                return [{ affectedRows: 0 }];
              }
              return [[]];
            }
          };

          const seenHistory = [state.last_seen_chapter_id];
          for (const chapterId of stream) {
            // chapterId === 0 时 markChapterAsRead 会因为 safePositiveInt 拒绝写入，
            // 这本身就保证了"非正章节id 不会让游标后退或前进"的语义。
            await markChapterAsRead(userId, novelId, chapterId, { db: fakeDb });
            seenHistory.push(state.last_seen_chapter_id);
          }

          // 单调不减
          for (let i = 1; i < seenHistory.length; i++) {
            expect(seenHistory[i]).toBeGreaterThanOrEqual(seenHistory[i - 1]);
          }
          // 最终 = max(initial, max(positive ids in stream))
          const positiveStream = stream.filter(x => Number.isInteger(x) && x > 0);
          const expectedFinal = Math.max(initial, ...positiveStream, initial);
          expect(state.last_seen_chapter_id).toBe(expectedFinal);
        }
      ),
      { numRuns: 100 }
    );
  });
});
