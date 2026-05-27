<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const days = ['一', '二', '三', '四', '五', '六', '日']
const today = new Date().getDay() || 7

const rows = computed(() => {
  const source = props.data.map((item, index) => ({
    day: item.day || days[index] || '',
    minutes: Number(item.minutes ?? item.duration ?? item.readTime ?? item.value ?? 0),
    today: item.today ?? index + 1 === today,
  }))
  const normalized = days.map((day, index) => source[index] || { day, minutes: 0, today: index + 1 === today })
  const max = Math.max(...normalized.map(item => item.minutes), 0)
  return normalized.map(item => ({
    ...item,
    pct: max ? Math.max(8, Math.round(item.minutes / max * 100)) : 0,
  }))
})

const total = computed(() => rows.value.reduce((sum, item) => sum + item.minutes, 0))
</script>

<template>
  <div>
    <div v-if="total" class="flex items-end justify-between gap-2 h-28 sm:h-32 mb-3">
      <div v-for="(item, index) in rows" :key="index" class="flex-1 flex flex-col items-center gap-1.5">
        <div
          :class="['w-full rounded-t transition-all', item.today ? 'bg-clay-500' : 'bg-clay-500/40']"
          :style="{ height: item.pct + '%' }"
        ></div>
        <span :class="['text-[10px]', item.today ? 'text-clay-700 font-medium' : 'text-ink-500']">{{ item.day }}</span>
      </div>
    </div>
    <div v-else class="py-8 text-center">
      <p class="text-sm text-ink-500 dark:text-ink-300">本周还没有阅读记录，去打开一本书吧 →</p>
      <RouterLink to="/" class="inline-block mt-3 px-4 py-2 rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 text-sm">去首页</RouterLink>
    </div>
  </div>
</template>
