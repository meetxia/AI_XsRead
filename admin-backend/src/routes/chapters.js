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

// 批量导入章节
router.post('/batch-import', async (req, res, next) => {
  try {
    // 这里先做占位实现：校验参数并返回成功，便于前后端联调
    const { novelId, chapters } = req.body || {};
    if (!novelId || !Array.isArray(chapters) || chapters.length === 0) {
      return res.status(400).json({ code: 400, message: 'novelId 与 chapters 不能为空' });
    }
    // 实际场景可在此写入数据库、批量插入章节，并记录日志
    return res.status(200).json({ code: 200, message: '批量导入任务已接收', data: { count: chapters.length } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

