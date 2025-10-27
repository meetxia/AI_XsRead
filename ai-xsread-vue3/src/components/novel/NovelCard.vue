<template>
  <div
    @click="handleClick"
    class="novel-card"
  >
    <!-- 顶部：分类和时间 -->
    <div class="card-header">
      <span class="category-tag" :style="getCategoryStyle()">
        {{ novel.category || '都市言情' }}
      </span>
      <span class="publish-time">{{ getPublishTime() }}</span>
    </div>

    <!-- 标题 -->
    <h3 class="card-title">{{ novel.title }}</h3>

    <!-- 描述 -->
    <p v-if="showDescription" class="card-description">
      {{ novel.description || '这是一个精彩的故事，讲述了一段动人的情节...' }}
    </p>

    <!-- 底部信息 -->
    <div class="card-footer">
      <div class="card-meta">
        <!-- 字数 -->
        <span class="meta-item">
          <svg class="meta-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
          </svg>
          {{ formatWordCount(novel.wordCount) }}
        </span>

        <!-- 点赞数 -->
        <span class="meta-item meta-likes">
          <svg class="meta-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
          </svg>
          {{ formatLikes(novel.likes) }}
        </span>
      </div>

      <!-- 阅读按钮 -->
      <span class="read-btn">阅读 →</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  novel: {
    type: Object,
    required: true
  },
  showDescription: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click', 'read', 'add-shelf'])

// 点击事件处理
function handleClick() {
  emit('click', props.novel)
}

// 格式化字数
function formatWordCount(count) {
  if (!count) return '12.8万字'
  if (count > 10000) {
    return `${(count / 10000).toFixed(1)}万字`
  }
  return `${count}字`
}

// 格式化点赞数
function formatLikes(likes) {
  if (!likes) return '2.3k'
  if (likes >= 10000) {
    return `${(likes / 10000).toFixed(1)}w`
  }
  if (likes >= 1000) {
    return `${(likes / 1000).toFixed(1)}k`
  }
  return likes
}

// 获取发布时间
function getPublishTime() {
  // 模拟数据，实际应该从 novel.publishTime 计算
  const times = ['3天前', '5天前', '1周前', '2周前']
  return times[Math.floor(Math.random() * times.length)]
}

// 获取分类样式
function getCategoryStyle() {
  const categories = {
    '都市言情': { bg: 'var(--color-accent)', color: 'var(--color-primary)' },
    '古风穿越': { bg: 'var(--color-accent)', color: 'var(--color-secondary)' },
    '悬疑推理': { bg: '#e9d5ff', color: '#9333ea' },
    '治愈系': { bg: '#d1fae5', color: '#10b981' },
    '玄幻': { bg: 'var(--color-accent)', color: 'var(--color-primary)' },
    '言情': { bg: 'var(--color-accent)', color: 'var(--color-secondary)' },
    '武侠': { bg: 'var(--color-accent)', color: 'var(--color-primary)' },
    '科幻': { bg: '#dbeafe', color: '#2563eb' },
    '历史': { bg: '#fef3c7', color: '#d97706' },
    '游戏': { bg: '#e9d5ff', color: '#9333ea' }
  }
  
  const category = props.novel.category || '都市言情'
  const style = categories[category] || categories['都市言情']
  
  return {
    backgroundColor: style.bg,
    color: style.color
  }
}
</script>

<style scoped>
.novel-card {
  background-color: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.novel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px var(--color-shadow), 0 10px 10px -5px var(--color-shadow);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.category-tag {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  font-weight: 500;
}

.publish-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 卡片标题 */
.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

/* 卡片描述 */
.card-description {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.75;
  margin-bottom: 1rem;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-muted);
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-icon {
  width: 1rem;
  height: 1rem;
  margin-right: 0.25rem;
}

.meta-likes {
  color: var(--color-primary);
}

.read-btn {
  font-weight: 500;
  color: var(--color-primary);
  transition: opacity 0.2s ease;
}

.novel-card:hover .read-btn {
  opacity: 0.8;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .novel-card {
    padding: 1.25rem;
  }

  .card-title {
    font-size: 1.125rem;
  }

  .card-description {
    font-size: 0.8125rem;
  }

  .card-footer {
    font-size: 0.8125rem;
  }
}
</style>
