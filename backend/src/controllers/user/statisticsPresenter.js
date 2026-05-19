function formatUserStatistics({
  joinDays,
  bookshelfStats,
  timeStats,
  favoriteCategory,
  streakResult,
  trendData,
  chapterStats
}) {
  const bookshelf = bookshelfStats[0] || {};
  const readTime = timeStats[0] || {};
  const favorite = favoriteCategory[0] || null;
  const streak = streakResult[0] || {};
  const chapters = chapterStats[0] || {};

  return {
    joinDays,
    bookshelf: {
      total: bookshelf.total_books || 0,
      reading: bookshelf.reading_books || 0,
      finished: bookshelf.finished_books || 0,
      collected: bookshelf.collected_books || 0
    },
    readTime: {
      total: readTime.total_read_time || 0,
      today: readTime.today_read_time || 0,
      weekly: readTime.weekly_read_time || 0,
      monthly: readTime.monthly_read_time || 0
    },
    reading: {
      totalNovels: chapters.total_novels_read || 0,
      totalChapters: chapters.total_chapters || 0,
      readingStreak: streak.reading_streak || 0
    },
    favoriteCategory: favorite ? {
      id: favorite.id,
      name: favorite.name,
      count: favorite.count
    } : null,
    readingTrend: trendData.map(item => ({
      date: item.date,
      novelsRead: item.novels_read,
      chaptersRead: item.chapters_read,
      count: item.chapters_read,
      readTime: item.read_time || 0
    }))
  };
}

module.exports = {
  formatUserStatistics
};
