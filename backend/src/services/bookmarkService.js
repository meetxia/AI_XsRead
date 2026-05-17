const { pool } = require('../config/database');
const { resolveParagraphAnchor } = require('../utils/paragraphAnchor');
const { sanitizeText } = require('../utils/sanitizer');
const { hasTable, hasColumn } = require('../utils/schemaCompat');

function toPositiveInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toNonNegativeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

async function ensureBookmarkTable() {
  if (!(await hasTable('user_bookmarks'))) {
    const error = new Error('书签功能尚未启用');
    error.httpStatus = 404;
    throw error;
  }
}

async function createBookmark(userId, payload = {}) {
  await ensureBookmarkTable();

  const novelId = toPositiveInt(payload.novelId);
  const chapterId = toPositiveInt(payload.chapterId);
  if (!novelId || !chapterId) {
    const error = new Error('novelId 和 chapterId 必填');
    error.httpStatus = 400;
    throw error;
  }

  const anchor = await resolveParagraphAnchor(
    chapterId,
    payload.paragraphIndex,
    payload.paragraphHash
  );
  const note = sanitizeText(payload.note || '', { maxLen: 500 });
  const charOffset = toNonNegativeInt(payload.charOffset, 0);

  const [result] = await pool.query(
    `INSERT INTO user_bookmarks
       (user_id, novel_id, chapter_id, paragraph_index, paragraph_hash, char_offset, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      userId,
      novelId,
      chapterId,
      anchor.paragraphIndex,
      payload.paragraphHash || null,
      charOffset,
      note || null
    ]
  );

  return {
    id: result.insertId,
    novelId,
    chapterId,
    paragraphIndex: anchor.paragraphIndex,
    paragraphHash: payload.paragraphHash || null,
    charOffset,
    note,
    anchorStatus: anchor.status
  };
}

async function listByNovel(userId, novelId = null, options = {}) {
  if (!(await hasTable('user_bookmarks'))) {
    return {
      list: [],
      pagination: {
        page: 1,
        pageSize: toPositiveInt(options.pageSize, 20),
        total: 0,
        totalPages: 0
      }
    };
  }

  const page = toPositiveInt(options.page, 1);
  const pageSize = Math.min(toPositiveInt(options.pageSize, 20), 100);
  const offset = (page - 1) * pageSize;
  const params = [userId];
  let where = 'WHERE b.user_id = ?';

  if (novelId) {
    where += ' AND b.novel_id = ?';
    params.push(toPositiveInt(novelId));
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM user_bookmarks b ${where}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.query(
    `SELECT
       b.id, b.user_id, b.novel_id, b.chapter_id, b.paragraph_index,
       b.paragraph_hash, b.char_offset, b.note, b.created_at,
       n.title AS novel_title,
       c.title AS chapter_title,
       SUBSTRING(c.content, 1, 60) AS paragraph_preview
     FROM user_bookmarks b
     LEFT JOIN novels n ON n.id = b.novel_id
     LEFT JOIN chapters c ON c.id = b.chapter_id
     ${where}
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    list: rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

async function removeBookmark(userId, bookmarkId) {
  await ensureBookmarkTable();

  const id = toPositiveInt(bookmarkId);
  if (!id) {
    const error = new Error('无效的书签ID');
    error.httpStatus = 400;
    throw error;
  }

  const [result] = await pool.query(
    'DELETE FROM user_bookmarks WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  return { deleted: result.affectedRows > 0 };
}

async function isCurrentAnchorBookmarked(userId, payload = {}) {
  if (!(await hasTable('user_bookmarks'))) {
    return false;
  }

  const [rows] = await pool.query(
    `SELECT id FROM user_bookmarks
     WHERE user_id = ? AND novel_id = ? AND chapter_id = ?
       AND paragraph_index = ? AND (paragraph_hash <=> ?)
     LIMIT 1`,
    [
      userId,
      toPositiveInt(payload.novelId),
      toPositiveInt(payload.chapterId),
      toNonNegativeInt(payload.paragraphIndex, 0),
      payload.paragraphHash || null
    ]
  );
  return rows.length > 0;
}

module.exports = {
  createBookmark,
  isCurrentAnchorBookmarked,
  listByNovel,
  removeBookmark
};
