<template>
  <div 
    ref="container"
    class="pull-to-refresh-container"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- 刷新指示器 -->
    <transition name="fade">
      <div 
        v-show="pullDistance > 0"
        class="pull-indicator"
        :style="{ 
          height: indicatorHeight + 'px',
          opacity: indicatorOpacity
        }"
      >
        <div class="indicator-content" :class="`status-${status}`">
          <!-- 下拉状态 -->
          <div v-if="status === 'pulling'" class="indicator-icon">
            <svg 
              class="arrow-icon"
              :style="{ transform: `rotate(${arrowRotation}deg)` }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span class="indicator-text">下拉刷新</span>
          </div>
          
          <!-- 准备释放状态 -->
          <div v-else-if="status === 'ready'" class="indicator-icon">
            <svg 
              class="arrow-icon ready"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span class="indicator-text">释放刷新</span>
          </div>
          
          <!-- 刷新中状态 -->
          <div v-else-if="status === 'refreshing'" class="indicator-icon">
            <svg class="spinner-icon" viewBox="0 0 24 24">
              <circle 
                class="spinner-circle" 
                cx="12" 
                cy="12" 
                r="10" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="3"
              />
            </svg>
            <span class="indicator-text">刷新中...</span>
          </div>
          
          <!-- 完成状态 -->
          <div v-else-if="status === 'success'" class="indicator-icon">
            <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="indicator-text">刷新成功</span>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 内容区域 -->
    <div 
      class="pull-content"
      :style="{ transform: `translateY(${contentOffset}px)` }"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  // 触发刷新的阈值（px）
  threshold: {
    type: Number,
    default: 80
  },
  // 最大下拉距离（px）
  maxDistance: {
    type: Number,
    default: 150
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 阻力系数（0-1）
  resistance: {
    type: Number,
    default: 0.5
  },
  // 是否自动关闭
  autoClose: {
    type: Boolean,
    default: true
  },
  // 成功提示显示时长
  successDuration: {
    type: Number,
    default: 800
  }
})

const emit = defineEmits(['refresh'])

// 状态
const status = ref('idle') // idle, pulling, ready, refreshing, success
const pullDistance = ref(0)
const contentOffset = ref(0)

// 触摸信息
let startY = 0
let startScrollTop = 0
let isRefreshing = false

// 计算指示器高度（带缓动效果）
const indicatorHeight = computed(() => {
  return Math.min(pullDistance.value, props.maxDistance)
})

// 计算指示器透明度
const indicatorOpacity = computed(() => {
  return Math.min(pullDistance.value / props.threshold, 1)
})

// 箭头旋转角度
const arrowRotation = computed(() => {
  const progress = Math.min(pullDistance.value / props.threshold, 1)
  return progress * 180
})

const container = ref(null)

/**
 * 触摸开始
 */
function handleTouchStart(event) {
  if (props.disabled || isRefreshing) return
  
  const scrollTop = container.value?.scrollTop || 0
  
  // 只在顶部时允许下拉刷新
  if (scrollTop === 0) {
    startY = event.touches[0].clientY
    startScrollTop = scrollTop
    status.value = 'pulling'
  }
}

/**
 * 触摸移动
 */
function handleTouchMove(event) {
  if (props.disabled || isRefreshing || status.value === 'idle') return
  
  const currentY = event.touches[0].clientY
  const distance = currentY - startY
  
  if (distance > 0 && startScrollTop === 0) {
    // 阻止默认滚动
    event.preventDefault()
    
    // 应用阻力效果
    const damping = props.resistance
    const actualDistance = distance * damping
    
    // 限制最大拉动距离
    pullDistance.value = Math.min(actualDistance, props.maxDistance)
    contentOffset.value = pullDistance.value
    
    // 更新状态
    if (pullDistance.value >= props.threshold) {
      status.value = 'ready'
    } else {
      status.value = 'pulling'
    }
  }
}

/**
 * 触摸结束
 */
async function handleTouchEnd() {
  if (props.disabled || isRefreshing || status.value === 'idle') return
  
  if (status.value === 'ready') {
    // 触发刷新
    status.value = 'refreshing'
    isRefreshing = true
    
    // 保持指示器显示
    contentOffset.value = props.threshold
    
    try {
      // 触觉反馈
      if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }
      
      // 执行刷新
      await emit('refresh')
      
      // 显示成功状态
      status.value = 'success'
      
      // 延迟后自动关闭
      if (props.autoClose) {
        setTimeout(() => {
          resetState()
        }, props.successDuration)
      }
    } catch (error) {
      console.error('刷新失败:', error)
      resetState()
    }
  } else {
    // 未达到阈值，回弹
    resetState()
  }
}

/**
 * 重置状态
 */
function resetState() {
  status.value = 'idle'
  pullDistance.value = 0
  contentOffset.value = 0
  isRefreshing = false
}

/**
 * 暴露方法
 */
defineExpose({
  reset: resetState
})
</script>

<style scoped>
.pull-to-refresh-container {
  position: relative;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 刷新指示器 */
.pull-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-base);
  transition: opacity 0.2s ease;
  overflow: hidden;
}

.indicator-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
}

.indicator-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* 箭头图标 */
.arrow-icon {
  width: 32px;
  height: 32px;
  color: var(--color-primary);
  transition: transform 0.3s ease;
}

.arrow-icon.ready {
  animation: bounce 0.6s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

/* 加载图标 */
.spinner-icon {
  width: 32px;
  height: 32px;
  animation: rotate 1s linear infinite;
}

.spinner-circle {
  stroke-dasharray: 60;
  stroke-dashoffset: 0;
  stroke: var(--color-primary);
  animation: spinner-dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spinner-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 完成图标 */
.check-icon {
  width: 32px;
  height: 32px;
  color: #10b981;
  stroke-width: 3;
  animation: check-scale 0.3s ease;
}

@keyframes check-scale {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* 指示文本 */
.indicator-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.status-ready .indicator-text {
  color: var(--color-primary);
  font-weight: 600;
}

.status-refreshing .indicator-text {
  color: var(--color-primary);
}

.status-success .indicator-text {
  color: #10b981;
}

/* 内容区域 */
.pull-content {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  will-change: transform;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 暗色模式适配 */
:root.dark .pull-indicator {
  background: var(--color-bg-base);
}
</style>

