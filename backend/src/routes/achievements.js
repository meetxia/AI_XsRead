const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');

// 挂载在 /api/user 下（见 routes/index.js），路径不再带 /user 前缀
router.get('/achievements', authenticate, asyncHandler(achievementController.list));

module.exports = router;
