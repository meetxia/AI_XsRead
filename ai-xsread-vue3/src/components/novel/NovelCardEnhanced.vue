<template>
  <article
    class="novel-card enhanced"
    role="article"
    :aria-labelledby="`novel-title-${novel.id}`"
    :aria-describedby="`novel-desc-${novel.id}`"
    @click="handleClick"
  >
    <!-- 封面区域 -->
    <div class="cover-wrapper">
      <img
        v-if="novel.cover"
        :src="novel.cover"
        :alt="`${novel.title}的封面`"
        class="cover-image"
        loading="lazy"
      />
      <div v-else class="cover-placeholder">
        <span class="placeholder-icon">📚</span>
      </div>
      
      <!-- 状态标签 -->
      <div class="status-badges">
        <span v-if="isNew" class="badge new">NEW</span>
        <span v-if="isHot" class="badge hot">HOT</span>
        <span v-if="novel.status === 0" class="badge complete">完结</span>
        <span v-else class="badge updating">连载中</span>
      </div>
      
      <!-- VIP标记 -->
      <div v-if="novel.isVip" class="vip-mark">
        <span class="vip-icon">👑</span>
        <span class="vip-text">VIP</span>
      </div>
    </div>
    
    <!-- 信息区域 -->
    <div class="info-section">
      <!-- 标题 -->
      <h3 :id="`novel-title-${novel.id}`" class="title">
        {{ novel.title }}
      </h3>
      
      <!-- 作者 -->
      <p class="author">
        <span class="author-label">作者:</span>
        {{ novel.author }}
      </p>
      
      <!-- 简介预览 -->
      <p :id="`novel-desc-${novel.id}`" class="description-preview">
        {{ truncateText(novel.description, 60) }}
      </p>
      
      <!-- 统计信息 -->
      <div class="stats-inline" role="group" aria-label="统计数据">
        <span class="stat-item" :aria-label="`浏览量${novel.views || 0}次`">
          <svg class="stat-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
          </svg>
          {{ formatNumber(novel.views) }}
        </span>
        <span class="stat-item" :aria-label="`点赞数${novel.likes || 0}个`">
          <svg class="stat-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
          </svg>
          {{ formatNumber(novel.likes) }}
        </span>
        <span class="stat-item" :aria-label="`评分${novel.rating || 0}分`">
          <svg class="stat-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
          {{ novel.rating || 4.5 }}
        </span>
      </div>
      
      <!-- 最新更新 -->
      <div v-if="novel.lastChapterTitle || novel.last_chapter_title" class="latest-update">
        <span class="label">最新:</span>
        <span class="chapter-title">{{ novel.lastChapterTitle || novel.last_chapter_title }}</span>
        <span class="update-time">{{ timeAgo(novel.lastUpdateTime || novel.last_update_time) }}</span>
      </div>
      
      <!-- 快捷操作 -->
      <div class="quick-actions">
        <button
          class="btn-read"
          :aria-label="`${hasReadingProgress ? '继续阅读' : '开始阅读'}${novel.title}`"
          @click.stop="startReading"
        >
          {{ hasReadingProgress ? '继续阅读' : '开始阅读' }}
        </button>
        <button
          class="btn-collect"
          :aria-label="isCollected ? '取消收藏' : '加入书架'"
          :aria-pressed="isCollected"
          @click.stop="toggleCollect"
        >
          <svg
            class="collect-icon"
            :class="{ filled: isCollected }"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              v-if="isCollected"
              fill-rule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clip-rule="evenodd"
            ></path>
            <path
              v-else
              fill-rule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clip-rule="evenodd"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            ></path>
          </svg>
          <span class="sr-only">{{ isCollected ? '已收藏' : '收藏' }}</span>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  novel: {
    type: Object,
    required: true
  },
  hasReadingProgress: {
    type: Boolean,
    default: false
  },
  isCollected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'read', 'collect'])
const router = useRouter()

// 是否是新书（7天内）
const isNew = computed(() => {
  if (!props.novel.created_at) return false
  const createTime = new Date(props.novel.created_at).getTime()
  const now = Date.now()
  const daysDiff = (now - createTime) / (1000 * 60 * 60 * 24)
  return daysDiff <= 7
})

// 是否是热门
const isHot = computed(() => {
  return props.novel.isHot || props.novel.is_hot || props.novel.views > 10000
})

// 点击卡片
function handleClick() {
  emit('click', props.novel)
  router.push(`/reading/${props.novel.id}`)
}

// 开始/继续阅读
function startReading() {
  emit('read', props.novel)
  router.push(`/reading/${props.novel.id}`)
}

// 收藏/取消收藏
function toggleCollect() {
  emit('collect', props.novel)
}

// 截断文本
function truncateText(text, maxLength) {
  if (!text) return '暂无简介'
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 格式化数字
function formatNumber(num) {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// 时间格式化
function timeAgo(time) {
  if (!time) return '最近更新'
  const now = Date.now()
  const updateTime = new Date(time).getTime()
  const diff = now - updateTime
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < 30 * day) {
    return Math.floor(diff / day) + '天前'
  } else {
    return new Date(updateTime).toLocaleDateString()
  }
}
</script>

<style scoped>
.novel-card.enhanced {
  display: flex;
  gap: 1rem;
  background-color: var(--color-bg-elevated, #ffffff);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.novel-card.enhanced:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

/* 封面区域 */
.cover-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 100px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 2.5rem;
}

/* 状态标签 */
.status-badges {
  position: absolute;
  top: 6px;
  left: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge.new {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.badge.hot {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.badge.complete {
  background: #10b981;
  color: white;
}

.badge.updating {
  background: #3b82f6;
  color: white;
}

/* VIP标记 */
.vip-mark {
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #000;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 2px;
}

.vip-icon {
  font-size: 12px;
}

.vip-text {
  font-size: 10px;
}

/* 信息区域 */
.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.author {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.author-label {
  color: var(--color-text-muted);
  margin-right: 4px;
}

.description-preview {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 统计信息 */
.stats-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.stat-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* 最新更新 */
.latest-update {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  padding: 0.5rem;
  background: var(--color-bg-base, #fafafa);
  border-radius: 6px;
}

.latest-update .label {
  font-weight: 500;
  margin-right: 4px;
}

.latest-update .chapter-title {
  color: var(--color-text-secondary);
  margin-right: 8px;
}

.latest-update .update-time {
  color: var(--color-text-muted);
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.btn-read {
  flex: 1;
  padding: 0.625rem 1rem;
  background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-read:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.3);
}

.btn-collect {
  width: 40px;
  height: 40px;
  padding: 0;
  background: var(--color-bg-base, #fafafa);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-collect:hover {
  background: var(--color-bg-hover, #f3f4f6);
  transform: scale(1.05);
}

.collect-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-secondary);
  transition: all 0.3s ease;
}

.collect-icon.filled {
  color: var(--color-primary);
  animation: heartbeat 0.3s ease;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
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

/* 移动端适配 */
@media (max-width: 640px) {
  .novel-card.enhanced {
    padding: 0.75rem;
    gap: 0.75rem;
    border-radius: 10px;
  }
  
  .cover-wrapper {
    width: 75px;
    height: 105px;
  }
  
  .info-section {
    gap: 0.375rem;
  }
  
  .title {
    font-size: 0.9375rem;
    line-height: 1.3;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  
  .author {
    font-size: 0.8125rem;
  }
  
  .description-preview {
    font-size: 0.75rem;
    line-height: 1.4;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  
  .stats-inline {
    gap: 0.5rem;
  }
  
  .stat-item {
    font-size: 0.75rem;
  }
  
  .stat-icon {
    width: 14px;
    height: 14px;
  }
  
  .latest-update {
    font-size: 0.6875rem;
    padding: 0.375rem 0.5rem;
  }
  
  .quick-actions {
    gap: 0.375rem;
  }
  
  .btn-read {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    border-radius: 6px;
  }
  
  .btn-collect {
    width: 36px;
    height: 36px;
    border-radius: 6px;
  }
  
  .collect-icon {
    width: 18px;
    height: 18px;
  }
  
  /* 移动端触摸反馈 */
  .novel-card.enhanced:active {
    transform: scale(0.98);
  }
  
  .btn-read:active {
    transform: scale(0.95);
  }
  
  .btn-collect:active {
    transform: scale(0.95);
  }
}
</style>

