const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const config = require('../config');
const Response = require('../utils/response');

/**
 * 用户注册
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 检查用户名是否已存在
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return Response.error(res, '用户名或邮箱已被使用', 400);
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())',
      [username, email, hashedPassword]
    );
    
    const userId = result.insertId;
    
    // 查询新创建的用户信息
    const [users] = await pool.query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    return Response.created(res, users[0], '注册成功');
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
      expiresIn: 7200, // 2小时，单位：秒
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
    
    return Response.success(res, users[0]);
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

