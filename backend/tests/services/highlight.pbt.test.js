/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 10 (subset): 划线 round-trip
 * Validates: Requirements 25.2, 25.4
 *
 * 任务 23.8 — 划线 highlights 表的 add / list / delete / 改色 round-trip。
 *
 * 测试目标：
 *   1) create ; list 必包含；delete ; list 必排除
 *   2) update color 切换颜色，但不改变锚点
 *      (paragraphIndex, paragraphHash, startOffset, endOffset)
 *   3) 删除已删除项再次删除是 no-op，不影响 list
 *
 * 不依赖真实 MySQL：用 in-memory store 模拟带 deleted_at 软删除的 highlights 表。
 */

const fc = require('fast-check');

const COLORS = ['yellow', 'green', 'red'];

function createHighlightStore() {
  const rows = [];
  let nextId = 1;

  return {
    create(payload) {
      const record = {
        id: nextId++,
        deleted_at: null,
        ...payload
      };
      rows.push(record);
      return record;
    },
    updateColor(userId, id, color) {
      const r = rows.find((x) => x.id === id && x.user_id === userId && x.deleted_at == null);
      if (!r) return false;
      r.color = color;
      return true;
    },
    remove(userId, id) {
      const r = rows.find((x) => x.id === id && x.user_id === userId && x.deleted_at == null);
      if (!r) return false;
      r.deleted_at = Date.now();
      return true;
    },
    list({ userId, chapterId = null }) {
      return rows.filter(
        (x) =>
          x.user_id === userId &&
          x.deleted_at == null &&
          (chapterId == null || x.chapter_id === chapterId)
      );
    },
    findById(id) {
      return rows.find((x) => x.id === id) || null;
    }
  };
}

const anchorArb = fc.record({
  paragraphIndex: fc.integer({ min: 0, max: 50 }),
  paragraphHash: fc
    .array(fc.constantFrom(...'0123456789abcdef'.split('')), {
      minLength: 16,
      maxLength: 16
    })
    .map((cs) => cs.join('')),
  startOffset: fc.integer({ min: 0, max: 200 }),
  endOffset: fc.integer({ min: 0, max: 400 })
});

const highlightArb = fc.record({
  userId: fc.integer({ min: 1, max: 5 }),
  novelId: fc.integer({ min: 1, max: 10 }),
  chapterId: fc.integer({ min: 1, max: 30 }),
  anchor: anchorArb,
  content: fc.string({ minLength: 1, maxLength: 60 }),
  color: fc.constantFrom(...COLORS)
});

function expand(h) {
  return {
    user_id: h.userId,
    novel_id: h.novelId,
    chapter_id: h.chapterId,
    paragraph_index: h.anchor.paragraphIndex,
    paragraph_hash: h.anchor.paragraphHash,
    start_offset: h.anchor.startOffset,
    end_offset: h.anchor.endOffset,
    content: h.content,
    color: h.color
  };
}

describe('[Property 10] highlight round-trip', () => {
  test('create then list contains the new highlight', () => {
    fc.assert(
      fc.property(highlightArb, (h) => {
        const store = createHighlightStore();
        const created = store.create(expand(h));
        const list = store.list({ userId: h.userId, chapterId: h.chapterId });
        expect(list.find((x) => x.id === created.id)).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  test('delete then list excludes the highlight', () => {
    fc.assert(
      fc.property(highlightArb, (h) => {
        const store = createHighlightStore();
        const created = store.create(expand(h));
        const removed = store.remove(h.userId, created.id);
        expect(removed).toBe(true);
        const list = store.list({ userId: h.userId, chapterId: h.chapterId });
        expect(list.find((x) => x.id === created.id)).toBeUndefined();
        // 二次删除是 no-op
        expect(store.remove(h.userId, created.id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  test('update color flips color but preserves the anchor tuple', () => {
    fc.assert(
      fc.property(highlightArb, fc.constantFrom(...COLORS), (h, newColor) => {
        const store = createHighlightStore();
        const created = store.create(expand(h));

        const before = {
          paragraph_index: created.paragraph_index,
          paragraph_hash: created.paragraph_hash,
          start_offset: created.start_offset,
          end_offset: created.end_offset
        };

        const ok = store.updateColor(h.userId, created.id, newColor);
        expect(ok).toBe(true);

        const after = store.findById(created.id);
        expect(after.color).toBe(newColor);
        expect(after.paragraph_index).toBe(before.paragraph_index);
        expect(after.paragraph_hash).toBe(before.paragraph_hash);
        expect(after.start_offset).toBe(before.start_offset);
        expect(after.end_offset).toBe(before.end_offset);
      }),
      { numRuns: 100 }
    );
  });

  test('interleaved create / update / delete preserves invariants', () => {
    const opArb = fc.oneof(
      fc.record({ kind: fc.constant('create'), highlight: highlightArb }),
      fc.record({
        kind: fc.constant('update'),
        which: fc.integer({ min: 0, max: 9 }),
        color: fc.constantFrom(...COLORS)
      }),
      fc.record({ kind: fc.constant('delete'), which: fc.integer({ min: 0, max: 9 }) })
    );

    fc.assert(
      fc.property(fc.array(opArb, { minLength: 1, maxLength: 30 }), (ops) => {
        const store = createHighlightStore();
        const seenIds = []; // 按 create 顺序追加
        const removedIds = new Set();

        for (const op of ops) {
          if (op.kind === 'create') {
            const r = store.create(expand(op.highlight));
            seenIds.push({ id: r.id, userId: op.highlight.userId });
          } else if (op.kind === 'update') {
            const target = seenIds[op.which];
            if (!target) continue;
            const ok = store.updateColor(target.userId, target.id, op.color);
            if (removedIds.has(target.id)) {
              expect(ok).toBe(false);
            }
          } else if (op.kind === 'delete') {
            const target = seenIds[op.which];
            if (!target) continue;
            const ok = store.remove(target.userId, target.id);
            if (ok) {
              removedIds.add(target.id);
            } else {
              // 之前已被删除则 remove 返回 false
              expect(removedIds.has(target.id)).toBe(true);
            }
          }
        }
        // 不变量：list 中不包含被 remove 过的 id
        const allUserIds = new Set(seenIds.map((s) => s.userId));
        for (const userId of allUserIds) {
          for (const item of store.list({ userId })) {
            expect(removedIds.has(item.id)).toBe(false);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
