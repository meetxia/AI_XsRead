const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middlewares/auth');
const { uploadService } = require('../services/uploadService');
const Response = require('../utils/response');

/**
 * @swagger
 * /api/upload/novel:
 *   post:
 *     summary: 上传TXT小说
 *     tags: [上传]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: TXT文件
 *     responses:
 *       200:
 *         description: 上传成功
 *       400:
 *         description: 文件格式错误或验证失败
 *       401:
 *         description: 未登录
 */
router.post(
  '/novel',
  authenticate,
  uploadController.upload.single('file'),
  uploadController.uploadTxtNovel
);

/**
 * @swagger
 * /api/upload/novels/batch:
 *   post:
 *     summary: 批量上传TXT小说
 *     tags: [上传]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 多个TXT文件
 *     responses:
 *       200:
 *         description: 批量上传完成
 */
router.post(
  '/novels/batch',
  authenticate,
  uploadController.upload.array('files', 50), // 最多50个文件
  uploadController.batchUploadTxtNovels
);

// 用户头像上传
router.post(
  '/avatar',
  authenticate,
  uploadService.uploadSingle('avatar'),
  uploadController.uploadAvatar
);

// 通用图片上传（用于评论等）
router.post(
  '/image',
  authenticate,
  uploadService.uploadSingle('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return Response.error(res, '请上传图片文件', 400);
      }

      // 处理图片（压缩）
      const result = await uploadService.processImage(req.file, {
        format: 'webp',
        maxWidth: 1200,
        maxHeight: 1200
      });

      // 直接返回相对路径，前端会自动使用当前域名
      const imageUrl = result.data.url;

      return Response.success(res, {
        url: imageUrl
      }, '图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/upload/my-novels:
 *   get:
 *     summary: 获取我的小说列表
 *     tags: [上传]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 成功返回小说列表
 */
router.get(
  '/my-novels',
  authenticate,
  uploadController.getMyNovels
);

module.exports = router;

