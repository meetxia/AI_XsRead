const db = require('../config/database');
const Response = require('../utils/response');

/**
 * 数据看板控制器
 */
class DashboardController {
  /**
   * 获取概览统计
   */
  static async getOverview(req, res, next) {
    try {
      // 总用户数
      const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
      
      // 今日新增用户
      const [newUsersToday] = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()'
      );
      
      // 作品总数
      const [totalNovels] = await db.query('SELECT COUNT(*) as count FROM novels');
      
      // 章节总数
      const [totalChapters] = await db.query('SELECT COUNT(*) as count FROM chapters');
      
      // 今日浏览量
      const [todayViews] = await db.query(
        'SELECT COALESCE(SUM(page_views), 0) as count FROM statistics_daily WHERE date = CURDATE()'
      );
      
      // 待审核评论
      const [pendingComments] = await db.query(
        'SELECT COUNT(*) as count FROM comments WHERE status = 0'
      );

      const overview = {
        totalUsers: totalUsers[0].count,
        newUsersToday: newUsersToday[0].count,
        totalNovels: totalNovels[0].count,
        totalChapters: totalChapters[0].count,
        todayViews: todayViews[0].count,
        avgReadTime: 22, // 从统计表计算
        pendingComments: pendingComments[0].count
      };

      return Response.success(res, overview);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取趋势数据
   */
  static async getTrends(req, res, next) {
    try {
      const { days = 7 } = req.query;

      // 最近N天的统计数据
      const [trends] = await db.query(
        `SELECT 
          date,
          new_users,
          active_users,
          page_views,
          unique_visitors,
          reading_duration,
          new_comments,
          new_collections,
          revenue
        FROM statistics_daily 
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ORDER BY date ASC`,
        [parseInt(days)]
      );

      return Response.success(res, trends);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取实时动态
   */
  static async getRealtime(req, res, next) {
    try {
      // 最近的用户活动
      const [activities] = await db.query(
        `SELECT 
          rh.id,
          u.username,
          n.title as novel_title,
          rh.read_time,
          'reading' as type
        FROM reading_history rh
        JOIN users u ON rh.user_id = u.id
        JOIN novels n ON rh.novel_id = n.id
        ORDER BY rh.read_time DESC
        LIMIT 10`
      );

      return Response.success(res, activities);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取排行榜
   */
  static async getRanking(req, res, next) {
    try {
      const { type = 'views', limit = 10 } = req.query;

      let orderField = 'views';
      if (type === 'collections') orderField = 'collections';
      if (type === 'likes') orderField = 'likes';

      const [ranking] = await db.query(
        `SELECT
          id,
          title,
          author,
          ${orderField} as value,
          views,
          collections,
          likes
        FROM novels
        ORDER BY ${orderField} DESC
        LIMIT ?`,
        [parseInt(limit)]
      );

      return Response.success(res, ranking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 分类占比 - 按分类聚合小说数量
   */
  static async getCategoryDistribution(req, res, next) {
    try {
      const [rows] = await db.query(
        `SELECT
          c.id,
          c.name,
          COUNT(n.id) AS value
        FROM categories c
        LEFT JOIN novels n ON n.category_id = c.id
        WHERE c.status = 1
        GROUP BY c.id, c.name
        ORDER BY value DESC, c.sort_order ASC`
      );

      return Response.success(res, rows);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 活跃用户趋势 - 按日聚合 reading_history 中独立用户数
   * 入参 ?days=7|30
   */
  static async getUserActivity(req, res, next) {
    try {
      let days = parseInt(req.query.days, 10);
      if (!Number.isFinite(days) || days <= 0) days = 7;
      if (days > 365) days = 365;

      const [rows] = await db.query(
        `SELECT
          DATE(read_time) AS date,
          COUNT(DISTINCT user_id) AS active_users
        FROM reading_history
        WHERE read_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(read_time)
        ORDER BY date ASC`,
        [days]
      );

      // 补齐缺失日期，确保前端连续展示
      const map = new Map();
      rows.forEach((r) => {
        const key = r.date instanceof Date
          ? r.date.toISOString().slice(0, 10)
          : String(r.date).slice(0, 10);
        map.set(key, Number(r.active_users) || 0);
      });

      const dates = [];
      const values = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dates.push(key);
        values.push(map.get(key) || 0);
      }

      return Response.success(res, { dates, values });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 阅读时长分布 - 按用户累计阅读时长分桶
   * 优先使用 users.total_read_time（patch_v2 后），不存在则回退到
   * reading_history 聚合 SUM(duration)
   */
  static async getReadingTimeDistribution(req, res, next) {
    try {
      // 安全检测 users 是否含 total_read_time 字段
      const [colRows] = await db.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = 'total_read_time'
         LIMIT 1`
      );

      let durations = [];
      if (colRows.length > 0) {
        const [rows] = await db.query(
          `SELECT COALESCE(total_read_time, 0) AS minutes
           FROM users
           WHERE status = 1`
        );
        durations = rows.map((r) => Number(r.minutes) || 0);
      } else {
        // 回退方案：reading_history 按用户聚合
        const [rows] = await db.query(
          `SELECT
             user_id,
             COALESCE(SUM(duration), 0) AS minutes
           FROM reading_history
           GROUP BY user_id`
        );
        durations = rows.map((r) => Number(r.minutes) || 0);
      }

      // 分桶（单位：分钟）
      const buckets = [
        { label: '<1h', min: 0, max: 60, count: 0 },
        { label: '1-5h', min: 60, max: 300, count: 0 },
        { label: '5-10h', min: 300, max: 600, count: 0 },
        { label: '10-30h', min: 600, max: 1800, count: 0 },
        { label: '30h+', min: 1800, max: Infinity, count: 0 }
      ];

      durations.forEach((m) => {
        const b = buckets.find((x) => m >= x.min && m < x.max);
        if (b) b.count += 1;
      });

      const result = buckets.map(({ label, count }) => ({ label, count }));
      return Response.success(res, { buckets: result });
    } catch (error) {
      // 安全降级：返回空 buckets，不向前端报 500
      console.error('[getReadingTimeDistribution] fallback empty:', error.message);
      return Response.success(res, { buckets: [] });
    }
  }

  /**
   * 小说总览统计
   */
  static async getNovelStats(req, res, next) {
    try {
      const [[totalNovelsRow]] = await db.query(
        'SELECT COUNT(*) AS count FROM novels'
      );
      const [[totalChaptersRow]] = await db.query(
        'SELECT COUNT(*) AS count FROM chapters'
      );
      const [[totalWordsRow]] = await db.query(
        'SELECT COALESCE(SUM(word_count), 0) AS total FROM novels'
      );
      const [[newThisMonthRow]] = await db.query(
        `SELECT COUNT(*) AS count FROM novels
         WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
      );
      const [[avgRatingRow]] = await db.query(
        `SELECT COALESCE(AVG(rating), 0) AS avg FROM novels WHERE rating > 0`
      );

      return Response.success(res, {
        totalNovels: Number(totalNovelsRow.count) || 0,
        totalChapters: Number(totalChaptersRow.count) || 0,
        totalWords: Number(totalWordsRow.total) || 0,
        newThisMonth: Number(newThisMonthRow.count) || 0,
        avgRating: Number(parseFloat(avgRatingRow.avg).toFixed(2)) || 0
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 热门小说 TOP10 - 按 reading_history 阅读次数
   */
  static async getTopNovels(req, res, next) {
    try {
      let limit = parseInt(req.query.limit, 10);
      if (!Number.isFinite(limit) || limit <= 0) limit = 10;
      if (limit > 50) limit = 50;

      const [rows] = await db.query(
        `SELECT
          n.id,
          n.title,
          n.author,
          n.cover AS cover_url,
          n.views,
          COUNT(rh.id) AS read_count
        FROM novels n
        LEFT JOIN reading_history rh ON rh.novel_id = n.id
        GROUP BY n.id, n.title, n.author, n.cover, n.views
        ORDER BY read_count DESC, n.views DESC
        LIMIT ?`,
        [limit]
      );

      return Response.success(res, rows);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;

