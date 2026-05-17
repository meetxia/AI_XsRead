const express = require('express');
const router = express.Router();
const interestTagController = require('../controllers/interestTagController');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const writeRateLimiter = require('../middlewares/writeRateLimiter');

router.use(authenticate);

router.get('/user/interest-tags', asyncHandler(interestTagController.list));
router.post('/user/interest-tags', writeRateLimiter, asyncHandler(interestTagController.save));

module.exports = router;
