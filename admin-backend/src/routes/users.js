const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 获取用户列表
router.get('/', UserController.getList);

// 获取用户详情
router.get('/:id', UserController.getDetail);

// 更新用户状态
router.put('/:id/status', UserController.updateStatus);

// 获取用户统计
router.get('/:id/statistics', UserController.getStatistics);

module.exports = router;

