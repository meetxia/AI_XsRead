<template>
  <div class="empty-state" role="status" aria-live="polite">
    <!-- 插图 -->
    <div class="empty-illustration">
      <div class="illustration-wrapper">
        <span class="illustration-emoji">{{ emoji }}</span>
      </div>
    </div>
    
    <!-- 标题 -->
    <h3 class="empty-title">{{ currentTitle }}</h3>
    
    <!-- 描述 -->
    <p class="empty-message">{{ currentMessage }}</p>
    
    <!-- 操作按钮 -->
    <button
      v-if="actionText"
      class="empty-action-btn"
      @click="$emit('action')"
    >
      {{ actionText }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['action'])

// 预设的空状态文案
const presets = {
  'bookshelf-empty': {
    emoji: '📚',
    title: '书架空空如也',
    message: '快去发现喜欢的小说吧',
    actionText: '去首页看看'
  },
  'search-no-results': {
    emoji: '🔍',
    title: '没有找到相关小说',
    message: '换个关键词试试？或者看看推荐的书',
    actionText: '查看推荐'
  },
  'comments-empty': {
    emoji: '💭',
    title: '还没有评论',
    message: '成为第一个发表评论的人吧',
    actionText: '发表评论'
  },
  'network-error': {
    emoji: '🌐',
    title: '网络开小差了',
    message: '请检查网络连接后重试',
    actionText: '重新加载'
  },
  'no-data': {
    emoji: '📭',
    title: '暂无数据',
    message: '这里还没有内容哦',
    actionText: ''
  },
  'reading-history-empty': {
    emoji: '📖',
    title: '还没有阅读记录',
    message: '开始你的第一次阅读吧',
    actionText: '去看看小说'
  },
  'favorites-empty': {
    emoji: '❤️',
    title: '还没有收藏',
    message: '收藏你喜欢的小说，方便下次阅读',
    actionText: '去发现'
  },
  '404': {
    emoji: '🔭',
    title: '页面走丢了',
    message: '我们找不到你要访问的页面',
    actionText: '返回首页'
  }
}

// 获取当前配置
const currentPreset = computed(() => {
  return presets[props.type] || presets['no-data']
})

const emoji = computed(() => {
  return currentPreset.value.emoji
})

const currentTitle = computed(() => {
  return props.title || currentPreset.value.title
})

const currentMessage = computed(() => {
  return props.message || currentPreset.value.message
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: 400px;
}

/* 插图 */
.empty-illustration {
  margin-bottom: 2rem;
}

.illustration-wrapper {
  width: 120px;
  height: 120px;
  background: var(--color-bg-hover, #f8f8f8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}

.illustration-emoji {
  font-size: 4rem;
  line-height: 1;
}

/* 浮动动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 标题 */
.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.75rem;
}

/* 描述 */
.empty-message {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0 0 2rem;
  max-width: 400px;
  line-height: 1.6;
}

/* 操作按钮 */
.empty-action-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.3);
}

.empty-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(217, 84, 104, 0.4);
}

.empty-action-btn:active {
  transform: translateY(0);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .empty-state {
    padding: 3rem 1.5rem;
    min-height: 300px;
  }
  
  .illustration-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .illustration-emoji {
    font-size: 3rem;
  }
  
  .empty-title {
    font-size: 1.25rem;
  }
  
  .empty-message {
    font-size: 0.9375rem;
  }
}
</style>

