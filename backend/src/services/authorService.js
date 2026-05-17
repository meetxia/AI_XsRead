const { pool } = require('../config/database');
const { hasTable } = require('../utils/schemaCompat');

function positiveInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function getAuthor(authorId, userId = null) {
  const id = positiveInt(authorId);
  const [stats] = await pool.query(
    `SELECT
       COUNT(*) AS worksCount,
       COALESCE(SUM(word_count), 0) AS totalWords,
       ROUND(AVG(rating), 2) AS averageRating,
       MAX(COALESCE(last_update_time, updated_at)) AS latestUpdateAt
     FROM novels
     WHERE author_id = ?`,
    [id]
  );
  const [one] = await pool.query(
    `SELECT author AS name, MIN(cover) AS avatar
     FROM novels
     WHERE author_id = ?
     GROUP BY author
     LIMIT 1`,
    [id]
  );

  if (one.length === 0) {
    const error = new Error('作者不存在或无作品');
    error.httpStatus = 404;
    throw error;
  }

  let isFollowing = false;
  let followerCount = 0;
  if (await hasTable('user_follow_authors')) {
    const [followers] = await pool.query(
      'SELECT COUNT(*) AS total FROM user_follow_authors WHERE author_id = ?',
      [id]
    );
    followerCount = Number(followers[0]?.total || 0);

    if (userId) {
      const [mine] = await pool.query(
        'SELECT id FROM user_follow_authors WHERE user_id = ? AND author_id = ? LIMIT 1',
        [userId, id]
      );
      isFollowing = mine.length > 0;
    }
  }

  return {
    id,
    name: one[0].name || '未知作者',
    avatar: one[0].avatar || '',
    worksCount: Number(stats[0]?.worksCount || 0),
    totalWords: Number(stats[0]?.totalWords || 0),
    averageRating: Number(stats[0]?.averageRating || 0),
    latestUpdateAt: stats[0]?.latestUpdateAt || null,
    isFollowing,
    followerCount
  };
}

async function listAuthorNovels(authorId, options = {}) {
  const page = positiveInt(options.page, 1);
  const pageSize = Math.min(positiveInt(options.pageSize, 20), 100);
  const offset = (page - 1) * pageSize;
  const params = [positiveInt(authorId)];
  let where = 'WHERE author_id = ?';

  if (options.exclude) {
    where += ' AND id <> ?';
    params.push(positiveInt(options.exclude));
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM novels ${where}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);
  const [rows] = await pool.query(
    `SELECT id, title, author, cover, description, word_count, rating,
       views, likes, collections, last_update_time, updated_at
     FROM novels
     ${where}
     ORDER BY COALESCE(last_update_time, updated_at) DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    list: rows,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
}

async function followAuthor(userId, authorId) {
  if (!(await hasTable('user_follow_authors'))) {
    const error = new Error('关注作者功能尚未启用');
    error.httpStatus = 404;
    throw error;
  }

  await pool.query(
    `INSERT IGNORE INTO user_follow_authors (user_id, author_id, created_at)
     VALUES (?, ?, NOW())`,
    [userId, positiveInt(authorId)]
  );
  return { isFollowing: true };
}

async function unfollowAuthor(userId, authorId) {
  if (!(await hasTable('user_follow_authors'))) {
    return { isFollowing: false };
  }

  await pool.query(
    'DELETE FROM user_follow_authors WHERE user_id = ? AND author_id = ?',
    [userId, positiveInt(authorId)]
  );
  return { isFollowing: false };
}

async function listFollowingAuthors(userId, options = {}) {
  if (!(await hasTable('user_follow_authors'))) {
    return { list: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
  }

  const page = positiveInt(options.page, 1);
  const pageSize = Math.min(positiveInt(options.pageSize, 10), 100);
  const offset = (page - 1) * pageSize;

  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS total FROM user_follow_authors WHERE user_id = ?',
    [userId]
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.query(
    `SELECT
       ufa.author_id AS id,
       ufa.created_at AS followed_at,
       a.name,
       a.avatar,
       a.latest_work_id,
       a.latest_work_title,
       a.latest_work_cover,
       a.latest_update_at
     FROM user_follow_authors ufa
     LEFT JOIN (
       SELECT
         n.author_id,
         MIN(n.author) AS name,
         MIN(n.cover) AS avatar,
         SUBSTRING_INDEX(GROUP_CONCAT(n.id ORDER BY COALESCE(n.last_update_time, n.updated_at) DESC), ',', 1) AS latest_work_id,
         SUBSTRING_INDEX(GROUP_CONCAT(n.title ORDER BY COALESCE(n.last_update_time, n.updated_at) DESC SEPARATOR '|||'), '|||', 1) AS latest_work_title,
         SUBSTRING_INDEX(GROUP_CONCAT(n.cover ORDER BY COALESCE(n.last_update_time, n.updated_at) DESC SEPARATOR '|||'), '|||', 1) AS latest_work_cover,
         MAX(COALESCE(n.last_update_time, n.updated_at)) AS latest_update_at
       FROM novels n
       GROUP BY n.author_id
     ) a ON a.author_id = ufa.author_id
     WHERE ufa.user_id = ?
     ORDER BY a.latest_update_at DESC, ufa.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, pageSize, offset]
  );

  return {
    list: rows,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
}

module.exports = {
  followAuthor,
  getAuthor,
  listAuthorNovels,
  listFollowingAuthors,
  unfollowAuthor
};
