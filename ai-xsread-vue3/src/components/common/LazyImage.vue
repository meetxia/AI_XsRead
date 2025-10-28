<template>
  <div class="lazy-image-wrapper" :class="wrapperClass">
    <transition name="fade">
      <img
        v-if="isLoaded"
        :src="currentSrc"
        :alt="alt"
        :class="['lazy-image', imageClass, { loaded: isLoaded }]"
        @load="handleLoad"
        @error="handleError"
      />
    </transition>
    
    <!-- 加载占位 -->
    <div v-if="!isLoaded && !hasError" class="lazy-placeholder">
      <div class="placeholder-shimmer"></div>
      <div v-if="showIcon" class="placeholder-icon">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>
    
    <!-- 加载失败 -->
    <div v-if="hasError" class="lazy-error">
      <div class="error-icon">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <span class="error-text">{{ errorText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '' // 占位图
  },
  errorImage: {
    type: String,
    default: '' // 错误图
  },
  lazy: {
    type: Boolean,
    default: true
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  errorText: {
    type: String,
    default: '图片加载失败'
  },
  imageClass: {
    type: String,
    default: ''
  },
  wrapperClass: {
    type: String,
    default: ''
  },
  rootMargin: {
    type: String,
    default: '50px' // 提前50px开始加载
  }
})

const emit = defineEmits(['load', 'error'])

const isLoaded = ref(false)
const hasError = ref(false)
const currentSrc = ref(props.placeholder || '')
let observer = null

// 处理加载成功
function handleLoad() {
  isLoaded.value = true
  emit('load')
}

// 处理加载失败
function handleError() {
  hasError.value = true
  if (props.errorImage) {
    currentSrc.value = props.errorImage
  }
  emit('error')
}

// 开始加载图片
function loadImage() {
  if (!props.lazy) {
    currentSrc.value = props.src
    return
  }
  
  const img = new Image()
  img.onload = () => {
    currentSrc.value = props.src
    handleLoad()
  }
  img.onerror = handleError
  img.src = props.src
}

// 创建 Intersection Observer
function createObserver(el) {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage()
          observer.unobserve(el)
        }
      })
    },
    {
      rootMargin: props.rootMargin,
      threshold: 0.01
    }
  )
}

onMounted(() => {
  const el = document.querySelector('.lazy-image-wrapper')
  
  if (!props.lazy) {
    // 不使用懒加载，直接加载
    loadImage()
  } else if ('IntersectionObserver' in window) {
    // 使用 Intersection Observer
    if (el) {
      createObserver(el)
      observer.observe(el)
    }
  } else {
    // 不支持 Intersection Observer，直接加载
    loadImage()
  }
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.lazy-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--color-bg-hover, #f8f8f8);
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lazy-image.loaded {
  animation: fadeIn 0.4s ease;
}

/* 占位符 */
.lazy-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-hover, #f8f8f8);
}

.placeholder-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.5) 50%,
    transparent 100%
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

.placeholder-icon {
  width: 40px;
  height: 40px;
  color: var(--color-text-muted);
  opacity: 0.5;
  z-index: 1;
}

.placeholder-icon svg {
  width: 100%;
  height: 100%;
}

/* 加载失败 */
.lazy-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--color-bg-hover, #f8f8f8);
}

.error-icon {
  width: 32px;
  height: 32px;
  color: var(--color-text-muted);
}

.error-icon svg {
  width: 100%;
  height: 100%;
}

.error-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 淡入动画 */
.fade-enter-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 屏幕阅读器专用 */
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

