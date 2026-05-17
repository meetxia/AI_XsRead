const { pool } = require('../config/database');
const { buildParagraphHashes } = require('../utils/paragraphAnchor');

function stringifyHashes(content) {
  return JSON.stringify(buildParagraphHashes(content || ''));
}

async function upsertChapter(chapter, db = pool) {
  const {
    id = null,
    novelId,
    chapterNumber,
    title,
    content = '',
    wordCount = String(content).replace(/\s/g, '').length,
    isFree = 1,
    status = 1,
    publishTime = null
  } = chapter;
  const paragraphHashes = stringifyHashes(content);

  if (id) {
    const [result] = await db.query(
      `UPDATE chapters
       SET title = ?, content = ?, word_count = ?, is_free = ?, status = ?,
           publish_time = ?, paragraph_hashes = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, content, wordCount, isFree, status, publishTime, paragraphHashes, id]
    );
    return { id, affectedRows: result.affectedRows, paragraphHashes: JSON.parse(paragraphHashes) };
  }

  const [result] = await db.query(
    `INSERT INTO chapters (
       novel_id, chapter_number, title, content, word_count, is_free, status, publish_time, paragraph_hashes
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [novelId, chapterNumber, title, content, wordCount, isFree, status, publishTime, paragraphHashes]
  );

  return { id: result.insertId, affectedRows: result.affectedRows, paragraphHashes: JSON.parse(paragraphHashes) };
}

async function refreshChapterParagraphHashes(chapterId, db = pool) {
  const [rows] = await db.query('SELECT id, content FROM chapters WHERE id = ? LIMIT 1', [chapterId]);
  if (rows.length === 0) {
    return null;
  }

  const paragraphHashes = stringifyHashes(rows[0].content);
  await db.query(
    'UPDATE chapters SET paragraph_hashes = ? WHERE id = ?',
    [paragraphHashes, chapterId]
  );

  return { id: chapterId, paragraphHashes: JSON.parse(paragraphHashes) };
}

async function recomputeAllParagraphHashes(options = {}) {
  const { batchSize = 100, db = pool } = options;
  let lastId = 0;
  let updated = 0;

  while (true) {
    const [rows] = await db.query(
      `SELECT id, content FROM chapters
       WHERE id > ?
       ORDER BY id ASC
       LIMIT ?`,
      [lastId, batchSize]
    );

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      await db.query(
        'UPDATE chapters SET paragraph_hashes = ? WHERE id = ?',
        [stringifyHashes(row.content), row.id]
      );
      updated += 1;
      lastId = row.id;
    }
  }

  return { updated };
}

module.exports = {
  recomputeAllParagraphHashes,
  refreshChapterParagraphHashes,
  upsertChapter
};
