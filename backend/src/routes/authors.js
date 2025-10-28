const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const Response = require('../utils/response');
const { pool } = require('../config/database');

// 获取作者信息（基于 novels.author_id 关联）
router.get('/:authorId', async (req, res, next) => {
  try {
    const { authorId } = req.params;
    const [stats] = await pool.query(
      `SELECT 
         COUNT(*) as worksCount,
         COALESCE(SUM(word_count),0) as totalWords,
         ROUND(AVG(rating),2) as avgRating
       FROM novels WHERE author_id = ?`,
      [authorId]
    );

    // 这里没有独立 authors 表，返回聚合与占位基本信息
    const [one] = await pool.query(
      `SELECT author as name, MIN(cover) as avatar
       FROM novels WHERE author_id = ? LIMIT 1`,
      [authorId]
    );

    if (one.length === 0) {
      return Response.error(res, '作者不存在或无作品', 404);
    }

    return Response.success(res, {
      id: Number(authorId),
      name: one[0].name || '未知作者',
      avatar: one[0].avatar || '',
      worksCount: Number(stats[0].worksCount || 0),
      totalWords: Number(stats[0].totalWords || 0),
      averageRating: Number(stats[0].avgRating || 0)
    });
  } catch (error) {
    next(error);
  }
});

// 获取作者作品
router.get('/:authorId/novels', async (req, res, next) => {
  try {
    const { authorId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM novels WHERE author_id = ?',
      [authorId]
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT id, title, author, cover, description, rating, views, likes, collections
       FROM novels WHERE author_id = ?
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [authorId, parseInt(pageSize), offset]
    );

    return Response.paginate(res, rows, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    });
  } catch (error) {
    next(error);
  }
});

// 关注作者（占位：本项目暂无 authors 表，以本地存储或未来表做持久化）
router.post('/:authorId/follow', authenticate, async (req, res, next) => {
  try {
    // 可在此实现到 user_follow_authors 表。此处先返回成功
    return Response.success(res, null, '操作成功');
  } catch (error) {
    next(error);
  }
});

module.exports = router;


