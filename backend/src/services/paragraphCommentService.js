const { pool } = require('../config/database');
const { resolveParagraphAnchor } = require('../utils/paragraphAnchor');
const { sanitizeComment } = require('../utils/sanitizer');
const { hasTable } = require('../utils/schemaCompat');

function intParam(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function positiveInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function ensureCommentTable() {
  if (!(await hasTable('paragraph_comments'))) {
    const error = new Error('段评功能尚未启用');
    error.httpStatus = 404;
    throw error;
  }
}

async function createComment(userId, payload = {}) {
  await ensureCommentTable();

  const novelId = positiveInt(payload.novelId);
  const chapterId = positiveInt(payload.chapterId);
  if (!novelId || !chapterId) {
    const error = new Error('novelId 和 chapterId 必填');
    error.httpStatus = 400;
    throw error;
  }

  const parentId = payload.parentId ? positiveInt(payload.parentId) : null;
  if (parentId) {
    const [parents] = await pool.query(
      'SELECT id, parent_id FROM paragraph_comments WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [parentId]
    );
    if (parents.length === 0 || parents[0].parent_id) {
      const error = new Error('不支持二级回复');
      error.httpStatus = 400;
      throw error;
    }
  }

  const anchor = await resolveParagraphAnchor(
    chapterId,
    payload.paragraphIndex,
    payload.paragraphHash
  );
  const content = sanitizeComment(payload.content);
  if (!content) {
    const error = new Error('内容不能为空');
    error.httpStatus = 400;
    throw error;
  }

  const [result] = await pool.query(
    `INSERT INTO paragraph_comments
       (user_id, novel_id, chapter_id, paragraph_index, paragraph_hash, content, parent_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      userId,
      novelId,
      chapterId,
      anchor.paragraphIndex,
      payload.paragraphHash || null,
      content,
      parentId
    ]
  );

  return {
    id: result.insertId,
    novelId,
    chapterId,
    paragraphIndex: anchor.paragraphIndex,
    paragraphHash: payload.paragraphHash || null,
    content,
    parentId,
    anchorStatus: anchor.status
  };
}

async function listComments(options = {}) {
  if (!(await hasTable('paragraph_comments'))) {
    return { list: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  const page = positiveInt(options.page, 1);
  const pageSize = Math.min(positiveInt(options.pageSize, 20), 100);
  const offset = (page - 1) * pageSize;
  const params = [];
  let where = 'WHERE pc.deleted_at IS NULL';

  if (options.novelId) {
    where += ' AND pc.novel_id = ?';
    params.push(positiveInt(options.novelId));
  }
  if (options.chapterId) {
    where += ' AND pc.chapter_id = ?';
    params.push(positiveInt(options.chapterId));
  }
  if (options.paragraphIndex !== undefined) {
    where += ' AND pc.paragraph_index = ?';
    params.push(intParam(options.paragraphIndex, 0));
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM paragraph_comments pc ${where}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);
  const orderBy = options.sortBy === 'latest'
    ? 'pc.created_at DESC'
    : '(pc.likes + COALESCE(reply_stats.reply_count, 0) * 2 + LEAST(CHAR_LENGTH(pc.content) / 50, 5)) DESC, pc.created_at DESC';

  const [rows] = await pool.query(
    `SELECT
       pc.id, pc.user_id, pc.novel_id, pc.chapter_id, pc.paragraph_index,
       pc.paragraph_hash, pc.content, pc.likes, pc.parent_id, pc.created_at,
       u.nickname, u.username, u.avatar,
       COALESCE(reply_stats.reply_count, 0) AS reply_count,
       (pc.likes + COALESCE(reply_stats.reply_count, 0) * 2 + LEAST(CHAR_LENGTH(pc.content) / 50, 5)) AS quality_score
     FROM paragraph_comments pc
     LEFT JOIN users u ON u.id = pc.user_id
     LEFT JOIN (
       SELECT parent_id, COUNT(*) AS reply_count
       FROM paragraph_comments
       WHERE deleted_at IS NULL AND parent_id IS NOT NULL
       GROUP BY parent_id
     ) reply_stats ON reply_stats.parent_id = pc.id
     ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    list: rows,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
}

async function getCounts(options = {}) {
  if (!(await hasTable('paragraph_comments'))) {
    return [];
  }

  const novelId = positiveInt(options.novelId);
  const chapterId = positiveInt(options.chapterId);
  if (!novelId || !chapterId) {
    const error = new Error('novelId 和 chapterId 必填');
    error.httpStatus = 400;
    throw error;
  }

  const [rows] = await pool.query(
    `SELECT paragraph_index AS paragraphIndex, COUNT(*) AS count
     FROM paragraph_comments
     WHERE novel_id = ? AND chapter_id = ? AND deleted_at IS NULL
     GROUP BY paragraph_index`,
    [novelId, chapterId]
  );
  return rows.map(row => ({
    paragraphIndex: Number(row.paragraphIndex),
    count: Number(row.count || 0)
  }));
}

async function likeComment(commentId) {
  await ensureCommentTable();
  await pool.query(
    'UPDATE paragraph_comments SET likes = likes + 1 WHERE id = ? AND deleted_at IS NULL',
    [positiveInt(commentId)]
  );
  return { liked: true };
}

async function unlikeComment(commentId) {
  await ensureCommentTable();
  await pool.query(
    'UPDATE paragraph_comments SET likes = GREATEST(likes - 1, 0) WHERE id = ? AND deleted_at IS NULL',
    [positiveInt(commentId)]
  );
  return { liked: false };
}

async function removeComment(userId, commentId) {
  await ensureCommentTable();
  const [result] = await pool.query(
    'UPDATE paragraph_comments SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [positiveInt(commentId), userId]
  );
  return { deleted: result.affectedRows > 0 };
}

module.exports = {
  createComment,
  getCounts,
  likeComment,
  listComments,
  removeComment,
  unlikeComment
};
