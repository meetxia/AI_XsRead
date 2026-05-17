/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 14.4 — useReadingHistoryEntry 计算逻辑
 *
 * 单元测试覆盖：
 *   - 空记录 / 缺失 novel → 返回 null
 *   - 完整记录 → 返回 HomePage 卡片所需 shape
 *   - remainingMinutes = round(wordCount * (1 - progress/100) / 350)
 *
 * Validates: Requirements 13.2
 */
import { describe, expect, it } from 'vitest'
import { formatHistoryEntry } from '../useReadingHistoryEntry'

describe('useReadingHistoryEntry — formatHistoryEntry', () => {
  it('returns null for an empty record', () => {
    expect(formatHistoryEntry(null)).toBeNull()
    expect(formatHistoryEntry(undefined)).toBeNull()
    expect(formatHistoryEntry({})).toBeNull()
    expect(formatHistoryEntry({ novel: null, chapter: null, progress: null })).toBeNull()
  })

  it('returns null when the novel is missing or has no title', () => {
    expect(formatHistoryEntry({ novel: {}, chapter: { title: 'X' }, progress: { progress: 30 } })).toBeNull()
    expect(formatHistoryEntry({ novel: { id: 1 } })).toBeNull()
  })

  it('formats a real record into the homepage card shape', () => {
    const entry = formatHistoryEntry({
      novel: { id: 1, title: '山有木兮', author: '昭昭', wordCount: 700_000 },
      chapter: { id: 42, title: '第三十六章 月落', chapterNumber: 36 },
      progress: { progress: 40, paragraphIndex: 7, updatedAt: 1_700_000_000_000 }
    })

    expect(entry).toEqual({
      title: '山有木兮',
      author: '昭昭',
      chapterTitle: '第三十六章 月落',
      chapterIndex: 36,
      percent: 40,
      // 700_000 * 0.6 / 350 = 1200
      remainingMinutes: 1200
    })
  })

  it('computes remainingMinutes = round(wordCount * (1 - progress/100) / 350)', () => {
    const entry = formatHistoryEntry({
      novel: { id: 2, title: 'X', wordCount: 35_000 },
      chapter: { id: 1, title: '一', chapterNumber: 1 },
      progress: { progress: 50 }
    })
    // 35_000 * 0.5 / 350 = 50
    expect(entry.remainingMinutes).toBe(50)
  })

  it('clamps percent into [0, 100] and floors fractional values', () => {
    const high = formatHistoryEntry({
      novel: { id: 3, title: 'A', wordCount: 1000 },
      chapter: { id: 1, title: 'a', chapterNumber: 1 },
      progress: { progress: 250 }
    })
    expect(high.percent).toBe(100)
    expect(high.remainingMinutes).toBe(0)

    const low = formatHistoryEntry({
      novel: { id: 4, title: 'B', wordCount: 1000 },
      chapter: { id: 1, title: 'b', chapterNumber: 1 },
      progress: { progress: -10 }
    })
    expect(low.percent).toBe(0)

    const fractional = formatHistoryEntry({
      novel: { id: 5, title: 'C', wordCount: 1000 },
      chapter: { id: 1, title: 'c', chapterNumber: 1 },
      progress: { progress: 73.9 }
    })
    expect(fractional.percent).toBe(73)
  })

  it('returns 0 remainingMinutes when wordCount is missing', () => {
    const entry = formatHistoryEntry({
      novel: { id: 6, title: 'D' },
      chapter: { id: 1, title: 'x', chapterNumber: 1 },
      progress: { progress: 30 }
    })
    expect(entry.remainingMinutes).toBe(0)
    expect(entry.title).toBe('D')
    expect(entry.percent).toBe(30)
  })
})
