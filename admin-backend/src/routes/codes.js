const express = require('express');
const router = express.Router();
const CodeController = require('../controllers/codeController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// 全部需要登录
router.use(authMiddleware);

// 批次管理
router.post('/batches', adminMiddleware, CodeController.createBatch);
router.get('/batches', CodeController.getBatches);
router.get('/batches/:id', CodeController.getBatchDetail);
router.get('/batches/:id/export', adminMiddleware, CodeController.exportBatch);

// 作废
router.post('/void', adminMiddleware, CodeController.voidCodes);

// 激活记录
router.get('/redemptions', CodeController.getRedemptions);

module.exports = router;
