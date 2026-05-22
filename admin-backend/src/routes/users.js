const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const MembershipAdminController = require('../controllers/membershipAdminController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// 所有路由都需要管理员权限
router.use(authMiddleware);
router.use(adminMiddleware);

// 获取用户列表
router.get('/', UserController.getList);

// 获取用户详情
router.get('/:id', UserController.getDetail);

// 更新用户状态
router.put('/:id/status', UserController.updateStatus);

// 获取用户统计
router.get('/:id/statistics', UserController.getStatistics);

// 会员状态：停用 / 启用
router.post('/:id/membership/disable', MembershipAdminController.disableMember);
router.post('/:id/membership/enable', MembershipAdminController.enableMember);

module.exports = router;
