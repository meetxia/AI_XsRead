<script setup>
import { computed } from 'vue'
import Icon from '@/components/v2/icons/Icon.vue'

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['click'])

const isRead = computed(() => {
  const v = props.notification?.isRead
  return v === 1 || v === true
})

const iconName = computed(() => {
  const type = props.notification?.type
  if (type === 'membership') return 'starFill'
  if (type === 'achievement') return 'starFill'
  return 'bell'
})

const iconWrapperClass = computed(() => {
  const type = props.notification?.type
  if (type === 'membership') return 'bg-cream-100 text-clay-700 dark:bg-night-700 dark:text-clay-400'
  if (type === 'achievement') return 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
  return 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
})

/**
 * 相对时间：2 分钟前 / 3 小时前 / 昨天 12:30 / 5月18日
 */
function formatRelativeTime(input) {
  if (!input) return ''
  const date = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffSec < 60) return '刚刚'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 86400000
  const ts = date.getTime()
  if (ts >= startOfYesterday && ts < startOfToday) {
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `昨天 ${hh}:${mm}`
  }
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
  }
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

const relativeTime = computed(() => formatRelativeTime(props.notification?.createdAt))

function handleClick() {
  emit('click', props.notification)
}
</script>

<template>
  <button
    type="button"
    @click="handleClick"
    class="w-full text-left rounded-2xl bg-white dark:bg-night-800 shadow-cream p-4 sm:p-5 flex gap-3 sm:gap-4 transition hover:translate-y-[-1px] hover:shadow-cream-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-400 relative"
  >
    <!-- 未读小红点 -->
    <span
      v-if="!isRead"
      class="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-red-500"
      aria-label="未读"
    />

    <!-- 类型 icon -->
    <span
      class="shrink-0 w-10 h-10 rounded-full grid place-items-center"
      :class="iconWrapperClass"
    >
      <Icon :name="iconName" class="w-5 h-5" />
    </span>

    <!-- 主体内容 -->
    <div class="flex-1 min-w-0">
      <div class="flex items-baseline gap-2">
        <h3
          :class="[
            'flex-1 truncate text-sm sm:text-base',
            isRead ? 'font-normal text-ink-700 dark:text-cream-200' : 'font-semibold text-ink-900 dark:text-cream-100'
          ]"
        >
          {{ notification.title }}
        </h3>
        <span class="shrink-0 text-xs text-ink-500">{{ relativeTime }}</span>
      </div>
      <p
        v-if="notification.content"
        class="mt-1 text-xs sm:text-sm text-ink-500 line-clamp-2"
      >{{ notification.content }}</p>
    </div>

    <!-- 链接箭头 -->
    <span v-if="notification.link" class="self-center text-ink-300">
      <Icon name="arrowRight" class="w-4 h-4" />
    </span>
  </button>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
