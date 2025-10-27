const express = require('express');
const router = express.Router();
const novelController = require('../controllers/novelController');
const { idValidation } = require('../utils/validators');

// 获取章节内容
router.get('/:id', idValidation, novelController.getChapterContent);

module.exports = router;

