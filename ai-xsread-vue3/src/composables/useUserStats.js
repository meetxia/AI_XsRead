import { computed, ref } from 'vue'
import { getUserStatistics } from '@/api/user'

export function useUserStats() {
  const stats = ref(null)
  const loading = ref(false)

  async function loadStats() {
    loading.value = true
    try {
      const res = await getUserStatistics()
      stats.value = res?.code === 200 ? (res.data || {}) : {}
    } catch (error) {
      stats.value = {}
    } finally {
      loading.value = false
    }
  }

  const shelfCount = computed(() => stats.value?.bookshelf?.total ?? stats.value?.shelf ?? 0)
  const readingStreak = computed(() => stats.value?.readingStreak ?? stats.value?.streak ?? 0)
  const totalMinutes = computed(() => {
    const readTime = stats.value?.readTime || {}
    return Number(readTime.total ?? stats.value?.totalReadingMinutes ?? 0)
  })
  const todayMinutes = computed(() => Number(stats.value?.readTime?.today || 0))
  const joinDays = computed(() => stats.value?.joinDays ?? 0)
  const weekTrend = computed(() => stats.value?.readingTrend || stats.value?.weekData || [])

  function formatMinutes(minutes) {
    const value = Math.max(0, Math.floor(Number(minutes) || 0))
    if (value < 60) return `${value}m`
    return `${Math.floor(value / 60)}h`
  }

  return {
    stats,
    loading,
    shelfCount,
    readingStreak,
    totalMinutes,
    todayMinutes,
    joinDays,
    weekTrend,
    formatMinutes,
    loadStats,
  }
}
