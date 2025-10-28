/**
 * 评论控制器
 */
const { pool } = require('../config/database');
const { ErrorCodes, getErrorMessage } = require('../constants/errorCodes');
const AppError = require('../utils/AppError');
const { sanitizeComment } = require('../utils/sanitize');

// 确保评论相关表存在（首次使用时自动创建）
async function ensureCommentTables() {
  const createCommentsSQL = `
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      novel_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      parent_id INT DEFAULT NULL,
      reply_to_user_id INT DEFAULT NULL,
      likes INT DEFAULT 0,
      created_at DATETIME NOT NULL,
      deleted_at DATETIME DEFAULT NULL,
      INDEX idx_novel_id (novel_id),
      INDEX idx_user_id (user_id),
      INDEX idx_parent_id (parent_id),
      INDEX idx_created_at (created_at),
      INDEX idx_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

  const createLikesSQL = `
    CREATE TABLE IF NOT EXISTS comment_likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      comment_id INT NOT NULL,
      created_at DATETIME NOT NULL,
      UNIQUE KEY uk_user_comment (user_id, comment_id),
      INDEX idx_comment_id (comment_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

  await pool.query(createCommentsSQL);
  await pool.query(createLikesSQL);
}

/**
 * 获取小说评论列表
 * GET /api/novels/:novelId/comments
 */
exports.getNovelComments = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const { 
      page = 1, 
      pageSize = 20, 
      sort = 'time', // time: 按时间, hot: 按热度
      parentId = null 
    } = req.query;

    const offset = (page - 1) * pageSize;
    const userId = req.user?.id; // 当前登录用户ID

    // 构建排序字段
    let orderBy = 'c.created_at DESC';
    if (sort === 'hot') {
      orderBy = 'c.likes DESC, c.created_at DESC';
    }

    // 查询评论
    let query = `
      SELECT 
        c.id,
        c.content,
        c.images,
        c.likes,
        c.created_at,
        c.parent_id,
        c.reply_to_user_id,
        u.id as user_id,
        u.username,
        u.avatar,
        ru.username as reply_to_username,
        (SELECT COUNT(*) FROM comments WHERE parent_id = c.id AND deleted_at IS NULL) as reply_count
        ${userId ? `, (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND user_id = ?) as is_liked` : ''}
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      LEFT JOIN users ru ON c.reply_to_user_id = ru.id
      WHERE c.novel_id = ? AND c.parent_id ${parentId ? '= ?' : 'IS NULL'} AND c.deleted_at IS NULL
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const queryParams = userId ? [userId, novelId] : [novelId];
    if (parentId) {
      queryParams.push(parentId);
    }
    queryParams.push(parseInt(pageSize), offset);

    let comments;
    try {
      [comments] = await pool.query(query, queryParams);
    } catch (dbErr) {
      // 当评论相关表尚未创建时，优雅降级为空列表，避免500
      if (dbErr && (dbErr.code === 'ER_NO_SUCH_TABLE' || dbErr.code === 'ER_BAD_FIELD_ERROR')) {
        return res.json({
          code: 200,
          message: '获取成功',
          data: {
            list: [],
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total: 0,
              totalPages: 0
            }
          },
          timestamp: Date.now()
        });
      }
      throw dbErr;
    }

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM comments 
      WHERE novel_id = ? AND parent_id ${parentId ? '= ?' : 'IS NULL'} AND deleted_at IS NULL
    `;
    const countParams = parentId ? [novelId, parentId] : [novelId];
    const [countResult] = await pool.query(countQuery, countParams);

    // 格式化评论数据
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      images: comment.images ? JSON.parse(comment.images) : [],
      likes: comment.likes,
      replyCount: comment.reply_count,
      isLiked: userId ? comment.is_liked > 0 : false,
      createdAt: comment.created_at,
      user: {
        id: comment.user_id,
        username: comment.username,
        avatar: comment.avatar
      },
      replyTo: comment.reply_to_user_id ? {
        userId: comment.reply_to_user_id,
        username: comment.reply_to_username
      } : null
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: formattedComments,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / pageSize)
        }
      },
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 发表评论
 * POST /api/novels/:novelId/comments
 */
exports.createComment = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const { content, parentId = null, replyToUserId = null, images = [] } = req.body;
    const userId = req.user.id;

    // 验证内容（评论必须有文字或图片）
    if ((!content || content.trim().length === 0) && images.length === 0) {
      throw new AppError(
        ErrorCodes.COMMENT_TOO_SHORT,
        '评论内容不能为空'
      );
    }

    if (content && content.length > 500) {
      throw new AppError(
        ErrorCodes.COMMENT_TOO_LONG,
        getErrorMessage(ErrorCodes.COMMENT_TOO_LONG)
      );
    }

    // 验证图片数量
    if (images.length > 3) {
      throw new AppError(
        ErrorCodes.INVALID_PARAMETER,
        '最多只能上传3张图片'
      );
    }

    // 清理内容（XSS防护）
    const sanitizedContent = content ? sanitizeComment(content) : '';

    // 验证小说是否存在
    const [novels] = await pool.query(
      'SELECT id FROM novels WHERE id = ?',
      [novelId]
    );

    if (novels.length === 0) {
      throw new AppError(
        ErrorCodes.NOVEL_NOT_FOUND,
        getErrorMessage(ErrorCodes.NOVEL_NOT_FOUND)
      );
    }

    // 如果是回复评论，验证父评论是否存在
    if (parentId) {
      const [parentComments] = await pool.query(
        'SELECT id FROM comments WHERE id = ? AND novel_id = ?',
        [parentId, novelId]
      );

      if (parentComments.length === 0) {
        throw new AppError(
          ErrorCodes.COMMENT_NOT_FOUND,
          '父评论不存在'
        );
      }
    }

    // 防刷机制：检查最近1分钟内的评论数
    const [recentComments] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM comments 
       WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)`,
      [userId]
    );

    if (recentComments[0].count >= 3) {
      throw new AppError(
        ErrorCodes.TOO_MANY_REQUESTS,
        '评论过于频繁，请稍后再试'
      );
    }

    // 插入评论
    const imagesJson = images.length > 0 ? JSON.stringify(images) : null;
    let result;
    try {
      [result] = await pool.query(
        `INSERT INTO comments (novel_id, user_id, content, images, parent_id, reply_to_user_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [novelId, userId, sanitizedContent, imagesJson, parentId, replyToUserId]
      );
    } catch (e) {
      if (e && e.code === 'ER_NO_SUCH_TABLE') {
        await ensureCommentTables();
        [result] = await pool.query(
          `INSERT INTO comments (novel_id, user_id, content, images, parent_id, reply_to_user_id, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [novelId, userId, sanitizedContent, imagesJson, parentId, replyToUserId]
        );
      } else {
        throw e;
      }
    }

    // 获取刚插入的评论
    const [newComment] = await pool.query(
      `SELECT 
        c.id, c.content, c.images, c.likes, c.created_at,
        u.id as user_id, u.username, u.avatar
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      code: 201,
      message: '评论成功',
      data: {
        id: newComment[0].id,
        content: newComment[0].content,
        images: newComment[0].images ? JSON.parse(newComment[0].images) : [],
        likes: newComment[0].likes,
        createdAt: newComment[0].created_at,
        user: {
          id: newComment[0].user_id,
          username: newComment[0].username,
          avatar: newComment[0].avatar
        }
      },
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除评论
 * DELETE /api/comments/:commentId
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // 查询评论
    const [comments] = await pool.query(
      'SELECT user_id FROM comments WHERE id = ?',
      [commentId]
    );

    if (comments.length === 0) {
      throw new AppError(
        ErrorCodes.COMMENT_NOT_FOUND,
        getErrorMessage(ErrorCodes.COMMENT_NOT_FOUND)
      );
    }

    // 权限验证：只有评论作者或管理员可以删除
    if (comments[0].user_id !== userId && req.user.role !== 'admin') {
      throw new AppError(
        ErrorCodes.COMMENT_FORBIDDEN,
        '无权删除该评论'
      );
    }

    // 软删除：标记为已删除而不是真正删除
    await pool.query(
      'UPDATE comments SET deleted_at = NOW() WHERE id = ?',
      [commentId]
    );

    res.json({
      code: 200,
      message: '删除成功',
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 点赞评论
 * POST /api/comments/:commentId/like
 */
exports.likeComment = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    await connection.beginTransaction();

    // 检查评论是否存在
    const [comments] = await connection.query(
      'SELECT id FROM comments WHERE id = ?',
      [commentId]
    );

    if (comments.length === 0) {
      throw new AppError(
        ErrorCodes.COMMENT_NOT_FOUND,
        getErrorMessage(ErrorCodes.COMMENT_NOT_FOUND)
      );
    }

    // 检查是否已点赞
    const [likes] = await connection.query(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [userId, commentId]
    );

    if (likes.length > 0) {
      throw new AppError(
        ErrorCodes.COMMENT_ALREADY_LIKED,
        getErrorMessage(ErrorCodes.COMMENT_ALREADY_LIKED)
      );
    }

    // 添加点赞记录
    try {
      await connection.query(
        'INSERT INTO comment_likes (user_id, comment_id, created_at) VALUES (?, ?, NOW())',
        [userId, commentId]
      );
    } catch (e) {
      if (e && e.code === 'ER_NO_SUCH_TABLE') {
        await ensureCommentTables();
        await connection.query(
          'INSERT INTO comment_likes (user_id, comment_id, created_at) VALUES (?, ?, NOW())',
          [userId, commentId]
        );
      } else {
        throw e;
      }
    }

    // 更新评论点赞数
    await connection.query(
      'UPDATE comments SET likes = likes + 1 WHERE id = ?',
      [commentId]
    );

    await connection.commit();

    res.json({
      code: 200,
      message: '点赞成功',
      timestamp: Date.now()
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * 取消点赞评论
 * DELETE /api/comments/:commentId/like
 */
exports.unlikeComment = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    await connection.beginTransaction();

    // 检查是否已点赞
    const [likes] = await connection.query(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [userId, commentId]
    );

    if (likes.length === 0) {
      throw new AppError(
        ErrorCodes.COMMENT_NOT_LIKED,
        getErrorMessage(ErrorCodes.COMMENT_NOT_LIKED)
      );
    }

    // 删除点赞记录
    await connection.query(
      'DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [userId, commentId]
    );

    // 更新评论点赞数
    await connection.query(
      'UPDATE comments SET likes = likes - 1 WHERE id = ?',
      [commentId]
    );

    await connection.commit();

    res.json({
      code: 200,
      message: '取消点赞成功',
      timestamp: Date.now()
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * 获取评论回复列表
 * GET /api/comments/:commentId/replies
 */
exports.getCommentReplies = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    const userId = req.user?.id;

    // 查询回复
    const query = `
      SELECT 
        c.id,
        c.content,
        c.likes,
        c.created_at,
        c.reply_to_user_id,
        u.id as user_id,
        u.username,
        u.avatar,
        ru.username as reply_to_username
        ${userId ? `, (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND user_id = ?) as is_liked` : ''}
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      LEFT JOIN users ru ON c.reply_to_user_id = ru.id
      WHERE c.parent_id = ? AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const queryParams = userId ? [userId, commentId] : [commentId];
    queryParams.push(parseInt(pageSize), offset);

    const [replies] = await pool.query(query, queryParams);

    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM comments WHERE parent_id = ? AND deleted_at IS NULL',
      [commentId]
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: replies.map(reply => ({
          id: reply.id,
          content: reply.content,
          likes: reply.likes,
          isLiked: userId ? reply.is_liked > 0 : false,
          createdAt: reply.created_at,
          user: {
            id: reply.user_id,
            username: reply.username,
            avatar: reply.avatar
          },
          replyTo: reply.reply_to_user_id ? {
            userId: reply.reply_to_user_id,
            username: reply.reply_to_username
          } : null
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / pageSize)
        }
      },
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 发表回复
 * POST /api/comments/:commentId/reply
 */
exports.createReply = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      throw new AppError(
        ErrorCodes.COMMENT_TOO_SHORT,
        getErrorMessage(ErrorCodes.COMMENT_TOO_SHORT)
      );
    }
    if (content.length > 500) {
      throw new AppError(
        ErrorCodes.COMMENT_TOO_LONG,
        getErrorMessage(ErrorCodes.COMMENT_TOO_LONG)
      );
    }

    const sanitizedContent = sanitizeComment(content);

    // 校验父评论并获取所属小说及被回复用户
    const [parents] = await pool.query(
      'SELECT id, novel_id, user_id FROM comments WHERE id = ? LIMIT 1',
      [commentId]
    );
    if (parents.length === 0) {
      throw new AppError(
        ErrorCodes.COMMENT_NOT_FOUND,
        getErrorMessage(ErrorCodes.COMMENT_NOT_FOUND)
      );
    }

    const parent = parents[0];

    // 插入回复
    const [result] = await pool.query(
      `INSERT INTO comments (novel_id, user_id, content, parent_id, reply_to_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [parent.novel_id, userId, sanitizedContent, parent.id, parent.user_id]
    );

    // 返回新回复
    const [rows] = await pool.query(
      `SELECT 
        c.id, c.content, c.likes, c.created_at,
        u.id as user_id, u.username, u.avatar,
        ru.username as reply_to_username
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       LEFT JOIN users ru ON c.reply_to_user_id = ru.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    const r = rows[0];
    res.status(201).json({
      code: 201,
      message: '回复成功',
      data: {
        id: r.id,
        content: r.content,
        likes: r.likes,
        createdAt: r.created_at,
        user: { id: r.user_id, username: r.username, avatar: r.avatar },
        replyTo: r.reply_to_username ? { username: r.reply_to_username } : null
      },
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
};

