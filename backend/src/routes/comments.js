/**
 * 评论路由
 */
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');

// 获取小说评论列表（公开，可选登录）
router.get(
  '/novels/:novelId/comments',
  asyncHandler(commentController.getNovelComments)
);

// 发表评论（需要登录）
router.post(
  '/novels/:novelId/comments',
  authenticate,
  asyncHandler(commentController.createComment)
);

// 删除评论（需要登录）
router.delete(
  '/comments/:commentId',
  authenticate,
  asyncHandler(commentController.deleteComment)
);

// 点赞评论（需要登录）
router.post(
  '/comments/:commentId/like',
  authenticate,
  asyncHandler(commentController.likeComment)
);

// 取消点赞评论（需要登录）
router.delete(
  '/comments/:commentId/like',
  authenticate,
  asyncHandler(commentController.unlikeComment)
);

// 获取评论回复列表（公开，可选登录）
router.get(
  '/comments/:commentId/replies',
  asyncHandler(commentController.getCommentReplies)
);

// 新增：发表评论的回复（需要登录）
router.post(
  '/comments/:commentId/reply',
  authenticate,
  asyncHandler(commentController.createReply)
);

module.exports = router;

