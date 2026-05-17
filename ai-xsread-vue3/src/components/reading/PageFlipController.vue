<script setup>
/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 18.1 — PageFlipController
 *
 * 职责：
 *   - 包裹默认 slot 的阅读区域；
 *   - 当 mode === 'tap' 时渲染绝对定位的三段式 overlay（左 1/3 / 中 1/3 / 右 1/3），
 *     overlay 仅作为视觉指示与 e2e 测试 hook，pointer-events: none；
 *   - 监听 slot wrapper 的 click（tap 模式下按 X 决定 prev/next/toggle）与
 *     touchstart / touchend（swipe 模式下经 decideAction 派发）；
 *   - 翻页时使用 200ms opacity-only 的 cross-fade Transition，
 *     不修改父级 scrollTop；
 *   - 边缘 12px / 垂直分量 / 时长上限统一交由 decideAction 守卫。
 *
 * 不做：
 *   - 不直接调用 scrollBy / scrollTo（避免与系统手势冲突）；
 *   - 不感知 ReadingPage 的章节状态；上层通过 transitionKey 控制是否触发淡入淡出；
 *   - 不接管 window 级事件，监听仅落在自身根节点上。
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 36.3
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { decideAction } from '@/composables/usePageFlip'

const props = defineProps({
  mode: {
    type: String,
    default: 'scroll',
    validator: (value) => ['scroll', 'tap', 'swipe'].includes(value),
  },
  // 上层可以传入一个会变化的 key 来触发 200ms 的 cross-fade。
  transitionKey: {
    type: [String, Number, null],
    default: null,
  },
  // 是否拦截原生 click：默认 true。某些场景（无障碍调试）可以关闭。
  enabled: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['prev', 'next', 'toggle'])

const rootRef = ref(null)
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0

function shouldIgnore(event) {
  if (!props.enabled) return true
  const target = event.target
  if (!target || typeof target.closest !== 'function') return false
  return Boolean(target.closest('button, a, input, textarea, select, [data-ignore-pageflip]'))
}

function handleClick(event) {
  if (shouldIgnore(event)) return

  if (props.mode === 'tap') {
    const action = decideAction({
      mode: 'tap',
      startX: event.clientX,
      endX: event.clientX,
      dy: 0,
      duration: 0,
      viewportWidth: window.innerWidth,
    })
    if (action === 'prev') emit('prev')
    else if (action === 'next') emit('next')
    else emit('toggle')
    return
  }

  // scroll / swipe 模式：单击中央切换工具栏，与既有 ReadingPage 行为一致。
  emit('toggle')
}

function handleTouchStart(event) {
  if (shouldIgnore(event)) return
  const touch = event.touches[0]
  if (!touch) return
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchStartTime = Date.now()
}

function handleTouchEnd(event) {
  if (shouldIgnore(event)) return
  const touch = event.changedTouches[0]
  if (!touch) return

  const action = decideAction({
    // tap / swipe 都允许 swipe 派发（与 usePageFlip 同源）；scroll 模式让原生滚动接管。
    mode: props.mode === 'scroll' ? 'scroll' : props.mode,
    startX: touchStartX,
    endX: touch.clientX,
    dy: touch.clientY - touchStartY,
    duration: Date.now() - touchStartTime,
    viewportWidth: window.innerWidth,
  })

  if (action === 'prev') emit('prev')
  else if (action === 'next') emit('next')
  // 'toggle' 仅由 click 触发，touch 'toggle' 留给 click。'ignore' 不派发。
}

onMounted(() => {
  const el = rootRef.value
  if (!el) return
  el.addEventListener('touchstart', handleTouchStart, { passive: true })
  el.addEventListener('touchend', handleTouchEnd, { passive: true })
})

onBeforeUnmount(() => {
  const el = rootRef.value
  if (!el) return
  el.removeEventListener('touchstart', handleTouchStart)
  el.removeEventListener('touchend', handleTouchEnd)
})
</script>

<template>
  <div ref="rootRef" class="pageflip-root" @click="handleClick">
    <Transition name="pageflip-fade" mode="out-in">
      <div :key="transitionKey" class="pageflip-stage">
        <slot />
      </div>
    </Transition>

    <div v-if="mode === 'tap'" class="pageflip-overlay" aria-hidden="true">
      <div data-pageflip-zone="prev" class="pageflip-zone pageflip-zone-prev"></div>
      <div data-pageflip-zone="toggle" class="pageflip-zone pageflip-zone-toggle"></div>
      <div data-pageflip-zone="next" class="pageflip-zone pageflip-zone-next"></div>
    </div>
  </div>
</template>

<style scoped>
.pageflip-root {
  position: relative;
}

.pageflip-stage {
  position: relative;
}

.pageflip-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  /* overlay 仅作为视觉指示和测试 hook，不拦截 click，
     真正的判定在根节点的 click 处理里完成 */
  pointer-events: none;
}

.pageflip-zone {
  flex: 1 1 33.3333%;
  height: 100%;
  background: transparent;
}

/* 200ms opacity-only cross-fade，不会改变 scrollTop / 不会触发 layout 抖动 */
.pageflip-fade-enter-active,
.pageflip-fade-leave-active {
  transition: opacity 200ms ease;
}

.pageflip-fade-enter-from,
.pageflip-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .pageflip-fade-enter-active,
  .pageflip-fade-leave-active {
    transition: none;
  }
}
</style>
