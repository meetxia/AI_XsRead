const { pool } = require('../config/database');
const Response = require('../utils/response');

/**
 * 获取小说列表
 */
const getNovelList = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      categoryId,
      status,
      sortBy = 'updated_at',
      order = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (categoryId) {
      whereClause += ' AND category_id = ?';
      params.push(categoryId);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM novels ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // 查询列表数据
    const [novels] = await pool.query(
      `SELECT n.*, c.name as category_name 
       FROM novels n 
       LEFT JOIN categories c ON n.category_id = c.id 
       ${whereClause}
       ORDER BY ${sortBy} ${order}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );
    
    return Response.paginate(res, novels, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    });
  } catch (error) {
    console.error('Get novel list error:', error);
    return Response.error(res, '获取小说列表失败', 500);
  }
};

/**
 * 获取小说详情
 */
const getNovelDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [novels] = await pool.query(
      `SELECT n.*, c.name as category_name,
              (SELECT COUNT(*) FROM chapters WHERE novel_id = n.id) as chapter_count
       FROM novels n
       LEFT JOIN categories c ON n.category_id = c.id
       WHERE n.id = ?`,
      [id]
    );
    
    if (novels.length === 0) {
      return Response.error(res, '小说不存在', 404);
    }
    
    // 更新浏览量
    await pool.query(
      'UPDATE novels SET views = views + 1 WHERE id = ?',
      [id]
    );
    
    return Response.success(res, novels[0]);
  } catch (error) {
    console.error('Get novel detail error:', error);
    return Response.error(res, '获取小说详情失败', 500);
  }
};

/**
 * 获取推荐小说
 */
const getRecommendNovels = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const [novels] = await pool.query(
      `SELECT n.*, c.name as category_name
       FROM novels n
       LEFT JOIN categories c ON n.category_id = c.id
       WHERE n.status = 'published'
       ORDER BY n.views DESC, n.rating DESC
       LIMIT ?`,
      [parseInt(limit)]
    );
    
    return Response.success(res, novels);
  } catch (error) {
    console.error('Get recommend novels error:', error);
    return Response.error(res, '获取推荐小说失败', 500);
  }
};

/**
 * 获取章节列表
 */
const getChapterList = async (req, res) => {
  try {
    const { novelId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;
    
    const offset = (page - 1) * pageSize;
    
    // 查询总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM chapters WHERE novel_id = ?',
      [novelId]
    );
    const total = countResult[0].total;
    
    // 查询章节列表
    const [chapters] = await pool.query(
      `SELECT id, novel_id, chapter_number, title, word_count, 
              is_free, created_at, updated_at
       FROM chapters
       WHERE novel_id = ?
       ORDER BY chapter_number ASC
       LIMIT ? OFFSET ?`,
      [novelId, parseInt(pageSize), offset]
    );
    
    return Response.paginate(res, chapters, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    });
  } catch (error) {
    console.error('Get chapter list error:', error);
    return Response.error(res, '获取章节列表失败', 500);
  }
};

/**
 * 获取章节内容
 */
const getChapterContent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [chapters] = await pool.query(
      'SELECT * FROM chapters WHERE id = ?',
      [id]
    );
    
    if (chapters.length === 0) {
      return Response.error(res, '章节不存在', 404);
    }
    
    return Response.success(res, chapters[0]);
  } catch (error) {
    console.error('Get chapter content error:', error);
    return Response.error(res, '获取章节内容失败', 500);
  }
};

/**
 * 搜索小说
 */
const searchNovels = async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query;
    
    if (!keyword) {
      return Response.error(res, '请输入搜索关键词', 400);
    }
    
    const offset = (page - 1) * pageSize;
    const searchTerm = `%${keyword}%`;
    
    // 查询总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM novels WHERE title LIKE ? OR author LIKE ? OR description LIKE ?',
      [searchTerm, searchTerm, searchTerm]
    );
    const total = countResult[0].total;
    
    // 搜索小说
    const [novels] = await pool.query(
      `SELECT n.*, c.name as category_name
       FROM novels n
       LEFT JOIN categories c ON n.category_id = c.id
       WHERE n.title LIKE ? OR n.author LIKE ? OR n.description LIKE ?
       ORDER BY n.views DESC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, parseInt(pageSize), offset]
    );
    
    return Response.paginate(res, novels, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    });
  } catch (error) {
    console.error('Search novels error:', error);
    return Response.error(res, '搜索失败', 500);
  }
};

/**
 * 获取分类列表
 */
const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories ORDER BY sort_order ASC, id ASC'
    );
    
    return Response.success(res, categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return Response.error(res, '获取分类列表失败', 500);
  }
};

module.exports = {
  getNovelList,
  getNovelDetail,
  getRecommendNovels,
  getChapterList,
  getChapterContent,
  searchNovels,
  getCategories
};

