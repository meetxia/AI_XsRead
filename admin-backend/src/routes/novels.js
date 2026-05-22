const express = require('express');
const multer = require('multer');
const router = express.Router();
const NovelController = require('../controllers/novelController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const txtUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 50
  },
  fileFilter(req, file, cb) {
    if (/\.txt$/i.test(file.originalname)) {
      cb(null, true);
      return;
    }
    cb(new Error('只支持TXT格式文件'));
  }
});

// 所有路由都需要管理员权限
router.use(authMiddleware);
router.use(adminMiddleware);

// 获取小说列表
router.get('/', NovelController.getList);

// 获取分类列表
router.get('/categories', NovelController.getCategories);

// 批量设置 VIP（需放在 /:id 之前以免被误匹配）
router.post('/set-vip', NovelController.setVip);

// 批量上传 TXT 小说（需放在 /:id 之前以免被误匹配）
router.post('/batch-upload', txtUpload.array('files', 50), NovelController.batchUploadTxt);

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

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(200).json({ code: 400, message: '单个TXT文件不能超过10MB', timestamp: Date.now() });
    }
    return res.status(200).json({ code: 400, message: err.message, timestamp: Date.now() });
  }
  if (err) {
    return res.status(200).json({ code: 400, message: err.message || '上传失败', timestamp: Date.now() });
  }
  next();
});

module.exports = router;
