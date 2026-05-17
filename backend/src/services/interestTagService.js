const { pool } = require('../config/database');
const { hasTable } = require('../utils/schemaCompat');

function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(
    tags
      .map(tag => String(tag || '').trim())
      .filter(tag => tag.length > 0 && tag.length <= 50)
  )].slice(0, 30);
}

async function saveTags(userId, tags = []) {
  if (!(await hasTable('user_interest_tags'))) {
    const error = new Error('兴趣标签功能尚未启用');
    error.httpStatus = 404;
    throw error;
  }

  const normalized = normalizeTags(tags);
  for (const tag of normalized) {
    await pool.query(
      `INSERT INTO user_interest_tags (user_id, tag, weight, created_at)
       VALUES (?, ?, 1.00, NOW())
       ON DUPLICATE KEY UPDATE weight = LEAST(weight + 0.10, 5.00)`,
      [userId, tag]
    );
  }

  return { tags: normalized };
}

async function listTags(userId) {
  if (!(await hasTable('user_interest_tags'))) {
    return [];
  }

  const [rows] = await pool.query(
    `SELECT tag, weight, created_at
     FROM user_interest_tags
     WHERE user_id = ?
     ORDER BY weight DESC, created_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = {
  listTags,
  normalizeTags,
  saveTags
};
