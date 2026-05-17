const { pool } = require('../config/database');

const achievementRules = [
  { code: 'chapters_10', name: '初出茅庐', description: '阅读10个章节', type: 'chapters', threshold: 10, icon: 'book' },
  { code: 'chapters_100', name: '勤奋读者', description: '阅读100个章节', type: 'chapters', threshold: 100, icon: 'books' },
  { code: 'novels_5', name: '书友新手', description: '阅读5本小说', type: 'novels', threshold: 5, icon: 'seedling' },
  { code: 'novels_20', name: '阅读爱好者', description: '阅读20本小说', type: 'novels', threshold: 20, icon: 'star' },
  { code: 'finished_1', name: '善始善终', description: '完成1本小说', type: 'finished', threshold: 1, icon: 'check' },
  { code: 'time_60', name: '一小时', description: '累计阅读1小时', type: 'time', threshold: 60, icon: 'clock' },
  { code: 'time_600', name: '十小时', description: '累计阅读10小时', type: 'time', threshold: 600, icon: 'timer' },
  { code: 'streak_7', name: '七日之约', description: '近30天内阅读7天', type: 'streak', threshold: 7, icon: 'calendar' }
];

async function evaluate(userId) {
  const [statsRows] = await pool.query(
    `SELECT
       (SELECT COUNT(DISTINCT chapter_id) FROM reading_history WHERE user_id = ?) AS total_chapters,
       (SELECT COUNT(DISTINCT novel_id) FROM reading_history WHERE user_id = ?) AS total_novels,
       (SELECT COUNT(*) FROM bookshelf WHERE user_id = ? AND type = 'finished') AS finished_novels,
       (SELECT COALESCE(SUM(duration), 0) FROM reading_history WHERE user_id = ?) AS total_read_time,
       (SELECT COUNT(DISTINCT DATE(read_time)) FROM reading_history WHERE user_id = ? AND read_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS reading_days`,
    [userId, userId, userId, userId, userId]
  );
  const stats = statsRows[0] || {};

  const achievements = achievementRules.map(rule => {
    let currentValue = 0;
    if (rule.type === 'chapters') currentValue = Number(stats.total_chapters || 0);
    if (rule.type === 'novels') currentValue = Number(stats.total_novels || 0);
    if (rule.type === 'finished') currentValue = Number(stats.finished_novels || 0);
    if (rule.type === 'time') currentValue = Math.floor(Number(stats.total_read_time || 0) / 60);
    if (rule.type === 'streak') currentValue = Number(stats.reading_days || 0);

    const unlocked = currentValue >= rule.threshold;
    return {
      ...rule,
      id: rule.code,
      currentValue,
      progress: Math.min(Math.round((currentValue / rule.threshold) * 100), 100),
      target: rule.threshold,
      unlocked,
      unlockedAt: unlocked ? new Date() : null,
      category: rule.type === 'chapters' ? 'reading'
        : ['novels', 'finished'].includes(rule.type) ? 'bookshelf'
          : rule.type === 'streak' ? 'habit' : 'milestone'
    };
  });

  const unlockedCount = achievements.filter(item => item.unlocked).length;
  return {
    totalAchievements: achievements.length,
    unlockedAchievements: unlockedCount,
    summary: {
      unlocked: unlockedCount,
      total: achievements.length,
      percentage: Math.round((unlockedCount / achievements.length) * 100) || 0
    },
    achievements
  };
}

module.exports = {
  achievementRules,
  evaluate
};
