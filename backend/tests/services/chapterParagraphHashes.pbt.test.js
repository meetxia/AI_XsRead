/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 3: chapters.paragraph_hashes 与章节正文一致
 * Validates: Requirements 29.3
 *
 * 任务 6.2 — chapter.paragraph_hashes 必须等价于
 *   `splitParagraphs(content).map(computeHash)`。
 *
 * 测试目标：
 *   1) 长度一致：paragraph_hashes.length === splitParagraphs(content).length
 *   2) 逐项一致：每个 hash 都来自同一段落的 computeHash(text)
 *   3) chapterService.upsertChapter / refreshChapterParagraphHashes 写入的 JSON
 *      在反序列化后与 buildParagraphHashes(content) 完全相等
 *
 * 不依赖真实 MySQL：使用注入的 fake db.query 收集写入参数。
 */

const fc = require('fast-check');
const {
  buildParagraphHashes,
  computeHash,
  splitParagraphs
} = require('../../src/utils/paragraphAnchor');
const chapterService = require('../../src/services/chapterService');

/**
 * 任意"章节文本"：由 1..15 段构成，每段 1..120 字，段之间用一个或多个空行分隔。
 */
const chapterContentArb = fc
  .array(
    fc.string({ minLength: 1, maxLength: 120 }).filter((s) => s.trim().length > 0),
    { minLength: 1, maxLength: 15 }
  )
  .chain((paragraphs) =>
    fc
      .array(fc.constantFrom('\n\n', '\n\n\n', '\r\n\r\n'), {
        minLength: paragraphs.length - 1,
        maxLength: paragraphs.length - 1
      })
      .map((joiners) =>
        paragraphs.reduce(
          (acc, p, idx) => acc + (idx === 0 ? '' : joiners[idx - 1]) + p,
          ''
        )
      )
  );

describe('[Property 3] chapters.paragraph_hashes equals splitParagraphs(content).map(computeHash)', () => {
  test('buildParagraphHashes produces the per-paragraph computeHash array', () => {
    fc.assert(
      fc.property(chapterContentArb, (content) => {
        const paragraphs = splitParagraphs(content);
        const hashes = buildParagraphHashes(content);
        expect(hashes).toHaveLength(paragraphs.length);
        for (let i = 0; i < paragraphs.length; i += 1) {
          expect(hashes[i]).toBe(computeHash(paragraphs[i]));
        }
      }),
      { numRuns: 100 }
    );
  });

  test('upsertChapter persists paragraph_hashes JSON aligned with content', async () => {
    await fc.assert(
      fc.asyncProperty(chapterContentArb, async (content) => {
        const writes = [];
        const fakeDb = {
          async query(sql, params) {
            writes.push({ sql, params });
            // 模拟 INSERT，返回 insertId
            if (/INSERT INTO chapters/i.test(sql)) {
              return [{ insertId: 999 }];
            }
            return [{ affectedRows: 1 }];
          }
        };

        const result = await chapterService.upsertChapter(
          {
            novelId: 1,
            chapterNumber: 1,
            title: 't',
            content,
            wordCount: content.length
          },
          fakeDb
        );

        expect(result.id).toBe(999);
        // INSERT 语句中第 9 个参数是 paragraph_hashes 的 JSON 字符串
        const insert = writes.find(w => /INSERT INTO chapters/i.test(w.sql));
        expect(insert).toBeDefined();
        const paragraphHashesJson = insert.params[8];
        expect(JSON.parse(paragraphHashesJson)).toEqual(buildParagraphHashes(content));
        // 同时返回值里也带 paragraphHashes
        expect(result.paragraphHashes).toEqual(buildParagraphHashes(content));
      }),
      { numRuns: 50 }
    );
  });

  test('refreshChapterParagraphHashes rewrites JSON to match current content', async () => {
    await fc.assert(
      fc.asyncProperty(chapterContentArb, async (content) => {
        const writes = [];
        const fakeDb = {
          async query(sql, params) {
            if (/SELECT id, content FROM chapters/i.test(sql)) {
              return [[{ id: 7, content }]];
            }
            writes.push({ sql, params });
            return [{ affectedRows: 1 }];
          }
        };

        const result = await chapterService.refreshChapterParagraphHashes(7, fakeDb);
        expect(result).not.toBeNull();
        expect(result.paragraphHashes).toEqual(buildParagraphHashes(content));

        const update = writes.find(w => /UPDATE chapters SET paragraph_hashes/i.test(w.sql));
        expect(update).toBeDefined();
        expect(JSON.parse(update.params[0])).toEqual(buildParagraphHashes(content));
      }),
      { numRuns: 50 }
    );
  });
});
