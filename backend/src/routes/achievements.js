const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');

router.get('/user/achievements', authenticate, asyncHandler(achievementController.list));

module.exports = router;
