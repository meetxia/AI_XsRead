const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const config = require('../config');
const Response = require('../utils/response');
const { getRandomAvatarUrl } = require('../utils/avatar');

/**
 * 用户注册
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 简化校验：至少提供用户名或邮箱之一 + 密码
    if (!password || (!username && !email)) {
      return Response.error(res, '请提供用户名或邮箱，以及密码', 400);
    }

    // 规范化
    const normalizedUsername = username ? String(username).trim() : null;
    const normalizedEmail = email ? String(email).trim() : null;
    
    // 唯一性检查（分别检查非空字段）
    let conflict = null;
    if (normalizedUsername) {
      const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [normalizedUsername]);
      if (rows.length > 0) conflict = '用户名已被使用';
    }
    if (!conflict && normalizedEmail) {
      const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
      if (rows.length > 0) conflict = '邮箱已被使用';
    }
    if (conflict) {
      return Response.error(res, conflict, 400);
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 随机头像
    const avatarUrl = getRandomAvatarUrl(req) || null;

    // 创建用户
    // 缺失的用户名或邮箱自动填充
    const finalUsername = normalizedUsername || (normalizedEmail ? normalizedEmail.split('@')[0] : `user_${Date.now()}`);
    const finalEmail = normalizedEmail || `${finalUsername}@local.local`;

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, avatar, created_at) VALUES (?, ?, ?, ?, NOW())',
      [finalUsername, finalEmail, hashedPassword, avatarUrl]
    );
    
    const userId = result.insertId;
    
    // 查询新创建的用户信息
    const [users] = await pool.query(
      'SELECT id, username, email, avatar, role, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    const user = users[0];
    
    // 生成访问令牌（注册成功后自动登录）
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // 生成刷新令牌
    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
    
    // 返回注册信息（包含token，自动登录）
    return Response.created(res, {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7天，单位：秒
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role || 'user'
      }
    }, '注册成功');
  } catch (error) {
    console.error('Register error:', error);
    return Response.error(res, '注册失败', 500);
  }
};

/**
 * 用户登录
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查询用户
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
    
    if (users.length === 0) {
      return Response.error(res, '用户名或密码错误', 401);
    }
    
    const user = users[0];
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return Response.error(res, '用户名或密码错误', 401);
    }
    
    // 如果没有头像，随机分配并回写
    if (!user.avatar) {
      try {
        const newAvatar = getRandomAvatarUrl(req);
        if (newAvatar) {
          await pool.query('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [newAvatar, user.id]);
          user.avatar = newAvatar;
        }
      } catch (e) {
        // 不影响登录流程
        console.warn('分配头像失败（登录时）:', e.message);
      }
    }

    // 生成访问令牌
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // 生成刷新令牌
    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
    
    // 返回登录信息
    return Response.success(res, {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7天，单位：秒
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role || 'user'
      }
    }, '登录成功');
  } catch (error) {
    console.error('Login error:', error);
    return Response.error(res, '登录失败', 500);
  }
};

/**
 * 刷新令牌
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return Response.error(res, '请提供刷新令牌', 400);
    }
    
    // 验证刷新令牌
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // 查询用户信息
    const [users] = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (users.length === 0) {
      return Response.error(res, '用户不存在', 404);
    }
    
    const user = users[0];
    
    // 生成新的访问令牌
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    return Response.success(res, {
      accessToken,
      expiresIn: 7200
    }, '令牌刷新成功');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return Response.error(res, '刷新令牌已过期，请重新登录', 401);
    }
    console.error('Refresh token error:', error);
    return Response.error(res, '令牌刷新失败', 500);
  }
};

/**
 * 获取当前用户信息
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [users] = await pool.query(
      'SELECT id, username, email, avatar, role, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return Response.error(res, '用户不存在', 404);
    }
    const user = users[0];

    // 若缺失头像则自动分配并更新
    if (!user.avatar) {
      try {
        const newAvatar = getRandomAvatarUrl(req);
        if (newAvatar) {
          await pool.query('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [newAvatar, user.id]);
          user.avatar = newAvatar;
        }
      } catch (e) {
        console.warn('分配头像失败（获取当前用户）:', e.message);
      }
    }

    return Response.success(res, user);
  } catch (error) {
    console.error('Get current user error:', error);
    return Response.error(res, '获取用户信息失败', 500);
  }
};

/**
 * 登出（客户端删除token即可）
 */
const logout = async (req, res) => {
  return Response.success(res, null, '登出成功');
};

module.exports = {
  register,
  login,
  refresh,
  getCurrentUser,
  logout
};

