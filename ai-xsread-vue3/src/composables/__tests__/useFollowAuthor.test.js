/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 27.2 — useFollowAuthor composable tests
 *
 * Coverage:
 *  - Initial loadStatus sets `following` from response
 *  - toggle flips and calls correct endpoint, rollback on rejection
 *  - Unauthenticated toggle redirects to login
 *  - Cache: same authorId shares state between calls
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/authors', () => ({
  getAuthor: vi.fn(),
  followAuthor: vi.fn(),
  unfollowAuthor: vi.fn(),
  listAuthorNovels: vi.fn(),
  listFollowingAuthors: vi.fn(),
}))

const userState = { isLogin: true }
vi.mock('@/stores/user', () => ({
  useUserStore: () => userState,
}))

import { getAuthor, followAuthor, unfollowAuthor } from '@/api/authors'
import { useFollowAuthor, resetFollowAuthorCache } from '../useFollowAuthor'

describe('useFollowAuthor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFollowAuthorCache()
    userState.isLogin = true
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { pathname: '/novel/42', search: '', hash: '', href: 'http://localhost/novel/42' },
      })
    }
  })

  afterEach(() => {
    resetFollowAuthorCache()
  })

  it('throws when authorId is missing', () => {
    expect(() => useFollowAuthor(null)).toThrow(/authorId/)
    expect(() => useFollowAuthor('')).toThrow(/authorId/)
  })

  it('loadStatus reflects isFollowing and followerCount from response', async () => {
    getAuthor.mockResolvedValueOnce({
      code: 200,
      data: { id: 1, name: '南风晚晚', isFollowing: true, followerCount: 1234 },
    })

    const { following, followerCount, loadStatus } = useFollowAuthor(1)
    await loadStatus()

    expect(getAuthor).toHaveBeenCalledWith(1)
    expect(following.value).toBe(true)
    expect(followerCount.value).toBe(1234)
  })

  it('loadStatus tolerates anonymous users (no error thrown)', async () => {
    userState.isLogin = false
    getAuthor.mockRejectedValueOnce(new Error('401'))

    const { following, loadStatus } = useFollowAuthor(2)
    await expect(loadStatus()).resolves.toBeDefined()
    expect(following.value).toBe(false)
  })

  it('toggle calls follow endpoint when not following', async () => {
    getAuthor.mockResolvedValueOnce({
      code: 200,
      data: { isFollowing: false, followerCount: 10 },
    })
    followAuthor.mockResolvedValueOnce({ code: 200, data: { following: true } })

    const { following, followerCount, loadStatus, toggle } = useFollowAuthor(3)
    await loadStatus()
    expect(following.value).toBe(false)

    const result = await toggle()
    expect(followAuthor).toHaveBeenCalledWith(3)
    expect(unfollowAuthor).not.toHaveBeenCalled()
    expect(following.value).toBe(true)
    expect(followerCount.value).toBe(11)
    expect(result.ok).toBe(true)
  })

  it('toggle calls unfollow endpoint when already following', async () => {
    getAuthor.mockResolvedValueOnce({
      code: 200,
      data: { isFollowing: true, followerCount: 200 },
    })
    unfollowAuthor.mockResolvedValueOnce({ code: 200, data: { following: false } })

    const { following, followerCount, loadStatus, toggle } = useFollowAuthor(4)
    await loadStatus()
    expect(following.value).toBe(true)

    await toggle()
    expect(unfollowAuthor).toHaveBeenCalledWith(4)
    expect(followAuthor).not.toHaveBeenCalled()
    expect(following.value).toBe(false)
    expect(followerCount.value).toBe(199)
  })

  it('rolls back optimistic state when API rejects', async () => {
    getAuthor.mockResolvedValueOnce({
      code: 200,
      data: { isFollowing: false, followerCount: 5 },
    })
    followAuthor.mockRejectedValueOnce(new Error('network'))

    const { following, followerCount, loadStatus, toggle } = useFollowAuthor(5)
    await loadStatus()

    await expect(toggle()).rejects.toThrow('network')
    expect(following.value).toBe(false)
    expect(followerCount.value).toBe(5)
  })

  it('redirects to login when user is not authenticated and toggle is called', async () => {
    userState.isLogin = false
    const push = vi.fn()
    const router = { push }

    const { toggle } = useFollowAuthor(6, { router })
    const result = await toggle()

    expect(result.redirected).toBe(true)
    expect(push).toHaveBeenCalledTimes(1)
    expect(push.mock.calls[0][0]).toMatch(/^\/login\?returnUrl=/)
    expect(followAuthor).not.toHaveBeenCalled()
    expect(unfollowAuthor).not.toHaveBeenCalled()
  })

  it('shares state across components using same authorId', async () => {
    getAuthor.mockResolvedValueOnce({
      code: 200,
      data: { isFollowing: false, followerCount: 0 },
    })
    followAuthor.mockResolvedValueOnce({ code: 200, data: { following: true } })

    const a = useFollowAuthor(7)
    const b = useFollowAuthor(7)

    await a.loadStatus()
    expect(b.following.value).toBe(false)

    await a.toggle()
    expect(a.following.value).toBe(true)
    expect(b.following.value).toBe(true)
    expect(b.followerCount.value).toBe(1)
  })

  it('treats existing in-flight loadStatus as single-flight', async () => {
    let resolveFn
    const pending = new Promise((resolve) => {
      resolveFn = resolve
    })
    getAuthor.mockReturnValueOnce(pending)

    const { loadStatus } = useFollowAuthor(8)
    const p1 = loadStatus()
    const p2 = loadStatus()

    expect(getAuthor).toHaveBeenCalledTimes(1)

    resolveFn({ code: 200, data: { isFollowing: true, followerCount: 9 } })
    await Promise.all([p1, p2])

    expect(getAuthor).toHaveBeenCalledTimes(1)
  })
})
