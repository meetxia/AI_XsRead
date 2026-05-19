/**
 * 小说服务层
 * 处理小说相关的业务逻辑
 */
const { pool } = require('../config/database');
const { isMember } = require('./membershipService');
const {
  buildNovelListQuery,
  buildNovelSearchQuery
} = require('./novel/queryBuilders');
const {
  createPagination,
  getOffset,
  paginateTextByChars
} = require('./novel/pagination');
const { formatNovelDownloadText } = require('./novel/textFormatters');

/**
 * VIP 试读截断字数（按 String.length 简单截断 1500 个字符）
 * 来源：spec/membership-system/requirements §5 R-7
 */
const TRIAL_LENGTH = 1500;

class NovelService {
  /**
   * 获取小说列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 小说列表和分页信息
   */
  async getNovelList(options = {}) {
    const { page = 1, pageSize = 20 } = options;
    const offset = getOffset(page, pageSize);
    const { whereClause, params, safeSort, safeOrder } = buildNovelListQuery(options);
    
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
       ORDER BY ${safeSort} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );
    
    return {
      list: novels,
      pagination: createPagination(page, pageSize, total)
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

    // 标准化 is_vip 字段为 0/1（TINYINT 默认是 number，但保险）
    novel.is_vip = Number(novel.is_vip || 0);

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
   * 记录用户浏览历史
   * @param {number} userId 用户 ID
   * @param {number} novelId 小说 ID
   * @returns {Promise<void>}
   */
  async recordViewHistory(userId, novelId) {
    try {
      // 插入浏览历史记录（允许重复记录，按时间排序）
      await pool.query(
        'INSERT INTO reading_history (user_id, novel_id, chapter_id, read_time) VALUES (?, ?, NULL, NOW())',
        [userId, novelId]
      );
    } catch (error) {
      console.error('Record view history error:', error);
      // 不抛出异常，避免影响主流程
    }
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
      WHERE 1=1
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
    const { keyword, page = 1, pageSize = 20 } = options;
    
    if (!keyword) {
      throw new Error('请输入搜索关键词');
    }
    
    const offset = getOffset(page, pageSize);
    const { whereClause, params, safeSort, safeOrder } = buildNovelSearchQuery(options);
    
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
       ORDER BY ${safeSort} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );
    
    return {
      list: novels,
      pagination: createPagination(page, pageSize, total)
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
    
    let whereClause = 'WHERE 1=1';
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
       ORDER BY hot_score DESC, n.updated_at DESC
       LIMIT ?`,
      [...params, parseInt(limit)]
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
    const { page = 1, pageSize = 50, keyword } = options;
    const offset = (page - 1) * pageSize;
    const params = [novelId];
    let whereClause = 'WHERE novel_id = ?';

    if (keyword && String(keyword).trim()) {
      whereClause += ' AND title LIKE ?';
      params.push(`${String(keyword).trim()}%`);
    }
    
    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM chapters ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // 查询章节列表
    const [chapters] = await pool.query(
      `SELECT 
        id, novel_id, chapter_number, title, word_count,
        is_free, created_at, updated_at
       FROM chapters
       ${whereClause}
       ORDER BY chapter_number ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    // 章节继承小说的 is_vip（整本维度）
    const [novelRows] = await pool.query(
      'SELECT is_vip FROM novels WHERE id = ? LIMIT 1',
      [novelId]
    );
    const novelIsVip = Number(novelRows[0]?.is_vip || 0);
    const enriched = chapters.map(ch => ({
      ...ch,
      is_vip: novelIsVip
    }));

    return {
      list: enriched,
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

    // 取小说 is_vip 标记
    const [novels] = await pool.query(
      'SELECT is_vip FROM novels WHERE id = ? LIMIT 1',
      [chapter.novel_id]
    );
    const novelIsVip = Number(novels[0]?.is_vip || 0) === 1;
    chapter.is_vip = novelIsVip ? 1 : 0;

    // 免费书：照常返回完整内容
    if (!novelIsVip) {
      return {
        ...chapter,
        vip_required: false,
        truncated: false
      };
    }

    // VIP 书：判断是否会员
    const member = await isMember(userId);
    if (member) {
      return {
        ...chapter,
        vip_required: true,
        truncated: false
      };
    }

    // 非会员：截断试读
    const fullContent = String(chapter.content || '');
    if (fullContent.length > TRIAL_LENGTH) {
      return {
        ...chapter,
        content: fullContent.slice(0, TRIAL_LENGTH),
        truncated: true,
        vip_required: true,
        trial_length: TRIAL_LENGTH
      };
    }
    return {
      ...chapter,
      truncated: false,
      vip_required: true,
      trial_length: TRIAL_LENGTH
    };
  }

  /**
   * 按字符分页返回整本小说的内容
   * @param {number} novelId 小说ID
   * @param {Object} options 选项 { page, pageSize, userId? }
   * @returns {Promise<Object>} { page, pageSize, totalPages, totalChars, content, is_vip, vip_required, truncated, trial_length? }
   */
  async getNovelPageByChars(novelId, options = {}) {
    const {
      page = 1,
      pageSize = 3000,
      userId = null
    } = options;

    // 先取小说 is_vip
    const [novelRows] = await pool.query(
      'SELECT is_vip FROM novels WHERE id = ? LIMIT 1',
      [novelId]
    );
    const novelIsVip = Number(novelRows[0]?.is_vip || 0) === 1;

    // 读取该小说所有章节内容，按章节顺序拼接
    const [rows] = await pool.query(
      `SELECT content FROM chapters WHERE novel_id = ? ORDER BY chapter_number ASC`,
      [novelId]
    );

    if (!rows || rows.length === 0) {
      return {
        page: 1,
        pageSize: parseInt(pageSize),
        totalPages: 1,
        totalChars: 0,
        content: '',
        is_vip: novelIsVip ? 1 : 0,
        vip_required: novelIsVip,
        truncated: false
      };
    }

    let fullText = rows.map(r => r.content || '').join('\n\n');

    // VIP gating：非会员 + VIP 书 → 整本只允许试读前 TRIAL_LENGTH 字
    let truncated = false;
    let trialLength = null;
    let vipRequired = false;
    if (novelIsVip) {
      vipRequired = true;
      const member = await isMember(userId);
      if (!member && fullText.length > TRIAL_LENGTH) {
        fullText = fullText.slice(0, TRIAL_LENGTH);
        truncated = true;
        trialLength = TRIAL_LENGTH;
      }
    }

    const paged = paginateTextByChars(fullText, { page, pageSize });

    const result = {
      page: paged.page,
      pageSize: paged.pageSize,
      totalPages: paged.totalPages,
      totalChars: paged.totalChars,
      content: paged.content,
      is_vip: novelIsVip ? 1 : 0,
      vip_required: vipRequired,
      truncated
    };
    if (trialLength !== null) {
      result.trial_length = trialLength;
    }
    return result;
  }

  /**
   * 生成整本小说 TXT 下载文本
   * @param {number} novelId 小说 ID
   * @returns {Promise<{title:string, filename:string, text:string}>}
   */
  async buildNovelDownloadText(novelId) {
    const [novels] = await pool.query(
      'SELECT id, title, author, description FROM novels WHERE id = ? LIMIT 1',
      [novelId]
    );

    if (!novels || novels.length === 0) {
      throw new Error('小说不存在');
    }

    const novel = novels[0];
    const [chapters] = await pool.query(
      `SELECT chapter_number, title, content
       FROM chapters
       WHERE novel_id = ?
       ORDER BY chapter_number ASC, id ASC`,
      [novelId]
    );

    return formatNovelDownloadText(novel, chapters);
  }
}

module.exports = new NovelService();
