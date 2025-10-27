const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT工具类
 */
class JWTUtil {
  /**
   * 生成访问令牌
   */
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  /**
   * 生成刷新令牌
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn
    });
  }

  /**
   * 验证令牌
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Token无效或已过期');
    }
  }

  /**
   * 解码令牌（不验证）
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTUtil;

