const db = require('../config/database');
const BcryptUtil = require('../utils/bcrypt');
const JWTUtil = require('../utils/jwt');
const Response = require('../utils/response');

/**
 * 认证控制器
 */
class AuthController {
  /**
   * 管理员登录
   */
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // 验证输入
      if (!username || !password) {
        return Response.error(res, '用户名和密码不能为空', 400);
      }

      // 查询管理员
      const [users] = await db.query(
        'SELECT * FROM admin_users WHERE username = ? AND status = 1',
        [username]
      );

      if (users.length === 0) {
        return Response.error(res, '用户名或密码错误', 401);
      }

      const user = users[0];

      // 验证密码
      const isValidPassword = await BcryptUtil.comparePassword(password, user.password);
      
      if (!isValidPassword) {
        return Response.error(res, '用户名或密码错误', 401);
      }

      // 生成token
      const accessToken = JWTUtil.generateAccessToken({
        id: user.id,
        username: user.username,
        role: user.role
      });

      const refreshToken = JWTUtil.generateRefreshToken({
        id: user.id,
        username: user.username
      });

      // 更新登录信息
      await db.query(
        'UPDATE admin_users SET last_login_time = NOW(), last_login_ip = ? WHERE id = ?',
        [req.ip, user.id]
      );

      // 记录登录日志
      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, description, ip, user_agent)
         VALUES (?, ?, 'login', 'auth', '管理员登录', ?, ?)`,
        [user.id, user.username, req.ip, req.headers['user-agent']]
      );

      // 返回用户信息（不包含密码）
      const userInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      };

      return Response.success(res, {
        accessToken,
        refreshToken,
        expiresIn: 7200,
        user: userInfo
      }, '登录成功');

    } catch (error) {
      next(error);
    }
  }

  /**
   * 退出登录
   */
  static async logout(req, res, next) {
    try {
      const { id, username } = req.user;

      // 记录退出日志
      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, description, ip)
         VALUES (?, ?, 'logout', 'auth', '管理员退出登录', ?)`,
        [id, username, req.ip]
      );

      return Response.success(res, null, '退出成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前管理员信息
   */
  static async getProfile(req, res, next) {
    try {
      const { id } = req.user;

      const [users] = await db.query(
        'SELECT id, username, email, avatar, role, created_at, last_login_time FROM admin_users WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        return Response.error(res, '用户不存在', 404);
      }

      return Response.success(res, users[0]);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刷新Token
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return Response.error(res, '刷新令牌不能为空', 400);
      }

      // 验证刷新令牌
      const decoded = JWTUtil.verifyToken(refreshToken);

      // 生成新的访问令牌
      const newAccessToken = JWTUtil.generateAccessToken({
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      });

      return Response.success(res, {
        accessToken: newAccessToken,
        expiresIn: 7200
      });
    } catch (error) {
      return Response.error(res, 'Token无效或已过期', 401);
    }
  }
}

module.exports = AuthController;

