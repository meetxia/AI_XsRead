const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/contactController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/contact', ContactController.getContact);
router.put('/contact', adminMiddleware, ContactController.updateContact);
router.post(
  '/contact/qrcode',
  adminMiddleware,
  ContactController.uploadInstance.single('file'),
  ContactController.uploadQrcode
);

module.exports = router;
