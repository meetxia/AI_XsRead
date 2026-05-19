import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/api/notifications'
import { useUserStore } from '@/stores/user'

export const useNotificationStore = defineStore('notification', () => {
  // ── State ────────────────────────────────────────────────
  const list = ref([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const unreadCount = ref(0)
  const loading = ref(false)

  const hasUnread = computed(() => unreadCount.value > 0)

  function getUserSafe() {
    try {
      return useUserStore()
    } catch (err) {
      return null
    }
  }

  /** 拉列表（默认第一页 20 条） */
  async function fetchList({ page: nextPage = 1, pageSize: nextPageSize = 20, onlyUnread = false } = {}) {
    const userStore = getUserSafe()
    if (!userStore || !userStore.isLogin) {
      list.value = []
      total.value = 0
      return
    }
    loading.value = true
    try {
      const res = await listNotifications({
        page: nextPage,
        pageSize: nextPageSize,
        onlyUnread: onlyUnread ? 1 : 0,
      })
      const data = res?.data || {}
      list.value = Array.isArray(data.list) ? data.list : []
      total.value = Number(data.total) || 0
      page.value = Number(data.page) || nextPage
      pageSize.value = Number(data.pageSize) || nextPageSize
    } catch (err) {
      console.warn('[notification] fetchList failed', err)
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  /** 拉未读数（不轮询；仅在登录态变化、进入相关页时调用） */
  async function fetchUnreadCount() {
    const userStore = getUserSafe()
    if (!userStore || !userStore.isLogin) {
      unreadCount.value = 0
      return
    }
    try {
      const res = await getUnreadCount()
      const c = Number(res?.data?.count)
      unreadCount.value = Number.isFinite(c) ? c : 0
    } catch (err) {
      console.warn('[notification] fetchUnreadCount failed', err)
    }
  }

  /** 标记单条已读 */
  async function markRead(id) {
    const target = list.value.find((item) => String(item.id) === String(id))
    if (target && (target.isRead === 1 || target.isRead === true)) {
      // 已经读过，无需调接口
      return
    }
    try {
      await markNotificationRead(id)
      if (target) {
        target.isRead = 1
        target.readAt = new Date().toISOString()
      }
      if (unreadCount.value > 0) unreadCount.value -= 1
    } catch (err) {
      console.warn('[notification] markRead failed', err)
      throw err
    }
  }

  /** 全部已读 */
  async function markAllRead() {
    try {
      const res = await markAllNotificationsRead()
      list.value = list.value.map((item) => ({
        ...item,
        isRead: 1,
        readAt: item.readAt || new Date().toISOString(),
      }))
      unreadCount.value = 0
      return res?.data?.affected ?? 0
    } catch (err) {
      console.warn('[notification] markAllRead failed', err)
      throw err
    }
  }

  /** 登出 / 切账号清空 */
  function reset() {
    list.value = []
    total.value = 0
    page.value = 1
    pageSize.value = 20
    unreadCount.value = 0
  }

  return {
    list,
    total,
    page,
    pageSize,
    unreadCount,
    loading,
    hasUnread,
    fetchList,
    fetchUnreadCount,
    markRead,
    markAllRead,
    reset,
  }
})
