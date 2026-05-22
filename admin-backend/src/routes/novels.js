const express = require('express');
const router = express.Router();
const NovelController = require('../controllers/novelController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// 所有路由都需要管理员权限
router.use(authMiddleware);
router.use(adminMiddleware);

// 获取小说列表
router.get('/', NovelController.getList);

// 批量设置 VIP（需放在 /:id 之前以免被误匹配）
router.post('/set-vip', NovelController.setVip);

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
