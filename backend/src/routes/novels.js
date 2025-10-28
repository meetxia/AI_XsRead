const express = require('express');
const router = express.Router();
const novelController = require('../controllers/novelController');
const { idValidation, paginationValidation, textPaginationValidation } = require('../utils/validators');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * @swagger
 * /api/novels:
 *   get:
 *     summary: 获取小说列表
 *     tags: [小说]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: 分类ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, finished]
 *         description: 小说状态
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: updated_at
 *         description: 排序字段
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 成功返回小说列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Novel'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/novels', paginationValidation, novelController.getNovelList);

/**
 * @swagger
 * /api/novels/recommend:
 *   get:
 *     summary: 获取推荐小说
 *     tags: [小说]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量
 *     responses:
 *       200:
 *         description: 成功返回推荐小说列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/novels/recommend', novelController.getRecommendNovels);

/**
 * @swagger
 * /api/novels/categories:
 *   get:
 *     summary: 获取分类列表
 *     tags: [小说]
 *     responses:
 *       200:
 *         description: 成功返回分类列表
 */
router.get('/novels/categories', novelController.getCategories);

/**
 * @swagger
 * /api/novels/search/suggestions:
 *   get:
 *     summary: 获取搜索建议
 *     tags: [小说]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功返回搜索建议
 */
router.get('/novels/search/suggestions', novelController.getSearchSuggestions);

/**
 * @swagger
 * /api/novels/search/hot:
 *   get:
 *     summary: 获取热门搜索
 *     tags: [小说]
 *     responses:
 *       200:
 *         description: 成功返回热门搜索列表
 */
router.get('/novels/search/hot', novelController.getHotSearches);

/**
 * @swagger
 * /api/novels/search:
 *   get:
 *     summary: 搜索小说
 *     tags: [小说]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
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
 *         description: 成功返回搜索结果
 *       400:
 *         description: 缺少搜索关键词
 */
router.get('/novels/search', paginationValidation, novelController.searchNovels);

/**
 * @swagger
 * /api/novels/{id}:
 *   get:
 *     summary: 获取小说详情
 *     tags: [小说]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 小说ID
 *     responses:
 *       200:
 *         description: 成功返回小说详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/Novel'
 *       404:
 *         description: 小说不存在
 */
router.get('/novels/:id', idValidation, novelController.getNovelDetail);

/**
 * @swagger
 * /api/novels/{novelId}/chapters:
 *   get:
 *     summary: 获取小说章节列表
 *     tags: [章节]
 *     parameters:
 *       - in: path
 *         name: novelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 小说ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 成功返回章节列表
 */
router.get('/novels/:novelId/chapters', paginationValidation, novelController.getChapterList);

// 新增：整本小说按字符分页阅读（无章节）
router.get(
  '/novels/:id/pages',
  textPaginationValidation,
  asyncHandler(novelController.getNovelPages)
);

// ========== 点赞/收藏相关（需要登录） ==========

// ========== 评分相关 ==========
// 获取小说评分概览与我的评分（可选登录）
router.get(
  '/novels/:id/rating',
  idValidation,
  asyncHandler(novelController.getNovelRating)
);

// 提交评分（需要登录）
router.post(
  '/novels/:id/rating',
  authenticate,
  idValidation,
  asyncHandler(novelController.submitNovelRating)
);

// 更新评分（需要登录）
router.put(
  '/novels/:id/rating',
  authenticate,
  idValidation,
  asyncHandler(novelController.updateNovelRating)
);

/**
 * @swagger
 * /api/novels/{id}/like:
 *   post:
 *     summary: 点赞小说
 *     tags: [小说]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 点赞成功
 *       401:
 *         description: 未登录
 *   delete:
 *     summary: 取消点赞
 *     tags: [小说]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 取消成功
 *       401:
 *         description: 未登录
 */
router.post(
  '/novels/:id/like',
  authenticate,
  idValidation,
  asyncHandler(novelController.likeNovel)
);

router.delete(
  '/novels/:id/like',
  authenticate,
  idValidation,
  asyncHandler(novelController.unlikeNovel)
);

/**
 * @swagger
 * /api/novels/{id}/collect:
 *   post:
 *     summary: 收藏小说
 *     tags: [小说]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 收藏成功
 *   delete:
 *     summary: 取消收藏
 *     tags: [小说]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 取消成功
 */
router.post(
  '/novels/:id/collect',
  authenticate,
  idValidation,
  asyncHandler(novelController.collectNovel)
);

router.delete(
  '/novels/:id/collect',
  authenticate,
  idValidation,
  asyncHandler(novelController.uncollectNovel)
);

/**
 * @swagger
 * /api/novels/{id}/status:
 *   get:
 *     summary: 获取用户对小说的状态
 *     tags: [小说]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功返回状态信息
 */
router.get(
  '/novels/:id/status',
  authenticate,
  idValidation,
  asyncHandler(novelController.getNovelStatus)
);

module.exports = router;
