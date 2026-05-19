import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/notifications', () => ({
  listNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}))

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  changePassword: vi.fn(),
}))

vi.mock('@/api/user', () => ({
  uploadAvatarApi: vi.fn(),
  updateUserProfile: vi.fn(),
}))

import { useNotificationStore } from '@/stores/notification'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications'

describe('notification store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('clears list state and unread count when fetchList runs while logged out', async () => {
    const notification = useNotificationStore()
    notification.list = [{ id: 1, isRead: 0 }]
    notification.total = 1
    notification.unreadCount = 1

    await notification.fetchList()

    expect(listNotifications).not.toHaveBeenCalled()
    expect(notification.list).toEqual([])
    expect(notification.total).toBe(0)
    expect(notification.unreadCount).toBe(0)
  })

  it('reset clears list state and unread count', () => {
    const notification = useNotificationStore()
    notification.list = [{ id: 1, isRead: 0 }]
    notification.total = 1
    notification.page = 3
    notification.pageSize = 10
    notification.unreadCount = 5

    notification.reset()

    expect(notification.list).toEqual([])
    expect(notification.total).toBe(0)
    expect(notification.page).toBe(1)
    expect(notification.pageSize).toBe(20)
    expect(notification.unreadCount).toBe(0)
  })

  it('does not call API again for an already-read notification', async () => {
    const notification = useNotificationStore()
    notification.list = [{ id: 7, isRead: 1, readAt: '2026-05-19T00:00:00.000Z' }]
    notification.unreadCount = 3

    await notification.markRead(7)

    expect(markNotificationRead).not.toHaveBeenCalled()
    expect(notification.unreadCount).toBe(3)
  })

  it('markAllRead marks every item as read and clears unread count', async () => {
    markAllNotificationsRead.mockResolvedValueOnce({ data: { affected: 2 } })
    const notification = useNotificationStore()
    notification.list = [
      { id: 1, isRead: 0, readAt: null },
      { id: 2, isRead: false, readAt: null },
    ]
    notification.unreadCount = 2

    const affected = await notification.markAllRead()

    expect(affected).toBe(2)
    expect(markAllNotificationsRead).toHaveBeenCalledTimes(1)
    expect(notification.list.every((item) => item.isRead === 1)).toBe(true)
    expect(notification.list.every((item) => item.readAt)).toBe(true)
    expect(notification.unreadCount).toBe(0)
  })
})
