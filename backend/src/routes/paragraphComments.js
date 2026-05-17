const express = require('express');
const router = express.Router();
const paragraphCommentController = require('../controllers/paragraphCommentController');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const writeRateLimiter = require('../middlewares/writeRateLimiter');

router.get('/paragraph-comments/counts', asyncHandler(paragraphCommentController.counts));
router.get('/paragraph-comments', asyncHandler(paragraphCommentController.list));
router.post('/paragraph-comments', authenticate, writeRateLimiter, asyncHandler(paragraphCommentController.create));
router.post('/paragraph-comments/:id/like', authenticate, writeRateLimiter, asyncHandler(paragraphCommentController.like));
router.delete('/paragraph-comments/:id/like', authenticate, writeRateLimiter, asyncHandler(paragraphCommentController.unlike));
router.delete('/paragraph-comments/:id', authenticate, writeRateLimiter, asyncHandler(paragraphCommentController.remove));

module.exports = router;
