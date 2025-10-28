<template>
  <transition name="fade">
    <button
      v-show="visible"
      class="back-to-top"
      aria-label="返回顶部"
      @click="scrollToTop"
    >
      <!-- 进度环 -->
      <svg class="progress-ring" width="48" height="48">
        <circle
          class="progress-ring-bg"
          stroke="currentColor"
          stroke-width="3"
          fill="transparent"
          r="20"
          cx="24"
          cy="24"
        />
        <circle
          class="progress-ring-progress"
          stroke="currentColor"
          stroke-width="3"
          fill="transparent"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          r="20"
          cx="24"
          cy="24"
        />
      </svg>
      
      <!-- 箭头图标 -->
      <svg class="arrow-icon" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd"></path>
      </svg>
    </button>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { throttle } from 'lodash-es'

const visible = ref(false)
const scrollProgress = ref(0)

// 进度环计算
const radius = 20
const circumference = 2 * Math.PI * radius

const dashOffset = computed(() => {
  return circumference * (1 - scrollProgress.value)
})

// 滚动监听（节流）
const handleScroll = throttle(() => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const docHeight = document.documentElement.scrollHeight
  const winHeight = window.innerHeight
  
  // 滚动超过300px时显示按钮
  visible.value = scrollTop > 300
  
  // 计算滚动进度
  const scrollableHeight = docHeight - winHeight
  if (scrollableHeight > 0) {
    scrollProgress.value = scrollTop / scrollableHeight
  }
}, 100)

// 平滑滚动到顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
  
  // 触觉反馈（移动端）
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 999;
  width: 48px;
  height: 48px;
  background: var(--color-bg-elevated, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-to-top:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.back-to-top:active {
  transform: translateY(-2px);
}

/* 进度环 */
.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  stroke: var(--color-border-light, #f3f4f6);
  opacity: 0.3;
}

.progress-ring-progress {
  stroke: var(--color-primary);
  transition: stroke-dashoffset 0.3s ease;
}

.back-to-top:hover .progress-ring-progress {
  stroke: white;
}

/* 箭头图标 */
.arrow-icon {
  width: 24px;
  height: 24px;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.back-to-top:hover .arrow-icon {
  color: white;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .back-to-top {
    bottom: 70px;
    right: 16px;
  }
}

/* 平板端 */
@media (min-width: 641px) and (max-width: 1024px) {
  .back-to-top {
    bottom: 24px;
  }
}

/* 桌面端 */
@media (min-width: 1025px) {
  .back-to-top {
    bottom: 40px;
    right: 40px;
  }
}
</style>

