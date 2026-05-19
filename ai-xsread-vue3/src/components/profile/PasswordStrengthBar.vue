<script setup>
/**
 * 密码强度指示条
 *
 * 强度计算：
 *   - 长度 >= 8 +1
 *   - 含字母（a-z / A-Z）+1
 *   - 含数字 +1
 *   - 含特殊符号 +1
 * 总分 0-4：
 *   0-1 弱（红）
 *   2-3 中（橙）
 *   4   强（绿）
 *
 * 仅信息性展示，不阻止保存。
 */
import { computed } from 'vue'

const props = defineProps({
  password: { type: String, default: '' }
})

const score = computed(() => {
  const pwd = props.password || ''
  if (!pwd) return 0
  let s = 0
  if (pwd.length >= 8) s++
  if (/[A-Za-z]/.test(pwd)) s++
  if (/\d/.test(pwd)) s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  return s
})

const level = computed(() => {
  if (!props.password) return 'empty'
  if (score.value <= 1) return 'weak'
  if (score.value <= 3) return 'medium'
  return 'strong'
})

const label = computed(() => {
  switch (level.value) {
    case 'weak': return '弱'
    case 'medium': return '中'
    case 'strong': return '强'
    default: return '请输入新密码'
  }
})

const barWidth = computed(() => {
  switch (level.value) {
    case 'weak': return '33%'
    case 'medium': return '66%'
    case 'strong': return '100%'
    default: return '0%'
  }
})

const barColor = computed(() => {
  switch (level.value) {
    case 'weak': return 'bg-cinnabar-500'
    case 'medium': return 'bg-amber-500'
    case 'strong': return 'bg-emerald-500'
    default: return 'bg-cream-200 dark:bg-night-700'
  }
})

const textColor = computed(() => {
  switch (level.value) {
    case 'weak': return 'text-cinnabar-500'
    case 'medium': return 'text-amber-500'
    case 'strong': return 'text-emerald-500'
    default: return 'text-ink-500 dark:text-ink-300'
  }
})
</script>

<template>
  <div class="mt-1.5" aria-live="polite">
    <div class="h-1.5 w-full rounded-full bg-cream-200 dark:bg-night-700 overflow-hidden">
      <div
        class="h-full transition-all duration-300 ease-out"
        :class="barColor"
        :style="{ width: barWidth }"
      ></div>
    </div>
    <p class="mt-1 text-[11px]" :class="textColor">
      密码强度：{{ label }}
      <span v-if="level !== 'empty'" class="ml-1 text-ink-500 dark:text-ink-300">
        建议含字母、数字、特殊符号且长度 ≥ 8
      </span>
    </p>
  </div>
</template>
