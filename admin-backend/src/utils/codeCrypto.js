/**
 * 激活码加密工具（AES-256-GCM）
 *
 * 设计：
 * - 用 ACTIVATION_CODE_SECRET 派生固定 32 字节密钥（SHA-256(secret + ":activation-code")）
 *   - 这是一个跨进程共享的独立密钥，backend / admin-backend 必须配置相同值
 *   - 不复用 JWT_SECRET，因为 JWT_SECRET 在 backend / admin-backend 里是独立的（避免互相伪造 token）
 *   - 派生时加 namespace 后缀避免与其它派生密钥冲撞
 * - 启动时若 ACTIVATION_CODE_SECRET 缺失，会回退到 JWT_SECRET 并打印 warning（兼容遗留环境）
 * - 每次加密生成新的 12 字节随机 IV，所以同一个明文每次密文都不同
 * - 输出格式：iv(12) || tag(16) || ciphertext，存进 VARBINARY 字段
 * - 同时提供 lookupHash(plain) = SHA-256(明文) 的 hex，作为定位记录的索引
 *
 * 安全性：
 * - 即便 DB 整表泄露，攻击者拿不到 ACTIVATION_CODE_SECRET 也解不出明文激活码
 * - 同一明文每次插入会写入不同密文，不便统计；这是有意为之，不是 bug
 */

const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const NAMESPACE = ':activation-code';

let cachedKey = null;
let cachedSecret = null;
let warnedFallback = false;

function resolveSecret() {
  const primary = process.env.ACTIVATION_CODE_SECRET || '';
  if (primary) return primary;

  const fallback = process.env.JWT_SECRET || '';
  if (fallback) {
    if (!warnedFallback) {
      // eslint-disable-next-line no-console
      console.warn(
        '[codeCrypto] ACTIVATION_CODE_SECRET 未设置，临时使用 JWT_SECRET 派生密钥。' +
        '生产环境请显式设置 ACTIVATION_CODE_SECRET，并在 backend / admin-backend 间保持一致。'
      );
      warnedFallback = true;
    }
    return fallback;
  }
  return '';
}

function getKey() {
  const secret = resolveSecret();
  if (!secret) {
    throw new Error(
      'codeCrypto: 既未设置 ACTIVATION_CODE_SECRET 也未设置 JWT_SECRET，无法派生加密密钥'
    );
  }
  if (cachedSecret !== secret) {
    cachedKey = crypto.createHash('sha256').update(secret + NAMESPACE).digest();
    cachedSecret = secret;
  }
  return cachedKey;
}

/**
 * 加密：返回 Buffer，约定格式 iv || tag || ciphertext
 * @param {string} plain
 * @returns {Buffer}
 */
function encrypt(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new TypeError('codeCrypto.encrypt: plain 必须是非空字符串');
  }
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}

/**
 * 解密
 * @param {Buffer} buf
 * @returns {string}
 */
function decrypt(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < IV_LEN + TAG_LEN + 1) {
    throw new TypeError('codeCrypto.decrypt: buf 长度不合法');
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

/**
 * 用于按用户输入的明文码定位记录的索引（不可逆）
 * @param {string} plain
 * @returns {string} 64 hex chars
 */
function lookupHash(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new TypeError('codeCrypto.lookupHash: plain 必须是非空字符串');
  }
  return crypto.createHash('sha256').update(plain).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  lookupHash
};
