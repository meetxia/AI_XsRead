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
  const toWholeMinutes = (value) => Math.floor(Math.max(0, Number(value) || 0) / 60)
  const readMinutes = (value, secondsValue) => {
    if (secondsValue !== undefined && secondsValue !== null) return toWholeMinutes(secondsValue)
    return Math.max(0, Number(value) || 0)
  }
  const totalMinutes = computed(() => {
    const readTime = stats.value?.readTime || {}
    return readMinutes(readTime.total ?? stats.value?.totalReadingMinutes ?? 0, readTime.totalSeconds)
  })
  const todayMinutes = computed(() => {
    const readTime = stats.value?.readTime || {}
    return readMinutes(readTime.today || 0, readTime.todaySeconds)
  })
  const joinDays = computed(() => stats.value?.joinDays ?? 0)
  const weekTrend = computed(() => {
    const source = stats.value?.readingTrend || stats.value?.weekData || []
    return source.map((item) => {
      const minutes = readMinutes(
        item.minutes ?? item.readTime ?? item.duration ?? item.value ?? 0,
        item.readTimeSeconds ?? item.durationSeconds
      )
      return {
        ...item,
        minutes,
        duration: minutes,
      }
    })
  })
  const weeklyBooks = computed(() => {
    const source = stats.value?.weeklyBooks || []
    return source.map((item) => {
      const minutes = readMinutes(
        item.minutes ?? item.readTime ?? item.duration ?? 0,
        item.readTimeSeconds ?? item.durationSeconds
      )
      return {
        ...item,
        novelId: item.novelId ?? item.novel_id,
        lastReadTime: item.lastReadTime ?? item.last_read_time,
        chaptersRead: item.chaptersRead ?? item.chapters_read ?? 0,
        minutes,
      }
    })
  })

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
    weeklyBooks,
    formatMinutes,
    loadStats,
  }
}
