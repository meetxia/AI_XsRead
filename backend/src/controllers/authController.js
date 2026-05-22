const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const config = require('../config');
const Response = require('../utils/response');
const { getRandomAvatarUrl } = require('../utils/avatar');
const { sendEmail, buildPasswordResetLink } = require('../utils/mailer');
const { redeemActivationCode, ActivationError } = require('./membershipController');

/**
 * 用户注册
 */
const register = async (req, res) => {
  try {
    const { username, email, password, activation_code: activationCodeRaw } = req.body;

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
      { expiresIn: config.jwt.expiresIn, algorithm: 'HS256' }
    );

    // 生成刷新令牌
    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn, algorithm: 'HS256' }
    );

    // 可选：注册时附带激活码 → 注册流程已成功，激活失败不阻断
    let activationStatus = 'not_provided';
    let activationMessage = null;
    let activationData = null;
    if (activationCodeRaw) {
      try {
        activationData = await redeemActivationCode({
          userId: user.id,
          code: activationCodeRaw,
          channel: 'register',
          ip: req.ip,
          userAgent: req.get('user-agent') || null
        });
        activationStatus = 'success';
        activationMessage = '激活成功';
      } catch (activationErr) {
        activationStatus = 'failed';
        if (activationErr instanceof ActivationError) {
          activationMessage = activationErr.message;
        } else {
          activationMessage = '激活失败，请稍后在个人中心重试';
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[register] 激活码处理失败:', activationErr.message);
          }
        }
      }
    }

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
      },
      activation_status: activationStatus,
      activation_message: activationMessage,
      activation_data: activationData
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
      { expiresIn: config.jwt.expiresIn, algorithm: 'HS256' }
    );

    // 生成刷新令牌
    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn, algorithm: 'HS256' }
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
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret, { algorithms: ['HS256'] });
    
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
      { expiresIn: config.jwt.expiresIn, algorithm: 'HS256' }
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

/**
 * 修改密码
 * 必须已登录（authenticate 中间件），从 req.user.id 取用户。
 * 请求体：{ oldPassword, newPassword }
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return Response.error(res, '请先登录', 401);
    }

    const { oldPassword, newPassword } = req.body || {};

    if (!oldPassword || !newPassword) {
      return Response.error(res, '请提供旧密码和新密码', 400);
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return Response.error(res, '新密码至少 6 位', 400);
    }
    if (oldPassword === newPassword) {
      return Response.error(res, '新密码不能与旧密码相同', 400);
    }

    // 取用户当前密码
    const [users] = await pool.query('SELECT id, password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return Response.error(res, '用户不存在', 404);
    }
    const user = users[0];

    // 校验旧密码
    const isOldValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldValid) {
      return Response.error(res, '旧密码不正确', 400);
    }

    // 加密新密码并更新
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashed, userId]
    );

    return Response.success(res, null, '密码修改成功');
  } catch (error) {
    console.error('Change password error:', error);
    return Response.error(res, '修改密码失败', 500);
  }
};

/**
 * 忘记密码 / 申请重置链接
 * 请求体：{ email }
 *
 * 安全：
 * - 不论邮箱是否存在，统一返回 200 success（避免邮箱枚举）
 * - 限流由路由层 forgotPasswordLimiter 处理
 * - DB 仅存 token 的 SHA-256 hash，不存明文
 *
 * 副作用：
 * - 邮箱存在时：写一条 password_reset_tokens（30 分钟过期）+ sendEmail
 * - 邮箱不存在时：什么也不做，但仍延迟"看起来像在工作"避免 timing attack（保留以后可加）
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body || {};

  // 入参基本校验：失败时也返回 200，让攻击者看到一致响应
  const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
  const emailLooksValid = normalizedEmail && /.+@.+\..+/.test(normalizedEmail);
  const ip = req.ip || null;

  if (!emailLooksValid) {
    return Response.success(
      res,
      null,
      '如果该邮箱已注册，我们已发送重置链接，请检查邮箱（30 分钟内有效）'
    );
  }

  try {
    const [users] = await pool.query(
      'SELECT id, email FROM users WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail]
    );
    const user = users[0];

    if (user) {
      const token = crypto.randomBytes(32).toString('hex'); // 64 hex 字符
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, ip)
         VALUES (?, ?, ?, ?)`,
        [user.id, tokenHash, expiresAt, ip]
      );

      const resetLink = buildPasswordResetLink(token);
      try {
        await sendEmail({
          to: user.email,
          subject: 'MOMO 小说 · 密码重置',
          text:
            `您好，\n\n` +
            `您（或他人）发起了密码重置请求。请在 30 分钟内点击以下链接重置密码：\n\n` +
            `${resetLink}\n\n` +
            `如非本人操作，请忽略此邮件，您的账号仍然安全。`,
          html:
            `<p>您好，</p>` +
            `<p>您（或他人）发起了密码重置请求。请在 30 分钟内点击以下链接重置密码：</p>` +
            `<p><a href="${resetLink}">${resetLink}</a></p>` +
            `<p>如非本人操作，请忽略此邮件，您的账号仍然安全。</p>`
        });
      } catch (mailErr) {
        // 邮件发送失败不影响接口响应：fallback 已 console.log
        // eslint-disable-next-line no-console
        console.warn('[forgotPassword] sendEmail 异常:', mailErr.message);
      }

      // dev 环境：把链接打印到日志，方便开发者直接拷贝测试
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[forgotPassword] reset link =', resetLink);
      }
    }
  } catch (err) {
    // DB 异常：仅记录日志，仍然返回 200 不暴露
    // eslint-disable-next-line no-console
    console.error('[forgotPassword] error:', err);
  }

  return Response.success(
    res,
    null,
    '如果该邮箱已注册，我们已发送重置链接，请检查邮箱（30 分钟内有效）'
  );
};

/**
 * 重置密码
 * 请求体：{ token, newPassword }
 *
 * 校验：
 * - token 长度恰为 64 hex
 * - newPassword 长度 ≥ 6
 * - DB 中 token_hash 匹配 + used_at IS NULL + expires_at > NOW()
 *
 * 命中后事务内：bcrypt 更新 users.password + 标记 used_at
 */
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (!token || typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
    return Response.error(res, '重置链接无效或已过期', 400);
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return Response.error(res, '新密码至少 6 位', 400);
  }

  const tokenHash = crypto.createHash('sha256').update(token.toLowerCase()).digest('hex');

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, user_id, expires_at, used_at
         FROM password_reset_tokens
        WHERE token_hash = ?
        LIMIT 1
        FOR UPDATE`,
      [tokenHash]
    );

    const tokenRow = rows[0];
    const now = new Date();

    if (
      !tokenRow ||
      tokenRow.used_at ||
      new Date(tokenRow.expires_at).getTime() <= now.getTime()
    ) {
      await connection.rollback();
      connection.release();
      return Response.error(res, '重置链接无效或已过期', 400);
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await connection.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashed, tokenRow.user_id]
    );

    await connection.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
      [tokenRow.id]
    );

    await connection.commit();
    connection.release();

    return Response.success(res, null, '密码重置成功，请使用新密码登录');
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {
        // ignore
      }
      connection.release();
    }
    // eslint-disable-next-line no-console
    console.error('[resetPassword] error:', err);
    return Response.error(res, '密码重置失败，请稍后再试', 500);
  }
};

module.exports = {
  register,
  login,
  refresh,
  getCurrentUser,
  logout,
  changePassword,
  forgotPassword,
  resetPassword
};

