<template>
  <div class="magazine-layout">
    <!-- 加载状态 -->
    <div v-if="loading && novels.length === 0" class="loading-skeleton">
      <div v-for="i in 6" :key="i" class="skeleton-card" :class="`skeleton-${getSkeletonSize(i)}`">
        <div class="skeleton-cover"></div>
        <div class="skeleton-content">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-author"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    </div>

    <!-- 杂志式网格布局 -->
    <div v-else class="magazine-grid">
      <NovelCard
        v-for="(novel, index) in novels"
        :key="novel.id"
        :novel="novel"
        :size="getCardSize(index)"
        :show-description="true"
        class="magazine-grid-item"
        :class="`grid-item-${getCardSize(index)}`"
      />
    </div>

    <!-- 加载更多指示器 -->
    <div v-if="loading && novels.length > 0" class="loading-more">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>

    <!-- 无更多内容 -->
    <div v-if="!loading && !hasMore && novels.length > 0" class="no-more">
      <div class="no-more-line"></div>
      <span class="no-more-text">已经到底啦</span>
      <div class="no-more-line"></div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && novels.length === 0" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
      </svg>
      <p class="empty-text">暂无内容</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import NovelCard from './NovelCard.vue'

const props = defineProps({
  novels: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: true
  },
  autoLoad: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['load-more'])

// 卡片尺寸模式（创建视觉节奏感）
const sizePatterns = [
  // 第一组：大-中-中
  ['featured', 'normal', 'normal'],
  // 第二组：中-中-大
  ['normal', 'normal', 'large'],
  // 第三组：小-中-中
  ['small', 'normal', 'normal'],
  // 第四组：中-大-中
  ['normal', 'large', 'normal'],
  // 第五组：中-中-中
  ['normal', 'normal', 'normal']
]

// 获取卡片尺寸（根据索引决定）
function getCardSize(index) {
  const patternIndex = Math.floor(index / 3) % sizePatterns.length
  const positionInPattern = index % 3
  return sizePatterns[patternIndex][positionInPattern]
}

// 获取骨架屏尺寸
function getSkeletonSize(index) {
  const sizes = ['normal', 'large', 'normal', 'normal', 'featured', 'normal']
  return sizes[(index - 1) % sizes.length]
}

// 滚动监听（自动加载更多）
const handleScroll = () => {
  if (!props.autoLoad || props.loading || !props.hasMore) return

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  // 距离底部 500px 时触发加载
  if (scrollTop + windowHeight >= documentHeight - 500) {
    emit('load-more')
  }
}

onMounted(() => {
  if (props.autoLoad) {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onUnmounted(() => {
  if (props.autoLoad) {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
/* ===== 杂志式网格布局 ===== */
.magazine-layout {
  width: 100%;
  padding: 1rem 0;
}

.magazine-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  
  /* 关键：自动填充空白区域，让卡片紧密排列 */
  grid-auto-flow: dense;
  
  /* 移除固定行高，让卡片自适应内容 */
  grid-auto-rows: auto;
}

/* 卡片网格项定位 */
.magazine-grid-item {
  /* 移除最小高度限制 */
  align-self: start;
}

/* 小卡片 */
.grid-item-small {
  grid-column: span 1;
}

/* 正常卡片 */
.grid-item-normal {
  grid-column: span 1;
}

/* 大卡片 */
.grid-item-large {
  grid-column: span 1;
}

/* 特色卡片 - 横跨两列 */
.grid-item-featured {
  grid-column: span 2;
}

/* ===== 骨架屏加载 ===== */
.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  grid-auto-flow: dense;
  grid-auto-rows: auto;
}

.skeleton-card {
  background: var(--color-bg-card);
  border-radius: 1.25rem;
  overflow: hidden;
  animation: pulse 1.5s ease-in-out infinite;
  align-self: start;
}

.skeleton-normal {
  grid-column: span 1;
}

.skeleton-large {
  grid-column: span 1;
}

.skeleton-featured {
  grid-column: span 2;
}

.skeleton-cover {
  width: 100%;
  height: 40px;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.04) 0%,
    rgba(0, 0, 0, 0.06) 50%,
    rgba(0, 0, 0, 0.04) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-featured .skeleton-cover {
  height: 60px;
}

.skeleton-large .skeleton-cover {
  height: 50px;
}

.skeleton-content {
  padding: 2rem 1.75rem;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.04) 0%,
    rgba(0, 0, 0, 0.06) 50%,
    rgba(0, 0, 0, 0.04) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}

.skeleton-title {
  height: 20px;
  width: 70%;
  margin-bottom: 1rem;
}

.skeleton-author {
  height: 14px;
  width: 40%;
  margin-bottom: 1rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ===== 加载更多 ===== */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 0 2rem;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(217, 84, 104, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
}

/* ===== 无更多内容 ===== */
.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 0 2rem;
}

.no-more-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 0, 0, 0.1),
    transparent
  );
}

.no-more-text {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  opacity: 0.6;
  letter-spacing: 0.05em;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--color-text-muted);
  opacity: 0.3;
  margin-bottom: 1.5rem;
}

.empty-text {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  opacity: 0.6;
}

/* ===== 平板端优化 ===== */
@media (max-width: 1024px) {
  .magazine-grid,
  .loading-skeleton {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem 1.25rem;
    grid-auto-flow: dense;
  }

  .grid-item-featured,
  .skeleton-featured {
    grid-column: span 2;
  }
}

/* ===== 移动端优化 ===== */
@media (max-width: 640px) {
  .magazine-layout {
    padding: 0.5rem 0;
  }

  .magazine-grid,
  .loading-skeleton {
    grid-template-columns: 1fr;
    gap: 0.875rem;
    grid-auto-flow: dense;
  }

  /* 移动端所有卡片单列显示 */
  .grid-item-small,
  .grid-item-normal,
  .grid-item-large,
  .grid-item-featured,
  .skeleton-normal,
  .skeleton-large,
  .skeleton-featured {
    grid-column: span 1;
  }

  .magazine-grid-item {
    min-height: auto;
  }

  .skeleton-cover,
  .skeleton-featured .skeleton-cover,
  .skeleton-large .skeleton-cover {
    height: 35px;
  }

  .skeleton-content {
    padding: 1.5rem 1.25rem;
  }

  .loading-more {
    padding: 2rem 0 1.5rem;
  }

  .no-more {
    padding: 2rem 0 1.5rem;
  }

  .empty-state {
    padding: 4rem 1.5rem;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
  }
}

/* ===== 深色模式优化 ===== */
@media (prefers-color-scheme: dark) {
  .skeleton-cover,
  .skeleton-line {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.03) 0%,
      rgba(255, 255, 255, 0.06) 50%,
      rgba(255, 255, 255, 0.03) 100%
    );
  }

  .loading-spinner {
    border-color: rgba(217, 84, 104, 0.3);
    border-top-color: var(--color-primary);
  }

  .no-more-line {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
  }
}
</style>

