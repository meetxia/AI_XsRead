const bcrypt = require('bcryptjs');

/**
 * 密码加密工具
 */
class BcryptUtil {
  /**
   * 加密密码
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * 验证密码
   */
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = BcryptUtil;

