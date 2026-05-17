import { computed, ref } from 'vue'
import { listAchievements } from '@/api/achievements'

export function useAchievements() {
  const achievements = ref([])
  const summary = ref({ unlocked: 0, total: 0 })
  const loading = ref(false)

  const unlocked = computed(() => achievements.value.filter(item => item.unlockedAt || item.unlocked_at))
  const locked = computed(() => achievements.value.filter(item => !(item.unlockedAt || item.unlocked_at)))

  async function loadAchievements() {
    loading.value = true
    try {
      const res = await listAchievements()
      if (res?.code === 200) {
        const data = res.data || {}
        achievements.value = Array.isArray(data) ? data : (data.achievements || data.list || [])
        summary.value = data.summary || {
          unlocked: unlocked.value.length,
          total: achievements.value.length,
        }
      }
    } finally {
      loading.value = false
    }
  }

  return {
    achievements,
    unlocked,
    locked,
    summary,
    loading,
    loadAchievements,
  }
}
