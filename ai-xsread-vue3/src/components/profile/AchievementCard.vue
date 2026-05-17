<script setup>
/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 29.2: 勋章卡片组件
 *
 * Props:
 *   - achievement: {
 *       code, name|title, description, icon, category,
 *       threshold|target, currentValue, unlocked, unlockedAt
 *     }
 *
 * Validates: Requirements 15.2, 15.3, 15.4
 */
import { computed } from 'vue'

const props = defineProps({
  achievement: {
    type: Object,
    required: true,
  },
})

// 兼容后端返回的多种字段命名（驼峰 / 下划线 / 旧字段）。
const title = computed(
  () => props.achievement.title || props.achievement.name || '未命名勋章'
)

const description = computed(
  () => props.achievement.description || '继续阅读，解锁更多故事印记。'
)

// 兼容 currentValue / current_value、threshold / target 字段命名差异。
const threshold = computed(() => {
  const raw = props.achievement.threshold ?? props.achievement.target ?? 1
  const num = Number(raw)
  return num > 0 ? num : 1
})

const currentValue = computed(() => {
  const raw = props.achievement.currentValue ?? props.achievement.current_value ?? 0
  const num = Number(raw)
  return Number.isFinite(num) && num >= 0 ? num : 0
})

// unlocked 字段：显式 boolean 优先，否则看 unlockedAt 时间戳。
const unlocked = computed(() => {
  if (typeof props.achievement.unlocked === 'boolean') return props.achievement.unlocked
  return Boolean(props.achievement.unlockedAt || props.achievement.unlocked_at)
})

// 进度百分比：min(currentValue / threshold, 1) * 100
const progressPercent = computed(() => {
  const ratio = currentValue.value / threshold.value
  return Math.max(0, Math.min(100, Math.round(ratio * 100)))
})

// 用于测试断言：精确到 4 位小数的浮点比例（0..1）。
const progressRatio = computed(() => {
  const ratio = currentValue.value / threshold.value
  return Math.max(0, Math.min(1, Number(ratio.toFixed(4))))
})

// 解锁时间格式化：YYYY-MM-DD HH:mm
function formatDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${y}-${m}-${d} ${hh}:${mm}`
}

const unlockedAtText = computed(() =>
  formatDate(props.achievement.unlockedAt || props.achievement.unlocked_at)
)

// 优先使用 emoji，其次回退到通用 🏆。
const iconText = computed(() => {
  const raw = props.achievement.icon
  if (typeof raw === 'string' && raw.trim()) return raw
  return unlocked.value ? '🏆' : '🔒'
})
</script>

<template>
  <article
    data-testid="achievement-card"
    :class="[
      'achievement-card relative rounded-2xl p-4 transition-all',
      unlocked
        ? 'bg-cream-100 dark:bg-night-800 ring-1 ring-clay-500/30 shadow-sm'
        : 'bg-cream-100/70 dark:bg-night-800/70 opacity-80'
    ]"
    :data-unlocked="unlocked ? 'true' : 'false'"
    :data-category="achievement.category || ''"
  >
    <div class="flex items-start gap-3">
      <div
        :class="[
          'w-12 h-12 rounded-2xl grid place-items-center shrink-0 text-2xl',
          unlocked
            ? 'bg-clay-500 text-cream-50'
            : 'bg-cream-200 dark:bg-night-700 text-ink-400 dark:text-ink-300'
        ]"
        aria-hidden="true"
      >
        <span data-testid="achievement-icon">{{ iconText }}</span>
      </div>

      <div class="flex-1 min-w-0">
        <h3
          data-testid="achievement-title"
          :class="['font-serif font-semibold truncate', unlocked ? '' : 'text-ink-700 dark:text-ink-200']"
        >
          {{ title }}
        </h3>
        <p
          data-testid="achievement-desc"
          class="mt-1 text-xs text-ink-500 dark:text-ink-300 line-clamp-2"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <!-- 解锁后展示解锁时间，未解锁则展示进度条 + X / Y -->
    <p
      v-if="unlocked && unlockedAtText"
      data-testid="achievement-unlocked-at"
      class="mt-3 text-[11px] text-clay-700 dark:text-clay-400"
    >
      解锁时间 {{ unlockedAtText }}
    </p>

    <div v-else class="mt-3">
      <div
        class="h-1.5 rounded-full bg-cream-200 dark:bg-night-700 overflow-hidden"
        role="progressbar"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          data-testid="achievement-progress-bar"
          class="h-full bg-clay-500 dark:bg-clay-400 rounded-full transition-[width] duration-500"
          :style="{ width: progressPercent + '%' }"
          :data-progress="progressPercent"
          :data-progress-ratio="progressRatio"
        ></div>
      </div>
      <p
        data-testid="achievement-progress-text"
        class="mt-1.5 text-[11px] text-ink-500 dark:text-ink-300"
      >
        {{ currentValue }} / {{ threshold }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.achievement-card {
  /* 让卡片在 grid 内部高度一致，便于已解锁 / 未解锁视觉对齐 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 132px;
}
</style>
