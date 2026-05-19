function normalizeNovelDownloadMeta(novel) {
  const title = String(novel.title || '未命名小说').trim() || '未命名小说';
  const author = String(novel.author || '佚名').trim() || '佚名';
  const description = String(novel.description || '').trim();
  const filenameBase = title.replace(/[\\/:*?"<>|]/g, '').trim() || 'novel';

  return {
    title,
    author,
    description,
    filename: `${filenameBase}.txt`
  };
}

function formatNovelDownloadText(novel, chapters) {
  const meta = normalizeNovelDownloadMeta(novel);
  const parts = [
    `《${meta.title}》`,
    `作者：${meta.author}`
  ];

  if (meta.description) {
    parts.push(`简介：${meta.description}`);
  }

  parts.push('');

  if (!chapters || chapters.length === 0) {
    parts.push('本书暂无章节内容。');
  } else {
    chapters.forEach((chapter, index) => {
      const chapterNumber = chapter.chapter_number || index + 1;
      const chapterTitle = String(chapter.title || '').trim();
      const heading = chapterTitle
        ? `第${chapterNumber}章 ${chapterTitle}`
        : `第${chapterNumber}章`;
      const content = String(chapter.content || '').trim();

      parts.push(heading);
      parts.push('');
      parts.push(content || '本章暂无内容。');
      parts.push('');
    });
  }

  return {
    title: meta.title,
    filename: meta.filename,
    text: `${parts.join('\n').replace(/\n{4,}/g, '\n\n\n')}\n`
  };
}

module.exports = {
  formatNovelDownloadText,
  normalizeNovelDownloadMeta
};
