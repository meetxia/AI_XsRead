<template>
  <div class="skeleton-screen">
    <!-- 小说卡片骨架 -->
    <div v-if="type === 'novel-card'" class="skeleton-novel-card">
      <div class="skeleton-cover shimmer"></div>
      <div class="skeleton-info">
        <div class="skeleton-title shimmer"></div>
        <div class="skeleton-author shimmer"></div>
        <div class="skeleton-description">
          <div class="skeleton-line shimmer"></div>
          <div class="skeleton-line shimmer"></div>
        </div>
        <div class="skeleton-stats">
          <div class="skeleton-stat shimmer"></div>
          <div class="skeleton-stat shimmer"></div>
          <div class="skeleton-stat shimmer"></div>
        </div>
      </div>
    </div>
    
    <!-- 小说详情页骨架 -->
    <div v-else-if="type === 'novel-detail'" class="skeleton-novel-detail">
      <div class="skeleton-header">
        <div class="skeleton-cover-large shimmer"></div>
        <div class="skeleton-detail-info">
          <div class="skeleton-title-large shimmer"></div>
          <div class="skeleton-meta shimmer"></div>
          <div class="skeleton-tags shimmer"></div>
        </div>
      </div>
      <div class="skeleton-description">
        <div class="skeleton-line shimmer"></div>
        <div class="skeleton-line shimmer"></div>
        <div class="skeleton-line shimmer"></div>
      </div>
    </div>
    
    <!-- 章节列表骨架 -->
    <div v-else-if="type === 'chapter-list'" class="skeleton-chapter-list">
      <div v-for="i in count" :key="i" class="skeleton-chapter-item">
        <div class="skeleton-chapter-number shimmer"></div>
        <div class="skeleton-chapter-title shimmer"></div>
        <div class="skeleton-chapter-time shimmer"></div>
      </div>
    </div>
    
    <!-- 阅读页骨架 -->
    <div v-else-if="type === 'reading'" class="skeleton-reading">
      <div class="skeleton-reading-title shimmer"></div>
      <div class="skeleton-reading-content">
        <div v-for="i in 10" :key="i" class="skeleton-paragraph shimmer"></div>
      </div>
    </div>
    
    <!-- 通用列表骨架 -->
    <div v-else class="skeleton-list">
      <div v-for="i in count" :key="i" class="skeleton-list-item shimmer"></div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'novel-card', // novel-card, novel-detail, chapter-list, reading, list
    validator: (value) => {
      return ['novel-card', 'novel-detail', 'chapter-list', 'reading', 'list'].includes(value)
    }
  },
  count: {
    type: Number,
    default: 3
  }
})
</script>

<style scoped>
/* 闪烁动画 - 优化后更流畅 */
@keyframes shimmer {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--color-bg-base, #f0f0f0) 0px,
    var(--color-bg-hover, #f8f8f8) 40px,
    var(--color-bg-base, #f0f0f0) 80px
  );
  background-size: 468px;
  animation: shimmer 1.2s ease-in-out infinite;
}

/* 暗色模式下的闪烁 */
:root.dark .shimmer {
  background: linear-gradient(
    90deg,
    #2d2d2d 0px,
    #3a3a3a 40px,
    #2d2d2d 80px
  );
  background-size: 468px;
}

/* 小说卡片骨架 */
.skeleton-novel-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-elevated);
  border-radius: 12px;
}

.skeleton-cover {
  width: 100px;
  height: 140px;
  border-radius: 8px;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-title {
  height: 24px;
  width: 70%;
  border-radius: 4px;
}

.skeleton-author {
  height: 18px;
  width: 40%;
  border-radius: 4px;
}

.skeleton-description {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 16px;
  width: 100%;
  border-radius: 4px;
}

.skeleton-stats {
  display: flex;
  gap: 1rem;
  margin-top: auto;
}

.skeleton-stat {
  height: 20px;
  width: 60px;
  border-radius: 4px;
}

/* 小说详情页骨架 */
.skeleton-novel-detail {
  padding: 2rem;
}

.skeleton-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.skeleton-cover-large {
  width: 200px;
  height: 280px;
  border-radius: 12px;
}

.skeleton-detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-title-large {
  height: 36px;
  width: 60%;
  border-radius: 6px;
}

.skeleton-meta {
  height: 24px;
  width: 80%;
  border-radius: 4px;
}

.skeleton-tags {
  height: 32px;
  width: 50%;
  border-radius: 4px;
}

/* 章节列表骨架 */
.skeleton-chapter-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-chapter-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-elevated);
  border-radius: 8px;
}

.skeleton-chapter-number {
  width: 60px;
  height: 20px;
  border-radius: 4px;
}

.skeleton-chapter-title {
  flex: 1;
  height: 20px;
  border-radius: 4px;
}

.skeleton-chapter-time {
  width: 80px;
  height: 18px;
  border-radius: 4px;
}

/* 阅读页骨架 */
.skeleton-reading {
  padding: 2rem;
}

.skeleton-reading-title {
  height: 32px;
  width: 50%;
  margin: 0 auto 2rem;
  border-radius: 6px;
}

.skeleton-reading-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.skeleton-paragraph {
  height: 80px;
  border-radius: 8px;
}

/* 通用列表骨架 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-list-item {
  height: 60px;
  border-radius: 8px;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .skeleton-novel-card {
    padding: 0.75rem;
  }
  
  .skeleton-cover {
    width: 80px;
    height: 112px;
  }
  
  .skeleton-header {
    flex-direction: column;
  }
  
  .skeleton-cover-large {
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
  }
}
</style>

