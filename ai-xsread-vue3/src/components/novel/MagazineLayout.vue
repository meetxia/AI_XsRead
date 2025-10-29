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

// 随机种子（每次刷新页面都不同）
const randomSeed = ref(Date.now())

// 预定义的卡片尺寸组合模式（确保视觉平衡）
const sizePatternGroups = [
  // 组1: 特色开场，平衡混合
  ['featured', 'normal', 'large', 'normal', 'small', 'normal'],
  // 组2: 均衡分布
  ['normal', 'large', 'normal', 'small', 'normal', 'large'],
  // 组3: 大卡片点缀
  ['normal', 'normal', 'large', 'featured', 'normal', 'small'],
  // 组4: 节奏感
  ['large', 'normal', 'small', 'normal', 'normal', 'large'],
  // 组5: 特色居中
  ['normal', 'small', 'normal', 'featured', 'normal', 'large'],
  // 组6: 平稳过渡
  ['normal', 'normal', 'large', 'normal', 'small', 'normal'],
  // 组7: 大开大合
  ['featured', 'small', 'normal', 'large', 'normal', 'normal'],
  // 组8: 均衡变化
  ['normal', 'large', 'small', 'normal', 'normal', 'large']
]

// 打乱数组的函数（使用种子确保每次刷新不同）
function shuffleArray(array, seed) {
  const arr = [...array]
  let currentSeed = seed
  for (let i = arr.length - 1; i > 0; i--) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    const j = Math.floor((currentSeed / 233280) * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 生成打乱后的模式列表（页面加载时一次性生成）
const shuffledPatterns = shuffleArray(sizePatternGroups, randomSeed.value)

// 获取卡片尺寸（智能分组策略）
function getCardSize(index) {
  // 确定在哪一组
  const groupIndex = Math.floor(index / 6) % shuffledPatterns.length
  // 确定在组内的位置
  const positionInGroup = index % 6
  
  return shuffledPatterns[groupIndex][positionInGroup]
}

// 获取骨架屏尺寸（使用相同的随机逻辑）
function getSkeletonSize(index) {
  return getCardSize(index - 1)  // 复用卡片尺寸逻辑
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
  gap: 1.25rem;  /* 统一上下左右间距 */
  max-width: 1400px;
  margin: 0 auto;
  
  /* 关键：自动填充空白区域，让卡片紧密排列 */
  grid-auto-flow: dense;
  
  /* 固定行高 - 确保间距一致 */
  grid-auto-rows: 120px;
}

/* 卡片网格项定位 */
.magazine-grid-item {
  /* 让卡片填充整个网格区域 */
  align-self: stretch;
  height: 100%;
}

/* 小卡片 - 1列2行 */
.grid-item-small {
  grid-column: span 1;
  grid-row: span 2;
}

/* 正常卡片 - 1列3行 */
.grid-item-normal {
  grid-column: span 1;
  grid-row: span 3;
}

/* 大卡片 - 1列4行 */
.grid-item-large {
  grid-column: span 1;
  grid-row: span 4;
}

/* 特色卡片 - 横跨2列2行 */
.grid-item-featured {
  grid-column: span 2;
  grid-row: span 2;
}

/* ===== 骨架屏加载 ===== */
.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  max-width: 1400px;
  margin: 0 auto;
  grid-auto-flow: dense;
  grid-auto-rows: 120px;  /* 与主网格相同 */
}

.skeleton-card {
  background: var(--color-bg-card);
  border-radius: 1.25rem;
  overflow: hidden;
  animation: pulse 1.5s ease-in-out infinite;
  height: 100%;
}

.skeleton-small {
  grid-column: span 1;
  grid-row: span 2;
}

.skeleton-normal {
  grid-column: span 1;
  grid-row: span 3;
}

.skeleton-large {
  grid-column: span 1;
  grid-row: span 4;
}

.skeleton-featured {
  grid-column: span 2;
  grid-row: span 2;
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
    gap: 1rem;  /* 统一间距 */
    grid-auto-flow: dense;
    grid-auto-rows: 110px;  /* 平板端稍小的行高 */
  }

  .grid-item-featured,
  .skeleton-featured {
    grid-column: span 2;
    grid-row: span 2;
  }
  
  /* 平板端保持相同的行跨越 */
  .grid-item-small,
  .skeleton-small {
    grid-row: span 2;
  }
  
  .grid-item-normal,
  .skeleton-normal {
    grid-row: span 3;
  }
  
  .grid-item-large,
  .skeleton-large {
    grid-row: span 4;
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
    gap: 0.625rem;  /* 减小间距从 0.875rem 到 0.625rem */
    grid-auto-flow: dense;
    grid-auto-rows: 60px;  /* 大幅减小行高从 100px 到 60px */
  }

  /* 移动端所有卡片单列显示，但保持不同高度 */
  .grid-item-small,
  .grid-item-normal,
  .grid-item-large,
  .grid-item-featured,
  .skeleton-small,
  .skeleton-normal,
  .skeleton-large,
  .skeleton-featured {
    grid-column: span 1;
  }
  
  /* 移动端的行跨越 - 减小每种卡片占用的行数 */
  .grid-item-small,
  .skeleton-small {
    grid-row: span 3;  /* 从 2 增加到 3，因为行高减小了 */
  }
  
  .grid-item-normal,
  .skeleton-normal {
    grid-row: span 4;  /* 从 3 增加到 4 */
  }
  
  .grid-item-large,
  .grid-item-featured,
  .skeleton-large,
  .skeleton-featured {
    grid-row: span 5;  /* 从 4 增加到 5 */
  }

  .skeleton-cover,
  .skeleton-featured .skeleton-cover,
  .skeleton-large .skeleton-cover {
    height: 25px;  /* 匹配移动端卡片封面高度 */
  }

  .skeleton-content {
    padding: 1rem 1rem;  /* 匹配移动端卡片内边距 */
  }
  
  .skeleton-line {
    height: 10px;  /* 减小骨架屏线条高度 */
    margin-bottom: 0.5rem;  /* 减小间距 */
  }
  
  .skeleton-title {
    height: 16px;  /* 减小标题高度 */
    margin-bottom: 0.5rem;
  }
  
  .skeleton-author {
    height: 12px;  /* 减小作者高度 */
    margin-bottom: 0.5rem;
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

