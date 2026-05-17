const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const writeRateLimiter = require('../middlewares/writeRateLimiter');

// 此 router 挂载在 /api/user 下（见 routes/index.js），所以这里的路径不再带 /user 前缀
// 全部接口都需要登录
router.use(authenticate);

router.get('/bookmarks', asyncHandler(bookmarkController.listMine));
router.get('/bookmarks/novels/:novelId', asyncHandler(bookmarkController.listByNovel));
router.post('/bookmarks', writeRateLimiter, asyncHandler(bookmarkController.create));
router.delete('/bookmarks/:id', writeRateLimiter, asyncHandler(bookmarkController.remove));

module.exports = router;
