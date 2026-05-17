/**
 * 小说服务层
 * 处理小说相关的业务逻辑
 */
const { pool } = require('../config/database');
const { isMember } = require('./membershipService');

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
    const {
      page = 1,
      pageSize = 20,
      categoryId,
      status,
      wordCountMin,
      wordCountMax,
      ratingMin,
      hasFinished,
      tags,
      exclude,
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
      if (status === 'finished') {
        whereClause += ' AND n.status = 0';
      } else {
        whereClause += ' AND n.status = ?';
        params.push(status);
      }
    }

    if (hasFinished !== undefined) {
      whereClause += hasFinished === 'true' || hasFinished === true
        ? ' AND n.status = 0'
        : ' AND n.status <> 0';
    }

    if (wordCountMin) {
      whereClause += ' AND n.word_count >= ?';
      params.push(Number.parseInt(wordCountMin, 10));
    }

    if (wordCountMax) {
      whereClause += ' AND n.word_count <= ?';
      params.push(Number.parseInt(wordCountMax, 10));
    }

    if (ratingMin) {
      whereClause += ' AND n.rating >= ?';
      params.push(Number(ratingMin));
    }

    if (exclude) {
      whereClause += ' AND n.id <> ?';
      params.push(Number.parseInt(exclude, 10));
    }

    const tagList = typeof tags === 'string'
      ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];
    if (tagList.length > 0) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM novel_tags nt
        JOIN tags t ON t.id = nt.tag_id
        WHERE nt.novel_id = n.id AND t.name IN (${tagList.map(() => '?').join(',')})
      )`;
      params.push(...tagList);
    }

    const sortMap = {
      updated_at: 'n.updated_at',
      last_update_time: 'n.last_update_time',
      word_count: 'n.word_count',
      views: 'n.views',
      rating: 'n.rating',
      likes: 'n.likes',
      default: 'n.updated_at'
    };
    const safeSort = sortMap[sortBy] || sortMap.default;
    const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
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
    const { 
      keyword, 
      page = 1, 
      pageSize = 20,
      categoryId,
      wordCountMin,
      wordCountMax,
      ratingMin,
      hasFinished,
      tags,
      exclude,
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

    if (wordCountMin) {
      whereClause += ' AND n.word_count >= ?';
      params.push(Number.parseInt(wordCountMin, 10));
    }

    if (wordCountMax) {
      whereClause += ' AND n.word_count <= ?';
      params.push(Number.parseInt(wordCountMax, 10));
    }

    if (ratingMin) {
      whereClause += ' AND n.rating >= ?';
      params.push(Number(ratingMin));
    }

    if (hasFinished !== undefined) {
      whereClause += hasFinished === 'true' || hasFinished === true
        ? ' AND n.status = 0'
        : ' AND n.status <> 0';
    }

    if (exclude) {
      whereClause += ' AND n.id <> ?';
      params.push(Number.parseInt(exclude, 10));
    }

    const tagList = typeof tags === 'string'
      ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];
    if (tagList.length > 0) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM novel_tags nt
        JOIN tags t ON t.id = nt.tag_id
        WHERE nt.novel_id = n.id AND t.name IN (${tagList.map(() => '?').join(',')})
      )`;
      params.push(...tagList);
    }

    const sortMap = {
      updated_at: 'n.updated_at',
      word_count: 'n.word_count',
      views: 'n.views',
      rating: 'n.rating',
      default: 'n.views'
    };
    const safeSort = sortMap[sortBy] || sortMap.default;
    const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
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

    const totalChars = fullText.length;
    const baseSize = Math.max(500, Math.min(20000, parseInt(pageSize)));

    // 智能分页：在 baseSize 附近（±tolerance）寻找标点或换行作为边界
    const tolerance = Math.max(100, Math.floor(baseSize * 0.15)); // 默认±15%
    const windowMin = Math.max(1, baseSize - tolerance);
    const windowMax = baseSize + tolerance;

    // 标点与分隔符（中英文句号/问号/感叹号/逗号/分号、换行、双换行）
    const boundaryRegex = /[。！？.!?；;，,]\s|\n\n|\n/g;

    // 预计算分页边界索引（每页结束位置的下一个索引）
    const pageEnds = [];
    let cursor = 0;
    while (cursor < totalChars) {
      const remaining = totalChars - cursor;
      if (remaining <= baseSize + tolerance) {
        // 剩余不足一大页，整块作为最后一页
        pageEnds.push(totalChars);
        break;
      }

      // 目标窗口区间
      const targetStart = cursor + windowMin;
      const targetEnd = Math.min(cursor + windowMax, totalChars);

      // 在窗口中寻找最近边界（尽量靠近 baseSize）
      let bestBoundary = -1;
      boundaryRegex.lastIndex = targetStart;
      let match;
      while ((match = boundaryRegex.exec(fullText)) && match.index <= targetEnd) {
        bestBoundary = match.index + (match[0].length > 1 ? match[0].length : 1);
      }

      if (bestBoundary === -1) {
        // 窗口中找不到边界，退而求其次：向后再找一个边界，避免硬切
        boundaryRegex.lastIndex = targetEnd;
        const forward = boundaryRegex.exec(fullText);
        if (forward) {
          bestBoundary = forward.index + (forward[0].length > 1 ? forward[0].length : 1);
        }
      }

      if (bestBoundary === -1) {
        // 仍未找到，最后兜底在 baseSize 处硬切
        bestBoundary = cursor + baseSize;
      }

      // 防止死循环
      if (bestBoundary <= cursor) {
        bestBoundary = Math.min(cursor + baseSize, totalChars);
      }

      pageEnds.push(bestBoundary);
      cursor = bestBoundary;
    }

    const totalPages = Math.max(1, pageEnds.length);
    const currentPage = Math.min(Math.max(1, parseInt(page)), totalPages);
    const sliceStart = currentPage === 1 ? 0 : pageEnds[currentPage - 2];
    const sliceEnd = pageEnds[currentPage - 1];
    const content = fullText.slice(sliceStart, sliceEnd);

    const result = {
      page: currentPage,
      pageSize: baseSize,
      totalPages,
      totalChars,
      content,
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

    const title = String(novel.title || '未命名小说').trim() || '未命名小说';
    const author = String(novel.author || '佚名').trim() || '佚名';
    const description = String(novel.description || '').trim();
    const parts = [
      `《${title}》`,
      `作者：${author}`
    ];

    if (description) {
      parts.push(`简介：${description}`);
    }

    parts.push('');

    if (!chapters || chapters.length === 0) {
      parts.push('本书暂无章节内容。');
    } else {
      chapters.forEach((chapter, index) => {
        const chapterNumber = chapter.chapter_number || index + 1;
        const chapterTitle = String(chapter.title || '').trim();
        const heading = chapterTitle
          ? `第${chapterNumber}章 ${chapterTitle}`
          : `第${chapterNumber}章`;
        const content = String(chapter.content || '').trim();

        parts.push(heading);
        parts.push('');
        parts.push(content || '本章暂无内容。');
        parts.push('');
      });
    }

    const filenameBase = title.replace(/[\\/:*?"<>|]/g, '').trim() || 'novel';

    return {
      title,
      filename: `${filenameBase}.txt`,
      text: `${parts.join('\n').replace(/\n{4,}/g, '\n\n\n')}\n`
    };
  }
}

module.exports = new NovelService();

