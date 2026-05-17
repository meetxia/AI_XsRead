/**
 * codeCrypto 单元测试
 */

// 测试时需要保证密钥存在；优先用 ACTIVATION_CODE_SECRET
process.env.ACTIVATION_CODE_SECRET =
  process.env.ACTIVATION_CODE_SECRET || 'test-activation-secret-stable-32chars-min';

const { encrypt, decrypt, lookupHash } = require('../../src/utils/codeCrypto');

describe('codeCrypto', () => {
  describe('encrypt + decrypt 回环', () => {
    it('能正确加解密 16 位激活码', () => {
      const plain = 'K7H2P3MX9YRT4QFW';
      const cipher = encrypt(plain);
      expect(Buffer.isBuffer(cipher)).toBe(true);
      expect(cipher.length).toBeGreaterThan(28); // iv(12) + tag(16) + ciphertext
      expect(decrypt(cipher)).toBe(plain);
    });

    it('对中文 / 长字符串也工作', () => {
      const plain = '激活码测试🎉Mixed文字abc123 ' + 'x'.repeat(200);
      expect(decrypt(encrypt(plain))).toBe(plain);
    });

    it('同一明文两次加密结果不同（IV 随机）', () => {
      const plain = 'SAME-PLAIN-CODE1';
      const a = encrypt(plain);
      const b = encrypt(plain);
      expect(a.equals(b)).toBe(false);
      // 但都能解出同一明文
      expect(decrypt(a)).toBe(plain);
      expect(decrypt(b)).toBe(plain);
    });

    it('密文被篡改会抛错（GCM 完整性校验）', () => {
      const plain = 'ABCDEFGHIJKLMNOP';
      const cipher = encrypt(plain);
      // 翻转密文最后一个字节
      cipher[cipher.length - 1] ^= 0xff;
      expect(() => decrypt(cipher)).toThrow();
    });

    it('用错误的 KEY 派生（不同 ACTIVATION_CODE_SECRET）解密会抛错', () => {
      const plain = 'CODE-FROM-KEY-A1';
      const original = process.env.ACTIVATION_CODE_SECRET;

      process.env.ACTIVATION_CODE_SECRET = original + '-A';
      const cipher = encrypt(plain);

      process.env.ACTIVATION_CODE_SECRET = original + '-B';
      expect(() => decrypt(cipher)).toThrow();

      process.env.ACTIVATION_CODE_SECRET = original;
    });
  });

  describe('lookupHash', () => {
    it('返回 64 字符 hex', () => {
      const hash = lookupHash('K7H2P3MX9YRT4QFW');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('同一输入两次结果相同', () => {
      expect(lookupHash('SAME')).toBe(lookupHash('SAME'));
    });

    it('不同输入结果不同', () => {
      expect(lookupHash('A')).not.toBe(lookupHash('B'));
    });

    it('大小写敏感（提示后续约定调用方传入"已规范化（大写、去分隔）"的明文）', () => {
      expect(lookupHash('abcd')).not.toBe(lookupHash('ABCD'));
    });
  });

  describe('入参校验', () => {
    it('encrypt 空字符串抛错', () => {
      expect(() => encrypt('')).toThrow();
    });
    it('encrypt 非字符串抛错', () => {
      expect(() => encrypt(null)).toThrow();
      expect(() => encrypt(undefined)).toThrow();
      expect(() => encrypt(123)).toThrow();
    });
    it('decrypt 长度不足抛错', () => {
      expect(() => decrypt(Buffer.from([1, 2, 3]))).toThrow();
    });
    it('lookupHash 空字符串抛错', () => {
      expect(() => lookupHash('')).toThrow();
    });
  });
});
