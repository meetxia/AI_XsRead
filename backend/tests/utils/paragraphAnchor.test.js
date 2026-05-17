const crypto = require('crypto');
const {
  computeHash,
  splitParagraphs,
  resolveParagraphAnchor
} = require('../../src/utils/paragraphAnchor');

describe('paragraphAnchor utils', () => {
  test('computeHash returns sha1 first 16 hex chars from the first 50 chars', () => {
    const text = '一'.repeat(50) + '后续内容不应影响 hash';
    const expected = crypto
      .createHash('sha1')
      .update('一'.repeat(50))
      .digest('hex')
      .slice(0, 16);

    expect(computeHash(text)).toBe(expected);
    expect(computeHash(text + ' changed')).toBe(expected);
  });

  test('splitParagraphs trims blank separators and keeps non-empty paragraphs', () => {
    expect(splitParagraphs(' 第一段 \n\n\n第二段\r\n\r\n  第三段  ')).toEqual([
      '第一段',
      '第二段',
      '第三段'
    ]);
  });

  test('resolveParagraphAnchor returns exact, rehashed, and fallback statuses', async () => {
    const content = ['旧第一段', '目标段落', '旧第三段'].join('\n\n');
    const paragraphs = splitParagraphs(content);
    const targetHash = computeHash(paragraphs[1]);

    await expect(resolveParagraphAnchor(7, 1, targetHash, { content }))
      .resolves.toEqual({ paragraphIndex: 1, status: 'exact' });

    await expect(resolveParagraphAnchor(7, 0, targetHash, { content }))
      .resolves.toEqual({ paragraphIndex: 1, status: 'rehashed' });

    await expect(resolveParagraphAnchor(7, 99, 'missinghash0000', { content }))
      .resolves.toEqual({ paragraphIndex: 2, status: 'fallback' });
  });
});
