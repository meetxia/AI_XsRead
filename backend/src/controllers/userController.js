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

module.exports = {
  getBookshelf,
  addToBookshelf,
  removeFromBookshelf,
  getReadingProgress,
  updateReadingProgress,
  getReadingHistory
};

