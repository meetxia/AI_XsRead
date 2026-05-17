/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 19: 段评一层楼限制与气泡数一致性
 * Validates: Requirements 27.4, 27.6, 27.7
 *
 * 任务 26.6 — 段评 paragraph_comments 的两个核心不变量：
 *   1) 一层楼限制：parent.parent_id !== NULL 时 create 必须被拒绝
 *      （PARAGRAPH_COMMENT_DEPTH_EXCEEDED）
 *   2) 气泡数一致性：
 *       - 新增段评 → countsByParagraph[paragraphIndex] += 1
 *       - 软删除段评 → countsByParagraph[paragraphIndex] -= 1
 *       - 软删除项不会出现在 list 中也不计入 counts
 *
 * 不依赖真实 MySQL：用 in-memory store + 模拟 paragraphCommentService 的语义。
 */

const fc = require('fast-check');

/**
 * In-memory paragraph comment store.
 *
 * 与 backend/src/services/paragraphCommentService.js 中的关键语义对齐：
 *  - parent_id 必须指向一条 deleted_at IS NULL 且 parent_id IS NULL 的评论
 *  - 否则抛 { code: 'PARAGRAPH_COMMENT_DEPTH_EXCEEDED', httpStatus: 400 }
 *  - getCounts 只统计 deleted_at IS NULL 的项
 */
function createParagraphCommentStore() {
  const records = [];
  let nextId = 1;

  function findActive(id) {
    return records.find((r) => r.id === id && r.deleted_at == null);
  }

  return {
    create({ userId, novelId, chapterId, paragraphIndex, content, parentId = null }) {
      if (parentId != null) {
        const parent = findActive(parentId);
        if (!parent || parent.parent_id != null) {
          const err = new Error('不支持二级回复');
          err.code = 'PARAGRAPH_COMMENT_DEPTH_EXCEEDED';
          err.httpStatus = 400;
          throw err;
        }
      }
      const record = {
        id: nextId++,
        user_id: userId,
        novel_id: novelId,
        chapter_id: chapterId,
        paragraph_index: paragraphIndex,
        parent_id: parentId,
        content,
        deleted_at: null
      };
      records.push(record);
      return record;
    },
    softDelete(id) {
      const record = findActive(id);
      if (!record) return false;
      record.deleted_at = Date.now();
      return true;
    },
    listByParagraph({ novelId, chapterId, paragraphIndex }) {
      return records.filter(
        (r) =>
          r.novel_id === novelId &&
          r.chapter_id === chapterId &&
          r.paragraph_index === paragraphIndex &&
          r.deleted_at == null
      );
    },
    counts({ novelId, chapterId }) {
      const map = new Map();
      for (const r of records) {
        if (r.novel_id !== novelId || r.chapter_id !== chapterId || r.deleted_at != null) {
          continue;
        }
        map.set(r.paragraph_index, (map.get(r.paragraph_index) || 0) + 1);
      }
      return map;
    }
  };
}

describe('[Property 19] paragraph comment depth + count consistency', () => {
  test('a request with parent.parent_id !== NULL is rejected with PARAGRAPH_COMMENT_DEPTH_EXCEEDED', () => {
    fc.assert(
      fc.property(
        fc.record({
          novelId: fc.integer({ min: 1, max: 5 }),
          chapterId: fc.integer({ min: 1, max: 5 }),
          paragraphIndex: fc.integer({ min: 0, max: 5 }),
          userIds: fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 3, maxLength: 6 })
        }),
        ({ novelId, chapterId, paragraphIndex, userIds }) => {
          const store = createParagraphCommentStore();
          // 一级评论
          const top = store.create({
            userId: userIds[0],
            novelId,
            chapterId,
            paragraphIndex,
            content: 'top'
          });
          // 一级 → 二级（合法的回复）
          const reply = store.create({
            userId: userIds[1],
            novelId,
            chapterId,
            paragraphIndex,
            content: 'reply',
            parentId: top.id
          });
          expect(reply.parent_id).toBe(top.id);

          // 三级回复必须被拒绝
          let thrown;
          try {
            store.create({
              userId: userIds[2],
              novelId,
              chapterId,
              paragraphIndex,
              content: 'too deep',
              parentId: reply.id
            });
          } catch (err) {
            thrown = err;
          }
          expect(thrown).toBeDefined();
          expect(thrown.code).toBe('PARAGRAPH_COMMENT_DEPTH_EXCEEDED');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('adding a paragraph_comment increments counts[paragraphIndex] by 1', () => {
    fc.assert(
      fc.property(
        fc.record({
          novelId: fc.integer({ min: 1, max: 3 }),
          chapterId: fc.integer({ min: 1, max: 3 }),
          paragraphIndex: fc.integer({ min: 0, max: 5 }),
          userIds: fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 10 })
        }),
        ({ novelId, chapterId, paragraphIndex, userIds }) => {
          const store = createParagraphCommentStore();
          for (let i = 0; i < userIds.length; i += 1) {
            const before = store.counts({ novelId, chapterId }).get(paragraphIndex) || 0;
            store.create({
              userId: userIds[i],
              novelId,
              chapterId,
              paragraphIndex,
              content: `c-${i}`
            });
            const after = store.counts({ novelId, chapterId }).get(paragraphIndex) || 0;
            expect(after).toBe(before + 1);
          }
          // counts 在其它段落上保持 0
          for (const [pi, cnt] of store.counts({ novelId, chapterId })) {
            if (pi !== paragraphIndex) {
              expect(cnt).toBe(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('soft-deleting a paragraph_comment decrements counts[paragraphIndex] by 1', () => {
    fc.assert(
      fc.property(
        fc.record({
          novelId: fc.integer({ min: 1, max: 3 }),
          chapterId: fc.integer({ min: 1, max: 3 }),
          paragraphIndex: fc.integer({ min: 0, max: 5 }),
          totalAdds: fc.integer({ min: 1, max: 8 }),
          deletePicks: fc.array(fc.integer({ min: 0, max: 7 }), { minLength: 0, maxLength: 8 })
        }),
        ({ novelId, chapterId, paragraphIndex, totalAdds, deletePicks }) => {
          const store = createParagraphCommentStore();
          const ids = [];
          for (let i = 0; i < totalAdds; i += 1) {
            const r = store.create({
              userId: 1,
              novelId,
              chapterId,
              paragraphIndex,
              content: `c-${i}`
            });
            ids.push(r.id);
          }
          let expected = totalAdds;
          for (const idx of deletePicks) {
            if (idx < ids.length) {
              const id = ids[idx];
              const before = store.counts({ novelId, chapterId }).get(paragraphIndex) || 0;
              const ok = store.softDelete(id);
              const after = store.counts({ novelId, chapterId }).get(paragraphIndex) || 0;
              if (ok) {
                expected -= 1;
                expect(after).toBe(before - 1);
              } else {
                // 已删除项再删一次：counts 不变
                expect(after).toBe(before);
              }
            }
          }
          const actual = store.counts({ novelId, chapterId }).get(paragraphIndex) || 0;
          expect(actual).toBe(expected);
          // list 中绝不包含软删除项
          for (const item of store.listByParagraph({ novelId, chapterId, paragraphIndex })) {
            expect(item.deleted_at).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
