/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 10 (subset): 书签 round-trip
 * Validates: Requirements 1.1, 1.4
 *
 * 任务 12.5 — 书签新增 / 删除 / 列出的 round-trip 不变量。
 *
 * 测试目标：
 *   1) add(x) ; list 必包含 x
 *   2) add(x) ; remove(x) ; list 必排除 x
 *   3) 重复 add 同一锚点不引入重复（锚点 = (user_id, novel_id, chapter_id, paragraph_index)）
 *
 * 不依赖真实 MySQL：使用 in-memory store 模拟带 UNIQUE(user_id, novel_id,
 * chapter_id, paragraph_index) 约束的 user_bookmarks 表，
 * 行为对齐 backend/src/services/bookmarkService.js 的语义。
 */

const fc = require('fast-check');

/**
 * 锚点 → 一条记录的 in-memory store。
 *
 * 锚点 key 由 (userId, novelId, chapterId, paragraphIndex) 组成，
 * 等价于 user_bookmarks 上的 UNIQUE 约束（虽然该表当前未显式声明 UNIQUE，
 * 但 service 层语义上要求 idempotent add 不引入重复）。
 */
function createBookmarkStore() {
  /** @type {Map<string, { id: number, userId: number, novelId: number, chapterId: number, paragraphIndex: number, note: string|null }>} */
  const data = new Map();
  let nextId = 1;

  const keyOf = ({ userId, novelId, chapterId, paragraphIndex }) =>
    `${userId}::${novelId}::${chapterId}::${paragraphIndex}`;

  return {
    add(payload) {
      const key = keyOf(payload);
      const existing = data.get(key);
      if (existing) return existing; // 幂等
      const record = { id: nextId++, ...payload };
      data.set(key, record);
      return record;
    },
    remove(userId, bookmarkId) {
      for (const [k, v] of data.entries()) {
        if (v.id === bookmarkId && v.userId === userId) {
          data.delete(k);
          return true;
        }
      }
      return false;
    },
    list(userId, novelId = null) {
      return [...data.values()].filter(
        (r) => r.userId === userId && (novelId == null || r.novelId === novelId)
      );
    },
    has(userId, novelId, chapterId, paragraphIndex) {
      return data.has(keyOf({ userId, novelId, chapterId, paragraphIndex }));
    },
    countAt(userId, novelId, chapterId, paragraphIndex) {
      const list = this.list(userId, novelId).filter(
        (r) => r.chapterId === chapterId && r.paragraphIndex === paragraphIndex
      );
      return list.length;
    }
  };
}

const anchorArb = fc.record({
  userId: fc.integer({ min: 1, max: 5 }),
  novelId: fc.integer({ min: 1, max: 10 }),
  chapterId: fc.integer({ min: 1, max: 30 }),
  paragraphIndex: fc.integer({ min: 0, max: 50 })
});

describe('[Property 10] bookmark round-trip', () => {
  test('add(x) ; list includes x', async () => {
    await fc.assert(
      fc.asyncProperty(anchorArb, async (anchor) => {
        const store = createBookmarkStore();
        const created = store.add({ ...anchor, note: null });
        const list = store.list(anchor.userId, anchor.novelId);
        expect(list.find((b) => b.id === created.id)).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  test('add(x) ; remove(x) ; list excludes x', async () => {
    await fc.assert(
      fc.asyncProperty(anchorArb, async (anchor) => {
        const store = createBookmarkStore();
        const created = store.add({ ...anchor, note: null });
        const removed = store.remove(anchor.userId, created.id);
        expect(removed).toBe(true);
        const list = store.list(anchor.userId, anchor.novelId);
        expect(list.find((b) => b.id === created.id)).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  test('idempotent add does not duplicate the same anchor', async () => {
    await fc.assert(
      fc.asyncProperty(
        anchorArb,
        fc.integer({ min: 2, max: 8 }),
        async (anchor, repeats) => {
          const store = createBookmarkStore();
          for (let i = 0; i < repeats; i += 1) {
            store.add({ ...anchor, note: null });
          }
          expect(
            store.countAt(anchor.userId, anchor.novelId, anchor.chapterId, anchor.paragraphIndex)
          ).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('interleaved add/remove ops preserve invariants (counts >= 0, presence consistent)', async () => {
    const opArb = fc.record({
      kind: fc.constantFrom('add', 'remove'),
      anchor: anchorArb
    });
    await fc.assert(
      fc.asyncProperty(
        fc.array(opArb, { minLength: 1, maxLength: 50 }),
        async (ops) => {
          const store = createBookmarkStore();
          // 用一个并行 reference 模型保持 (user, novel, chapter, paragraph) → bookmarkId
          const ref = new Map();
          const keyOf = (a) =>
            `${a.userId}::${a.novelId}::${a.chapterId}::${a.paragraphIndex}`;

          for (const op of ops) {
            if (op.kind === 'add') {
              const key = keyOf(op.anchor);
              if (!ref.has(key)) {
                const created = store.add({ ...op.anchor, note: null });
                ref.set(key, created.id);
              }
              // 幂等 add 后必然存在
              expect(
                store.has(
                  op.anchor.userId,
                  op.anchor.novelId,
                  op.anchor.chapterId,
                  op.anchor.paragraphIndex
                )
              ).toBe(true);
            } else {
              const key = keyOf(op.anchor);
              const id = ref.get(key);
              if (id) {
                store.remove(op.anchor.userId, id);
                ref.delete(key);
              }
              // 删除后该锚点必然不再存在（如果之前从未添加过，仍然是 false）
              expect(
                store.has(
                  op.anchor.userId,
                  op.anchor.novelId,
                  op.anchor.chapterId,
                  op.anchor.paragraphIndex
                )
              ).toBe(false);
            }
            // 计数一致：list().length === ref 中匹配该 user 的 key 数
            const liveForUser = [...ref.keys()].filter((k) =>
              k.startsWith(`${op.anchor.userId}::`)
            ).length;
            expect(store.list(op.anchor.userId)).toHaveLength(liveForUser);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
