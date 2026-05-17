const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const writeRateLimiter = require('../middlewares/writeRateLimiter');

router.use(authenticate);

router.get('/user/bookmarks', asyncHandler(bookmarkController.listMine));
router.get('/user/bookmarks/novels/:novelId', asyncHandler(bookmarkController.listByNovel));
router.post('/user/bookmarks', writeRateLimiter, asyncHandler(bookmarkController.create));
router.delete('/user/bookmarks/:id', writeRateLimiter, asyncHandler(bookmarkController.remove));

module.exports = router;
