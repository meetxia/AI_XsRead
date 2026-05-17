<script setup>
/**
 * 会员等级徽章（小芯片样式）
 *
 *  level: 0 普通 / 1 月卡 / 2 年卡 / 3 永久
 *  isActive: true 才显示彩色，否则灰
 *  size: 'sm' | 'md'
 *  showLabel: true 显示文字
 */
import { computed } from 'vue'

const props = defineProps({
  level: { type: [Number, String], default: 0 },
  isActive: { type: Boolean, default: true },
  size: { type: String, default: 'sm' },
  showLabel: { type: Boolean, default: true }
})

const lv = computed(() => Number(props.level) || 0)

const meta = computed(() => {
  if (lv.value === 3) {
    return {
      label: '永久',
      icon: '👑',
      cls: 'bg-gradient-to-r from-amber-300 via-pink-300 to-violet-400 text-night-900'
    }
  }
  if (lv.value === 2) {
    return {
      label: '年卡',
      icon: '★',
      cls: 'bg-gradient-to-r from-amber-300 to-yellow-500 text-night-900'
    }
  }
  if (lv.value === 1) {
    return {
      label: '月卡',
      icon: '☾',
      cls: 'bg-amber-200/80 text-amber-900 dark:bg-amber-300/80 dark:text-night-900'
    }
  }
  return {
    label: '普通',
    icon: '·',
    cls: 'bg-cream-200 text-ink-500 dark:bg-night-700 dark:text-ink-300'
  }
})

const sizing = computed(() => (
  props.size === 'md'
    ? 'h-7 px-2.5 text-xs gap-1.5'
    : 'h-5 px-1.5 text-[10px] gap-1'
))

const finalCls = computed(() => {
  if (lv.value === 0 || !props.isActive) {
    return 'bg-cream-200 text-ink-500 dark:bg-night-700 dark:text-ink-300'
  }
  return meta.value.cls
})
</script>

<template>
  <span
    v-if="lv > 0 || showLabel"
    :class="[
      'inline-flex items-center rounded-full font-medium tracking-wide select-none',
      sizing,
      finalCls
    ]"
    :aria-label="`会员等级 ${meta.label}`"
  >
    <span aria-hidden="true">{{ meta.icon }}</span>
    <span v-if="showLabel">{{ isActive || lv === 0 ? meta.label : `${meta.label}·已停用` }}</span>
  </span>
</template>
