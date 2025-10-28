<template>
  <div 
    ref="rippleContainer"
    class="ripple-container"
    @click="createRipple"
  >
    <slot></slot>
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="ripple"
      :style="{
        left: ripple.x + 'px',
        top: ripple.y + 'px',
        width: ripple.size + 'px',
        height: ripple.size + 'px'
      }"
    ></span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  color: {
    type: String,
    default: 'rgba(217, 84, 104, 0.3)' // 玫瑰红半透明
  },
  duration: {
    type: Number,
    default: 600 // 动画时长(ms)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  center: {
    type: Boolean,
    default: false // 是否从中心扩散
  }
})

const rippleContainer = ref(null)
const ripples = ref([])
let rippleId = 0

/**
 * 创建涟漪效果
 */
function createRipple(event) {
  if (props.disabled) return

  const container = rippleContainer.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  
  // 计算涟漪起始位置
  let x, y
  if (props.center) {
    x = rect.width / 2
    y = rect.height / 2
  } else {
    x = event.clientX - rect.left
    y = event.clientY - rect.top
  }

  // 计算涟漪大小（确保能覆盖整个容器）
  const size = Math.max(rect.width, rect.height) * 2

  // 创建涟漪
  const ripple = {
    id: rippleId++,
    x: x - size / 2,
    y: y - size / 2,
    size
  }

  ripples.value.push(ripple)

  // 触觉反馈（移动端）
  if ('vibrate' in navigator) {
    navigator.vibrate(5)
  }

  // 动画结束后移除涟漪
  setTimeout(() => {
    const index = ripples.value.findIndex(r => r.id === ripple.id)
    if (index > -1) {
      ripples.value.splice(index, 1)
    }
  }, props.duration)
}

/**
 * 暴露方法供父组件调用
 */
defineExpose({
  createRipple
})
</script>

<style scoped>
.ripple-container {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: v-bind(color);
  transform: scale(0);
  opacity: 1;
  pointer-events: none;
  animation: ripple-animation v-bind(duration + 'ms') ease-out;
}

@keyframes ripple-animation {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* 优化性能 */
.ripple-container,
.ripple {
  will-change: transform, opacity;
}
</style>

