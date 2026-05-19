const { pool } = require('../config/database');
const Response = require('../utils/response');
const { getRandomAvatarUrl } = require('../utils/avatar');
const { hasColumn } = require('../utils/schemaCompat');
const achievementService = require('../services/achievementService');
const { attachUnreadUpdate } = require('../services/unreadUpdateService');
const { resolveParagraphAnchor } = require('../utils/paragraphAnchor');
const {
  ALLOWED_SHELF_TYPES,
  buildBookshelfExtraSelect,
  buildBookshelfOrder,
  buildBookshelfWhere,
  createBookshelfTotals,
  normalizeBookshelfQuery,
  normalizeGroupName,
  sanitizeBookshelfIds
} = require('./user/bookshelfHelpers');
const {
  buildProfileUpdate,
  formatProfileStats
} = require('./user/profileHelpers');
const { formatUserStatistics } = require('./user/statisticsPresenter');

/**
 * 获取用户书架
 *
 * Query:
 *   - page, pageSize
 *   - type: reading | finished | collected | wishlist | all（缺省 all）
 *   - sortBy: recent_read | recent_update | added_at | title（缺省 recent_read）
 *
 * 行为：
 *   - 置顶项 (is_top = 1) 永远排在前面（与列存在性兼容降级）
 *   - 当 type !== 'wishlist' 且 type !== 'all' 时，仅返回该类型；type === 'all' 默认排除 wishlist
 *     避免 wishlist 与"在读 / 已读"混在一起
 *   - 响应附加 hasUnreadUpdate（Requirement 24.3）
 *   - 响应同时附带 totals：reading / finished / collected / wishlist；wishlist 不计入"在读 / 已读"统计
 */
const getBookshelf = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      filterType,
      sortField,
      sortDirection,
      pageNum,
      sizeNum,
      offset
    } = normalizeBookshelfQuery(req.query);

    const hasIsTop = await hasColumn('bookshelf', 'is_top');
    const hasGroupName = await hasColumn('bookshelf', 'group_name');
    const hasLastSeen = await hasColumn('bookshelf', 'last_seen_chapter_id');

    const { whereSql, whereParams } = buildBookshelfWhere(userId, filterType);

    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM bookshelf b WHERE ${whereSql}`,
      whereParams
    );
    const total = Number(countResult[0]?.total || 0);

    // 排序：置顶优先 + 用户选择字段
    const orderSql = buildBookshelfOrder({ hasIsTop, sortField, sortDirection });
    const extraSelect = buildBookshelfExtraSelect({ hasIsTop, hasGroupName, hasLastSeen });

    // 查询书架数据
    const [bookshelfRows] = await pool.query(
      `SELECT b.*, ${extraSelect}, n.title, n.author, n.cover, n.category_id,
              n.updated_at AS novel_updated_at, c.name as category_name,
              rp.chapter_id as current_chapter_id, rp.progress as reading_progress
       FROM bookshelf b
       INNER JOIN novels n ON b.novel_id = n.id
       LEFT JOIN categories c ON n.category_id = c.id
       LEFT JOIN reading_progress rp ON rp.user_id = b.user_id AND rp.novel_id = b.novel_id
       WHERE ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`,
      [...whereParams, sizeNum, offset]
    );

    // 附加 hasUnreadUpdate
    const enriched = await attachUnreadUpdate(bookshelfRows);

    // 类型分桶 totals（wishlist 不计入"在读 / 已读"统计）
    const [totalsRows] = await pool.query(
      `SELECT type, COUNT(*) as cnt FROM bookshelf WHERE user_id = ? GROUP BY type`,
      [userId]
    );
    const totals = createBookshelfTotals(totalsRows);

    return res.status(200).json({
      code: 200,
      message: 'success',
      data: enriched,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total,
        totalPages: sizeNum > 0 ? Math.ceil(total / sizeNum) : 0
      },
      totals,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Get bookshelf error:', error);
    return Response.error(res, '获取书架失败', 500);
  }
};

/**
 * 添加到书架
 *
 * 行为：
 *   - 当 type === 'reading' 且已有同书 type='wishlist' 记录时，自动晋升 type 为 'reading'
 *     （Requirement 21.4：想读 → 开始阅读）
 *   - 其它情况下若已存在记录，则返回 400
 */
const addToBookshelf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { novelId, type = 'reading' } = req.body;
    const shelfType = ALLOWED_SHELF_TYPES.includes(type) ? type : 'reading';

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
      'SELECT id, type FROM bookshelf WHERE user_id = ? AND novel_id = ?',
      [userId, novelId]
    );

    if (existing.length > 0) {
      const existingType = existing[0].type;
      // wishlist → reading 自动晋升
      if (shelfType === 'reading' && existingType === 'wishlist') {
        await pool.query(
          `UPDATE bookshelf
             SET type = 'reading', updated_at = NOW()
           WHERE user_id = ? AND novel_id = ?`,
          [userId, novelId]
        );
        return Response.success(res, { promoted: true, type: 'reading' }, '已切换为在读');
      }
      return Response.error(res, '该小说已在书架中', 400);
    }

    // 添加到书架
    await pool.query(
      'INSERT INTO bookshelf (user_id, novel_id, type) VALUES (?, ?, ?)',
      [userId, novelId, shelfType]
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

    const hasParagraphIndex = await hasColumn('reading_progress', 'paragraph_index');
    const hasCharOffset = await hasColumn('reading_progress', 'char_offset');
    const hasParagraphHash = await hasColumn('reading_progress', 'paragraph_hash');
    const extraFields = [
      hasParagraphIndex ? 'rp.paragraph_index' : 'NULL AS paragraph_index',
      hasCharOffset ? 'rp.char_offset' : 'NULL AS char_offset',
      hasParagraphHash ? 'rp.paragraph_hash' : 'NULL AS paragraph_hash'
    ].join(', ');

    const [progress] = await pool.query(
      `SELECT rp.*, ${extraFields}, c.title AS chapterTitle, c.title AS chapter_title
       FROM reading_progress rp
       LEFT JOIN chapters c ON c.id = rp.chapter_id
       WHERE rp.user_id = ? AND rp.novel_id = ?
       LIMIT 1`,
      [userId, novelId]
    );
    
    if (progress.length === 0) {
      return Response.success(res, null);
    }
    
    return Response.success(res, {
      ...progress[0],
      progress: Number(progress[0].progress || 0),
      paragraph_index: progress[0].paragraph_index ?? null,
      char_offset: progress[0].char_offset ?? null,
      paragraph_hash: progress[0].paragraph_hash ?? null,
      chapterTitle: progress[0].chapterTitle || progress[0].chapter_title || null
    });
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
    const {
      novelId,
      chapterId,
      progress = 0,
      paragraphIndex,
      paragraph_index,
      charOffset,
      char_offset,
      paragraphHash,
      paragraph_hash,
      duration = 0
    } = req.body;
    
    // 参数验证
    if (!novelId) {
      return Response.error(res, '小说ID不能为空', 400);
    }
    
    // 确保 chapterId 为 null 而不是 undefined
    const finalChapterId = chapterId || null;
    
    const hasParagraphIndex = await hasColumn('reading_progress', 'paragraph_index');
    const hasCharOffset = await hasColumn('reading_progress', 'char_offset');
    const hasParagraphHash = await hasColumn('reading_progress', 'paragraph_hash');
    const nextParagraphIndex = paragraphIndex ?? paragraph_index ?? null;
    const nextCharOffset = charOffset ?? char_offset ?? null;
    const nextParagraphHash = paragraphHash ?? paragraph_hash ?? null;

    const extraInsertColumns = [];
    const extraInsertValues = [];
    const extraInsertParams = [];
    const extraUpdateAssignments = [];
    const extraUpdateParams = [];

    if (hasParagraphIndex && nextParagraphIndex !== null && nextParagraphIndex !== undefined) {
      extraInsertColumns.push('paragraph_index');
      extraInsertValues.push('?');
      extraInsertParams.push(Number.parseInt(nextParagraphIndex, 10));
      extraUpdateAssignments.push('paragraph_index = ?');
      extraUpdateParams.push(Number.parseInt(nextParagraphIndex, 10));
    }
    if (hasCharOffset && nextCharOffset !== null && nextCharOffset !== undefined) {
      extraInsertColumns.push('char_offset');
      extraInsertValues.push('?');
      extraInsertParams.push(Number.parseInt(nextCharOffset, 10));
      extraUpdateAssignments.push('char_offset = ?');
      extraUpdateParams.push(Number.parseInt(nextCharOffset, 10));
    }
    if (hasParagraphHash && nextParagraphHash) {
      extraInsertColumns.push('paragraph_hash');
      extraInsertValues.push('?');
      extraInsertParams.push(String(nextParagraphHash).slice(0, 16));
      extraUpdateAssignments.push('paragraph_hash = ?');
      extraUpdateParams.push(String(nextParagraphHash).slice(0, 16));
    }

    // 段落锚点解析（Requirement 4.5）：
    // - 缺失 chapterId / paragraphIndex / paragraphHash 时不解析，progressApplied = null；
    // - 提供 chapterId 与 paragraphHash 时通过 resolveParagraphAnchor 返回 status：
    //     'exact'    — 索引 + hash 完全命中；
    //     'rehashed' — 章节正文修订后通过 hash 在新正文中线性回找；
    //     'fallback' — 仍未命中或越界，回退到 clamp 后的索引。
    let progressApplied = null;
    if (finalChapterId !== null && (nextParagraphIndex !== null || nextParagraphHash)) {
      try {
        const resolved = await resolveParagraphAnchor(
          finalChapterId,
          nextParagraphIndex,
          nextParagraphHash,
          pool
        );
        progressApplied = {
          paragraphIndex: resolved.paragraphIndex,
          status: resolved.status
        };
      } catch (anchorError) {
        // 锚点解析失败不应阻塞进度写入；记录 WARN 后继续。
        console.warn('resolveParagraphAnchor warning:', anchorError.message);
      }
    }

    // 检查是否已有记录
    const [existing] = await pool.query(
      'SELECT id FROM reading_progress WHERE user_id = ? AND novel_id = ?',
      [userId, novelId]
    );
    
    if (existing.length > 0) {
      // 更新
      await pool.query(
        `UPDATE reading_progress
         SET chapter_id = ?, progress = ?, ${extraUpdateAssignments.length ? `${extraUpdateAssignments.join(', ')}, ` : ''}updated_at = NOW()
         WHERE user_id = ? AND novel_id = ?`,
        [finalChapterId, progress, ...extraUpdateParams, userId, novelId]
      );
    } else {
      // 插入
      await pool.query(
        `INSERT INTO reading_progress
           (user_id, novel_id, chapter_id, progress${extraInsertColumns.length ? `, ${extraInsertColumns.join(', ')}` : ''}, created_at, updated_at)
         VALUES (?, ?, ?, ?${extraInsertValues.length ? `, ${extraInsertValues.join(', ')}` : ''}, NOW(), NOW())`,
        [userId, novelId, finalChapterId, progress, ...extraInsertParams]
      );
    }
    
    // 添加到阅读历史（避免频繁插入，只在有章节ID或首次阅读时记录）
    try {
      // 检查最近是否已有相同的阅读记录（5分钟内）
      const [recentHistory] = await pool.query(
        `SELECT id FROM reading_history 
         WHERE user_id = ? AND novel_id = ? 
         AND (chapter_id = ? OR (chapter_id IS NULL AND ? IS NULL))
         AND read_time > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
         LIMIT 1`,
        [userId, novelId, finalChapterId, finalChapterId]
      );
      
      const clampedDuration = Number(duration) > 120 ? 60 : Math.max(0, Number.parseInt(duration, 10) || 0);
      // 只有在5分钟内没有相同记录时才插入
      if (recentHistory.length === 0) {
        await pool.query(
          'INSERT INTO reading_history (user_id, novel_id, chapter_id, duration, read_time) VALUES (?, ?, ?, ?, NOW())',
          [userId, novelId, finalChapterId, clampedDuration]
        );
      } else if (clampedDuration > 0) {
        await pool.query(
          `UPDATE reading_history
           SET duration = LEAST(COALESCE(duration, 0) + ?, 86400), read_time = NOW()
           WHERE id = ?`,
          [clampedDuration, recentHistory[0].id]
        );
      }
    } catch (historyError) {
      // 阅读历史插入失败不影响主要功能，只记录日志
      console.warn('Insert reading history warning:', historyError.message);
    }
    
    await pool.query(
      `UPDATE bookshelf
       SET current_chapter_id = COALESCE(?, current_chapter_id),
           progress = ?,
           last_read_time = NOW(),
           updated_at = NOW()
       WHERE user_id = ? AND novel_id = ?`,
      [finalChapterId, progress, userId, novelId]
    ).catch(() => {});

    // 单调推进 last_seen_chapter_id（红点清除）— Requirement 24.2
    if (finalChapterId) {
      try {
        const { markChapterAsRead } = require('../services/unreadUpdateService');
        await markChapterAsRead(userId, novelId, finalChapterId);
      } catch (markError) {
        console.warn('markChapterAsRead warning:', markError.message);
      }
    }

    return Response.success(res, {
      updatedAt: new Date().toISOString(),
      progressApplied
    }, '更新成功');
  } catch (error) {
    console.error('Update reading progress error:', error);
    // 提供更详细的错误信息
    const errorMessage = error.sqlMessage || error.message || '更新失败';
    return Response.error(res, errorMessage, 500);
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
       ORDER BY MAX(rh.read_time) DESC
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

    // 阅读时长统计（使用reading_history表的duration字段和read_time字段）
    const [timeStats] = await pool.query(
      `SELECT 
        COALESCE(SUM(duration), 0) as total_read_time,
        COALESCE(SUM(CASE WHEN read_time >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN duration ELSE 0 END), 0) as today_read_time,
        COALESCE(SUM(CASE WHEN read_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN duration ELSE 0 END), 0) as weekly_read_time,
        COALESCE(SUM(CASE WHEN read_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN duration ELSE 0 END), 0) as monthly_read_time
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
      `SELECT COUNT(DISTINCT DATE(read_time)) as reading_streak
       FROM reading_history
       WHERE user_id = ?
       AND read_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [userId]
    );

    // 最近7天阅读趋势
    const [trendData] = await pool.query(
      `SELECT 
        DATE(read_time) as date,
        COUNT(DISTINCT novel_id) as novels_read,
        COUNT(DISTINCT chapter_id) as chapters_read,
        COALESCE(SUM(duration), 0) as read_time
       FROM reading_history
       WHERE user_id = ? AND read_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(read_time)
       ORDER BY date ASC`,
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

    // 加入天数（基于 users.created_at）
    // - 当天注册返回 0
    // - 第二天返回 1，依此类推
    const [joinDaysRows] = await pool.query(
      `SELECT GREATEST(DATEDIFF(NOW(), created_at), 0) AS joinDays
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );
    const joinDays = Number(joinDaysRows[0]?.joinDays || 0);

    return Response.success(res, formatUserStatistics({
      joinDays,
      bookshelfStats,
      timeStats,
      favoriteCategory,
      streakResult,
      trendData,
      chapterStats
    }));
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
    const result = await achievementService.evaluate(userId);
    return Response.success(res, result);
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
      `SELECT id, username, email, avatar, nickname, bio, gender, birthday, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return Response.error(res, '用户不存在', 404);
    }

    // 若缺失头像则自动分配并更新
    if (!users[0].avatar) {
      try {
        const newAvatar = getRandomAvatarUrl(req);
        if (newAvatar) {
          await pool.query('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [newAvatar, userId]);
          users[0].avatar = newAvatar;
        }
      } catch (e) {
        console.warn('分配头像失败（用户资料）:', e.message);
      }
    }

    // 获取基础统计（使用正确的表名）
    const [stats] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM bookshelf WHERE user_id = ?) as total_books,
        (SELECT COUNT(*) FROM user_likes WHERE user_id = ?) as total_likes,
        (SELECT COUNT(*) FROM bookshelf WHERE user_id = ? AND type = 'collected') as total_collections,
        (SELECT COUNT(*) FROM comments WHERE user_id = ?) as total_comments`,
      [userId, userId, userId, userId]
    );

    return Response.success(res, {
      user: users[0],
      stats: formatProfileStats(stats[0])
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return Response.error(res, '获取用户资料失败', 500);
  }
};

/**
 * 更新用户个人资料
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileUpdate = buildProfileUpdate(req.body);

    if (profileUpdate.error) {
      return Response.error(res, profileUpdate.error, 400);
    }

    // 添加更新时间
    const { updates, values } = profileUpdate;
    updates.push('updated_at = NOW()');
    values.push(userId);

    // 执行更新
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // 获取更新后的用户信息
    const [users] = await pool.query(
      `SELECT id, username, email, avatar, nickname, bio, gender, birthday, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    return Response.success(res, users[0], '更新成功');
  } catch (error) {
    console.error('Update user profile error:', error);
    return Response.error(res, '更新用户资料失败', 500);
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
  getUserProfile,
  updateUserProfile,
  async updateBookshelfItem(req, res) {
    try {
      const userId = req.user.id;
      const { novelId } = req.params;
      const { type } = req.body; // reading/finished/collected 等

      // 仅允许特定类型
      const allowed = ['reading', 'finished', 'collected'];
      if (type && !allowed.includes(type)) {
        return Response.error(res, '无效的书架类型', 400);
      }

      const [exists] = await pool.query(
        'SELECT id FROM bookshelf WHERE user_id = ? AND novel_id = ?',
        [userId, novelId]
      );
      if (exists.length === 0) {
        return Response.error(res, '书架项不存在', 404);
      }

      await pool.query(
        'UPDATE bookshelf SET type = COALESCE(?, type), updated_at = NOW() WHERE user_id = ? AND novel_id = ?',
        [type || null, userId, novelId]
      );

      return Response.success(res, null, '更新成功');
    } catch (error) {
      console.error('Update bookshelf item error:', error);
      return Response.error(res, '更新失败', 500);
    }
  },

  async batchOperateBookshelf(req, res) {
    try {
      const userId = req.user.id;
      const { ids = [], action, groupName } = req.body || {};

      if (!Array.isArray(ids) || ids.length === 0) {
        return Response.error(res, '缺少书籍ID列表', 400);
      }
      const allowedActions = ['delete', 'group', 'top', 'untop'];
      if (!allowedActions.includes(action)) {
        return Response.error(res, '不支持的批量操作', 400);
      }

      // 仅保留合法的整数 id
      const sanitizedIds = sanitizeBookshelfIds(ids);
      if (sanitizedIds.length === 0) {
        return Response.error(res, '缺少书籍ID列表', 400);
      }

      const placeholders = sanitizedIds.map(() => '?').join(',');
      let result;

      if (action === 'delete') {
        [result] = await pool.query(
          `DELETE FROM bookshelf WHERE user_id = ? AND novel_id IN (${placeholders})`,
          [userId, ...sanitizedIds]
        );
      } else if (action === 'group') {
        const hasGroupName = await hasColumn('bookshelf', 'group_name');
        if (!hasGroupName) {
          return Response.error(res, '分组功能尚未启用', 400);
        }
        const normalizedGroup = normalizeGroupName(groupName);
        [result] = await pool.query(
          `UPDATE bookshelf
             SET group_name = ?, updated_at = NOW()
           WHERE user_id = ? AND novel_id IN (${placeholders})`,
          [normalizedGroup || null, userId, ...sanitizedIds]
        );
      } else if (action === 'top' || action === 'untop') {
        const hasIsTop = await hasColumn('bookshelf', 'is_top');
        if (!hasIsTop) {
          return Response.error(res, '置顶功能尚未启用', 400);
        }
        const isTopValue = action === 'top' ? 1 : 0;
        [result] = await pool.query(
          `UPDATE bookshelf
             SET is_top = ?, updated_at = NOW()
           WHERE user_id = ? AND novel_id IN (${placeholders})`,
          [isTopValue, userId, ...sanitizedIds]
        );
      }

      return Response.success(res, { affected: result?.affectedRows || 0 }, '批量操作完成');
    } catch (error) {
      console.error('Batch operate bookshelf error:', error);
      return Response.error(res, '批量操作失败', 500);
    }
  },

  async checkInBookshelf(req, res) {
    try {
      const userId = req.user.id;
      const { novelId } = req.params;

      const [rows] = await pool.query(
        'SELECT id FROM bookshelf WHERE user_id = ? AND novel_id = ? LIMIT 1',
        [userId, novelId]
      );

      return Response.success(res, { inBookshelf: rows.length > 0 });
    } catch (error) {
      console.error('Check in bookshelf error:', error);
      return Response.error(res, '检查失败', 500);
    }
  }
};
