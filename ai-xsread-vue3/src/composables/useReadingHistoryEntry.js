/**
 * useReadingHistoryEntry
 *
 * 从最近一次阅读记录派生 HomePage "继续你的故事" 卡片所需的展示字段。
 * 该模块只暴露纯函数 `formatHistoryEntry`，便于在 setup 之外（包括 PBT / 单元测试）
 * 直接调用。
 *
 * 输出字段：
 *   - title:        小说标题
 *   - author:       作者名
 *   - chapterTitle: 上次读到的章节标题
 *   - chapterIndex: 章节序号（第 N 章 中的 N，从 1 起）
 *   - percent:      已读百分比，0..100，向下取整
 *   - remainingMinutes: 预计剩余阅读时长（分钟），按 350 字 / 分钟估算
 *
 * Requirement 引用：13.2 / 14.4
 */

const READ_SPEED_WORDS_PER_MIN = 350

function pickNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

/**
 * @param {Object} record
 * @param {Object|null} record.novel - { id, title, author, wordCount? }
 * @param {Object|null} record.chapter - { id, title, chapterNumber? }
 * @param {Object|null} record.progress - { progress, paragraphIndex?, updatedAt? }
 * @returns {Object|null} 卡片展示字段，无效输入返回 null。
 */
export function formatHistoryEntry(record) {
  if (!record || typeof record !== 'object') return null
  const { novel, chapter, progress } = record
  if (!novel || !novel.title) return null

  const percentRaw = pickNumber(progress?.progress, 0)
  const percent = Math.max(0, Math.min(100, Math.floor(percentRaw)))
  const wordCount = pickNumber(novel.wordCount, 0)
  const remaining = Math.max(0, wordCount * (1 - percent / 100))
  const remainingMinutes = wordCount > 0
    ? Math.round(remaining / READ_SPEED_WORDS_PER_MIN)
    : 0

  return {
    title: String(novel.title),
    author: novel.author ? String(novel.author) : '',
    chapterTitle: chapter?.title ? String(chapter.title) : '',
    chapterIndex: pickNumber(chapter?.chapterNumber ?? chapter?.chapter_number, 0),
    percent,
    remainingMinutes
  }
}

/**
 * Vue 友好封装：返回一个工厂函数，当 record 变化时调用 formatHistoryEntry。
 * 视图层可以直接用 computed 包一次：
 *   const entry = computed(() => formatHistoryEntry(record.value))
 */
export function useReadingHistoryEntry() {
  return { formatHistoryEntry }
}

export default useReadingHistoryEntry
