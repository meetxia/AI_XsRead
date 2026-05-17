/**
 * 公开系统端点：客服联系等
 * 注意：本路由文件不能 router.use(authenticate)，必须保持公开
 */

const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { asyncHandler } = require('../middlewares/errorHandler');

// GET /api/system/contact 公开
router.get('/contact', asyncHandler(systemController.getContact));

module.exports = router;
