const db = require('../config/database');
const Response = require('../utils/response');

const CATEGORY_MAP = {
  101: { name: '都市言情', keywords: ['总裁', '豪门', '婚姻', '恋爱', '暧昧', '前任', '闪婚', '未婚夫', '男朋友', '室友'] },
  102: { name: '古风穿越', keywords: ['穿越', '重生', '古风', '宫廷', '王爷', '嫡女', '皇上', '太子'] },
  103: { name: '玄幻修仙', keywords: ['修真', '仙侠', '玄幻', '灵气', '大佬', '师兄', '师妹', '尾巴'] },
  104: { name: '悬疑推理', keywords: ['悬疑', '推理', '真相', '谜团', '杀手', '死亡', '监控', '双胞胎'] },
  105: { name: '科幻未来', keywords: ['科幻', '星际', '未来', '机甲', '游戏', '测试', '虚拟'] },
  106: { name: '青春校园', keywords: ['校园', '青春', '同桌', '学长', '学妹'] }
};

function normalizeTxtFilename(filename) {
  const raw = String(filename || '');
  if (!/[ÃÂÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßà-ÿ]/.test(raw)) {
    return raw;
  }
  const restored = Buffer.from(raw, 'latin1').toString('utf8');
  if (restored.includes('\uFFFD')) return raw;
  return /[\u4e00-\u9fff]/.test(restored) ? restored : raw;
}

function getCategoryId(title) {
  for (const [categoryId, info] of Object.entries(CATEGORY_MAP)) {
    if (info.keywords.some((keyword) => title.includes(keyword))) {
      return Number(categoryId);
    }
  }
  return 101;
}

function generateAuthorName() {
  const prefixes = ['温柔', '墨染', '清风', '流年', '浅笑', '梦回', '烟雨', '星辰'];
  const suffixes = ['笔触', '明月', '如歌', '依依', '未央', '浅浅', '微凉'];
  return prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)];
}

function parseTxtBuffer(file) {
  const filename = normalizeTxtFilename(file.originalname);
  const title = filename.replace(/\.txt$/i, '').trim();
  let content = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
  content = content.replace(/\r\n/g, '\n').trim();
  const wordCount = content.replace(/\s/g, '').length;
  const paragraphs = content.split('\n\n').filter((p) => p.trim());
  const intro = paragraphs.find((p) => p.length > 50) || paragraphs[0] || content;
  let description = intro.substring(0, 200).replace(/\n/g, ' ').trim();
  if (description.length >= 200) description += '...';

  return {
    filename,
    title,
    author: generateAuthorName(),
    content,
    wordCount,
    description,
    categoryId: getCategoryId(title)
  };
}

function validateTxtNovel(novelData) {
  const errors = [];
  if (!novelData.title || novelData.title.length < 2) errors.push('标题太短，至少需要2个字符');
  if (novelData.title.length > 100) errors.push('标题太长，最多100个字符');
  if (!novelData.content || novelData.content.length < 100) errors.push('内容太短，至少需要100个字符');
  if (novelData.wordCount < 500) errors.push('字数太少，建议至少500字');
  if (novelData.wordCount > 1000000) errors.push('字数太多，超长小说建议分章节上传');
  return { valid: errors.length === 0, errors };
}

async function insertAdminNovelWithChapter(connection, novelData, adminUser) {
  const [novelResult] = await connection.query(
    `INSERT INTO novels (
      title, author, author_id, category_id, description,
      word_count, chapter_count, status, views, likes, collections,
      rating, rating_count, is_recommended, is_hot,
      last_chapter_title, last_update_time, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0, 0, 0, 0, 0, 0, 0, '正文', NOW(), NOW())`,
    [
      novelData.title,
      novelData.author,
      adminUser.id,
      novelData.categoryId,
      novelData.description,
      novelData.wordCount
    ]
  );

  const novelId = novelResult.insertId;

  await connection.query(
    `INSERT INTO chapters (
      novel_id, chapter_number, title, content, word_count, is_free, status, publish_time
    ) VALUES (?, 1, '正文', ?, ?, 1, 1, NOW())`,
    [novelId, novelData.content, novelData.wordCount]
  );

  await connection.query(
    `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
     VALUES (?, ?, 'batch_upload_txt', 'novel', ?, ?)`,
    [adminUser.id, adminUser.username, novelId, `批量上传TXT小说: ${novelData.title}`]
  );

  return novelId;
}

async function importAdminTxtNovelFile(file, adminUser, options = {}) {
  const seenTitles = options.seenTitles || null;
  const novelData = parseTxtBuffer(file);

  const validation = validateTxtNovel(novelData);
  if (!validation.valid) {
    return {
      status: 'failed',
      filename: novelData.filename,
      title: novelData.title,
      reason: validation.errors.join('; ')
    };
  }

  if (seenTitles && seenTitles.has(novelData.title)) {
    return {
      status: 'failed',
      filename: novelData.filename,
      title: novelData.title,
      reason: '同批次中已存在同名小说'
    };
  }

  const [existing] = await db.query('SELECT id FROM novels WHERE title = ?', [novelData.title]);
  if (existing.length > 0) {
    return {
      status: 'exists',
      filename: novelData.filename,
      title: novelData.title,
      novelId: existing[0].id
    };
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const novelId = await insertAdminNovelWithChapter(connection, novelData, adminUser);
    await connection.commit();
    if (seenTitles) seenTitles.add(novelData.title);

    return {
      status: 'success',
      filename: novelData.filename,
      novelId,
      title: novelData.title,
      wordCount: novelData.wordCount,
      categoryId: novelData.categoryId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const ALLOWED_SORTS = new Set([
  'last_update_time',
  'created_at',
  'updated_at',
  'views',
  'likes',
  'collections',
  'rating',
  'word_count'
]);

/**
 * 小说管理控制器
 */
class NovelController {
  /**
   * 获取小说列表
   */
  static async getList(req, res, next) {
    try {
      const {
        page = 1,
        pageSize = 20,
        category,
        status,
        keyword,
        sort = 'last_update_time'
      } = req.query;

      const sortField = ALLOWED_SORTS.has(String(sort)) ? sort : 'last_update_time';

      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      
      // 构建查询条件
      let whereClause = '1=1';
      const params = [];

      if (category) {
        whereClause += ' AND n.category_id = ?';
        params.push(category);
      }

      if (status !== undefined && status !== '') {
        whereClause += ' AND n.status = ?';
        params.push(parseInt(status));
      }

      if (keyword) {
        whereClause += ' AND (n.title LIKE ? OR n.author LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      // 获取总数
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM novels n WHERE ${whereClause}`,
        params
      );

      const total = countResult[0].total;

      // 获取列表数据
      const [novels] = await db.query(
        `SELECT 
          n.*,
          c.name as category
        FROM novels n
        LEFT JOIN categories c ON n.category_id = c.id
        WHERE ${whereClause}
        ORDER BY n.${sortField} DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );

      return Response.page(res, novels, total, parseInt(page), parseInt(pageSize));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取分类列表
   */
  static async getCategories(req, res, next) {
    try {
      const [categories] = await db.query(
        `SELECT
          id, name, description, sort_order
         FROM categories
         ORDER BY sort_order ASC, id ASC`
      );

      return Response.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 管理后台批量上传 TXT 小说
   */
  static async batchUploadTxt(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return Response.error(res, '请选择要上传的TXT文件', 400);
      }

      const seenTitles = new Set();
      const results = {
        success: [],
        failed: [],
        exists: []
      };

      for (const file of req.files) {
        try {
          const result = await importAdminTxtNovelFile(file, req.user, { seenTitles });
          if (result.status === 'success') {
            results.success.push({
              filename: result.filename,
              novelId: result.novelId,
              title: result.title,
              wordCount: result.wordCount,
              categoryId: result.categoryId
            });
          } else if (result.status === 'exists') {
            results.exists.push({
              filename: result.filename,
              title: result.title,
              novelId: result.novelId
            });
          } else {
            results.failed.push({
              filename: result.filename,
              title: result.title,
              reason: result.reason
            });
          }
        } catch (error) {
          results.failed.push({
            filename: normalizeTxtFilename(file.originalname),
            reason: error.message || '导入失败'
          });
        }
      }

      return Response.success(res, {
        total: req.files.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        existsCount: results.exists.length,
        details: results
      }, '批量上传完成');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取小说详情
   */
  static async getDetail(req, res, next) {
    try {
      const { id } = req.params;

      const [novels] = await db.query(
        `SELECT 
          n.*,
          c.name as category
        FROM novels n
        LEFT JOIN categories c ON n.category_id = c.id
        WHERE n.id = ?`,
        [id]
      );

      if (novels.length === 0) {
        return Response.error(res, '小说不存在', 404);
      }

      // 获取标签
      const [tags] = await db.query(
        `SELECT t.name 
        FROM novel_tags nt
        JOIN tags t ON nt.tag_id = t.id
        WHERE nt.novel_id = ?`,
        [id]
      );

      const novel = novels[0];
      novel.tags = tags.map(t => t.name);

      return Response.success(res, novel);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建小说
   */
  static async create(req, res, next) {
    try {
      const {
        title,
        author,
        categoryId,
        cover,
        description,
        tags = [],
        status = 1,
        isRecommended = 0,
        isHot = 0,
        isVip = 0
      } = req.body;

      // 验证必填字段
      if (!title || !categoryId || !description) {
        return Response.error(res, '标题、分类和简介不能为空', 400);
      }

      // 插入小说
      const [result] = await db.query(
        `INSERT INTO novels (
          title, author, category_id, cover, description,
          status, is_recommended, is_hot, is_vip, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [title, author || '佚名', categoryId, cover, description, status, isRecommended, isHot, isVip]
      );

      const novelId = result.insertId;

      // 处理标签
      if (tags.length > 0) {
        for (const tagName of tags) {
          // 查找或创建标签
          let [tagResult] = await db.query('SELECT id FROM tags WHERE name = ?', [tagName]);
          
          let tagId;
          if (tagResult.length === 0) {
            const [newTag] = await db.query('INSERT INTO tags (name) VALUES (?)', [tagName]);
            tagId = newTag.insertId;
          } else {
            tagId = tagResult[0].id;
          }

          // 关联小说和标签
          await db.query(
            'INSERT INTO novel_tags (novel_id, tag_id) VALUES (?, ?)',
            [novelId, tagId]
          );
        }
      }

      // 记录操作日志
      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
         VALUES (?, ?, 'create', 'novel', ?, ?)`,
        [req.user.id, req.user.username, novelId, `创建小说: ${title}`]
      );

      return Response.success(res, { id: novelId }, '创建成功', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新小说
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        title,
        categoryId,
        cover,
        description,
        tags = [],
        status,
        isRecommended,
        isHot,
        isVip
      } = req.body;

      // 检查小说是否存在
      const [novels] = await db.query('SELECT * FROM novels WHERE id = ?', [id]);
      
      if (novels.length === 0) {
        return Response.error(res, '小说不存在', 404);
      }

      // 更新小说
      await db.query(
        `UPDATE novels SET
          title = COALESCE(?, title),
          category_id = COALESCE(?, category_id),
          cover = COALESCE(?, cover),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          is_recommended = COALESCE(?, is_recommended),
          is_hot = COALESCE(?, is_hot),
          is_vip = COALESCE(?, is_vip),
          updated_at = NOW()
        WHERE id = ?`,
        [title, categoryId, cover, description, status, isRecommended, isHot, isVip, id]
      );

      // 更新标签
      if (tags.length > 0) {
        // 删除旧标签关联
        await db.query('DELETE FROM novel_tags WHERE novel_id = ?', [id]);

        // 添加新标签
        for (const tagName of tags) {
          let [tagResult] = await db.query('SELECT id FROM tags WHERE name = ?', [tagName]);
          
          let tagId;
          if (tagResult.length === 0) {
            const [newTag] = await db.query('INSERT INTO tags (name) VALUES (?)', [tagName]);
            tagId = newTag.insertId;
          } else {
            tagId = tagResult[0].id;
          }

          await db.query(
            'INSERT INTO novel_tags (novel_id, tag_id) VALUES (?, ?)',
            [id, tagId]
          );
        }
      }

      // 记录操作日志
      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
         VALUES (?, ?, 'update', 'novel', ?, ?)`,
        [req.user.id, req.user.username, id, `更新小说: ${title || novels[0].title}`]
      );

      return Response.success(res, null, '更新成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除小说
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      // 检查小说是否存在
      const [novels] = await db.query('SELECT title FROM novels WHERE id = ?', [id]);
      
      if (novels.length === 0) {
        return Response.error(res, '小说不存在', 404);
      }

      // 删除小说（会级联删除章节、标签关联等）
      await db.query('DELETE FROM novels WHERE id = ?', [id]);

      // 记录操作日志
      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
         VALUES (?, ?, 'delete', 'novel', ?, ?)`,
        [req.user.id, req.user.username, id, `删除小说: ${novels[0].title}`]
      );

      return Response.success(res, null, '删除成功', 204);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取小说统计数据
   */
  static async getStatistics(req, res, next) {
    try {
      const { id } = req.params;

      const [novels] = await db.query(
        `SELECT 
          views,
          likes,
          collections,
          comments,
          rating,
          rating_count
        FROM novels WHERE id = ?`,
        [id]
      );

      if (novels.length === 0) {
        return Response.error(res, '小说不存在', 404);
      }

      return Response.success(res, novels[0]);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量切换 VIP 状态
   * POST /api/admin/novels/set-vip
   * body: { ids: [1,2,3], is_vip: 0|1 }
   */
  static async setVip(req, res, next) {
    try {
      const { ids, is_vip } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return Response.error(res, 'ids 不能为空', 400);
      }
      const novelIds = ids
        .map((x) => parseInt(x, 10))
        .filter((x) => Number.isInteger(x) && x > 0);
      if (novelIds.length === 0) {
        return Response.error(res, 'ids 中没有合法 ID', 400);
      }
      const flag = is_vip === 1 || is_vip === '1' || is_vip === true ? 1 : 0;

      const [result] = await db.query(
        'UPDATE novels SET is_vip = ? WHERE id IN (?)',
        [flag, novelIds]
      );

      // 写会员相关审计日志
      await db.query(
        `INSERT INTO code_admin_logs (admin_id, action, target, detail, ip)
         VALUES (?, 'set_novel_vip', ?, ?, ?)`,
        [
          req.user.id,
          `novels:[${novelIds.join(',')}]`,
          JSON.stringify({ is_vip: flag, count: novelIds.length }),
          req.ip || null
        ]
      );

      return Response.success(res, {
        affected_rows: result.affectedRows,
        ids: novelIds,
        is_vip: flag
      }, '更新成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/novels/set-vip
   * 批量设置 / 取消整本 VIP
   * Body: { ids: number[], is_vip: 0|1 }
   */
  static async setVip(req, res, next) {
    try {
      const { ids, is_vip: isVipRaw } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return Response.error(res, 'ids 必须为非空数组', 400);
      }
      const cleanIds = ids
        .map((x) => Number(x))
        .filter((x) => Number.isInteger(x) && x > 0);
      if (cleanIds.length === 0) {
        return Response.error(res, 'ids 中没有合法 ID', 400);
      }
      const isVip = Number(isVipRaw) === 1 ? 1 : 0;

      const placeholders = cleanIds.map(() => '?').join(',');
      const [updateResult] = await db.query(
        `UPDATE novels SET is_vip = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
        [isVip, ...cleanIds]
      );

      // 写日志（用 code_admin_logs 与会员/激活码体系共用）
      try {
        const conn = await db.getConnection();
        try {
          await conn.query(
            `INSERT INTO code_admin_logs (admin_id, action, target, detail, ip, created_at)
             VALUES (?, 'set_novel_vip', ?, ?, ?, NOW())`,
            [
              req.user.id,
              `novels:${cleanIds.join(',')}`,
              JSON.stringify({ is_vip: isVip, count: cleanIds.length, affected: updateResult.affectedRows }),
              req.ip || null
            ]
          );
        } finally {
          conn.release();
        }
      } catch (_) { /* ignore log failure */ }

      return Response.success(
        res,
        { is_vip: isVip, count: updateResult.affectedRows },
        isVip ? '已标记为 VIP' : '已取消 VIP 标记'
      );
    } catch (error) {
      next(error);
    }
  }
}

NovelController.__test__ = {
  normalizeTxtFilename,
  parseTxtBuffer,
  validateTxtNovel,
  importAdminTxtNovelFile,
  insertAdminNovelWithChapter
};

module.exports = NovelController;
