const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/contactController');
const ConfigController = require('../controllers/configController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

// 客服信息
router.get('/contact', ContactController.getContact);
router.put('/contact', adminMiddleware, ContactController.updateContact);
router.post(
  '/contact/qrcode',
  adminMiddleware,
  ContactController.uploadInstance.single('file'),
  ContactController.uploadQrcode
);

// 系统配置（system_config 表）
router.get('/configs', ConfigController.getAllConfigs);
router.get('/configs/:key', ConfigController.getConfigByKey);
router.put('/configs', adminMiddleware, ConfigController.batchUpdateConfigs);
router.put('/configs/:key', adminMiddleware, ConfigController.updateConfig);

module.exports = router;
