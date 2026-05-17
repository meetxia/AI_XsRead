/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 7: 进度合并 max-by-updatedAt
 *
 * mergeProgress(local, server) 必须满足：
 *   - 任意 local.updatedAt 与 server.updatedAt：返回 argmax(updatedAt)
 *   - 当 updatedAt 相等（含都为 0 / 缺省）时优先返回 local
 *   - 一侧为 null/undefined 时返回另一侧；两侧皆空返回 null
 *
 * Validates: Requirements 4.6
 */
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { mergeProgress } from '../useReadingProgress'

const tsArb = fc.integer({ min: 0, max: 2_000_000_000_000 })

const progressArb = (label) =>
  fc.record({
    source: fc.constant(label),
    chapterId: fc.integer({ min: 1, max: 10_000 }),
    paragraphIndex: fc.integer({ min: 0, max: 5_000 }),
    updatedAt: tsArb
  })

describe('[Property 7] mergeProgress argmax(updatedAt)', () => {
  it('returns whichever side has the larger updatedAt', () => {
    fc.assert(
      fc.property(progressArb('local'), progressArb('server'), (local, server) => {
        const merged = mergeProgress(local, server)
        if (server.updatedAt > local.updatedAt) {
          expect(merged).toBe(server)
        } else {
          // Equal or local newer → local wins.
          expect(merged).toBe(local)
        }
      }),
      { numRuns: 200 }
    )
  })

  it('prefers local when both updatedAt values are equal', () => {
    fc.assert(
      fc.property(tsArb, (ts) => {
        const local = { source: 'local', updatedAt: ts, chapterId: 1 }
        const server = { source: 'server', updatedAt: ts, chapterId: 9 }
        expect(mergeProgress(local, server)).toBe(local)
      }),
      { numRuns: 50 }
    )
  })

  it('handles missing or empty inputs', () => {
    expect(mergeProgress(null, null)).toBeNull()
    expect(mergeProgress(undefined, undefined)).toBeNull()

    fc.assert(
      fc.property(progressArb('only'), (only) => {
        expect(mergeProgress(only, null)).toBe(only)
        expect(mergeProgress(null, only)).toBe(only)
        expect(mergeProgress(only, undefined)).toBe(only)
      }),
      { numRuns: 50 }
    )
  })

  it('treats missing updatedAt as 0 and still resolves deterministically', () => {
    const local = { source: 'local', chapterId: 1 } // updatedAt missing
    const server = { source: 'server', chapterId: 2, updatedAt: 0 }
    // 0 == 0 → prefer local.
    expect(mergeProgress(local, server)).toBe(local)

    const fresh = { source: 'fresh', updatedAt: 100 }
    expect(mergeProgress(local, fresh)).toBe(fresh)
  })
})
