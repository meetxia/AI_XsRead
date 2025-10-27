const express = require('express');
const router = express.Router();
const ChapterController = require('../controllers/chapterController');
const { authMiddleware } = require('../middlewares/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 获取章节列表
router.get('/', ChapterController.getList);

// 获取章节详情
router.get('/:id', ChapterController.getDetail);

// 创建章节
router.post('/', ChapterController.create);

// 更新章节
router.put('/:id', ChapterController.update);

// 删除章节
router.delete('/:id', ChapterController.delete);

module.exports = router;

