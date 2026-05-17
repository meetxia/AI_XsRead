/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 23.4 — Chapter highlight restoration
 *
 * Loads highlights for the current (novelId, chapterId) via api/highlights.js
 * and rebuilds `<mark data-highlight-id ... data-anchor-status>` wrappers in
 * the rendered paragraphs of `containerRef`.
 *
 * Anchor resolution (per Requirement 25.3):
 *   1. exact match by (paragraphIndex, paragraphHash)
 *   2. linear scan of paragraphHash → status='rehashed'
 *   3. clamp(paragraphIndex, 0, n-1) → status='fallback' (lighter color, tooltip)
 *
 * Pure helper `resolveHighlightsForChapter` is exported for testability — see
 * `__tests__/highlightRenderer.pbt.test.js`.
 */
import { nextTick, onBeforeUnmount, ref, unref, watch } from 'vue'
import { useHighlightsStore } from '@/stores/highlights'
import { computeParagraphHash, normalizeParagraphs } from '@/composables/useParagraphAnchor'

const FALLBACK_TOOLTIP = '原文已修订'
const VALID_COLORS = new Set(['yellow', 'green', 'red'])

function readNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function readColor(color) {
  if (typeof color === 'string' && VALID_COLORS.has(color)) return color
  return 'yellow'
}

/**
 * Pure helper.
 *
 * @param {{ paragraphs: Array<string|{text:string,hash?:string}>, paragraphHashes?: string[], highlights: Array<object> }} input
 * @returns {{ resolved: Array<object>, segmentsByIndex: Array<Array<object>> }}
 */
export function resolveHighlightsForChapter(input = {}) {
  const rawParagraphs = Array.isArray(input.paragraphs) ? input.paragraphs : []
  const items = rawParagraphs.map((p) => {
    if (p && typeof p === 'object') return { text: String(p.text ?? ''), hash: String(p.hash ?? '') }
    return { text: String(p ?? ''), hash: '' }
  })
  const paragraphHashes = Array.isArray(input.paragraphHashes) ? input.paragraphHashes : []
  const hashes = items.map((it, i) => {
    const fromArr = typeof paragraphHashes[i] === 'string' ? paragraphHashes[i] : ''
    return fromArr || it.hash || ''
  })
  const n = items.length
  const highlights = Array.isArray(input.highlights) ? input.highlights : []

  const resolved = []
  for (const h of highlights) {
    if (!h || h.deleted || h.deleted_at) continue
    const requestedIndex = readNumber(h.paragraphIndex ?? h.paragraph_index, 0)
    const hashRaw = h.paragraphHash ?? h.paragraph_hash ?? ''
    const hash = typeof hashRaw === 'string' ? hashRaw : ''
    const startOffset = Math.max(0, readNumber(h.startOffset ?? h.start_offset, 0))
    const endOffset = Math.max(startOffset, readNumber(h.endOffset ?? h.end_offset, 0))

    if (n === 0) continue

    let resolvedIndex = -1
    let status = 'fallback'

    if (
      requestedIndex >= 0 &&
      requestedIndex < n &&
      hash &&
      hashes[requestedIndex] === hash
    ) {
      resolvedIndex = requestedIndex
      status = 'exact'
    } else if (hash) {
      const found = hashes.findIndex((value) => value && value === hash)
      if (found >= 0) {
        resolvedIndex = found
        status = 'rehashed'
      }
    }

    if (resolvedIndex < 0) {
      resolvedIndex = Math.max(0, Math.min(requestedIndex, n - 1))
      status = 'fallback'
    }

    const text = items[resolvedIndex].text
    const safeStart = Math.max(0, Math.min(startOffset, text.length))
    const safeEnd = Math.max(safeStart, Math.min(endOffset, text.length))

    resolved.push({
      id: h.id ?? null,
      status,
      paragraphIndex: resolvedIndex,
      requestedParagraphIndex: requestedIndex,
      startOffset: safeStart,
      endOffset: safeEnd,
      content: typeof h.content === 'string' ? h.content : text.slice(safeStart, safeEnd),
      color: readColor(h.color),
      tooltip: status === 'fallback' ? FALLBACK_TOOLTIP : '',
      note: h.note || '',
    })
  }

  // Stable ordering: paragraphIndex asc, startOffset asc.
  resolved.sort((a, b) => a.paragraphIndex - b.paragraphIndex || a.startOffset - b.startOffset)

  const segmentsByIndex = items.map((paragraph, i) => {
    const text = paragraph.text
    const myHls = resolved.filter((r) => r.paragraphIndex === i)
    if (myHls.length === 0) return [{ type: 'text', text }]
    // Each highlight always emits its own <mark> segment so overlapping
    // ranges still appear in the rendered output. We interleave text gaps
    // between non-overlapping ranges based on a running `lastEnd` cursor.
    const segs = []
    let lastEnd = 0
    for (const h of myHls) {
      if (h.startOffset > lastEnd) {
        segs.push({ type: 'text', text: text.slice(lastEnd, h.startOffset) })
      }
      segs.push({
        type: 'mark',
        id: h.id,
        color: h.color,
        status: h.status,
        text: text.slice(h.startOffset, h.endOffset),
        tooltip: h.tooltip,
        note: h.note,
      })
      lastEnd = Math.max(lastEnd, h.endOffset)
    }
    if (lastEnd < text.length) segs.push({ type: 'text', text: text.slice(lastEnd) })
    return segs
  })

  return { resolved, segmentsByIndex }
}

function clearInjectedMarks(el) {
  el.querySelectorAll('mark[data-highlight-id]').forEach((mark) => {
    const parent = mark.parentNode
    if (!parent) return
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
  })
  el.normalize?.()
}

function buildSegmentNodes(segments) {
  const fragment = document.createDocumentFragment()
  for (const seg of segments) {
    if (seg.type === 'mark') {
      const mark = document.createElement('mark')
      mark.dataset.highlightId = String(seg.id ?? '')
      mark.className = `hl-${seg.color || 'yellow'}`
      mark.dataset.anchorStatus = seg.status
      if (seg.tooltip) mark.dataset.tooltip = seg.tooltip
      if (seg.status === 'fallback') mark.classList.add('hl-fallback')
      mark.textContent = seg.text
      fragment.appendChild(mark)
    } else {
      fragment.appendChild(document.createTextNode(seg.text))
    }
  }
  return fragment
}

function rewriteParagraphElement(el, segments) {
  if (!el || !segments) return
  clearInjectedMarks(el)
  const directTextNodes = Array.from(el.childNodes).filter((n) => n.nodeType === 3)
  if (!directTextNodes.length) {
    // Nothing to rewrite (paragraph contains only element children).
    return
  }
  const firstText = directTextNodes[0]
  const fragment = buildSegmentNodes(segments)
  el.insertBefore(fragment, firstText)
  directTextNodes.forEach((node) => node.remove())
}

export function useHighlightRenderer({ containerRef, novelId, chapterId, paragraphsRef } = {}) {
  const store = useHighlightsStore()
  const highlights = ref([])
  const isRendering = ref(false)

  async function fetchAndCache(force = false) {
    const nid = readNumber(unref(novelId), 0)
    const cid = readNumber(unref(chapterId), 0)
    if (!nid || !cid) {
      highlights.value = []
      return []
    }
    try {
      const list = await store.fetchByChapter(nid, cid, { force })
      highlights.value = Array.isArray(list) ? list : []
    } catch {
      highlights.value = []
    }
    return highlights.value
  }

  async function renderToDOM() {
    isRendering.value = true
    try {
      await nextTick()
      const container = unref(containerRef)
      if (!container) return
      const paragraphs = normalizeParagraphs(unref(paragraphsRef) || [])
      if (!paragraphs.length) return
      const hashes = await Promise.all(paragraphs.map((text) => computeParagraphHash(text)))
      const items = paragraphs.map((text, i) => ({ text, hash: hashes[i] }))
      const { segmentsByIndex } = resolveHighlightsForChapter({
        paragraphs: items,
        paragraphHashes: hashes,
        highlights: highlights.value,
      })
      items.forEach((_, i) => {
        const el = container.querySelector(`[data-paragraph-index="${i}"]`)
        if (!el) return
        rewriteParagraphElement(el, segmentsByIndex[i])
      })
    } finally {
      isRendering.value = false
    }
  }

  async function refresh({ force = false } = {}) {
    await fetchAndCache(force)
    await renderToDOM()
  }

  const stopWatchKeys = watch(
    [() => unref(novelId), () => unref(chapterId)],
    () => { refresh({ force: false }) },
    { immediate: true }
  )

  const stopWatchParas = watch(
    () => {
      const value = unref(paragraphsRef)
      return Array.isArray(value) ? value.length : 0
    },
    () => { renderToDOM() },
    { flush: 'post' }
  )

  onBeforeUnmount(() => {
    stopWatchKeys()
    stopWatchParas()
  })

  return {
    highlights,
    isRendering,
    refresh,
    renderToDOM,
    resolveHighlightsForChapter,
  }
}

export default useHighlightRenderer
