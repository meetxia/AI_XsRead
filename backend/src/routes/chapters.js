const express = require('express');
const router = express.Router();
const novelController = require('../controllers/novelController');
const { idValidation } = require('../utils/validators');
const { optionalAuth } = require('../middlewares/auth');

// 获取章节内容（可选登录：用于识别会员身份解锁 VIP 内容）
router.get('/:id', optionalAuth, idValidation, novelController.getChapterContent);

module.exports = router;

