<template>
  <div class="loading-container" :class="containerClass" role="status" aria-live="polite">
    <!-- 加载动画 -->
    <div class="loading-spinner" :class="`spinner-${variant}`">
      <!-- 默认旋转圆圈 -->
      <div v-if="variant === 'circle'" class="spinner-circle">
        <div class="circle-ring"></div>
      </div>
      
      <!-- 点跳动 -->
      <div v-else-if="variant === 'dots'" class="spinner-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      
      <!-- 波浪 -->
      <div v-else-if="variant === 'wave'" class="spinner-wave">
        <span class="wave-bar"></span>
        <span class="wave-bar"></span>
        <span class="wave-bar"></span>
        <span class="wave-bar"></span>
        <span class="wave-bar"></span>
      </div>
      
      <!-- 书本翻页 -->
      <div v-else-if="variant === 'book'" class="spinner-book">
        <div class="book">
          <div class="book-page"></div>
          <div class="book-page"></div>
          <div class="book-page"></div>
        </div>
      </div>
      
      <!-- 默认渐变圆环 -->
      <div v-else class="spinner-gradient">
        <svg viewBox="0 0 50 50" class="gradient-svg">
          <circle cx="25" cy="25" r="20" fill="none" stroke-width="4" stroke="url(#gradient)"></circle>
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:var(--color-primary);stop-opacity:1" />
              <stop offset="100%" style="stop-color:var(--color-secondary);stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
    
    <!-- 加载文本 -->
    <div v-if="text" class="loading-text">
      {{ currentText }}
    </div>
    
    <!-- 屏幕阅读器文本 -->
    <span class="sr-only">{{ currentText }}</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'circle', // circle, dots, wave, book, gradient
    validator: (value) => ['circle', 'dots', 'wave', 'book', 'gradient'].includes(value)
  },
  text: {
    type: String,
    default: '加载中...'
  },
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  fullscreen: {
    type: Boolean,
    default: false
  },
  overlay: {
    type: Boolean,
    default: false
  },
  smartText: {
    type: Boolean,
    default: false // 启用智能提示文本
  }
})

const currentText = ref(props.text)

// 智能加载提示（根据时长显示不同提示）
const loadingMessages = [
  { time: 0, message: '加载中...' },
  { time: 2000, message: '马上就好...' },
  { time: 5000, message: '网络似乎有点慢...' },
  { time: 10000, message: '您可以稍后再试' }
]

let messageTimer = null

const containerClass = computed(() => {
  return {
    [`loading-${props.size}`]: true,
    'loading-fullscreen': props.fullscreen,
    'loading-overlay': props.overlay
  }
})

// 智能文本切换
function startSmartText() {
  if (!props.smartText) return
  
  loadingMessages.forEach(({ time, message }) => {
    setTimeout(() => {
      if (props.smartText) {
        currentText.value = message
      }
    }, time)
  })
}

onMounted(() => {
  if (props.smartText) {
    startSmartText()
  }
})

onBeforeUnmount(() => {
  if (messageTimer) {
    clearTimeout(messageTimer)
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.loading-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--color-bg-base, #fefefe);
}

.loading-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.loading-overlay .loading-text {
  color: white;
}

/* 尺寸 */
.loading-small .loading-spinner {
  width: 24px;
  height: 24px;
}

.loading-medium .loading-spinner {
  width: 40px;
  height: 40px;
}

.loading-large .loading-spinner {
  width: 60px;
  height: 60px;
}

/* 加载文本 */
.loading-text {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* 圆圈旋转 */
.spinner-circle {
  width: 100%;
  height: 100%;
  animation: rotate 1s linear infinite;
}

.circle-ring {
  width: 100%;
  height: 100%;
  border: 3px solid var(--color-border-light, #f3f4f6);
  border-top-color: var(--color-primary);
  border-radius: 50%;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

/* 点跳动 */
.spinner-dots {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dot {
  width: 10px;
  height: 10px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 波浪 */
.spinner-wave {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 100%;
}

.wave-bar {
  width: 4px;
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
  animation: wave 1.2s infinite ease-in-out;
}

.wave-bar:nth-child(1) { animation-delay: -1.2s; }
.wave-bar:nth-child(2) { animation-delay: -1.1s; }
.wave-bar:nth-child(3) { animation-delay: -1.0s; }
.wave-bar:nth-child(4) { animation-delay: -0.9s; }
.wave-bar:nth-child(5) { animation-delay: -0.8s; }

@keyframes wave {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

/* 书本翻页 */
.spinner-book {
  width: 100%;
  height: 100%;
  perspective: 600px;
}

.book {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: bookFlip 2s infinite;
}

.book-page {
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
}

.book-page:nth-child(1) {
  animation: page1 2s infinite;
}

.book-page:nth-child(2) {
  animation: page2 2s infinite;
}

.book-page:nth-child(3) {
  animation: page3 2s infinite;
}

@keyframes bookFlip {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
}

@keyframes page1 {
  0%, 30% { transform: rotateY(0deg); opacity: 1; }
  50%, 100% { transform: rotateY(-180deg); opacity: 0; }
}

@keyframes page2 {
  0%, 30% { transform: rotateY(0deg); opacity: 0; }
  50%, 80% { transform: rotateY(0deg); opacity: 1; }
  100% { transform: rotateY(-180deg); opacity: 0; }
}

@keyframes page3 {
  0%, 60% { transform: rotateY(0deg); opacity: 0; }
  90%, 100% { transform: rotateY(0deg); opacity: 1; }
}

/* 渐变圆环 */
.spinner-gradient {
  width: 100%;
  height: 100%;
  animation: rotate 1.5s linear infinite;
}

.gradient-svg {
  width: 100%;
  height: 100%;
}

/* 屏幕阅读器可见，视觉隐藏 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>

