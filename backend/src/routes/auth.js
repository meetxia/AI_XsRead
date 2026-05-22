const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { loginValidation } = require('../utils/validators');

// 登录 / 注册专项限流：每 IP 每 15 分钟 10 次
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: '操作过于频繁，请 15 分钟后再试',
    timestamp: Date.now()
  }
});

// 忘记密码限流：每 IP 每小时 3 次（防止滥发邮件 / 邮箱枚举试探）
// 测试环境下跳过，避免单元测试因限流相互干扰
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    code: 429,
    message: '请求过于频繁，请 1 小时后再试',
    timestamp: Date.now()
  }
});

// 重置密码限流：每 IP 每 15 分钟 5 次（暴力 token 猜测防护）
// 测试环境下跳过
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    code: 429,
    message: '操作过于频繁，请稍后再试',
    timestamp: Date.now()
  }
});

// 用户注册（简化：仅用户名或邮箱 + 密码）
router.post('/register', authLimiter, authController.register);

// 用户登录
router.post('/login', authLimiter, loginValidation, authController.login);

// 刷新令牌
router.post('/refresh', authController.refresh);

// 兼容前端：刷新令牌（别名）
router.post('/refresh-token', authController.refresh);

// 获取当前用户信息（需要认证）
router.get('/me', authenticate, authController.getCurrentUser);

// 修改密码（需要认证）
router.post('/change-password', authenticate, authController.changePassword);

// 忘记密码：申请重置链接（公开，限流 3/小时）
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);

// 重置密码：根据 token 重置（公开，限流 5/15min）
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);

// 登出
router.post('/logout', authenticate, authController.logout);

module.exports = router;
