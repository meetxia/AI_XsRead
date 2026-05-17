/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 27.2 — useFollowAuthor composable
 *
 * Acceptance:
 * - Reactive state: following, loading, followerCount
 * - loadStatus() calls GET /api/authors/:authorId (optionalAuth, anon-safe)
 * - toggle() flips state; POST /follow when following=false, else DELETE
 * - Optimistic update + rollback on error
 * - Unauthenticated → buildLoginUrl(currentPath) redirect
 * - Per-authorId cache (Map) shared across components in one session
 *
 * Validates: Requirements 23.2, 23.3, 23.4, 23.6, 32.2, 28.1
 */
import { computed, ref } from 'vue'
import { getAuthor, followAuthor, unfollowAuthor } from '@/api/authors'
import { useUserStore } from '@/stores/user'
import { buildLoginUrl } from '@/composables/useReturnUrl'

// Module-level cache shared across composable callers within one session.
const cache = new Map()

function ensureEntry(authorId) {
  const key = String(authorId)
  if (!cache.has(key)) {
    cache.set(key, {
      following: ref(false),
      loading: ref(false),
      followerCount: ref(0),
      loaded: ref(false),
      loadingPromise: null,
    })
  }
  return cache.get(key)
}

function unwrapAuthor(payload) {
  if (!payload) return null
  if (payload.code !== undefined && payload.code !== 200) return null
  return payload.data ?? payload
}

function readFollowerCount(data) {
  if (!data) return 0
  const candidates = [
    data.followerCount,
    data.follower_count,
    data.followers,
    data.followers_count,
    data.fans,
    data.fan_count,
  ]
  for (const value of candidates) {
    if (value === null || value === undefined) continue
    const n = Number(value)
    if (Number.isFinite(n)) return Math.max(0, n)
  }
  return 0
}

function readIsFollowing(data) {
  if (!data) return false
  return Boolean(data.isFollowing ?? data.is_following ?? data.following ?? false)
}

function safeCurrentPath() {
  if (typeof window === 'undefined' || !window.location) return '/'
  const { pathname = '/', search = '', hash = '' } = window.location
  return `${pathname}${search}${hash}` || '/'
}

function redirectToLogin(router) {
  const url = buildLoginUrl(safeCurrentPath())
  if (router && typeof router.push === 'function') {
    router.push(url)
  } else if (typeof window !== 'undefined') {
    window.location.href = url
  }
}

/**
 * Reset cached state for tests / explicit invalidation.
 * @param {string|number|null} authorId
 */
export function resetFollowAuthorCache(authorId = null) {
  if (authorId === null || authorId === undefined) {
    cache.clear()
    return
  }
  cache.delete(String(authorId))
}

export function useFollowAuthor(authorId, options = {}) {
  if (authorId === null || authorId === undefined || authorId === '') {
    throw new Error('useFollowAuthor: authorId is required')
  }

  const { router = null } = options
  const entry = ensureEntry(authorId)
  const userStore = useUserStore()

  const isLoggedIn = () => Boolean(userStore?.isLogin)

  async function loadStatus({ force = false } = {}) {
    if (!force && entry.loaded.value && !entry.loadingPromise) {
      return {
        following: entry.following.value,
        followerCount: entry.followerCount.value,
      }
    }
    if (entry.loadingPromise) return entry.loadingPromise

    entry.loading.value = true
    entry.loadingPromise = (async () => {
      try {
        const res = await getAuthor(authorId)
        const data = unwrapAuthor(res)
        if (data) {
          entry.following.value = readIsFollowing(data)
          entry.followerCount.value = readFollowerCount(data)
        } else {
          entry.following.value = false
        }
        entry.loaded.value = true
        return {
          following: entry.following.value,
          followerCount: entry.followerCount.value,
        }
      } catch (err) {
        // optionalAuth semantics — don't blow up for anonymous users.
        entry.loaded.value = true
        return {
          following: entry.following.value,
          followerCount: entry.followerCount.value,
        }
      } finally {
        entry.loading.value = false
        entry.loadingPromise = null
      }
    })()
    return entry.loadingPromise
  }

  async function toggle() {
    if (!isLoggedIn()) {
      redirectToLogin(router)
      return { redirected: true }
    }
    if (entry.loading.value) {
      return { skipped: true }
    }

    const previousFollowing = entry.following.value
    const previousCount = entry.followerCount.value
    const optimisticFollowing = !previousFollowing
    const optimisticCount = Math.max(0, previousCount + (optimisticFollowing ? 1 : -1))

    entry.following.value = optimisticFollowing
    entry.followerCount.value = optimisticCount
    entry.loading.value = true

    try {
      if (previousFollowing) {
        await unfollowAuthor(authorId)
      } else {
        await followAuthor(authorId)
      }
      return { ok: true, following: entry.following.value }
    } catch (err) {
      // Rollback on failure.
      entry.following.value = previousFollowing
      entry.followerCount.value = previousCount
      throw err
    } finally {
      entry.loading.value = false
    }
  }

  return {
    following: entry.following,
    loading: entry.loading,
    followerCount: entry.followerCount,
    loaded: computed(() => entry.loaded.value),
    loadStatus,
    toggle,
  }
}

export default useFollowAuthor
