<template>
  <button
    class="like-button"
    :class="{ liked: isLiked, animating: isAnimating }"
    :aria-label="isLiked ? '取消点赞' : '点赞'"
    :aria-pressed="isLiked"
    @click="handleLike"
  >
    <!-- 心形图标 -->
    <svg class="heart-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
    
    <!-- 粒子效果 -->
    <div class="particles" aria-hidden="true">
      <span
        v-for="i in 8"
        :key="i"
        class="particle"
        :style="{ '--angle': i * 45 + 'deg' }"
      ></span>
    </div>
    
    <!-- 点赞数 -->
    <transition name="bounce" mode="out-in">
      <span :key="displayCount" class="like-count">
        {{ formatNumber(displayCount) }}
      </span>
    </transition>
  </button>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  liked: {
    type: Boolean,
    default: false
  },
  count: {
    type: Number,
    default: 0
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

const emit = defineEmits(['like', 'unlike'])

const isLiked = ref(props.liked)
const isAnimating = ref(false)
const displayCount = ref(props.count)

// 处理点赞
function handleLike() {
  isLiked.value = !isLiked.value
  isAnimating.value = true
  
  // 触觉反馈（移动端）
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
  
  // 播放音效（可选）
  // playSound('like.mp3')
  
  // 更新计数
  if (isLiked.value) {
    displayCount.value++
    emit('like')
  } else {
    displayCount.value--
    emit('unlike')
  }
  
  // 动画结束后重置状态
  setTimeout(() => {
    isAnimating.value = false
  }, 600)
}

// 格式化数字
function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// 监听 props 变化
watch(() => props.liked, (newVal) => {
  isLiked.value = newVal
})

watch(() => props.count, (newVal) => {
  displayCount.value = newVal
})
</script>

<style scoped>
.like-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg-elevated, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.like-button:hover {
  background: var(--color-bg-hover, #f8f8f8);
  border-color: var(--color-primary);
}

.like-button.animating {
  animation: heartbeat 0.3s ease;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

/* 心形图标 */
.heart-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-muted);
  transition: all 0.3s ease;
}

.like-button.liked .heart-icon {
  color: var(--color-primary);
  animation: pulse 0.3s ease;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

/* 粒子爆炸效果 */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-primary);
  opacity: 0;
}

.like-button.animating.liked .particle {
  animation: particle-burst 0.6s ease-out;
}

@keyframes particle-burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(30px);
    opacity: 0;
  }
}

/* 点赞数 */
.like-count {
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.like-button.liked .like-count {
  color: var(--color-primary);
}

/* 数字弹跳动画 */
.bounce-enter-active {
  animation: bounceIn 0.3s ease;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 尺寸变体 */
.like-button.size-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.like-button.size-small .heart-icon {
  width: 16px;
  height: 16px;
}

.like-button.size-large {
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
}

.like-button.size-large .heart-icon {
  width: 24px;
  height: 24px;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .like-button {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>

