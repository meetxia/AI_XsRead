<template>
  <button
    v-if="hasCount"
    type="button"
    class="paragraph-comment-bubble"
    :class="{ 'is-disabled': disabled }"
    :disabled="disabled"
    :aria-label="`段评 ${displayCount} 条`"
    data-ignore-pageflip
    data-testid="paragraph-comment-bubble"
    @click.stop="onClick"
  >
    <span class="bubble-icon" aria-hidden="true">评</span>
    <span class="bubble-count">{{ displayCount }}</span>
  </button>
</template>

<script setup>
/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 26.2 — ParagraphCommentBubble.vue
 *
 * Tiny clickable badge rendered to the right of each paragraph showing the
 * number of segment comments. Hidden when count === 0 to satisfy the spec
 * (Requirements 27.2). On click emits `open(paragraphIndex)` so the parent
 * (`ReadingPage.vue`) can show the existing `ParagraphCommentSheet`.
 *
 * Layout notes:
 *   - ≥ 24×24px hit area (40×24 here) keyed off Tailwind `h-6 min-w-[40px]`.
 *   - Distance from right ≥ 8px via `right: 8px` rule on the parent paragraph.
 *   - `position: sticky` + `transform: translate(0,0)` to escape layout thrash
 *     while still hugging the paragraph baseline.
 *   - 360px mobile minimum: padding + min-width keep the touch target safe.
 *
 * Validates: Requirements 27.2, 27.11, 36.3
 */
import { computed } from 'vue'

const props = defineProps({
  count: { type: Number, default: 0 },
  paragraphIndex: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['open'])

const numericCount = computed(() => {
  const n = Number(props.count)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
})

const hasCount = computed(() => numericCount.value > 0)

const displayCount = computed(() => {
  const n = numericCount.value
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
})

function onClick() {
  if (props.disabled) return
  emit('open', props.paragraphIndex)
}
</script>

<style scoped>
.paragraph-comment-bubble {
  position: sticky;
  /* `transform` forces a paint layer so the bubble sliding in doesn't
     trigger a paragraph reflow. */
  transform: translate(0, 0);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-inline-start: 0.5rem;
  padding: 0 0.55rem;
  min-width: 40px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(217, 84, 104, 0.22);
  background: rgba(217, 84, 104, 0.12);
  color: var(--color-primary, #d95468);
  font-size: 0.72rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
  /* Distance-from-right ≥ 8px for the 360px viewport: leaves room for the
     reader's safe-area inset (the parent paragraph applies the right padding). */
  right: 8px;
}

.paragraph-comment-bubble:hover {
  background: rgba(217, 84, 104, 0.2);
}

.paragraph-comment-bubble:active {
  transform: translate(0, 1px);
}

.paragraph-comment-bubble.is-disabled,
.paragraph-comment-bubble:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.bubble-icon {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.bubble-count {
  font-variant-numeric: tabular-nums;
}

@media (min-width: 768px) {
  .paragraph-comment-bubble {
    min-width: 44px;
    height: 26px;
    font-size: 0.78rem;
  }
}
</style>
