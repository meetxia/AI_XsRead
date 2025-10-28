/**
 * 加密解密工具
 * 用于敏感数据的加密存储
 */
const crypto = require('crypto');

// 加密算法
const ALGORITHM = 'aes-256-cbc';

// 从环境变量获取密钥，如果没有则使用默认值（生产环境必须设置）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// 确保密钥长度为32字节
const SECRET_KEY = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');

/**
 * 加密服务类
 */
class CryptoService {
  /**
   * 加密文本
   * @param {string} text - 要加密的文本
   * @returns {string} 加密后的文本（格式：iv:encryptedData）
   */
  encrypt(text) {
    if (!text) {
      return text;
    }

    try {
      // 生成随机的初始化向量
      const iv = crypto.randomBytes(16);
      
      // 创建加密器
      const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
      
      // 加密
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // 返回格式：iv:encryptedData
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('加密失败:', error);
      throw new Error('数据加密失败');
    }
  }

  /**
   * 解密文本
   * @param {string} encryptedText - 加密的文本（格式：iv:encryptedData）
   * @returns {string} 解密后的文本
   */
  decrypt(encryptedText) {
    if (!encryptedText) {
      return encryptedText;
    }

    try {
      // 分离IV和加密数据
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        throw new Error('加密数据格式错误');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encryptedData = parts[1];
      
      // 创建解密器
      const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
      
      // 解密
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('解密失败:', error);
      throw new Error('数据解密失败');
    }
  }

  /**
   * 生成哈希值（单向加密，不可逆）
   * @param {string} text - 要哈希的文本
   * @param {string} algorithm - 哈希算法（默认sha256）
   * @returns {string} 哈希值
   */
  hash(text, algorithm = 'sha256') {
    if (!text) {
      return text;
    }

    try {
      return crypto
        .createHash(algorithm)
        .update(text)
        .digest('hex');
    } catch (error) {
      console.error('哈希失败:', error);
      throw new Error('数据哈希失败');
    }
  }

  /**
   * 生成HMAC（带密钥的哈希）
   * @param {string} text - 要哈希的文本
   * @param {string} key - 密钥（可选，默认使用全局密钥）
   * @param {string} algorithm - 哈希算法（默认sha256）
   * @returns {string} HMAC值
   */
  hmac(text, key = null, algorithm = 'sha256') {
    if (!text) {
      return text;
    }

    try {
      const hmacKey = key || SECRET_KEY.toString('hex');
      return crypto
        .createHmac(algorithm, hmacKey)
        .update(text)
        .digest('hex');
    } catch (error) {
      console.error('HMAC失败:', error);
      throw new Error('HMAC生成失败');
    }
  }

  /**
   * 生成随机字符串
   * @param {number} length - 字符串长度（字节数）
   * @param {string} encoding - 编码格式（hex/base64）
   * @returns {string} 随机字符串
   */
  randomString(length = 32, encoding = 'hex') {
    try {
      return crypto.randomBytes(length).toString(encoding);
    } catch (error) {
      console.error('生成随机字符串失败:', error);
      throw new Error('生成随机字符串失败');
    }
  }

  /**
   * 生成随机数字
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 随机数字
   */
  randomInt(min = 0, max = 999999) {
    try {
      return crypto.randomInt(min, max + 1);
    } catch (error) {
      console.error('生成随机数字失败:', error);
      throw new Error('生成随机数字失败');
    }
  }

  /**
   * 加密邮箱
   * 保留域名部分便于调试
   * @param {string} email - 邮箱
   * @returns {string} 加密后的邮箱
   */
  encryptEmail(email) {
    if (!email) {
      return email;
    }

    try {
      const [localPart, domain] = email.split('@');
      const encryptedLocal = this.encrypt(localPart);
      return `${encryptedLocal}@${domain}`;
    } catch (error) {
      // 如果格式不正确，直接加密整个字符串
      return this.encrypt(email);
    }
  }

  /**
   * 解密邮箱
   * @param {string} encryptedEmail - 加密的邮箱
   * @returns {string} 解密后的邮箱
   */
  decryptEmail(encryptedEmail) {
    if (!encryptedEmail) {
      return encryptedEmail;
    }

    try {
      const parts = encryptedEmail.split('@');
      if (parts.length === 2) {
        const decryptedLocal = this.decrypt(parts[0]);
        return `${decryptedLocal}@${parts[1]}`;
      } else {
        return this.decrypt(encryptedEmail);
      }
    } catch (error) {
      return this.decrypt(encryptedEmail);
    }
  }

  /**
   * 加密手机号
   * 保留最后4位便于识别
   * @param {string} phone - 手机号
   * @returns {string} 加密后的手机号
   */
  encryptPhone(phone) {
    if (!phone || phone.length < 4) {
      return this.encrypt(phone);
    }

    try {
      const lastFour = phone.slice(-4);
      const firstPart = phone.slice(0, -4);
      const encryptedFirst = this.encrypt(firstPart);
      return `${encryptedFirst}:${lastFour}`;
    } catch (error) {
      return this.encrypt(phone);
    }
  }

  /**
   * 解密手机号
   * @param {string} encryptedPhone - 加密的手机号
   * @returns {string} 解密后的手机号
   */
  decryptPhone(encryptedPhone) {
    if (!encryptedPhone) {
      return encryptedPhone;
    }

    try {
      const parts = encryptedPhone.split(':');
      if (parts.length === 3) {
        // 格式: iv:encryptedData:lastFour
        const iv = parts[0];
        const encryptedData = parts[1];
        const lastFour = parts[2];
        const decryptedFirst = this.decrypt(`${iv}:${encryptedData}`);
        return `${decryptedFirst}${lastFour}`;
      } else {
        return this.decrypt(encryptedPhone);
      }
    } catch (error) {
      return this.decrypt(encryptedPhone);
    }
  }

  /**
   * 验证加密密钥是否正确配置
   * @returns {boolean}
   */
  validateEncryptionKey() {
    if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
      console.error('❌ 生产环境必须配置ENCRYPTION_KEY环境变量');
      return false;
    }

    if (SECRET_KEY.length !== 32) {
      console.error('❌ 加密密钥长度必须为32字节');
      return false;
    }

    return true;
  }
}

// 导出单例
const cryptoService = new CryptoService();

// 在启动时验证密钥
if (!cryptoService.validateEncryptionKey()) {
  console.warn('⚠️  加密密钥配置有问题，请检查');
}

module.exports = cryptoService;

