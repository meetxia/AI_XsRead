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
}

module.exports = DashboardController;

