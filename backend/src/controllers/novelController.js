const Response = require('../utils/response');
const novelService = require('../services/novelService');

/**
 * 获取小说列表
 */
const getNovelList = async (req, res, next) => {
  try {
    const result = await novelService.getNovelList(req.query);
    return Response.paginate(res, result.list, result.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取小说详情
 */
const getNovelDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // 从认证中间件获取用户 ID
    
    // 获取小说详情
    const novel = await novelService.getNovelDetail(id, userId);
    
    // 异步增加浏览量（不阻塞响应）
    novelService.increaseViews(id).catch(err => {
      console.error('Increase views error:', err);
    });
    
    // 如果用户已登录，记录浏览历史（不阻塞响应）
    if (userId) {
      novelService.recordViewHistory(userId, id).catch(err => {
        console.error('Record view history error:', err);
      });
    }
    
    return Response.success(res, novel);
  } catch (error) {
    if (error.message === '小说不存在') {
      return Response.error(res, error.message, 404);
    }
    next(error);
  }
};

/**
 * 获取推荐小说
 */
const getRecommendNovels = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const novels = await novelService.getRecommendNovels({ 
      limit: req.query.limit,
      userId 
    });
    
    return Response.success(res, novels);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取热门小说
 */
const getHotNovels = async (req, res, next) => {
  try {
    const novels = await novelService.getHotNovels(req.query);
    return Response.success(res, novels);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取章节列表
 */
const getChapterList = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const result = await novelService.getChapterList(novelId, req.query);
    
    return Response.paginate(res, result.list, result.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取章节内容
 */
const getChapterContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const chapter = await novelService.getChapterContent(id, userId);
    return Response.success(res, chapter);
  } catch (error) {
    if (error.message === '章节不存在') {
      return Response.error(res, error.message, 404);
    }
    next(error);
  }
};

/**
 * 搜索小说
 */
const searchNovels = async (req, res, next) => {
  try {
    const result = await novelService.searchNovels(req.query);
    return Response.paginate(res, result.list, result.pagination);
  } catch (error) {
    if (error.message === '请输入搜索关键词') {
      return Response.error(res, error.message, 400);
    }
    next(error);
  }
};

/**
 * 获取分类列表
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await novelService.getCategories();
    return Response.success(res, categories);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取搜索建议
 */
const getSearchSuggestions = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword || keyword.trim().length < 2) {
      return Response.success(res, []);
    }
    
    const { pool } = require('../config/database');
    
    // 搜索小说标题
    const [titleSuggestions] = await pool.query(
      `SELECT DISTINCT title as suggestion, 'novel' as type, id 
       FROM novels 
       WHERE title LIKE ? 
       ORDER BY views DESC 
       LIMIT 5`,
      [`%${keyword}%`]
    );
    
    // 搜索作者
    const [authorSuggestions] = await pool.query(
      `SELECT DISTINCT author as suggestion, 'author' as type 
       FROM novels 
       WHERE author LIKE ? 
       ORDER BY views DESC 
       LIMIT 3`,
      [`%${keyword}%`]
    );
    
    // 合并结果
    const suggestions = [
      ...titleSuggestions.map(s => ({ text: s.suggestion, type: s.type, id: s.id })),
      ...authorSuggestions.map(s => ({ text: s.suggestion, type: s.type }))
    ];
    
    return Response.success(res, suggestions.slice(0, 8));
  } catch (error) {
    next(error);
  }
};

/**
 * 获取热门搜索
 */
const getHotSearches = async (req, res, next) => {
  try {
    const { pool } = require('../config/database');
    
    // 基于浏览量获取热门小说作为热搜
    const [hotNovels] = await pool.query(
      `SELECT title as keyword, views as count
       FROM novels 
       ORDER BY views DESC, rating DESC
       LIMIT 10`
    );
    
    // 添加趋势标记
    const hotSearches = hotNovels.map((item, index) => ({
      keyword: item.keyword,
      count: item.count,
      hot: index < 3, // 前3个标记为热门
      trend: index < 5 ? 'up' : 'stable', // 前5个上升，其他稳定
      isNew: false
    }));
    
    return Response.success(res, hotSearches);
  } catch (error) {
    next(error);
  }
};

/**
 * 点赞小说
 */
const likeNovel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { pool } = require('../config/database');
    
    // 检查是否已点赞
    const [existing] = await pool.query(
      'SELECT id FROM user_likes WHERE user_id = ? AND novel_id = ?',
      [userId, id]
    );
    
    if (existing.length > 0) {
      return Response.error(res, '已经点赞过了', 400);
    }
    
    // 添加点赞
    await pool.query(
      'INSERT INTO user_likes (user_id, novel_id) VALUES (?, ?)',
      [userId, id]
    );
    
    // 增加小说点赞数
    await pool.query(
      'UPDATE novels SET likes = likes + 1 WHERE id = ?',
      [id]
    );
    
    return Response.success(res, null, '点赞成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 取消点赞
 */
const unlikeNovel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { pool } = require('../config/database');
    
    // 删除点赞
    await pool.query(
      'DELETE FROM user_likes WHERE user_id = ? AND novel_id = ?',
      [userId, id]
    );
    
    // 减少小说点赞数
    await pool.query(
      'UPDATE novels SET likes = likes - 1 WHERE id = ? AND likes > 0',
      [id]
    );
    
    return Response.success(res, null, '取消点赞成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 收藏小说
 */
const collectNovel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { pool } = require('../config/database');
    
    // 检查是否已收藏
    const [existing] = await pool.query(
      'SELECT id FROM bookshelf WHERE user_id = ? AND novel_id = ?',
      [userId, id]
    );
    
    if (existing.length > 0) {
      return Response.error(res, '已经收藏过了', 400);
    }
    
    // 添加到书架
    await pool.query(
      'INSERT INTO bookshelf (user_id, novel_id, type) VALUES (?, ?, ?)',
      [userId, id, 'reading']
    );
    
    return Response.success(res, null, '收藏成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 取消收藏
 */
const uncollectNovel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { pool } = require('../config/database');
    
    // 从书架删除
    await pool.query(
      'DELETE FROM bookshelf WHERE user_id = ? AND novel_id = ?',
      [userId, id]
    );
    
    return Response.success(res, null, '取消收藏成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户对小说的状态
 */
const getNovelStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { pool } = require('../config/database');
    
    // 查询点赞状态
    const [likes] = await pool.query(
      'SELECT id FROM user_likes WHERE user_id = ? AND novel_id = ?',
      [userId, id]
    );
    
    // 查询收藏状态
    const [bookshelf] = await pool.query(
      'SELECT id FROM bookshelf WHERE user_id = ? AND novel_id = ?',
      [userId, id]
    );
    
    return Response.success(res, {
      isLiked: likes.length > 0,
      isCollected: bookshelf.length > 0
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNovelList,
  getNovelDetail,
  getRecommendNovels,
  getHotNovels,
  getChapterList,
  getChapterContent,
  searchNovels,
  getCategories,
  getSearchSuggestions,
  getHotSearches,
  likeNovel,
  unlikeNovel,
  collectNovel,
  uncollectNovel,
  getNovelStatus,
  /**
   * 新增：按字符分页获取整本小说内容
   */
  async getNovelPages(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 3000 } = req.query;
      const result = await novelService.getNovelPageByChars(id, { page, pageSize });
      return Response.success(res, result);
    } catch (error) {
      next(error);
    }
  },
  // 评分相关
  async getNovelRating(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null;
      const { pool } = require('../config/database');

      // 汇总评分：基于 comments.rating 与 status=1 的评论
      const [agg] = await pool.query(
        `SELECT 
           ROUND(AVG(CASE WHEN rating > 0 THEN rating END), 1) AS averageRating,
           SUM(CASE WHEN rating > 0 THEN 1 ELSE 0 END) AS totalRatings,
           SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS star5,
           SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS star4,
           SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS star3,
           SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS star2,
           SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS star1
         FROM comments 
         WHERE novel_id = ? AND deleted_at IS NULL`,
        [id]
      );

      let userRating = null;
      if (userId) {
        const [mine] = await pool.query(
          `SELECT id, rating, created_at FROM comments 
           WHERE novel_id = ? AND user_id = ? AND deleted_at IS NULL 
           ORDER BY created_at DESC LIMIT 1`,
          [id, userId]
        );
        if (mine.length > 0 && mine[0].rating > 0) {
          userRating = { id: mine[0].id, rating: mine[0].rating, createdAt: mine[0].created_at };
        }
      }

      const distribution = {
        5: Number(agg[0]?.star5 || 0),
        4: Number(agg[0]?.star4 || 0),
        3: Number(agg[0]?.star3 || 0),
        2: Number(agg[0]?.star2 || 0),
        1: Number(agg[0]?.star1 || 0)
      };

      return Response.success(res, {
        averageRating: Number(agg[0]?.averageRating || 0),
        totalRatings: Number(agg[0]?.totalRatings || 0),
        distribution,
        userRating
      });
    } catch (error) {
      next(error);
    }
  },

  async submitNovelRating(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { rating } = req.body;
      const { pool } = require('../config/database');

      const value = Number(rating);
      if (!Number.isFinite(value) || value < 1 || value > 5) {
        return Response.error(res, '评分必须是1-5的整数', 400);
      }

      // 若用户已有带评分的评论，阻止重复提交；建议使用更新接口
      const [exists] = await pool.query(
        `SELECT id FROM comments WHERE novel_id = ? AND user_id = ? AND rating > 0 AND deleted_at IS NULL LIMIT 1`,
        [id, userId]
      );
      if (exists.length > 0) {
        return Response.error(res, '您已评分，请使用更新评分', 400);
      }

      await pool.query(
        `INSERT INTO comments (novel_id, user_id, content, rating, created_at) 
         VALUES (?, ?, '', ?, NOW())`,
        [id, userId, value]
      );

      // 触发平均分更新：直接更新 novels.rating 与 rating_count
      await pool.query(
        `UPDATE novels n SET 
           rating = IFNULL((SELECT ROUND(AVG(rating), 2) FROM comments WHERE novel_id = n.id AND rating > 0 AND deleted_at IS NULL), 0),
           rating_count = (SELECT COUNT(*) FROM comments WHERE novel_id = n.id AND rating > 0 AND deleted_at IS NULL),
           updated_at = NOW()
         WHERE n.id = ?`,
        [id]
      );

      return Response.created(res, null, '评分成功');
    } catch (error) {
      next(error);
    }
  },

  async updateNovelRating(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { rating } = req.body;
      const { pool } = require('../config/database');

      const value = Number(rating);
      if (!Number.isFinite(value) || value < 1 || value > 5) {
        return Response.error(res, '评分必须是1-5的整数', 400);
      }

      // 找到用户最近一条评分记录（或创建一条）
      const [mine] = await pool.query(
        `SELECT id FROM comments WHERE novel_id = ? AND user_id = ? AND rating > 0 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
        [id, userId]
      );

      if (mine.length > 0) {
        await pool.query(
          `UPDATE comments SET rating = ?, created_at = NOW() WHERE id = ?`,
          [value, mine[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO comments (novel_id, user_id, content, rating, created_at) 
           VALUES (?, ?, '', ?, NOW())`,
          [id, userId, value]
        );
      }

      await pool.query(
        `UPDATE novels n SET 
           rating = IFNULL((SELECT ROUND(AVG(rating), 2) FROM comments WHERE novel_id = n.id AND rating > 0 AND deleted_at IS NULL), 0),
           rating_count = (SELECT COUNT(*) FROM comments WHERE novel_id = n.id AND rating > 0 AND deleted_at IS NULL),
           updated_at = NOW()
         WHERE n.id = ?`,
        [id]
      );

      return Response.success(res, null, '评分已更新');
    } catch (error) {
      next(error);
    }
  }
};
