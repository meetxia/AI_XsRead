/**
 * 小说服务层
 * 处理小说相关的业务逻辑
 */
const { pool } = require('../config/database');

class NovelService {
  /**
   * 获取小说列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 小说列表和分页信息
   */
  async getNovelList(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      categoryId,
      status,
      sortBy = 'updated_at',
      order = 'DESC'
    } = options;
    
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (categoryId) {
      whereClause += ' AND n.category_id = ?';
      params.push(categoryId);
    }
    
    if (status) {
      whereClause += ' AND n.status = ?';
      params.push(status);
    }
    
    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM novels n ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // 查询列表数据
    const [novels] = await pool.query(
      `SELECT 
        n.id, n.title, n.author, n.cover, n.description,
        n.category_id, n.status, n.views, n.likes, n.rating,
        n.word_count, n.chapter_count, n.collections,
        n.is_recommended, n.is_hot, n.last_chapter_title, n.last_update_time,
        n.created_at, n.updated_at,
        c.name as category_name
       FROM novels n 
       LEFT JOIN categories c ON n.category_id = c.id 
       ${whereClause}
       ORDER BY n.${sortBy} ${order}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );
    
    return {
      list: novels,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
  
  /**
   * 获取小说详情
   * @param {number} id 小说 ID
   * @param {number} userId 用户 ID（可选，用于查询用户关系）
   * @returns {Promise<Object>} 小说详情
   */
  async getNovelDetail(id, userId = null) {
    const [novels] = await pool.query(
      `SELECT 
        n.*,
        c.name as category_name,
        (SELECT COUNT(*) FROM chapters WHERE novel_id = n.id) as chapter_count
       FROM novels n
       LEFT JOIN categories c ON n.category_id = c.id
       WHERE n.id = ?`,
      [id]
    );
    
    if (novels.length === 0) {
      throw new Error('小说不存在');
    }
    
    const novel = novels[0];
    
    // 如果用户已登录，查询用户与小说的关系
    if (userId) {
      // 查询是否点赞
      const [likes] = await pool.query(
        'SELECT id FROM user_likes WHERE user_id = ? AND novel_id = ?',
        [userId, id]
      );
      novel.isLiked = likes.length > 0;
      
      // 查询是否收藏
      const [bookshelf] = await pool.query(
        'SELECT id FROM bookshelf WHERE user_id = ? AND novel_id = ?',
        [userId, id]
      );
      novel.isCollected = bookshelf.length > 0;
      
      // 查询阅读进度
      const [progress] = await pool.query(
        `SELECT chapter_id, progress 
         FROM reading_history 
         WHERE user_id = ? AND novel_id = ? 
         ORDER BY read_time DESC 
         LIMIT 1`,
        [userId, id]
      );
      novel.readingProgress = progress.length > 0 ? progress[0] : null;
    }
    
    return novel;
  }
  
  /**
   * 增加小说浏览量
   * @param {number} id 小说 ID
   * @returns {Promise<void>}
   */
  async increaseViews(id) {
    await pool.query(
      'UPDATE novels SET views = views + 1 WHERE id = ?',
      [id]
    );
  }
  
  /**
   * 获取推荐小说
   * @param {Object} options 选项
   * @returns {Promise<Array>} 推荐小说列表
   */
  async getRecommendNovels(options = {}) {
    const { limit = 10, userId = null } = options;
    
    let query = `
      SELECT 
        n.id, n.title, n.author, n.cover, n.description,
        n.category_id, n.views, n.likes, n.rating,
        n.word_count, n.chapter_count, n.collections,
        n.is_recommended, n.is_hot, n.last_chapter_title,
        c.name as category_name
      FROM novels n
      LEFT JOIN categories c ON n.category_id = c.id
      WHERE n.status = 1
    `;
    
    // 如果用户已登录，基于用户偏好推荐
    if (userId) {
      query += `
        AND n.category_id IN (
          SELECT DISTINCT n2.category_id 
          FROM bookshelf b
          JOIN novels n2 ON b.novel_id = n2.id
          WHERE b.user_id = ?
          LIMIT 3
        )
      `;
    }
    
    query += `
      ORDER BY 
        n.rating DESC,
        n.views DESC,
        n.updated_at DESC
      LIMIT ?
    `;
    
    const params = userId ? [userId, parseInt(limit)] : [parseInt(limit)];
    const [novels] = await pool.query(query, params);
    
    return novels;
  }
  
  /**
   * 搜索小说
   * @param {Object} options 搜索选项
   * @returns {Promise<Object>} 搜索结果和分页信息
   */
  async searchNovels(options = {}) {
    const { 
      keyword, 
      page = 1, 
      pageSize = 20,
      categoryId,
      sortBy = 'views',
      order = 'DESC'
    } = options;
    
    if (!keyword) {
      throw new Error('请输入搜索关键词');
    }
    
    const offset = (page - 1) * pageSize;
    const searchTerm = `%${keyword}%`;
    
    // 构建查询条件
    let whereClause = 'WHERE (n.title LIKE ? OR n.author LIKE ? OR n.description LIKE ?)';
    const params = [searchTerm, searchTerm, searchTerm];
    
    if (categoryId) {
      whereClause += ' AND n.category_id = ?';
      params.push(categoryId);
    }
    
    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM novels n ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // 搜索小说
    const [novels] = await pool.query(
      `SELECT 
        n.id, n.title, n.author, n.cover, n.description,
        n.category_id, n.views, n.likes, n.rating,
        n.word_count, n.chapter_count, n.collections,
        n.is_recommended, n.is_hot, n.last_chapter_title,
        c.name as category_name
       FROM novels n
       LEFT JOIN categories c ON n.category_id = c.id
       ${whereClause}
       ORDER BY n.${sortBy} ${order}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );
    
    return {
      list: novels,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
  
  /**
   * 获取热门小说
   * @param {Object} options 选项
   * @returns {Promise<Array>} 热门小说列表
   */
  async getHotNovels(options = {}) {
    const { 
      limit = 20,
      categoryId,
      days = 7 // 最近几天的热门
    } = options;
    
    let whereClause = 'WHERE n.status = 1';
    const params = [];
    
    if (categoryId) {
      whereClause += ' AND n.category_id = ?';
      params.push(categoryId);
    }
    
    // 计算热度（综合浏览量、点赞数、评分）
    const [novels] = await pool.query(
      `SELECT 
        n.id, n.title, n.author, n.cover, n.description,
        n.category_id, n.views, n.likes, n.rating,
        n.word_count, n.chapter_count, n.collections,
        n.is_recommended, n.is_hot, n.last_chapter_title,
        c.name as category_name,
        (n.views * 0.4 + n.likes * 0.3 + n.rating * 10 * 0.3) as hot_score
       FROM novels n
       LEFT JOIN categories c ON n.category_id = c.id
       ${whereClause}
       AND n.updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY hot_score DESC, n.updated_at DESC
       LIMIT ?`,
      [...params, days, parseInt(limit)]
    );
    
    return novels;
  }
  
  /**
   * 获取分类列表
   * @returns {Promise<Array>} 分类列表
   */
  async getCategories() {
    const [categories] = await pool.query(
      `SELECT 
        id, name, description, sort_order,
        (SELECT COUNT(*) FROM novels WHERE category_id = categories.id) as novel_count
       FROM categories 
       ORDER BY sort_order ASC, id ASC`
    );
    
    return categories;
  }
  
  /**
   * 获取章节列表
   * @param {number} novelId 小说 ID
   * @param {Object} options 选项
   * @returns {Promise<Object>} 章节列表和分页信息
   */
  async getChapterList(novelId, options = {}) {
    const { page = 1, pageSize = 50 } = options;
    const offset = (page - 1) * pageSize;
    
    // 查询总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM chapters WHERE novel_id = ?',
      [novelId]
    );
    const total = countResult[0].total;
    
    // 查询章节列表
    const [chapters] = await pool.query(
      `SELECT 
        id, novel_id, chapter_number, title, word_count,
        is_free, created_at, updated_at
       FROM chapters
       WHERE novel_id = ?
       ORDER BY chapter_number ASC
       LIMIT ? OFFSET ?`,
      [novelId, parseInt(pageSize), offset]
    );
    
    return {
      list: chapters,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
  
  /**
   * 获取章节内容
   * @param {number} chapterId 章节 ID
   * @param {number} userId 用户 ID（可选）
   * @returns {Promise<Object>} 章节内容
   */
  async getChapterContent(chapterId, userId = null) {
    const [chapters] = await pool.query(
      'SELECT * FROM chapters WHERE id = ?',
      [chapterId]
    );
    
    if (chapters.length === 0) {
      throw new Error('章节不存在');
    }
    
    const chapter = chapters[0];
    
    // 检查用户权限（如果不是免费章节）
    if (!chapter.is_free && userId) {
      // 可以在这里添加VIP检查逻辑
    }
    
    return chapter;
  }
}

module.exports = new NovelService();

