const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middlewares/auth');
const authorController = require('../controllers/authorController');
const { asyncHandler } = require('../middlewares/errorHandler');
const writeRateLimiter = require('../middlewares/writeRateLimiter');

router.get('/:authorId', optionalAuth, asyncHandler(authorController.getAuthor));

router.get('/:authorId/novels', asyncHandler(authorController.listAuthorNovels));

router.post('/:authorId/follow', authenticate, writeRateLimiter, asyncHandler(authorController.follow));
router.delete('/:authorId/follow', authenticate, writeRateLimiter, asyncHandler(authorController.unfollow));

module.exports = router;
