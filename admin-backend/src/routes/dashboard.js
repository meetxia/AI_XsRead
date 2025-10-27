const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middlewares/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 获取概览统计
router.get('/overview', DashboardController.getOverview);

// 获取趋势数据
router.get('/trends', DashboardController.getTrends);

// 获取实时动态
router.get('/realtime', DashboardController.getRealtime);

// 获取排行榜
router.get('/ranking', DashboardController.getRanking);

module.exports = router;

