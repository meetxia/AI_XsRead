/**
 * 通知中心路由
 *
 * 来源：docs/superpowers/specs/2026-05-18-profile-center-mvp-design.md §3.5 / §4.4
 * Track: Agent A
 *
 * 全部需要登录认证；写操作（markRead/markAllRead）走 writeRateLimiter 防刷。
 */
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const writeRateLimiter = require('../middlewares/writeRateLimiter');

// 整个通知中心都要登录
router.use(authenticate);

// GET  /api/notifications?page&pageSize&onlyUnread
router.get('/', asyncHandler(notificationController.list));

// GET  /api/notifications/unread-count
router.get('/unread-count', asyncHandler(notificationController.unreadCount));

// POST /api/notifications/read-all
router.post('/read-all', writeRateLimiter, asyncHandler(notificationController.markAllRead));

// POST /api/notifications/:id/read
router.post('/:id/read', writeRateLimiter, asyncHandler(notificationController.markRead));

module.exports = router;
