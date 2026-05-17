/**
 * 激活码生成器
 *
 * 字符集：A-Z + 2-9，共 29 个字符
 *   - 剔除：O 0 I 1 B 8（视觉易混淆）
 *   - 长度 16 → 29^16 ≈ 1.5e23 种组合，单批 1000 个码碰撞概率约 3.3e-18，可忽略
 *
 * 显示格式：4-4-4-4，例如 K7H2-P3MX-9YRT-4QFW
 * 输入归一：去掉所有空白和分隔符，强制大写
 */

const crypto = require('crypto');

const CHARSET = 'ACDEFGHJKLMNPQRSTUVWXYZ2345679'; // 30 字符（去掉易混淆的 O 0 I 1 B 8）
const CHARSET_LEN = CHARSET.length;
const CODE_LENGTH = 16;
const CODE_REGEX = new RegExp(`^[${CHARSET}]{${CODE_LENGTH}}$`);

/**
 * 生成单张激活码（明文）
 * @returns {string} 16 位大写字母+数字
 */
function generateCode() {
  // 用拒绝采样保证字符均匀分布（29 不能整除 256，简单 % 会有偏置；这里采用比例阈值）
  const threshold = 256 - (256 % CHARSET_LEN); // 232
  const out = [];
  while (out.length < CODE_LENGTH) {
    // 一次性多取一些字节降低系统调用开销
    const buf = crypto.randomBytes(CODE_LENGTH * 2);
    for (let i = 0; i < buf.length && out.length < CODE_LENGTH; i++) {
      const b = buf[i];
      if (b < threshold) {
        out.push(CHARSET[b % CHARSET_LEN]);
      }
    }
  }
  return out.join('');
}

/**
 * 批量生成不重复的明文激活码
 * @param {number} count
 * @returns {string[]}
 */
function generateCodes(count) {
  if (!Number.isInteger(count) || count < 1 || count > 10000) {
    throw new RangeError('codeGenerator.generateCodes: count 必须是 1-10000 的整数');
  }
  const set = new Set();
  while (set.size < count) {
    set.add(generateCode());
  }
  return [...set];
}

/**
 * 把生成的 16 位码格式化为 4-4-4-4 显示
 * @param {string} plain
 * @returns {string} 例 K7H2-P3MX-9YRT-4QFW
 */
function formatForDisplay(plain) {
  const code = String(plain || '').toUpperCase();
  return code.match(/.{1,4}/g)?.join('-') || code;
}

/**
 * 生成 8 位脱敏预览：前 4 + 后 4
 * @param {string} plain
 * @returns {string}
 */
function buildPreview(plain) {
  const code = String(plain || '').toUpperCase();
  if (code.length <= 8) return code;
  return code.slice(0, 4) + code.slice(-4);
}

/**
 * 把用户输入归一化为标准格式（去空白、去分隔符、转大写）
 * @param {string} input
 * @returns {string}
 */
function normalizeInput(input) {
  return String(input || '').replace(/[\s-]/g, '').toUpperCase();
}

/**
 * 校验是否为合法激活码格式（已归一化）
 * @param {string} normalized
 * @returns {boolean}
 */
function isValidFormat(normalized) {
  return typeof normalized === 'string' && CODE_REGEX.test(normalized);
}

module.exports = {
  CHARSET,
  CODE_LENGTH,
  generateCode,
  generateCodes,
  formatForDisplay,
  buildPreview,
  normalizeInput,
  isValidFormat
};
