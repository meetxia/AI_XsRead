/**
 * codeGenerator 单元测试
 */

const {
  CHARSET,
  CODE_LENGTH,
  generateCode,
  generateCodes,
  formatForDisplay,
  buildPreview,
  normalizeInput,
  isValidFormat
} = require('../../src/utils/codeGenerator');

describe('codeGenerator', () => {
  describe('generateCode', () => {
    it('返回长度为 16', () => {
      expect(generateCode()).toHaveLength(CODE_LENGTH);
    });

    it('只包含 CHARSET 字符（不含 O 0 I 1 B 8）', () => {
      const forbidden = /[O0I1B8]/;
      for (let i = 0; i < 200; i++) {
        const code = generateCode();
        expect(forbidden.test(code)).toBe(false);
        expect(/^[ACDEFGHJKLMNPQRSTUVWXYZ2345679]{16}$/.test(code)).toBe(true);
      }
    });
  });

  describe('generateCodes 批量', () => {
    it('生成 10000 个码全部唯一', () => {
      const codes = generateCodes(10000);
      expect(codes).toHaveLength(10000);
      expect(new Set(codes).size).toBe(10000);
    });

    it('count 非法时抛错', () => {
      expect(() => generateCodes(0)).toThrow();
      expect(() => generateCodes(-5)).toThrow();
      expect(() => generateCodes(1.5)).toThrow();
      expect(() => generateCodes(20000)).toThrow();
      expect(() => generateCodes('abc')).toThrow();
    });
  });

  describe('字符均匀分布（统计 sanity check）', () => {
    it('100000 字符样本里每个字符至少出现一次', () => {
      const sample = generateCodes(10000).join('');
      for (const ch of CHARSET) {
        expect(sample).toContain(ch);
      }
    });
  });

  describe('formatForDisplay', () => {
    it('16 位输出 4-4-4-4', () => {
      expect(formatForDisplay('K7H2P3MX9YRT4QFW')).toBe('K7H2-P3MX-9YRT-4QFW');
    });

    it('短输入也保留分组', () => {
      expect(formatForDisplay('ABCD')).toBe('ABCD');
      expect(formatForDisplay('ABCDEFGH')).toBe('ABCD-EFGH');
    });

    it('小写自动转大写', () => {
      expect(formatForDisplay('abcdwxyz')).toBe('ABCD-WXYZ');
    });
  });

  describe('buildPreview', () => {
    it('返回前 4 + 后 4', () => {
      expect(buildPreview('K7H2P3MX9YRT4QFW')).toBe('K7H24QFW');
    });

    it('短输入按原样返回', () => {
      expect(buildPreview('ABC')).toBe('ABC');
      expect(buildPreview('12345678')).toBe('12345678');
    });
  });

  describe('normalizeInput', () => {
    it('去掉空格和短横', () => {
      expect(normalizeInput('K7H2-P3MX-9YRT-4QFW')).toBe('K7H2P3MX9YRT4QFW');
      expect(normalizeInput(' K7H2 P3MX 9YRT 4QFW ')).toBe('K7H2P3MX9YRT4QFW');
    });

    it('转大写', () => {
      expect(normalizeInput('k7h2-p3mx-9yrt-4qfw')).toBe('K7H2P3MX9YRT4QFW');
    });

    it('容忍 null / undefined', () => {
      expect(normalizeInput(null)).toBe('');
      expect(normalizeInput(undefined)).toBe('');
    });
  });

  describe('isValidFormat', () => {
    it('正常 16 位通过', () => {
      expect(isValidFormat('K7H2P3MX9YRT4QFW')).toBe(true);
    });

    it('包含禁用字符不通过', () => {
      expect(isValidFormat('O7H2P3MX9YRT4QFW')).toBe(false); // O
      expect(isValidFormat('17H2P3MX9YRT4QFW')).toBe(false); // 1
      expect(isValidFormat('B7H2P3MX9YRT4QFW')).toBe(false); // B
      expect(isValidFormat('87H2P3MX9YRT4QFW')).toBe(false); // 8
      expect(isValidFormat('07H2P3MX9YRT4QFW')).toBe(false); // 0
    });

    it('长度不对不通过', () => {
      expect(isValidFormat('SHORT')).toBe(false);
      expect(isValidFormat('K7H2P3MX9YRT4QFWX')).toBe(false);
    });

    it('小写不通过（必须先 normalizeInput）', () => {
      expect(isValidFormat('k7h2p3mx9yrt4qfw')).toBe(false);
    });
  });
});
