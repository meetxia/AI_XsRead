const { pool } = require('../config/database');
const Response = require('../utils/response');

/**
 * 获取用户书架
 */
const getBookshelf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    const offset = (page - 1) * pageSize;
    
    // 查询总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM bookshelf WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;
    
    // 查询书架数据
    const [bookshelf] = await pool.query(
      `SELECT b.*, n.title, n.author, n.cover, n.category_id, c.name as category_name,
              rp.chapter_id as current_chapter_id, rp.progress as reading_progress
       FROM bookshelf b
       INNER JOIN novels n ON b.novel_id = n.id
       LEFT JOIN categories c ON n.category_id = c.id
       LEFT JOIN reading_progress rp ON rp.user_id = b.user_id AND rp.novel_id = b.novel_id
       WHERE b.user_id = ?
       ORDER BY b.updated_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), offset]
    );
    
    return Response.paginate(res, bookshelf, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    });
  } catch (error) {
    console.error('Get bookshelf error:', error);
    return Response.error(res, '获取书架失败', 500);
  }
};

/**
 * 添加到书架
 */
const addToBookshelf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { novelId } = req.body;
    
    // 检查小说是否存在
    const [novels] = await pool.query(
      'SELECT id FROM novels WHERE id = ?',
      [novelId]
    );
    
    if (novels.length === 0) {
      return Response.error(res, '小说不存在', 404);
    }
    
    // 检查是否已在书架
    const [existing] = await pool.query(
      'SELECT id FROM bookshelf WHERE user_id = ? AND novel_id = ?',
      [userId, novelId]
    );
    
    if (existing.length > 0) {
      return Response.error(res, '该小说已在书架中', 400);
    }
    
    // 添加到书架
    await pool.query(
      'INSERT INTO bookshelf (user_id, novel_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [userId, novelId]
    );
    
    return Response.created(res, null, '添加成功');
  } catch (error) {
    console.error('Add to bookshelf error:', error);
    return Response.error(res, '添加失败', 500);
  }
};

/**
 * 从书架移除
 */
const removeFromBookshelf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { novelId } = req.params;
    
    await pool.query(
      'DELETE FROM bookshelf WHERE user_id = ? AND novel_id = ?',
      [userId, novelId]
    );
    
    return Response.success(res, null, '移除成功');
  } catch (error) {
    console.error('Remove from bookshelf error:', error);
    return Response.error(res, '移除失败', 500);
  }
};

/**
 * 获取阅读进度
 */
const getReadingProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { novelId } = req.params;
    
    const [progress] = await pool.query(
      'SELECT * FROM reading_progress WHERE user_id = ? AND novel_id = ?',
      [userId, novelId]
    );
    
    if (progress.length === 0) {
      return Response.success(res, null);
    }
    
    return Response.success(res, progress[0]);
  } catch (error) {
    console.error('Get reading progress error:', error);
    return Response.error(res, '获取阅读进度失败', 500);
  }
};

/**
 * 更新阅读进度
 */
const updateReadingProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { novelId, chapterId, progress } = req.body;
    
    // 检查是否已有记录
    const [existing] = await pool.query(
      'SELECT id FROM reading_progress WHERE user_id = ? AND novel_id = ?',
      [userId, novelId]
    );
    
    if (existing.length > 0) {
      // 更新
      await pool.query(
        'UPDATE reading_progress SET chapter_id = ?, progress = ?, updated_at = NOW() WHERE user_id = ? AND novel_id = ?',
        [chapterId, progress, userId, novelId]
      );
    } else {
      // 插入
      await pool.query(
        'INSERT INTO reading_progress (user_id, novel_id, chapter_id, progress, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [userId, novelId, chapterId, progress]
      );
    }
    
    // 同时添加到阅读历史
    await pool.query(
      'INSERT INTO reading_history (user_id, novel_id, chapter_id, read_at) VALUES (?, ?, ?, NOW())',
      [userId, novelId, chapterId]
    );
    
    return Response.success(res, null, '更新成功');
  } catch (error) {
    console.error('Update reading progress error:', error);
    return Response.error(res, '更新失败', 500);
  }
};

/**
 * 获取阅读历史
 */
const getReadingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    const offset = (page - 1) * pageSize;
    
    // 查询总数
    const [countResult] = await pool.query(
      'SELECT COUNT(DISTINCT novel_id) as total FROM reading_history WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;
    
    // 查询阅读历史
    const [history] = await pool.query(
      `SELECT rh.*, n.title, n.author, n.cover, c.title as chapter_title
       FROM reading_history rh
       INNER JOIN novels n ON rh.novel_id = n.id
       LEFT JOIN chapters c ON rh.chapter_id = c.id
       WHERE rh.user_id = ?
       GROUP BY rh.novel_id
       ORDER BY MAX(rh.read_at) DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), offset]
    );
    
    return Response.paginate(res, history, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    });
  } catch (error) {
    console.error('Get reading history error:', error);
    return Response.error(res, '获取阅读历史失败', 500);
  }
};

/**
 * 获取用户阅读统计
 */
const getUserStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // 书架统计
    const [bookshelfStats] = await pool.query(
      `SELECT 
        COUNT(*) as total_books,
        SUM(CASE WHEN type = 'reading' THEN 1 ELSE 0 END) as reading_books,
        SUM(CASE WHEN type = 'finished' THEN 1 ELSE 0 END) as finished_books,
        SUM(CASE WHEN type = 'collected' THEN 1 ELSE 0 END) as collected_books
       FROM bookshelf
       WHERE user_id = ?`,
      [userId]
    );

    // 阅读时长统计（如果有reading_history表的duration字段）
    const [timeStats] = await pool.query(
      `SELECT 
        COALESCE(SUM(duration), 0) as total_read_time,
        COALESCE(SUM(CASE WHEN read_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN duration ELSE 0 END), 0) as today_read_time,
        COALESCE(SUM(CASE WHEN read_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN duration ELSE 0 END), 0) as weekly_read_time,
        COALESCE(SUM(CASE WHEN read_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN duration ELSE 0 END), 0) as monthly_read_time
       FROM reading_history
       WHERE user_id = ?`,
      [userId]
    );

    // 获取最喜欢的分类
    const [favoriteCategory] = await pool.query(
      `SELECT c.id, c.name, COUNT(*) as count
       FROM reading_history rh
       INNER JOIN novels n ON rh.novel_id = n.id
       INNER JOIN categories c ON n.category_id = c.id
       WHERE rh.user_id = ?
       GROUP BY c.id, c.name
       ORDER BY count DESC
       LIMIT 1`,
      [userId]
    );

    // 连续阅读天数
    const [streakResult] = await pool.query(
      `SELECT COUNT(DISTINCT DATE(read_at)) as reading_streak
       FROM reading_history
       WHERE user_id = ?
       AND read_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [userId]
    );

    // 最近7天阅读趋势
    const [trendData] = await pool.query(
      `SELECT 
        DATE(read_at) as date,
        COUNT(DISTINCT novel_id) as novels_read,
        COUNT(*) as chapters_read,
        COALESCE(SUM(duration), 0) as read_time
       FROM reading_history
       WHERE user_id = ? AND read_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(read_at)
       ORDER BY date DESC`,
      [userId]
    );

    // 阅读章节统计
    const [chapterStats] = await pool.query(
      `SELECT 
        COUNT(DISTINCT chapter_id) as total_chapters,
        COUNT(DISTINCT novel_id) as total_novels_read
       FROM reading_history
       WHERE user_id = ?`,
      [userId]
    );

    return Response.success(res, {
      bookshelf: {
        total: bookshelfStats[0].total_books || 0,
        reading: bookshelfStats[0].reading_books || 0,
        finished: bookshelfStats[0].finished_books || 0,
        collected: bookshelfStats[0].collected_books || 0
      },
      readTime: {
        total: timeStats[0]?.total_read_time || 0,
        today: timeStats[0]?.today_read_time || 0,
        weekly: timeStats[0]?.weekly_read_time || 0,
        monthly: timeStats[0]?.monthly_read_time || 0
      },
      reading: {
        totalNovels: chapterStats[0].total_novels_read || 0,
        totalChapters: chapterStats[0].total_chapters || 0,
        readingStreak: streakResult[0].reading_streak || 0
      },
      favoriteCategory: favoriteCategory.length > 0 ? {
        id: favoriteCategory[0].id,
        name: favoriteCategory[0].name,
        count: favoriteCategory[0].count
      } : null,
      readingTrend: trendData.map(item => ({
        date: item.date,
        novelsRead: item.novels_read,
        chaptersRead: item.chapters_read,
        readTime: item.read_time || 0
      }))
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    return Response.error(res, '获取统计数据失败', 500);
  }
};

/**
 * 获取用户成就
 */
const getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取各项统计数据
    const [stats] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM reading_history WHERE user_id = ?) as total_chapters,
        (SELECT COUNT(DISTINCT novel_id) FROM reading_history WHERE user_id = ?) as total_novels,
        (SELECT COUNT(*) FROM bookshelf WHERE user_id = ? AND type = 'finished') as finished_novels,
        (SELECT COALESCE(SUM(duration), 0) FROM reading_history WHERE user_id = ?) as total_read_time,
        (SELECT COUNT(DISTINCT DATE(read_at)) FROM reading_history WHERE user_id = ? AND read_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as reading_days`,
      [userId, userId, userId, userId, userId]
    );

    const data = stats[0];
    const achievements = [];

    // 定义成就规则
    const achievementRules = [
      // 阅读章节成就
      { id: 'chapters_10', name: '初出茅庐', description: '阅读10个章节', type: 'chapters', threshold: 10, icon: '📖' },
      { id: 'chapters_100', name: '勤奋读者', description: '阅读100个章节', type: 'chapters', threshold: 100, icon: '📚' },
      { id: 'chapters_500', name: '阅读达人', description: '阅读500个章节', type: 'chapters', threshold: 500, icon: '📕' },
      { id: 'chapters_1000', name: '书海无涯', description: '阅读1000个章节', type: 'chapters', threshold: 1000, icon: '🎓' },

      // 阅读小说成就
      { id: 'novels_5', name: '书虫新手', description: '阅读5本小说', type: 'novels', threshold: 5, icon: '🐛' },
      { id: 'novels_20', name: '阅读爱好者', description: '阅读20本小说', type: 'novels', threshold: 20, icon: '💚' },
      { id: 'novels_50', name: '资深书友', description: '阅读50本小说', type: 'novels', threshold: 50, icon: '⭐' },
      { id: 'novels_100', name: '阅读大师', description: '阅读100本小说', type: 'novels', threshold: 100, icon: '🏆' },

      // 完成小说成就
      { id: 'finished_1', name: '善始善终', description: '完成1本小说', type: 'finished', threshold: 1, icon: '✅' },
      { id: 'finished_10', name: '坚持不懈', description: '完成10本小说', type: 'finished', threshold: 10, icon: '🎯' },
      { id: 'finished_30', name: '追书达人', description: '完成30本小说', type: 'finished', threshold: 30, icon: '🌟' },

      // 阅读时长成就（分钟）
      { id: 'time_60', name: '初识文字', description: '累计阅读1小时', type: 'time', threshold: 60, icon: '⏰' },
      { id: 'time_600', name: '时间投资者', description: '累计阅读10小时', type: 'time', threshold: 600, icon: '⏳' },
      { id: 'time_3600', name: '时光旅人', description: '累计阅读60小时', type: 'time', threshold: 3600, icon: '🕐' },

      // 连续阅读成就
      { id: 'streak_7', name: '七日之约', description: '连续阅读7天', type: 'streak', threshold: 7, icon: '📅' },
      { id: 'streak_30', name: '月度坚持', description: '连续阅读30天', type: 'streak', threshold: 30, icon: '📆' }
    ];

    // 计算成就完成情况
    achievementRules.forEach(rule => {
      let currentValue = 0;
      switch (rule.type) {
        case 'chapters':
          currentValue = data.total_chapters;
          break;
        case 'novels':
          currentValue = data.total_novels;
          break;
        case 'finished':
          currentValue = data.finished_novels;
          break;
        case 'time':
          currentValue = Math.floor(data.total_read_time / 60); // 转换为分钟
          break;
        case 'streak':
          currentValue = data.reading_days;
          break;
      }

      achievements.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        icon: rule.icon,
        type: rule.type,
        threshold: rule.threshold,
        currentValue: currentValue,
        progress: Math.min((currentValue / rule.threshold) * 100, 100),
        unlocked: currentValue >= rule.threshold,
        unlockedAt: currentValue >= rule.threshold ? new Date() : null
      });
    });

    return Response.success(res, {
      totalAchievements: achievements.length,
      unlockedAchievements: achievements.filter(a => a.unlocked).length,
      achievements: achievements
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    return Response.error(res, '获取成就数据失败', 500);
  }
};

/**
 * 获取用户个人资料
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      `SELECT id, username, email, avatar, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return Response.error(res, '用户不存在', 404);
    }

    // 获取基础统计
    const [stats] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM bookshelf WHERE user_id = ?) as total_books,
        (SELECT COUNT(*) FROM novel_likes WHERE user_id = ?) as total_likes,
        (SELECT COUNT(*) FROM novel_collections WHERE user_id = ?) as total_collections,
        (SELECT COUNT(*) FROM comments WHERE user_id = ?) as total_comments`,
      [userId, userId, userId, userId]
    );

    return Response.success(res, {
      user: users[0],
      stats: {
        totalBooks: stats[0].total_books || 0,
        totalLikes: stats[0].total_likes || 0,
        totalCollections: stats[0].total_collections || 0,
        totalComments: stats[0].total_comments || 0
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return Response.error(res, '获取用户资料失败', 500);
  }
};

module.exports = {
  getBookshelf,
  addToBookshelf,
  removeFromBookshelf,
  getReadingProgress,
  updateReadingProgress,
  getReadingHistory,
  getUserStatistics,
  getUserAchievements,
  getUserProfile
};

