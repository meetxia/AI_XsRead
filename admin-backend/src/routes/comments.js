const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const { authMiddleware } = require('../middlewares/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 获取评论列表
router.get('/', CommentController.getList);

// 审核通过评论
router.put('/:id/approve', CommentController.approve);

// 拒绝/屏蔽评论
router.put('/:id/reject', CommentController.reject);

// 删除评论
router.delete('/:id', CommentController.delete);

module.exports = router;

