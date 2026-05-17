const crypto = require('crypto');

function splitParagraphs(content = '') {
  if (typeof content !== 'string') {
    return [];
  }

  return content
    .split(/\r?\n\s*\r?\n+/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
}

function computeHash(text = '') {
  const source = typeof text === 'string' ? text : String(text || '');
  return crypto
    .createHash('sha1')
    .update(source.slice(0, 50))
    .digest('hex')
    .slice(0, 16);
}

function parseStoredHashes(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }
  return null;
}

async function loadChapter(chapterId, dbOrChapter) {
  if (dbOrChapter && typeof dbOrChapter === 'object' && ('content' in dbOrChapter || 'paragraph_hashes' in dbOrChapter)) {
    return dbOrChapter;
  }

  if (dbOrChapter && typeof dbOrChapter === 'object' && Array.isArray(dbOrChapter.paragraphs)) {
    return {
      content: dbOrChapter.paragraphs.join('\n\n'),
      paragraph_hashes: dbOrChapter.paragraph_hashes
    };
  }

  const db = dbOrChapter && typeof dbOrChapter.query === 'function'
    ? dbOrChapter
    : require('../config/database').pool;
  const [rows] = await db.query(
    'SELECT id, content, paragraph_hashes FROM chapters WHERE id = ? LIMIT 1',
    [chapterId]
  );
  return rows[0] || { content: '' };
}

async function resolveParagraphAnchor(chapterId, paragraphIndex, paragraphHash, dbOrChapter) {
  const chapter = await loadChapter(chapterId, dbOrChapter);
  const paragraphs = splitParagraphs(chapter.content || '');
  const paragraphCount = paragraphs.length;

  if (paragraphCount === 0) {
    return { paragraphIndex: 0, status: 'fallback' };
  }

  const requestedIndex = Number.isInteger(Number(paragraphIndex))
    ? Number(paragraphIndex)
    : 0;
  const clampedIndex = Math.min(Math.max(requestedIndex, 0), paragraphCount - 1);
  const hashes = parseStoredHashes(chapter.paragraph_hashes)
    || paragraphs.map(paragraph => computeHash(paragraph));

  if (paragraphHash && hashes[clampedIndex] === paragraphHash) {
    return { paragraphIndex: clampedIndex, status: 'exact' };
  }

  if (paragraphHash) {
    const matches = [];
    hashes.forEach((hash, index) => {
      if (hash === paragraphHash) matches.push(index);
    });

    if (matches.length === 1) {
      return { paragraphIndex: matches[0], status: 'rehashed' };
    }
  }

  return { paragraphIndex: clampedIndex, status: 'fallback' };
}

function buildParagraphHashes(content = '') {
  return splitParagraphs(content).map(paragraph => computeHash(paragraph));
}

module.exports = {
  buildParagraphHashes,
  computeHash,
  resolveParagraphAnchor,
  splitParagraphs
};
