const express = require('express');
const router = express.Router();
const highlightController = require('../controllers/highlightController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const writeRateLimiter = require('../middlewares/writeRateLimiter');

router.get('/highlights', optionalAuth, asyncHandler(highlightController.list));
router.post('/highlights', authenticate, writeRateLimiter, asyncHandler(highlightController.create));
router.put('/highlights/:id', authenticate, writeRateLimiter, asyncHandler(highlightController.update));
router.delete('/highlights/:id', authenticate, writeRateLimiter, asyncHandler(highlightController.remove));

router.get('/user/highlights', authenticate, asyncHandler(highlightController.listMine));
router.get('/user/notes', authenticate, asyncHandler(highlightController.listMyNotes));
router.get('/novels/:novelId/notes/hot', optionalAuth, asyncHandler(highlightController.listHotNotesForNovel));

module.exports = router;
