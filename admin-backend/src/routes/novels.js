const express = require('express');
const router = express.Router();
const NovelController = require('../controllers/novelController');
const { authMiddleware } = require('../middlewares/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 获取小说列表
router.get('/', NovelController.getList);

// 获取小说详情
router.get('/:id', NovelController.getDetail);

// 创建小说
router.post('/', NovelController.create);

// 更新小说
router.put('/:id', NovelController.update);

// 删除小说
router.delete('/:id', NovelController.delete);

// 获取小说统计
router.get('/:id/statistics', NovelController.getStatistics);

module.exports = router;

