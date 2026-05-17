const express = require('express');
const router = express.Router();
const interestTagController = require('../controllers/interestTagController');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const writeRateLimiter = require('../middlewares/writeRateLimiter');

// 挂载在 /api/user 下（见 routes/index.js），路径不再带 /user 前缀
router.use(authenticate);

router.get('/interest-tags', asyncHandler(interestTagController.list));
router.post('/interest-tags', writeRateLimiter, asyncHandler(interestTagController.save));

module.exports = router;
