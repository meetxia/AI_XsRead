export function unwrapList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

export function formatCount(value) {
  const n = Number(value || 0)
  if (!n) return '0'
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)} 万`
  return n.toLocaleString('zh-CN')
}

export function formatWordCount(value) {
  const n = Number(value || 0)
  if (!n) return ''
  if (n >= 10000) return `${Math.round(n / 10000)} 万字`
  return `${n.toLocaleString('zh-CN')} 字`
}

export function relativeTime(input) {
  if (!input) return ''
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  const days = Math.max(0, Math.floor(diff / 86400000))
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return `${days} 天前`
  return date.toLocaleDateString('zh-CN')
}

export function normalizeBook(item, index = 0) {
  const novel = item.novel || item
  return {
    id: novel.id || item.novel_id || item.novelId,
    bookshelfId: item.bookshelf_id || item.id,
    title: novel.title || item.title || '未命名故事',
    author: novel.author || item.author || '佚名',
    cat: novel.category_name || item.category_name || item.category || '',
    rating: Number(novel.rating || item.rating || 0).toFixed(1),
    cover: novel.cover || item.cover || '',
    variant: Number(novel.id || item.novel_id || index) % 6,
    progress: Math.min(100, Math.max(0, Math.round(Number(item.progress || item.reading_progress || 0)))),
    type: item.type || (Number(item.progress || 0) >= 100 ? 'finished' : 'reading'),
    groupName: item.group_name || item.groupName || '默认分组',
    isTop: Boolean(item.is_top || item.isTop),
    hasUnreadUpdate: Boolean(item.hasUnreadUpdate || item.has_unread_update),
    lastReadTime: item.last_read_time || item.lastReadTime || item.updated_at || item.added_time,
    updatedAt: novel.updated_at || item.updated_at,
    chapterId: item.chapter_id || item.current_chapter_id || item.currentChapter,
    chapterTitle: item.chapter_title || item.chapterTitle || '',
  }
}
