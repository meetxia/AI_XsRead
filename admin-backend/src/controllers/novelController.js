const db = require('../config/database');
const Response = require('../utils/response');

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
        ORDER BY n.${sort} DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );

      return Response.page(res, novels, total, parseInt(page), parseInt(pageSize));
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
}

module.exports = NovelController;

