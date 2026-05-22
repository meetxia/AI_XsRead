const express = require('express');
const router = express.Router();
const CodeController = require('../controllers/codeController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// 激活码管理全部需要管理员权限
router.use(authMiddleware);
router.use(adminMiddleware);

// 批次管理
router.post('/batches', CodeController.createBatch);
router.get('/batches', CodeController.getBatches);
router.get('/batches/:id', CodeController.getBatchDetail);
router.get('/batches/:id/export', CodeController.exportBatch);
router.get('/batches/:id/export.txt', CodeController.exportBatchTxt);

// 作废
router.post('/void', CodeController.voidCodes);

// 激活记录
router.get('/redemptions', CodeController.getRedemptions);

module.exports = router;
