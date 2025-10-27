<template>
  <!-- 抽屉遮罩 -->
  <Transition name="fade">
    <div
      v-if="visible"
      class="drawer-overlay"
      @click="handleClose"
    ></div>
  </Transition>

  <!-- 抽屉内容 -->
  <Transition name="slide-right">
    <div v-if="visible" class="chapter-drawer">
      <!-- 抽屉头部 -->
      <div class="drawer-header">
        <h2>章节目录</h2>
        <button @click="handleClose" class="close-btn">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <svg class="search-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索章节..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- 章节统计 -->
      <div class="chapter-stats">
        <span>共 {{ totalChapters }} 章</span>
        <span class="separator">|</span>
        <span>已读 {{ readChapters }} 章</span>
      </div>

      <!-- 章节列表 -->
      <div ref="listRef" class="chapter-list">
        <div
          v-for="chapter in filteredChapters"
          :key="chapter.id"
          :class="[
            'chapter-item',
            { 'active': chapter.id === currentChapterId },
            { 'read': chapter.isRead }
          ]"
          @click="handleSelectChapter(chapter)"
        >
          <div class="chapter-number">{{ chapter.chapterNumber }}</div>
          <div class="chapter-info">
            <h3 class="chapter-title">{{ chapter.title }}</h3>
            <div class="chapter-meta">
              <span class="chapter-words">{{ formatWordCount(chapter.wordCount) }}</span>
              <span v-if="chapter.isRead" class="read-badge">已读</span>
              <span v-if="chapter.isVip" class="vip-badge">VIP</span>
            </div>
          </div>
          <svg v-if="chapter.id === currentChapterId" class="current-icon w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredChapters.length === 0" class="empty-state">
          <svg class="w-16 h-16 text-themed-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>没有找到相关章节</p>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <button @click="scrollToFirst" class="quick-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
          </svg>
          <span>第一章</span>
        </button>
        <button @click="scrollToCurrent" class="quick-btn">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd"></path>
          </svg>
          <span>当前章节</span>
        </button>
        <button @click="scrollToLast" class="quick-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <span>最新章</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  chapters: {
    type: Array,
    default: () => []
  },
  currentChapterId: {
    type: [Number, String],
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'select-chapter'])

// 搜索关键词
const searchQuery = ref('')

// 列表引用
const listRef = ref(null)

// 过滤后的章节列表
const filteredChapters = computed(() => {
  if (!searchQuery.value) {
    return props.chapters
  }
  
  const query = searchQuery.value.toLowerCase()
  return props.chapters.filter(chapter => 
    chapter.title.toLowerCase().includes(query) ||
    chapter.chapterNumber.toString().includes(query)
  )
})

// 总章节数
const totalChapters = computed(() => props.chapters.length)

// 已读章节数
const readChapters = computed(() => 
  props.chapters.filter(ch => ch.isRead).length
)

/**
 * 格式化字数
 */
const formatWordCount = (count) => {
  if (!count) return '0字'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万字'
  }
  return count + '字'
}

/**
 * 关闭抽屉
 */
const handleClose = () => {
  emit('close')
}

/**
 * 选择章节
 */
const handleSelectChapter = (chapter) => {
  emit('select-chapter', chapter)
  emit('close')
}

/**
 * 滚动到第一章
 */
const scrollToFirst = () => {
  if (listRef.value) {
    listRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

/**
 * 滚动到当前章节
 */
const scrollToCurrent = () => {
  nextTick(() => {
    const currentItem = listRef.value?.querySelector('.chapter-item.active')
    if (currentItem) {
      currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

/**
 * 滚动到最后一章
 */
const scrollToLast = () => {
  if (listRef.value) {
    listRef.value.scrollTo({ 
      top: listRef.value.scrollHeight, 
      behavior: 'smooth' 
    })
  }
}

// 监听visible变化，自动滚动到当前章节
watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      scrollToCurrent()
    })
  }
})
</script>

<style scoped>
/* 遮罩 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 200;
}

/* 抽屉 */
.chapter-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 85vw;
  background-color: var(--color-bg-card);
  box-shadow: -4px 0 8px var(--color-shadow);
  z-index: 201;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 抽屉头部 */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.drawer-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-btn {
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--color-accent);
  color: var(--color-primary);
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.search-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background-color: transparent;
  color: var(--color-text-primary);
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.clear-btn {
  padding: 0.25rem;
  color: var(--color-text-muted);
}

/* 章节统计 */
.chapter-stats {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.separator {
  margin: 0 0.5rem;
}

/* 章节列表 */
.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.chapter-item:hover {
  background-color: var(--color-accent);
}

.chapter-item.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.chapter-item.read:not(.active) {
  opacity: 0.6;
}

.chapter-number {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background-color: var(--color-accent);
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.875rem;
}

.chapter-item.active .chapter-number {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-item.active .chapter-title {
  color: white;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.chapter-item.active .chapter-meta {
  color: rgba(255, 255, 255, 0.8);
}

.read-badge,
.vip-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
}

.read-badge {
  background-color: var(--color-secondary);
  color: white;
}

.vip-badge {
  background-color: #fbbf24;
  color: white;
}

.current-icon {
  flex-shrink: 0;
  color: white;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.empty-state p {
  margin-top: 1rem;
  font-size: 0.875rem;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.quick-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  border-radius: 0.5rem;
  color: var(--color-text-secondary);
  background-color: transparent;
  transition: all 0.2s;
  font-size: 0.75rem;
}

.quick-btn:hover {
  background-color: var(--color-accent);
  color: var(--color-primary);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .chapter-drawer {
    width: 100%;
    max-width: 100vw;
  }
  
  .quick-actions {
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }
}
</style>

