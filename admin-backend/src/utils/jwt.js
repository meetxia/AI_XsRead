const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT工具类
 */
class JWTUtil {
  /** access token：用 jwt.secret + 显式 HS256 */
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS256'
    });
  }

  /** refresh token：用独立 jwt.refreshSecret */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      algorithm: 'HS256'
    });
  }

  /** 验证 access token */
  static verifyToken(token) {
    return jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
  }

  /** 验证 refresh token */
  static verifyRefreshToken(token) {
    return jwt.verify(token, config.jwt.refreshSecret, { algorithms: ['HS256'] });
  }

  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTUtil;
