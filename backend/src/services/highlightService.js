const { pool } = require('../config/database');
const { resolveParagraphAnchor } = require('../utils/paragraphAnchor');
const { sanitizeText } = require('../utils/sanitizer');
const { hasTable } = require('../utils/schemaCompat');

function positiveInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

async function ensureHighlightTable() {
  if (!(await hasTable('highlights'))) {
    const error = new Error('划线功能尚未启用');
    error.httpStatus = 404;
    throw error;
  }
}

async function createHighlight(userId, payload = {}) {
  await ensureHighlightTable();

  const novelId = positiveInt(payload.novelId);
  const chapterId = positiveInt(payload.chapterId);
  if (!novelId || !chapterId) {
    const error = new Error('novelId 和 chapterId 必填');
    error.httpStatus = 400;
    throw error;
  }

  const color = ['yellow', 'green', 'red'].includes(payload.color) ? payload.color : 'yellow';
  const content = sanitizeText(payload.content || '', { maxLen: 500 });
  const note = sanitizeText(payload.note || '', { maxLen: 500 });
  const anchor = await resolveParagraphAnchor(chapterId, payload.paragraphIndex, payload.paragraphHash);

  const [result] = await pool.query(
    `INSERT INTO highlights
       (user_id, novel_id, chapter_id, paragraph_index, paragraph_hash,
        start_offset, end_offset, content, color, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      userId,
      novelId,
      chapterId,
      anchor.paragraphIndex,
      payload.paragraphHash || null,
      nonNegativeInt(payload.startOffset, 0),
      nonNegativeInt(payload.endOffset, 0),
      content,
      color,
      note || null
    ]
  );

  return {
    id: result.insertId,
    novelId,
    chapterId,
    paragraphIndex: anchor.paragraphIndex,
    paragraphHash: payload.paragraphHash || null,
    startOffset: nonNegativeInt(payload.startOffset, 0),
    endOffset: nonNegativeInt(payload.endOffset, 0),
    content,
    color,
    note,
    anchorStatus: anchor.status
  };
}

async function listHighlights(userId, options = {}) {
  if (!(await hasTable('highlights'))) {
    return { list: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
  }

  const page = positiveInt(options.page, 1);
  const pageSize = Math.min(positiveInt(options.pageSize, 20), 100);
  const offset = (page - 1) * pageSize;
  const params = [];
  let where = 'WHERE h.deleted_at IS NULL';

  if (userId) {
    where += ' AND h.user_id = ?';
    params.push(userId);
  }
  if (options.novelId) {
    where += ' AND h.novel_id = ?';
    params.push(positiveInt(options.novelId));
  }
  if (options.chapterId) {
    where += ' AND h.chapter_id = ?';
    params.push(positiveInt(options.chapterId));
  }
  if (options.onlyNotes) {
    where += ' AND h.note IS NOT NULL AND h.note <> ""';
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM highlights h ${where}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);
  const [rows] = await pool.query(
    `SELECT
       h.id, h.user_id, h.novel_id, h.chapter_id, h.paragraph_index,
       h.paragraph_hash, h.start_offset, h.end_offset, h.content,
       h.color, h.note, h.created_at,
       n.title AS novel_title, c.title AS chapter_title
     FROM highlights h
     LEFT JOIN novels n ON n.id = h.novel_id
     LEFT JOIN chapters c ON c.id = h.chapter_id
     ${where}
     ORDER BY h.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    list: rows,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
}

async function listHotNotesForNovel(novelId, options = {}) {
  return listHighlights(null, {
    ...options,
    novelId,
    onlyNotes: true
  });
}

async function updateHighlight(userId, highlightId, payload = {}) {
  await ensureHighlightTable();
  const updates = [];
  const values = [];

  if (payload.note !== undefined) {
    updates.push('note = ?');
    values.push(sanitizeText(payload.note, { maxLen: 500 }) || null);
  }
  if (payload.color !== undefined) {
    if (!['yellow', 'green', 'red'].includes(payload.color)) {
      const error = new Error('无效的划线颜色');
      error.httpStatus = 400;
      throw error;
    }
    updates.push('color = ?');
    values.push(payload.color);
  }

  if (updates.length === 0) {
    return { updated: false };
  }

  values.push(positiveInt(highlightId), userId);
  const [result] = await pool.query(
    `UPDATE highlights SET ${updates.join(', ')}
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    values
  );
  return { updated: result.affectedRows > 0 };
}

async function removeHighlight(userId, highlightId) {
  await ensureHighlightTable();
  const [result] = await pool.query(
    'UPDATE highlights SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [positiveInt(highlightId), userId]
  );
  return { deleted: result.affectedRows > 0 };
}

module.exports = {
  createHighlight,
  listHighlights,
  listHotNotesForNovel,
  removeHighlight,
  updateHighlight
};
