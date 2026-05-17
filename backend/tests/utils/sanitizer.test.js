const { sanitizeText, sanitizeComment } = require('../../src/utils/sanitizer');

describe('sanitizer utils', () => {
  test('sanitizeComment strips dangerous html while preserving Chinese text', () => {
    const input = '<script>alert(1)</script><a href="javascript:alert(1)" onclick="x()">你好</a><img onerror="bad()" src=x>';

    const output = sanitizeComment(input);

    expect(output).toContain('你好');
    expect(output).not.toMatch(/script|javascript:|onclick|onerror/i);
  });

  test('sanitizeText throws COMMENT_TOO_LONG for over-length content', () => {
    expect(() => sanitizeText('a'.repeat(501), { maxLen: 500 })).toThrow(
      expect.objectContaining({ code: 'COMMENT_TOO_LONG' })
    );
  });
});
