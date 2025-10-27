const express = require('express');
const router = express.Router();
const novelController = require('../controllers/novelController');
const { idValidation, paginationValidation } = require('../utils/validators');

// 获取小说列表
router.get('/', paginationValidation, novelController.getNovelList);

// 获取推荐小说
router.get('/recommend', novelController.getRecommendNovels);

// 搜索小说
router.get('/search', paginationValidation, novelController.searchNovels);

// 获取分类列表
router.get('/categories', novelController.getCategories);

// 获取小说详情
router.get('/:id', idValidation, novelController.getNovelDetail);

// 获取章节列表
router.get('/:novelId/chapters', paginationValidation, novelController.getChapterList);

module.exports = router;

