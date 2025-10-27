const db = require('../config/database');
const Response = require('../utils/response');

/**
 * 章节管理控制器
 */
class ChapterController {
  /**
   * 获取章节列表
   */
  static async getList(req, res, next) {
    try {
      const {
        page = 1,
        pageSize = 50,
        novelId,
        status
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      
      let whereClause = '1=1';
      const params = [];

      if (novelId) {
        whereClause += ' AND c.novel_id = ?';
        params.push(novelId);
      }

      if (status !== undefined && status !== '') {
        whereClause += ' AND c.status = ?';
        params.push(parseInt(status));
      }

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM chapters c WHERE ${whereClause}`,
        params
      );

      const total = countResult[0].total;

      const [chapters] = await db.query(
        `SELECT 
          c.*,
          n.title as novel_title
        FROM chapters c
        LEFT JOIN novels n ON c.novel_id = n.id
        WHERE ${whereClause}
        ORDER BY c.novel_id, c.chapter_number DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );

      return Response.page(res, chapters, total, parseInt(page), parseInt(pageSize));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取章节详情
   */
  static async getDetail(req, res, next) {
    try {
      const { id } = req.params;

      const [chapters] = await db.query(
        `SELECT 
          c.*,
          n.title as novel_title
        FROM chapters c
        LEFT JOIN novels n ON c.novel_id = n.id
        WHERE c.id = ?`,
        [id]
      );

      if (chapters.length === 0) {
        return Response.error(res, '章节不存在', 404);
      }

      return Response.success(res, chapters[0]);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建章节
   */
  static async create(req, res, next) {
    try {
      const {
        novelId,
        chapterNumber,
        title,
        content,
        isFree = 1,
        price = 0,
        status = 1,
        publishTime
      } = req.body;

      if (!novelId || !title || !content) {
        return Response.error(res, '小说ID、标题和内容不能为空', 400);
      }

      // 计算字数
      const wordCount = content.length;

      // 插入章节
      const [result] = await db.query(
        `INSERT INTO chapters (
          novel_id, chapter_number, title, content, word_count,
          is_free, price, status, publish_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          novelId,
          chapterNumber || 1,
          title,
          content,
          wordCount,
          isFree,
          price,
          status,
          publishTime || new Date()
        ]
      );

      // 更新小说的章节数和字数
      await db.query(
        `UPDATE novels SET
          chapter_count = chapter_count + 1,
          word_count = word_count + ?,
          last_chapter_title = ?,
          last_update_time = NOW()
        WHERE id = ?`,
        [wordCount, title, novelId]
      );

      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
         VALUES (?, ?, 'create', 'chapter', ?, ?)`,
        [req.user.id, req.user.username, result.insertId, `创建章节: ${title}`]
      );

      return Response.success(res, { id: result.insertId }, '创建成功', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新章节
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { title, content, isFree, price, status, publishTime } = req.body;

      const [chapters] = await db.query('SELECT * FROM chapters WHERE id = ?', [id]);
      
      if (chapters.length === 0) {
        return Response.error(res, '章节不存在', 404);
      }

      const oldWordCount = chapters[0].word_count;
      const newWordCount = content ? content.length : oldWordCount;
      const wordCountDiff = newWordCount - oldWordCount;

      await db.query(
        `UPDATE chapters SET
          title = COALESCE(?, title),
          content = COALESCE(?, content),
          word_count = ?,
          is_free = COALESCE(?, is_free),
          price = COALESCE(?, price),
          status = COALESCE(?, status),
          publish_time = COALESCE(?, publish_time)
        WHERE id = ?`,
        [title, content, newWordCount, isFree, price, status, publishTime, id]
      );

      // 更新小说统计
      if (content) {
        await db.query(
          `UPDATE novels SET
            word_count = word_count + ?,
            last_update_time = NOW()
          WHERE id = ?`,
          [wordCountDiff, chapters[0].novel_id]
        );
      }

      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
         VALUES (?, ?, 'update', 'chapter', ?, ?)`,
        [req.user.id, req.user.username, id, `更新章节: ${title || chapters[0].title}`]
      );

      return Response.success(res, null, '更新成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除章节
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const [chapters] = await db.query('SELECT * FROM chapters WHERE id = ?', [id]);
      
      if (chapters.length === 0) {
        return Response.error(res, '章节不存在', 404);
      }

      await db.query('DELETE FROM chapters WHERE id = ?', [id]);

      // 更新小说统计
      await db.query(
        `UPDATE novels SET
          chapter_count = chapter_count - 1,
          word_count = word_count - ?
        WHERE id = ?`,
        [chapters[0].word_count, chapters[0].novel_id]
      );

      await db.query(
        `INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
         VALUES (?, ?, 'delete', 'chapter', ?, ?)`,
        [req.user.id, req.user.username, id, `删除章节: ${chapters[0].title}`]
      );

      return Response.success(res, null, '删除成功', 204);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ChapterController;

