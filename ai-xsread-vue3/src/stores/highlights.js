/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 23.4 — Pinia store: highlights cache by chapterId (5-minute TTL).
 */
import { defineStore } from 'pinia'
import { listChapterHighlights } from '@/api/highlights'

const TTL_MS = 5 * 60 * 1000

function cacheKey(novelId, chapterId) {
  return `${novelId || 0}::${chapterId || 0}`
}

export const useHighlightsStore = defineStore('highlights', {
  state: () => ({
    /** Map<key, { items: Highlight[], fetchedAt: number, novelId, chapterId }> */
    cache: new Map(),
    /** Map<key, Promise> single-flight guard */
    inflight: new Map(),
  }),
  actions: {
    getCached(novelId, chapterId) {
      const entry = this.cache.get(cacheKey(novelId, chapterId))
      if (!entry) return null
      if (Date.now() - entry.fetchedAt > TTL_MS) return null
      return entry.items
    },
    invalidate(chapterId) {
      if (chapterId === undefined || chapterId === null) {
        this.cache.clear()
        return
      }
      const target = String(chapterId)
      const remove = []
      this.cache.forEach((_value, key) => {
        const parts = key.split('::')
        if (parts[1] === target) remove.push(key)
      })
      remove.forEach((key) => this.cache.delete(key))
    },
    async fetchByChapter(novelId, chapterId, { force = false } = {}) {
      const key = cacheKey(novelId, chapterId)
      if (!force) {
        const cached = this.getCached(novelId, chapterId)
        if (cached) return cached
        if (this.inflight.has(key)) return this.inflight.get(key)
      }

      const promise = (async () => {
        try {
          const res = await listChapterHighlights({ novelId, chapterId })
          const list = res?.code === 200
            ? Array.isArray(res.data) ? res.data : (res.data?.list || res.data?.highlights || [])
            : []
          this.cache.set(key, {
            items: list,
            fetchedAt: Date.now(),
            novelId,
            chapterId,
          })
          return list
        } finally {
          this.inflight.delete(key)
        }
      })()
      this.inflight.set(key, promise)
      return promise
    },
    upsertLocal(highlight) {
      if (!highlight) return
      const novelId = Number(highlight.novelId ?? highlight.novel_id)
      const chapterId = Number(highlight.chapterId ?? highlight.chapter_id)
      if (!chapterId) return
      const key = cacheKey(novelId, chapterId)
      const entry = this.cache.get(key)
      if (!entry) return
      const idx = entry.items.findIndex((it) => Number(it.id) === Number(highlight.id))
      if (idx >= 0) entry.items.splice(idx, 1, { ...entry.items[idx], ...highlight })
      else entry.items.push(highlight)
    },
    removeLocal(novelId, chapterId, highlightId) {
      const key = cacheKey(novelId, chapterId)
      const entry = this.cache.get(key)
      if (!entry) return
      entry.items = entry.items.filter((it) => Number(it.id) !== Number(highlightId))
    },
  },
})

export default useHighlightsStore
