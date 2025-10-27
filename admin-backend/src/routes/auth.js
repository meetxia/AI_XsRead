const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

// 登录
router.post('/login', AuthController.login);

// 退出登录（需要认证）
router.post('/logout', authMiddleware, AuthController.logout);

// 获取当前管理员信息（需要认证）
router.get('/profile', authMiddleware, AuthController.getProfile);

// 刷新Token
router.post('/refresh-token', AuthController.refreshToken);

module.exports = router;

