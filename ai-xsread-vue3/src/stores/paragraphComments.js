/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 26.4 — paragraphCommentsStore (Pinia) + 5-minute aggregate cache
 *
 * Per chapter we keep a tiny structure:
 *   { countsByParagraph: { [index: number]: number }, fetchedAt: number }
 *
 * Actions:
 *   - getCounts(novelId, chapterId, { force }): returns the cached map or
 *     fetches `/api/paragraph-comments?novelId=&chapterId=` (aggregate-only)
 *     when the cache miss / TTL exceeded.
 *   - bumpCount(chapterId, paragraphIndex, delta): optimistic local update
 *     for create / soft-delete flows in the comment sheet.
 *   - invalidate(chapterId): drop the cached entry for this chapter.
 *
 * Validates: Requirements 27.2, 27.4, 27.6, 27.10
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAggregatedCount } from '@/api/paragraphComments'

export const PARAGRAPH_COMMENTS_TTL_MS = 5 * 60 * 1000

function normalizeRows(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.list)) return payload.list
  if (Array.isArray(payload.data?.list)) return payload.data.list
  return []
}

function buildCountsMap(rows) {
  const map = {}
  for (const row of rows || []) {
    if (!row) continue
    const index = Number(row.paragraphIndex ?? row.paragraph_index)
    const count = Number(row.count ?? row.total ?? 0)
    if (!Number.isFinite(index) || index < 0) continue
    if (Number.isFinite(count) && count > 0) {
      map[index] = (map[index] || 0) + count
    }
  }
  return map
}

export const useParagraphCommentsStore = defineStore('paragraphComments', () => {
  // Map<chapterId, { countsByParagraph, fetchedAt }>
  const cache = ref(new Map())
  const inflight = ref(new Map())

  function getEntry(chapterId) {
    const key = Number(chapterId)
    if (!Number.isFinite(key) || key <= 0) return null
    return cache.value.get(key) || null
  }

  function isFresh(entry, now = Date.now()) {
    return Boolean(entry && now - Number(entry.fetchedAt || 0) < PARAGRAPH_COMMENTS_TTL_MS)
  }

  function setCounts(chapterId, countsByParagraph) {
    const key = Number(chapterId)
    if (!Number.isFinite(key) || key <= 0) return null
    const entry = {
      countsByParagraph: { ...countsByParagraph },
      fetchedAt: Date.now(),
    }
    cache.value.set(key, entry)
    return entry
  }

  async function getCounts(novelId, chapterId, { force = false } = {}) {
    const key = Number(chapterId)
    if (!Number.isFinite(key) || key <= 0) {
      return { countsByParagraph: {}, fetchedAt: 0, fromCache: false }
    }

    const existing = cache.value.get(key)
    if (!force && isFresh(existing)) {
      return { ...existing, fromCache: true }
    }

    if (inflight.value.has(key)) {
      return inflight.value.get(key)
    }

    const promise = (async () => {
      try {
        const res = await getAggregatedCount(Number(novelId), key)
        const payload = res?.data ?? res
        const rows = normalizeRows(payload)
        const map = buildCountsMap(rows)
        const entry = setCounts(key, map)
        return { ...entry, fromCache: false }
      } catch (err) {
        // Keep an empty cache marker so the page does not re-spam the endpoint
        // when the chapter genuinely has no comments yet.
        const entry = setCounts(key, {})
        return { ...entry, fromCache: false, error: err }
      } finally {
        inflight.value.delete(key)
      }
    })()

    inflight.value.set(key, promise)
    return promise
  }

  function bumpCount(chapterId, paragraphIndex, delta) {
    const key = Number(chapterId)
    const idx = Number(paragraphIndex)
    const step = Number(delta)
    if (!Number.isFinite(key) || key <= 0) return
    if (!Number.isFinite(idx) || idx < 0) return
    if (!Number.isFinite(step) || step === 0) return

    const existing = cache.value.get(key)
    const counts = existing ? { ...existing.countsByParagraph } : {}
    const next = Math.max(0, Number(counts[idx] || 0) + step)
    if (next === 0) {
      delete counts[idx]
    } else {
      counts[idx] = next
    }
    cache.value.set(key, {
      countsByParagraph: counts,
      // Keep the existing TTL so an optimistic bump doesn't reset the freshness
      // window and trigger an unnecessary refetch right after.
      fetchedAt: existing?.fetchedAt || Date.now(),
    })
  }

  function invalidate(chapterId) {
    const key = Number(chapterId)
    if (!Number.isFinite(key) || key <= 0) {
      cache.value.clear()
      inflight.value.clear()
      return
    }
    cache.value.delete(key)
    inflight.value.delete(key)
  }

  function _resetForTests() {
    cache.value.clear()
    inflight.value.clear()
  }

  return {
    cache,
    getEntry,
    isFresh,
    getCounts,
    bumpCount,
    invalidate,
    _resetForTests,
  }
})

export default useParagraphCommentsStore
