const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { paginationValidation, idValidation } = require('../utils/validators');

// 所有路由都需要认证
router.use(authenticate);

// 书架相关
router.get('/bookshelf', paginationValidation, userController.getBookshelf);
router.post('/bookshelf', userController.addToBookshelf);
router.delete('/bookshelf/:novelId', idValidation, userController.removeFromBookshelf);

// 阅读进度
router.get('/reading-progress/:novelId', idValidation, userController.getReadingProgress);
router.post('/reading-progress', userController.updateReadingProgress);

// 阅读历史
router.get('/reading-history', paginationValidation, userController.getReadingHistory);

// 用户统计
router.get('/statistics', userController.getUserStatistics);

// 用户成就
router.get('/achievements', userController.getUserAchievements);

// 用户资料
router.get('/profile', userController.getUserProfile);

module.exports = router;
