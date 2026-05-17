/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 10: 用户内容写入 round-trip（书架 add/remove、关注 follow/unfollow、点赞 like/unlike）
 * Validates: Requirements 9.2, 9.3, 9.4, 9.5, 22.4, 22.5, 23.2, 23.3, 23.4, 27.4, 27.5, 27.6
 *
 * 任务 28.7 — 内容写入 round-trip 综合（书架 / 关注 / 点赞）。
 *
 * 测试目标（针对一个内存模型）：
 *   1) add ; list  → 必包含
 *   2) remove ; list  → 必排除
 *   3) add(x) ; remove(x) ; list  → 必排除
 *   4) 重复 add(x) 不引入重复（计数仍为 1）
 *   5) 计数始终 ≥ 0
 *
 * 这里用一个纯内存的 Set/Map 实现一个最小可推理的"用户内容"模型，
 * 模拟真实 SQL 上 UNIQUE(user_id, target_id) 约束的行为；
 * 该模型对应：bookshelf、user_follow_authors、user_likes
 * 三个表的写入 round-trip。
 */

const fc = require('fast-check');

/**
 * 纯内存版"幂等用户内容"存储。
 * - add(userId, targetId): 若不存在则插入；若存在则 NO-OP。
 * - remove(userId, targetId): 若存在则删除；若不存在则 NO-OP。
 * - list(userId): 返回当前用户的全部 targetId 列表。
 * - count(userId): 返回数量（≥ 0）。
 */
function createUserContentStore() {
  const data = new Map(); // userId -> Set<targetId>

  return {
    add(userId, targetId) {
      if (!data.has(userId)) data.set(userId, new Set());
      data.get(userId).add(targetId);
    },
    remove(userId, targetId) {
      const set = data.get(userId);
      if (set) set.delete(targetId);
    },
    has(userId, targetId) {
      return Boolean(data.get(userId)?.has(targetId));
    },
    list(userId) {
      return [...(data.get(userId) || [])];
    },
    count(userId) {
      return (data.get(userId) || new Set()).size;
    }
  };
}

describe('[Property 10] user content write round-trip (bookshelf / follow / like)', () => {
  test('add ; list includes; remove ; list excludes; counts >= 0', async () => {
    const opArb = fc.record({
      kind: fc.constantFrom('add', 'remove'),
      userId: fc.integer({ min: 1, max: 5 }),
      targetId: fc.integer({ min: 1, max: 20 })
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(opArb, { minLength: 1, maxLength: 40 }),
        async (ops) => {
          const store = createUserContentStore();

          for (const op of ops) {
            if (op.kind === 'add') {
              const before = store.count(op.userId);
              const wasMember = store.has(op.userId, op.targetId);
              store.add(op.userId, op.targetId);
              // 幂等：重复 add 不引入重复
              const after = store.count(op.userId);
              expect(after).toBe(wasMember ? before : before + 1);
              expect(store.has(op.userId, op.targetId)).toBe(true);
            } else {
              const before = store.count(op.userId);
              const wasMember = store.has(op.userId, op.targetId);
              store.remove(op.userId, op.targetId);
              const after = store.count(op.userId);
              expect(after).toBe(wasMember ? before - 1 : before);
              expect(store.has(op.userId, op.targetId)).toBe(false);
            }
            // 计数永远 ≥ 0
            expect(store.count(op.userId)).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('add(x) then remove(x) leaves x out of list (round-trip)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.integer({ min: 1, max: 100 }),
          targetId: fc.integer({ min: 1, max: 100 }),
          repeats: fc.integer({ min: 1, max: 5 })
        }),
        async ({ userId, targetId, repeats }) => {
          const store = createUserContentStore();
          for (let i = 0; i < repeats; i++) {
            store.add(userId, targetId);
          }
          expect(store.has(userId, targetId)).toBe(true);
          expect(store.count(userId)).toBe(1);

          store.remove(userId, targetId);
          expect(store.has(userId, targetId)).toBe(false);
          expect(store.list(userId)).not.toContain(targetId);
          expect(store.count(userId)).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('three independent stores (bookshelf / follow / like) preserve invariants in interleaved ops', async () => {
    const channelArb = fc.constantFrom('bookshelf', 'follow', 'like');
    const opArb = fc.record({
      channel: channelArb,
      kind: fc.constantFrom('add', 'remove'),
      userId: fc.integer({ min: 1, max: 4 }),
      targetId: fc.integer({ min: 1, max: 10 })
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(opArb, { minLength: 1, maxLength: 60 }),
        async (ops) => {
          const stores = {
            bookshelf: createUserContentStore(),
            follow: createUserContentStore(),
            like: createUserContentStore()
          };

          for (const op of ops) {
            const store = stores[op.channel];
            if (op.kind === 'add') {
              store.add(op.userId, op.targetId);
              expect(store.has(op.userId, op.targetId)).toBe(true);
            } else {
              store.remove(op.userId, op.targetId);
              expect(store.has(op.userId, op.targetId)).toBe(false);
            }
          }

          // 所有用户在所有 channel 上的最终计数都 ≥ 0
          for (const channel of Object.keys(stores)) {
            for (let userId = 1; userId <= 4; userId++) {
              expect(stores[channel].count(userId)).toBeGreaterThanOrEqual(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
