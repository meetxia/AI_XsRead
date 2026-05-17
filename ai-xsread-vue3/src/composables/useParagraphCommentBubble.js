/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 26.4 — useParagraphCommentBubble composable
 *
 * Wraps `paragraphCommentsStore` with a (novelId, chapterId)-bound API used by
 * `ReadingPage.vue` to render `ParagraphCommentBubble` next to every paragraph.
 *
 * Returned shape:
 *   - counts: ComputedRef<Record<number, number>>
 *   - loadCounts({ force }): triggers a fetch (TTL-aware)
 *   - bumpCount(paragraphIndex, delta): optimistic update for create / delete
 *   - invalidate(): drop the cached entry for the current chapter
 *
 * Validates: Requirements 27.2, 27.10
 */
import { computed, unref } from 'vue'
import { useParagraphCommentsStore } from '@/stores/paragraphComments'

function readKey(value) {
  const n = Number(unref(value))
  return Number.isFinite(n) && n > 0 ? n : null
}

export function useParagraphCommentBubble({ novelId, chapterId } = {}) {
  const store = useParagraphCommentsStore()

  const counts = computed(() => {
    const key = readKey(chapterId)
    if (!key) return {}
    const entry = store.getEntry(key)
    return entry?.countsByParagraph || {}
  })

  async function loadCounts({ force = false } = {}) {
    const novel = readKey(novelId)
    const chapter = readKey(chapterId)
    if (!novel || !chapter) return { countsByParagraph: {}, fetchedAt: 0, fromCache: false }
    return store.getCounts(novel, chapter, { force })
  }

  function bumpCount(paragraphIndex, delta) {
    const chapter = readKey(chapterId)
    if (!chapter) return
    store.bumpCount(chapter, paragraphIndex, delta)
  }

  function invalidate() {
    const chapter = readKey(chapterId)
    if (!chapter) return
    store.invalidate(chapter)
  }

  return {
    counts,
    loadCounts,
    bumpCount,
    invalidate,
  }
}

export default useParagraphCommentBubble
