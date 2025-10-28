<template>
  <div class="progress-bar-container" :class="containerClass">
    <!-- 进度条背景 -->
    <div class="progress-track">
      <!-- 进度条填充 -->
      <div 
        class="progress-fill"
        :class="{ 'progress-animated': animated, 'progress-indeterminate': indeterminate }"
        :style="progressStyle"
      >
        <!-- 光泽效果 -->
        <div v-if="!indeterminate" class="progress-shine"></div>
      </div>
    </div>
    
    <!-- 进度文本 -->
    <div v-if="showText" class="progress-text">
      <slot name="text">
        {{ indeterminate ? loadingText : `${percent}%` }}
      </slot>
    </div>
    
    <!-- 加载状态标签 -->
    <div v-if="showStatus && status" class="progress-status" :class="`status-${status}`">
      <span v-if="status === 'success'" class="status-icon">✓</span>
      <span v-else-if="status === 'error'" class="status-icon">✕</span>
      <span v-else-if="status === 'warning'" class="status-icon">⚠</span>
      <span class="status-text">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 进度百分比 0-100
  percent: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 100
  },
  // 是否显示进度文本
  showText: {
    type: Boolean,
    default: true
  },
  // 是否显示状态
  showStatus: {
    type: Boolean,
    default: false
  },
  // 状态 success, error, warning
  status: {
    type: String,
    default: '',
    validator: (value) => ['', 'success', 'error', 'warning'].includes(value)
  },
  // 状态文本
  statusText: {
    type: String,
    default: ''
  },
  // 是否为不确定进度
  indeterminate: {
    type: Boolean,
    default: false
  },
  // 加载文本（不确定进度时显示）
  loadingText: {
    type: String,
    default: '加载中...'
  },
  // 是否显示动画
  animated: {
    type: Boolean,
    default: true
  },
  // 进度条颜色
  color: {
    type: String,
    default: ''
  },
  // 进度条高度
  height: {
    type: String,
    default: '8px'
  },
  // 尺寸 small, medium, large
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  // 是否为圆形进度条
  circle: {
    type: Boolean,
    default: false
  },
  // 圆形进度条的宽度
  strokeWidth: {
    type: Number,
    default: 6
  }
})

const containerClass = computed(() => {
  return {
    [`progress-${props.size}`]: true,
    'progress-circle': props.circle
  }
})

const progressStyle = computed(() => {
  if (props.indeterminate) {
    return {}
  }
  
  const style = {
    width: `${props.percent}%`
  }
  
  if (props.color) {
    style.backgroundColor = props.color
  }
  
  return style
})

// 圆形进度条的路径
const circleRadius = computed(() => {
  return 50 - props.strokeWidth / 2
})

const circleCircumference = computed(() => {
  return 2 * Math.PI * circleRadius.value
})

const circleStrokeDashoffset = computed(() => {
  const progress = props.percent / 100
  return circleCircumference.value * (1 - progress)
})
</script>

<style scoped>
/* 进度条容器 */
.progress-bar-container {
  width: 100%;
}

/* 进度条轨道 */
.progress-track {
  position: relative;
  width: 100%;
  height: v-bind(height);
  background: var(--color-bg-hover, #f0f0f0);
  border-radius: 100px;
  overflow: hidden;
}

/* 进度条填充 */
.progress-fill {
  position: relative;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-primary) 0%,
    #ff6b7f 100%
  );
  border-radius: 100px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* 动画效果 */
.progress-animated {
  position: relative;
}

.progress-animated::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 不确定进度 */
.progress-indeterminate {
  width: 100% !important;
  background: var(--color-bg-hover);
  position: relative;
  overflow: hidden;
}

.progress-indeterminate::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  height: 100%;
  width: 50%;
  background: linear-gradient(
    90deg,
    var(--color-primary) 0%,
    #ff6b7f 100%
  );
  animation: indeterminate 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes indeterminate {
  0% {
    left: -50%;
  }
  100% {
    left: 100%;
  }
}

/* 光泽效果 */
.progress-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.3) 0%,
    transparent 100%
  );
  border-radius: 100px 100px 0 0;
}

/* 进度文本 */
.progress-text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  text-align: center;
}

/* 状态显示 */
.progress-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.status-success .status-icon {
  background: #10b981;
  color: white;
}

.status-error .status-icon {
  background: #ef4444;
  color: white;
}

.status-warning .status-icon {
  background: #f59e0b;
  color: white;
}

.status-text {
  color: var(--color-text-secondary);
}

/* 尺寸变体 */
.progress-small .progress-track {
  height: 4px;
}

.progress-small .progress-text {
  font-size: 0.75rem;
}

.progress-large .progress-track {
  height: 12px;
}

.progress-large .progress-text {
  font-size: 1rem;
}

/* 暗色模式 */
:root.dark .progress-track {
  background: #2d2d2d;
}

:root.dark .progress-indeterminate {
  background: #2d2d2d;
}

/* 圆形进度条 */
.progress-circle {
  width: 120px;
  height: 120px;
  position: relative;
}

.progress-circle .progress-track {
  display: none;
}

.circle-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.circle-bg {
  fill: none;
  stroke: var(--color-bg-hover);
}

.circle-progress {
  fill: none;
  stroke: var(--color-primary);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

/* 响应式 */
@media (max-width: 640px) {
  .progress-text {
    font-size: 0.8125rem;
  }
}
</style>

