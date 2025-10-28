const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { loginValidation } = require('../utils/validators');

// 用户注册（简化：仅用户名或邮箱 + 密码）
router.post('/register', authController.register);

// 用户登录
router.post('/login', loginValidation, authController.login);

// 刷新令牌
router.post('/refresh', authController.refresh);

// 兼容前端：刷新令牌（别名）
router.post('/refresh-token', authController.refresh);

// 获取当前用户信息（需要认证）
router.get('/me', authenticate, authController.getCurrentUser);

// 登出
router.post('/logout', authenticate, authController.logout);

module.exports = router;

