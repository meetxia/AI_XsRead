<template>
  <div v-show="show" class="search-suggestions" role="listbox">
    <!-- 热门搜索 -->
    <div v-if="!keyword && hotSearches.length" class="suggestion-section">
      <div class="section-header">
        <svg class="section-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"></path>
        </svg>
        <span class="section-title">热门搜索</span>
      </div>
      <div class="hot-tags">
        <button
          v-for="item in hotSearches"
          :key="item.id"
          class="hot-tag"
          @click="handleSelect(item.keyword)"
        >
          {{ item.keyword }}
        </button>
      </div>
    </div>
    
    <!-- 搜索历史 -->
    <div v-if="!keyword && searchHistory.length" class="suggestion-section">
      <div class="section-header">
        <svg class="section-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
        </svg>
        <span class="section-title">搜索历史</span>
        <button class="btn-clear" @click="clearHistory">清空</button>
      </div>
      <div class="history-list">
        <div
          v-for="item in searchHistory"
          :key="item.id"
          class="history-item"
          role="option"
          @click="handleSelect(item.keyword)"
        >
          <span class="history-keyword">{{ item.keyword }}</span>
          <button
            class="btn-delete"
            aria-label="删除此搜索记录"
            @click.stop="deleteHistory(item.id)"
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 实时建议 -->
    <div v-if="keyword && suggestions.length" class="suggestion-section">
      <div class="section-header">
        <svg class="section-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>
        </svg>
        <span class="section-title">搜索建议</span>
      </div>
      <div class="suggestion-list">
        <div
          v-for="item in suggestions"
          :key="item.id"
          class="suggestion-item"
          role="option"
          @click="handleSelect(item.keyword)"
        >
          <span class="suggestion-text" v-html="highlightKeyword(item.keyword)"></span>
          <span class="suggestion-count">约{{ item.count }}本</span>
        </div>
      </div>
    </div>
    
    <!-- 小说预览 -->
    <div v-if="keyword && novelPreviews.length" class="suggestion-section">
      <div class="section-header">
        <svg class="section-icon" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
        </svg>
        <span class="section-title">相关小说</span>
      </div>
      <div class="novel-previews">
        <div
          v-for="novel in novelPreviews"
          :key="novel.id"
          class="novel-preview-item"
          @click="handleSelectNovel(novel)"
        >
          <img
            v-if="novel.cover"
            :src="novel.cover"
            :alt="novel.title"
            class="preview-cover"
          />
          <div v-else class="preview-cover-placeholder">
            <span>📚</span>
          </div>
          <div class="preview-info">
            <div class="preview-title">{{ novel.title }}</div>
            <div class="preview-author">{{ novel.author }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  keyword: {
    type: String,
    default: ''
  },
  show: {
    type: Boolean,
    default: false
  },
  hotSearches: {
    type: Array,
    default: () => []
  },
  searchHistory: {
    type: Array,
    default: () => []
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  novelPreviews: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'select-novel', 'clear-history', 'delete-history'])

// 高亮关键词
function highlightKeyword(text) {
  if (!props.keyword) return text
  const regex = new RegExp(`(${props.keyword})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}

// 选择建议
function handleSelect(keyword) {
  emit('select', keyword)
}

// 选择小说
function handleSelectNovel(novel) {
  emit('select-novel', novel)
}

// 清空历史
function clearHistory() {
  emit('clear-history')
}

// 删除单条历史
function deleteHistory(id) {
  emit('delete-history', id)
}
</script>

<style scoped>
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: var(--color-bg-elevated, #ffffff);
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 500px;
  overflow-y: auto;
  z-index: 50;
}

/* 区域 */
.suggestion-section {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.suggestion-section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.section-icon {
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  flex: 1;
}

.btn-clear {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color 0.2s ease;
}

.btn-clear:hover {
  color: var(--color-primary);
}

/* 热门标签 */
.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hot-tag {
  padding: 0.375rem 0.875rem;
  background: var(--color-bg-hover, #f8f8f8);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 16px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.hot-tag:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  transform: scale(1.05);
}

/* 历史列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-hover, #f8f8f8);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.history-item:hover {
  background: var(--color-bg-base, #f3f4f6);
}

.history-keyword {
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.btn-delete {
  width: 20px;
  height: 20px;
  padding: 0;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.btn-delete:hover {
  color: var(--color-primary);
}

.btn-delete svg {
  width: 100%;
  height: 100%;
}

/* 建议列表 */
.suggestion-list {
  display: flex;
  flex-direction: column;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.2s ease;
  border-radius: 6px;
}

.suggestion-item:hover {
  background: var(--color-bg-hover, #f8f8f8);
}

.suggestion-text {
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.suggestion-text :deep(mark.highlight) {
  background: var(--color-accent, #FFBAAC);
  color: var(--color-primary);
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 500;
}

.suggestion-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 小说预览 */
.novel-previews {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.novel-preview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-hover, #f8f8f8);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.novel-preview-item:hover {
  background: var(--color-bg-base, #f3f4f6);
  transform: translateX(4px);
}

.preview-cover,
.preview-cover-placeholder {
  width: 48px;
  height: 64px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.preview-cover-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-author {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .search-suggestions {
    max-height: 400px;
  }
  
  .suggestion-section {
    padding: 0.875rem;
  }
}
</style>

