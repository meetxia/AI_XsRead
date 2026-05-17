<script setup>
/**
 * 会员到期倒计时
 *
 *  daysRemaining: number
 *  isPermanent: boolean
 *  level: 0|1|2|3
 *
 * 显示规则：
 *  - 永久 → 金色 "永久会员"
 *  - daysRemaining <= 0 / null → "未开通会员"（灰）
 *  - daysRemaining <= 7 → 红色 "还剩 X 天，请续费"
 *  - daysRemaining > 7 → 灰色 "{level} · 还剩 X 天"
 */
import { computed } from 'vue'

const props = defineProps({
  daysRemaining: { type: [Number, String], default: 0 },
  isPermanent: { type: Boolean, default: false },
  level: { type: [Number, String], default: 0 },
  levelLabel: { type: String, default: '' }
})

const days = computed(() => {
  const n = Number(props.daysRemaining)
  return Number.isFinite(n) ? n : 0
})

const lv = computed(() => Number(props.level) || 0)

const labelFromLevel = (l) => {
  if (l === 1) return '月卡'
  if (l === 2) return '年卡'
  if (l === 3) return '永久'
  return ''
}

const display = computed(() => {
  if (props.isPermanent || lv.value === 3) {
    return {
      tone: 'permanent',
      icon: '👑',
      text: '永久会员'
    }
  }
  if (days.value <= 0) {
    return {
      tone: 'inactive',
      icon: '·',
      text: '未开通会员'
    }
  }
  if (days.value <= 7) {
    return {
      tone: 'warning',
      icon: '⏳',
      text: `还剩 ${days.value} 天，请续费`
    }
  }
  const lab = props.levelLabel || labelFromLevel(lv.value) || '会员'
  return {
    tone: 'normal',
    icon: '·',
    text: `${lab} · 还剩 ${days.value} 天`
  }
})

const wrapCls = computed(() => {
  switch (display.value.tone) {
    case 'permanent':
      return 'bg-gradient-to-r from-amber-300 via-pink-300 to-violet-400 text-night-900'
    case 'warning':
      return 'bg-cinnabar-500/15 text-cinnabar-500'
    case 'normal':
      return 'bg-cream-100 dark:bg-night-800 text-ink-700 dark:text-ink-300'
    case 'inactive':
    default:
      return 'bg-cream-100 dark:bg-night-800 text-ink-500 dark:text-ink-300'
  }
})
</script>

<template>
  <span
    :class="['inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', wrapCls]"
    role="status"
  >
    <span aria-hidden="true">{{ display.icon }}</span>
    <span>{{ display.text }}</span>
  </span>
</template>
