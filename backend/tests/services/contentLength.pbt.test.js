/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 13: 内容长度 ≤ 500 字护栏
 * Validates: Requirements 26.3, 27.8, 34.5
 *
 * 任务 25.6 — sanitizeText / sanitizeComment 的 500 字上限护栏。
 *
 * 测试目标：
 *   1) 输入长度 ≤ 500 → 返回清洗后的字符串（不抛异常）
 *   2) 输入长度 > 500 → 抛 { code: 'COMMENT_TOO_LONG' }
 *   3) 内容里的 <script> / on*= / javascript: 在合规长度下被剥离
 */

const fc = require('fast-check');
const { sanitizeText, sanitizeComment } = require('../../src/utils/sanitizer');

describe('[Property 13] content length ≤ 500 guard', () => {
  test('inputs ≤ 500 chars return sanitized string without throwing', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (input) => {
          const out = sanitizeComment(input);
          expect(typeof out).toBe('string');
          expect(out.length).toBeLessThanOrEqual(500);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('inputs > 500 chars throw { code: COMMENT_TOO_LONG }', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 501, max: 5000 }),
        (length) => {
          const longContent = 'a'.repeat(length);
          let thrown;
          try {
            sanitizeComment(longContent);
          } catch (err) {
            thrown = err;
          }
          expect(thrown).toBeDefined();
          expect(thrown.code).toBe('COMMENT_TOO_LONG');
          expect(thrown.httpStatus).toBe(400);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('configurable maxLen on sanitizeText', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (maxLen, surplus) => {
          const ok = 'a'.repeat(maxLen);
          expect(sanitizeText(ok, { maxLen })).toBe(ok);

          const tooLong = 'a'.repeat(maxLen + surplus);
          expect(() => sanitizeText(tooLong, { maxLen })).toThrow(
            expect.objectContaining({ code: 'COMMENT_TOO_LONG' })
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  test('dangerous html tags are stripped while length stays within 500', () => {
    const samples = [
      '<script>alert(1)</script>你好',
      '<img src=x onerror="boom()">这一段',
      '<a href="javascript:alert(1)">点我</a>',
      '<div onclick="x()">click</div>'
    ];
    for (const input of samples) {
      const out = sanitizeComment(input);
      expect(out).not.toMatch(/<script\b/i);
      expect(out).not.toMatch(/\son[a-z]+\s*=/i);
      expect(out).not.toMatch(/javascript\s*:/i);
    }
  });

  test('null / undefined / non-string input is normalized to empty string', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeComment('')).toBe('');
  });
});
