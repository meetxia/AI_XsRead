const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// 所有路由都需要管理员权限
router.use(authMiddleware);
router.use(adminMiddleware);

// 获取概览统计
router.get('/overview', DashboardController.getOverview);

// 获取趋势数据
router.get('/trends', DashboardController.getTrends);

// 获取实时动态
router.get('/realtime', DashboardController.getRealtime);

// 获取排行榜
router.get('/ranking', DashboardController.getRanking);

// 分类占比（饼图数据）
router.get('/category-distribution', DashboardController.getCategoryDistribution);

// 用户活跃趋势（按日聚合独立用户）
router.get('/user-activity', DashboardController.getUserActivity);

// 阅读时长分布（分桶统计）
router.get('/reading-time-distribution', DashboardController.getReadingTimeDistribution);

// 小说统计概览（Analytics 页用）
router.get('/novel-stats', DashboardController.getNovelStats);

// 热门小说 TOP N
router.get('/top-novels', DashboardController.getTopNovels);

module.exports = router;

