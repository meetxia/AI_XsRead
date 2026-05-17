const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authorController = require('../controllers/authorController');
const { authenticate } = require('../middlewares/auth');
const { paginationValidation, idValidation, novelIdValidation } = require('../utils/validators');
const { asyncHandler } = require('../middlewares/errorHandler');
const writeRateLimiter = require('../middlewares/writeRateLimiter');

// 所有路由都需要认证
router.use(authenticate);

// 书架相关
router.get('/bookshelf', paginationValidation, userController.getBookshelf);
router.post('/bookshelf', writeRateLimiter, userController.addToBookshelf);
router.delete('/bookshelf/:novelId', writeRateLimiter, novelIdValidation, userController.removeFromBookshelf);

// 更新书架项（例如类型、排序标签等）
router.put('/bookshelf/:novelId', writeRateLimiter, novelIdValidation, userController.updateBookshelfItem);

// 批量操作书架（支持 delete | group | top | untop）
router.post('/bookshelf/batch', writeRateLimiter, userController.batchOperateBookshelf);

// 检查是否在书架
router.get('/bookshelf/check/:novelId', novelIdValidation, userController.checkInBookshelf);

// 阅读进度
router.get('/reading-progress/:novelId', novelIdValidation, userController.getReadingProgress);
router.post('/reading-progress', userController.updateReadingProgress);

// 阅读历史
router.get('/reading-history', paginationValidation, userController.getReadingHistory);

// 用户统计
router.get('/statistics', userController.getUserStatistics);

// 用户成就
router.get('/achievements', userController.getUserAchievements);

// 关注作者
router.get('/following-authors', paginationValidation, asyncHandler(authorController.listFollowing));

// 用户资料
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);

module.exports = router;
