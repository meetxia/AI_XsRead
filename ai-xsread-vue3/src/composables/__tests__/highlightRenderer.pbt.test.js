/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 20: 划线章节渲染等价性
 *
 * For arbitrary paragraphs[] and highlights[] tagged with one of three
 * statuses (exact / rehashed / fallback), `wrapHighlights(paragraphs, highlights)`
 * — implemented by the pure helper `resolveHighlightsForChapter` — must produce
 * an HTML/AST array satisfying:
 *
 *   - status='exact'    → <mark> exists with text === highlight.content
 *   - status='rehashed' → <mark> exists at a paragraph located by paragraphHash,
 *                         text contains a substring matching highlight.content
 *   - status='fallback' → <mark> exists at a clamped paragraph index with
 *                         data-anchor-status='fallback' and tooltip set
 *   - Deleting a highlight removes its <mark> from the next render
 *
 * Validates: Requirements 25.2, 25.3, 25.4, 25.5
 */
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  resolveHighlightsForChapter,
} from '../useHighlightRenderer'

const HEX = '0123456789abcdef'.split('')

const hashArb = fc
  .array(fc.constantFrom(...HEX), { minLength: 16, maxLength: 16 })
  .map((chars) => chars.join(''))

const paragraphTextArb = fc
  .string({ minLength: 8, maxLength: 80 })
  .filter((s) => s.trim().length >= 4)

function buildParagraphs(rng) {
  // rng: array of { text, hash } with unique hashes
  const seen = new Set()
  const items = []
  for (const { text, hash } of rng) {
    if (seen.has(hash)) continue
    seen.add(hash)
    items.push({ text, hash })
  }
  return items
}

const paragraphsArb = fc
  .array(fc.record({ text: paragraphTextArb, hash: hashArb }), {
    minLength: 1,
    maxLength: 8,
  })
  .map(buildParagraphs)
  .filter((items) => items.length >= 1)

/**
 * Given paragraphs[], emit an arbitrary command list of highlights tagged with
 * a deterministic synthetic status.
 */
function highlightCommandsFromParas(paragraphs) {
  const n = paragraphs.length
  const safeOffsets = (text) =>
    fc
      .tuple(
        fc.integer({ min: 0, max: Math.max(0, text.length - 1) }),
        fc.integer({ min: 1, max: Math.max(1, text.length) })
      )
      .map(([a, b]) => {
        const start = Math.min(a, b)
        const end = Math.max(start + 1, Math.max(a, b))
        return [start, Math.min(end, text.length)]
      })

  // Generate a small list of highlight specs.
  const exactArb = fc.integer({ min: 0, max: n - 1 }).chain((idx) =>
    safeOffsets(paragraphs[idx].text).map(([s, e]) => ({
      status: 'exact',
      paragraphIndex: idx,
      paragraphHash: paragraphs[idx].hash,
      startOffset: s,
      endOffset: e,
      content: paragraphs[idx].text.slice(s, e),
      color: 'yellow',
    }))
  )

  const rehashedArb = n >= 2
    ? fc
        .tuple(
          fc.integer({ min: 0, max: n - 1 }),
          fc.integer({ min: 0, max: n - 1 })
        )
        .filter(([a, b]) => a !== b)
        .chain(([requested, actual]) =>
          safeOffsets(paragraphs[actual].text).map(([s, e]) => ({
            status: 'rehashed',
            paragraphIndex: requested,
            paragraphHash: paragraphs[actual].hash,
            startOffset: s,
            endOffset: e,
            content: paragraphs[actual].text.slice(s, e),
            color: 'green',
            _expectedIndex: actual,
          }))
        )
    : null

  const fallbackArb = fc
    .integer({ min: -10, max: n + 10 })
    .chain((requested) => {
      const idx = Math.max(0, Math.min(requested, n - 1))
      return safeOffsets(paragraphs[idx].text).map(([s, e]) => ({
        status: 'fallback',
        paragraphIndex: requested,
        paragraphHash: 'deadbeefdeadbeef', // unknown hash → fallback
        startOffset: s,
        endOffset: e,
        content: paragraphs[idx].text.slice(s, e),
        color: 'red',
        _expectedIndex: idx,
      }))
    })

  const oneOf = rehashedArb
    ? fc.oneof(exactArb, rehashedArb, fallbackArb)
    : fc.oneof(exactArb, fallbackArb)

  return fc
    .array(oneOf, { minLength: 1, maxLength: 6 })
    .map((items) => items.map((it, i) => ({ ...it, id: i + 1 })))
}

const sampleArb = paragraphsArb.chain((paragraphs) =>
  highlightCommandsFromParas(paragraphs).map((highlights) => ({ paragraphs, highlights }))
)

function findMarkSegment(segmentsByIndex, paraIdx, id) {
  return segmentsByIndex[paraIdx]?.find((seg) => seg.type === 'mark' && seg.id === id) || null
}

describe('[Property 20] resolveHighlightsForChapter', () => {
  it('exact: <mark> exists with text === highlight.content', () => {
    fc.assert(
      fc.property(sampleArb, ({ paragraphs, highlights }) => {
        const onlyExact = highlights.filter((h) => h.status === 'exact')
        if (!onlyExact.length) return
        const items = paragraphs.map(({ text, hash }) => ({ text, hash }))
        const hashes = paragraphs.map((p) => p.hash)
        const { resolved, segmentsByIndex } = resolveHighlightsForChapter({
          paragraphs: items,
          paragraphHashes: hashes,
          highlights: onlyExact,
        })
        for (const h of onlyExact) {
          const r = resolved.find((x) => x.id === h.id)
          expect(r).toBeTruthy()
          expect(r.status).toBe('exact')
          expect(r.paragraphIndex).toBe(h.paragraphIndex)
          const mark = findMarkSegment(segmentsByIndex, r.paragraphIndex, h.id)
          expect(mark).toBeTruthy()
          expect(mark.text).toBe(h.content)
          expect(mark.status).toBe('exact')
        }
      }),
      { numRuns: 100 }
    )
  })

  it('rehashed: <mark> exists at the paragraph located by paragraphHash and contains the content', () => {
    fc.assert(
      fc.property(sampleArb, ({ paragraphs, highlights }) => {
        const onlyRehashed = highlights.filter((h) => h.status === 'rehashed')
        if (!onlyRehashed.length) return
        const items = paragraphs.map(({ text, hash }) => ({ text, hash }))
        const hashes = paragraphs.map((p) => p.hash)
        const { resolved, segmentsByIndex } = resolveHighlightsForChapter({
          paragraphs: items,
          paragraphHashes: hashes,
          highlights: onlyRehashed,
        })
        for (const h of onlyRehashed) {
          const r = resolved.find((x) => x.id === h.id)
          expect(r).toBeTruthy()
          expect(r.status).toBe('rehashed')
          expect(r.paragraphIndex).toBe(h._expectedIndex)
          const mark = findMarkSegment(segmentsByIndex, r.paragraphIndex, h.id)
          expect(mark).toBeTruthy()
          // Substring match against the resolved paragraph's text.
          expect(items[r.paragraphIndex].text).toContain(mark.text)
          expect(mark.text.length).toBeGreaterThan(0)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('fallback: <mark> uses clamped index, data-anchor-status=fallback, tooltip set', () => {
    fc.assert(
      fc.property(sampleArb, ({ paragraphs, highlights }) => {
        const onlyFallback = highlights.filter((h) => h.status === 'fallback')
        if (!onlyFallback.length) return
        const items = paragraphs.map(({ text, hash }) => ({ text, hash }))
        const hashes = paragraphs.map((p) => p.hash)
        const { resolved, segmentsByIndex } = resolveHighlightsForChapter({
          paragraphs: items,
          paragraphHashes: hashes,
          highlights: onlyFallback,
        })
        for (const h of onlyFallback) {
          const r = resolved.find((x) => x.id === h.id)
          expect(r).toBeTruthy()
          expect(r.status).toBe('fallback')
          expect(r.paragraphIndex).toBe(
            Math.max(0, Math.min(h.paragraphIndex, items.length - 1))
          )
          expect(r.tooltip).toBe('原文已修订')
          const mark = findMarkSegment(segmentsByIndex, r.paragraphIndex, h.id)
          expect(mark).toBeTruthy()
          expect(mark.status).toBe('fallback')
          expect(mark.tooltip).toBe('原文已修订')
        }
      }),
      { numRuns: 100 }
    )
  })

  it('deleting a highlight removes its <mark> from the next render', () => {
    fc.assert(
      fc.property(sampleArb, ({ paragraphs, highlights }) => {
        if (!highlights.length) return
        const items = paragraphs.map(({ text, hash }) => ({ text, hash }))
        const hashes = paragraphs.map((p) => p.hash)

        const { segmentsByIndex: before } = resolveHighlightsForChapter({
          paragraphs: items,
          paragraphHashes: hashes,
          highlights,
        })

        const removeId = highlights[0].id
        const remaining = highlights.filter((h) => h.id !== removeId)
        const { segmentsByIndex: after } = resolveHighlightsForChapter({
          paragraphs: items,
          paragraphHashes: hashes,
          highlights: remaining,
        })

        // The removed id must not appear in any paragraph's segments after deletion.
        const stillThere = after.some((segs) =>
          segs.some((seg) => seg.type === 'mark' && seg.id === removeId)
        )
        expect(stillThere).toBe(false)

        // Sanity: it was rendered before.
        const wasThereBefore = before.some((segs) =>
          segs.some((seg) => seg.type === 'mark' && seg.id === removeId)
        )
        expect(wasThereBefore).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})
