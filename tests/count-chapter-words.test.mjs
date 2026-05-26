import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { countText } from '../scripts/count-chapter-words.mjs';

describe('countText', () => {
  it('counts a chapter using the no-whitespace novel word-count convention', () => {
    const text = '第一行：豆包说，别喝。\n\nSecond line 42';

    assert.deepEqual(countText(text), {
      totalCharactersIncludingWhitespace: 27,
      charactersExcludingWhitespace: 23,
      cjkChineseCharactersOnly: 8,
      punctuationAndSymbols: 3,
      lines: 3,
    });
  });

  it('returns zero counts for an empty chapter', () => {
    assert.deepEqual(countText(''), {
      totalCharactersIncludingWhitespace: 0,
      charactersExcludingWhitespace: 0,
      cjkChineseCharactersOnly: 0,
      punctuationAndSymbols: 0,
      lines: 0,
    });
  });
});
