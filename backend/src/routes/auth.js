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

// 登出
router.post('/logout', authenticate, authController.logout);

module.exports = router;
