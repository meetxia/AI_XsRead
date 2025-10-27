const express = require('express');
const router = express.Router();
const upload = require('../services/uploadService');
const { authMiddleware } = require('../middlewares/auth');
const Response = require('../utils/response');

// 上传图片（需要认证）
router.post('/image', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return Response.error(res, '请选择要上传的图片', 400);
    }

    const fileUrl = `/uploads/images/${req.file.filename}`;

    return Response.success(res, {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }, '上传成功');
  } catch (error) {
    return Response.error(res, error.message || '上传失败', 500);
  }
});

// 错误处理
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return Response.error(res, '文件大小不能超过2MB', 400);
    }
    return Response.error(res, err.message, 400);
  }
  return Response.error(res, err.message || '上传失败', 500);
});

module.exports = router;

