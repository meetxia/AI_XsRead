<template>
  <div class="masonry-container">
    <!-- 骨架屏加载状态 -->
    <div v-if="loading && novels.length === 0" class="skeleton-grid">
      <div v-for="i in skeletonCount" :key="i" class="skeleton-item">
        <div class="skeleton-cover"></div>
        <div class="skeleton-content">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-author"></div>
          <div class="skeleton-line skeleton-desc"></div>
          <div class="skeleton-line skeleton-desc"></div>
        </div>
      </div>
    </div>

    <!-- 瀑布流布局 -->
    <div 
      v-else
      ref="masonryRef"
      :class="['masonry', `masonry-cols-${columns}`]"
    >
      <div 
        v-for="novel in novels" 
        :key="novel.id"
        class="masonry-item fade-in"
      >
        <slot name="item" :novel="novel">
          <NovelCard :novel="novel" :show-description="showDescription" />
        </slot>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more-container">
      <button
        v-if="!loading"
        @click="loadMore"
        class="load-more-btn"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <span>加载更多</span>
      </button>
      
      <!-- 加载中 -->
      <div v-else class="loading-spinner">
        <svg class="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2">加载中...</span>
      </div>
    </div>

    <!-- 无更多内容 -->
    <div v-else-if="novels.length > 0" class="no-more">
      <span>没有更多内容了</span>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && novels.length === 0" class="empty-state">
      <svg class="w-20 h-20 text-themed-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
      </svg>
      <p class="mt-4 text-themed-muted">暂无小说数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import NovelCard from './NovelCard.vue'

// Props
const props = defineProps({
  novels: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: true
  },
  columns: {
    type: Number,
    default: 3,
    validator: (value) => [1, 2, 3].includes(value)
  },
  showDescription: {
    type: Boolean,
    default: true
  },
  autoLoad: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['load-more'])

// 瀑布流容器引用
const masonryRef = ref(null)

// 骨架屏数量
const skeletonCount = computed(() => props.columns * 3)

/**
 * 加载更多
 */
const loadMore = () => {
  if (!props.loading && props.hasMore) {
    emit('load-more')
  }
}

/**
 * 滚动事件处理（自动加载）
 */
const handleScroll = () => {
  if (!props.autoLoad || props.loading || !props.hasMore) {
    return
  }

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  // 距离底部200px时触发加载
  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadMore()
  }
}

// 防抖处理
let scrollTimeout = null
const throttledScroll = () => {
  if (scrollTimeout) return
  
  scrollTimeout = setTimeout(() => {
    handleScroll()
    scrollTimeout = null
  }, 100)
}

onMounted(() => {
  if (props.autoLoad) {
    window.addEventListener('scroll', throttledScroll)
  }
})

onUnmounted(() => {
  if (props.autoLoad) {
    window.removeEventListener('scroll', throttledScroll)
  }
})
</script>

<style scoped>
.masonry-container {
  width: 100%;
  padding: 1rem;
}

/* 瀑布流布局 */
.masonry {
  column-gap: 1rem;
  width: 100%;
}

.masonry-cols-1 {
  column-count: 1;
}

.masonry-cols-2 {
  column-count: 2;
}

.masonry-cols-3 {
  column-count: 3;
}

/* 响应式 */
@media (max-width: 1024px) {
  .masonry-cols-3 {
    column-count: 2;
  }
}

@media (max-width: 640px) {
  .masonry-cols-2,
  .masonry-cols-3 {
    column-count: 1;
  }
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 1rem;
  display: inline-block;
  width: 100%;
}

/* 骨架屏网格 */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

@media (max-width: 640px) {
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}

/* 骨架屏项 */
.skeleton-item {
  border-radius: 1rem;
  overflow: hidden;
  background-color: var(--color-bg-card);
  box-shadow: 0 4px 6px -1px var(--color-shadow);
}

.skeleton-cover {
  width: 100%;
  padding-top: 133.33%; /* 3:4 比例 */
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-line {
  height: 0.875rem;
  border-radius: 0.25rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-title {
  width: 80%;
  height: 1.125rem;
}

.skeleton-author {
  width: 50%;
}

.skeleton-desc {
  width: 100%;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 加载更多按钮 */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  border-radius: 9999px;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: var(--color-primary);
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px var(--color-shadow);
  opacity: 0.9;
}

.load-more-btn:active {
  transform: translateY(0);
}

/* 加载中状态 */
.loading-spinner {
  display: flex;
  align-items: center;
  color: var(--color-primary);
  font-size: 1rem;
}

/* 无更多内容 */
.no-more {
  text-align: center;
  padding: 2rem 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

/* 旋转动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 淡入动画 */
.fade-in {
  animation: fadeIn 0.6s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端优化 */
@media (max-width: 640px) {
  .masonry-container {
    padding: 0.5rem;
  }
  
  .masonry-item {
    margin-bottom: 0.75rem;
  }
}
</style>

