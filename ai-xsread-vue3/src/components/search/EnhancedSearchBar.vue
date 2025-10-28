<template>
  <div class="enhanced-search-bar">
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper">
      <div class="search-input-container">
        <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        <input
          ref="inputRef"
          v-model="keyword"
          type="text"
          :placeholder="placeholder"
          @input="handleInput"
          @focus="handleFocus"
          @keyup.enter="handleSearch"
          @keydown="handleKeyDown"
          class="search-input"
          autocomplete="off"
        />
        
        <!-- 清空按钮 -->
        <button
          v-if="keyword"
          @click="handleClear"
          class="clear-btn"
          aria-label="清空搜索"
        >
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <!-- 搜索按钮 -->
        <button
          @click="handleSearch"
          class="search-btn"
          v-feedback
        >
          搜索
        </button>
      </div>
    </div>

    <!-- 搜索建议面板 -->
    <transition name="slide-fade">
      <div
        v-if="showPanel"
        class="suggestions-panel"
      >
        <!-- 热门搜索 -->
        <div v-if="!keyword && hotSearches.length > 0" class="section">
          <div class="section-header">
            <div class="section-title">
              <svg class="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
              </svg>
              <span>热门搜索</span>
            </div>
          </div>
          <div class="hot-searches">
            <div
              v-for="(item, index) in hotSearches"
              :key="item.id"
              class="hot-search-item"
              @click="selectHotSearch(item)"
              v-feedback="{ scale: true, ripple: true }"
            >
              <span class="hot-rank" :class="getRankClass(index)">{{ index + 1 }}</span>
              <span class="hot-keyword">{{ item.keyword }}</span>
              <span v-if="item.trend === 'up'" class="hot-trend up">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </span>
              <span v-else-if="item.trend === 'down'" class="hot-trend down">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <!-- 搜索历史 -->
        <div v-if="!keyword && searchHistory.length > 0" class="section">
          <div class="section-header">
            <div class="section-title">
              <svg class="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
              <span>搜索历史</span>
            </div>
            <button @click="clearHistory" class="clear-history-btn">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              清空
            </button>
          </div>
          <div class="history-list">
            <div
              v-for="item in searchHistory"
              :key="item.id"
              class="history-item"
              @click="selectHistory(item)"
            >
              <svg class="history-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
              <span class="history-keyword">{{ item.keyword }}</span>
              <button
                class="delete-history-btn"
                @click.stop="deleteHistory(item.id)"
                aria-label="删除历史记录"
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 实时搜索建议 -->
        <div v-if="keyword && suggestions.length > 0" class="section">
          <div class="section-header">
            <div class="section-title">
              <svg class="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
              <span>搜索建议</span>
            </div>
          </div>
          <div class="suggestions-list">
            <div
              v-for="(item, index) in suggestions"
              :key="item.id"
              class="suggestion-item"
              :class="{ active: activeSuggestionIndex === index }"
              @click="selectSuggestion(item)"
              @mouseenter="activeSuggestionIndex = index"
            >
              <svg class="suggestion-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
              <span class="suggestion-text" v-html="highlightKeyword(item.keyword)"></span>
              <span class="suggestion-count">约 {{ item.count }} 本</span>
            </div>
          </div>
        </div>

        <!-- 小说预览 -->
        <div v-if="keyword && novelPreviews.length > 0" class="section">
          <div class="section-header">
            <div class="section-title">
              <svg class="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <span>相关小说</span>
            </div>
            <router-link :to="`/search?keyword=${encodeURIComponent(keyword)}`" class="view-all-link">
              查看全部
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </router-link>
          </div>
          <div class="novel-previews">
            <div
              v-for="novel in novelPreviews"
              :key="novel.id"
              class="novel-preview-card"
              @click="goToNovel(novel.id)"
              v-feedback
            >
              <img :src="novel.cover" :alt="novel.title" class="novel-cover" />
              <div class="novel-info">
                <div class="novel-title">{{ novel.title }}</div>
                <div class="novel-author">{{ novel.author }}</div>
                <div class="novel-meta">
                  <span class="novel-category">{{ novel.category }}</span>
                  <span class="novel-status">{{ novel.status === 0 ? '完结' : '连载' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="keyword && suggestions.length === 0 && novelPreviews.length === 0 && !loading" class="empty-state">
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="empty-text">没有找到相关结果</div>
          <div class="empty-hint">换个关键词试试吧</div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <loading variant="dots" size="small" />
          <span class="loading-text">搜索中...</span>
        </div>
      </div>
    </transition>

    <!-- 遮罩层 -->
    <div
      v-if="showPanel"
      class="search-overlay"
      @click="closePanel"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash-es'
import Loading from '@/components/common/Loading.vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: '搜索小说、作者...'
  },
  hotSearches: {
    type: Array,
    default: () => []
  },
  maxHistory: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['search', 'suggest'])

const router = useRouter()

const inputRef = ref(null)
const keyword = ref('')
const showPanel = ref(false)
const loading = ref(false)
const suggestions = ref([])
const novelPreviews = ref([])
const searchHistory = ref([])
const activeSuggestionIndex = ref(-1)

// 获取排名样式类
function getRankClass(index) {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

// 输入处理
const handleInput = debounce(async () => {
  if (keyword.value.trim().length >= 2) {
    loading.value = true
    showPanel.value = true
    
    try {
      // 调用父组件的搜索建议方法
      emit('suggest', keyword.value.trim())
      
      // 模拟获取建议（实际项目中从API获取）
      await fetchSuggestions()
      await fetchNovelPreviews()
    } finally {
      loading.value = false
    }
  } else {
    suggestions.value = []
    novelPreviews.value = []
  }
}, 300)

// 聚焦处理
function handleFocus() {
  showPanel.value = true
  loadSearchHistory()
}

// 清空输入
function handleClear() {
  keyword.value = ''
  suggestions.value = []
  novelPreviews.value = []
  activeSuggestionIndex.value = -1
  inputRef.value?.focus()
}

// 执行搜索
function handleSearch() {
  if (keyword.value.trim()) {
    closePanel()
    saveToHistory(keyword.value.trim())
    emit('search', keyword.value.trim())
    router.push(`/search?keyword=${encodeURIComponent(keyword.value.trim())}`)
  }
}

// 键盘导航
function handleKeyDown(event) {
  if (!showPanel.value || suggestions.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      activeSuggestionIndex.value = Math.min(
        activeSuggestionIndex.value + 1,
        suggestions.value.length - 1
      )
      break
    case 'ArrowUp':
      event.preventDefault()
      activeSuggestionIndex.value = Math.max(
        activeSuggestionIndex.value - 1,
        -1
      )
      break
    case 'Enter':
      if (activeSuggestionIndex.value >= 0) {
        event.preventDefault()
        selectSuggestion(suggestions.value[activeSuggestionIndex.value])
      }
      break
    case 'Escape':
      closePanel()
      break
  }
}

// 选择热门搜索
function selectHotSearch(item) {
  keyword.value = item.keyword
  handleSearch()
}

// 选择历史记录
function selectHistory(item) {
  keyword.value = item.keyword
  handleSearch()
}

// 选择搜索建议
function selectSuggestion(item) {
  keyword.value = item.keyword
  handleSearch()
}

// 跳转到小说详情
function goToNovel(novelId) {
  closePanel()
  router.push(`/novel/${novelId}`)
}

// 高亮关键词
function highlightKeyword(text) {
  if (!keyword.value || !text) return text
  const regex = new RegExp(`(${keyword.value})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}

// 保存到搜索历史
function saveToHistory(keyword) {
  const existingIndex = searchHistory.value.findIndex(item => item.keyword === keyword)
  
  if (existingIndex > -1) {
    // 移到最前面
    searchHistory.value.splice(existingIndex, 1)
  }
  
  searchHistory.value.unshift({
    id: Date.now(),
    keyword,
    timestamp: new Date().toISOString()
  })
  
  // 限制历史记录数量
  if (searchHistory.value.length > props.maxHistory) {
    searchHistory.value = searchHistory.value.slice(0, props.maxHistory)
  }
  
  // 保存到localStorage
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 加载搜索历史
function loadSearchHistory() {
  try {
    const saved = localStorage.getItem('searchHistory')
    if (saved) {
      searchHistory.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载搜索历史失败:', error)
  }
}

// 删除单条历史
function deleteHistory(id) {
  searchHistory.value = searchHistory.value.filter(item => item.id !== id)
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 清空历史
function clearHistory() {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

// 关闭面板
function closePanel() {
  showPanel.value = false
  activeSuggestionIndex.value = -1
}

// 获取搜索建议（模拟）
async function fetchSuggestions() {
  // 实际项目中应该调用API
  await new Promise(resolve => setTimeout(resolve, 300))
  suggestions.value = [
    { id: 1, keyword: keyword.value + '推荐', count: 123 },
    { id: 2, keyword: keyword.value + '完结', count: 45 },
    { id: 3, keyword: keyword.value + '最新', count: 78 }
  ]
}

// 获取小说预览（模拟）
async function fetchNovelPreviews() {
  // 实际项目中应该调用API
  await new Promise(resolve => setTimeout(resolve, 300))
  novelPreviews.value = [
    {
      id: 1,
      title: keyword.value + '的故事',
      author: '作者A',
      cover: '/placeholder-cover.jpg',
      category: '玄幻',
      status: 1
    }
  ]
}

// 点击外部关闭
function handleClickOutside(event) {
  if (!event.target.closest('.enhanced-search-bar')) {
    closePanel()
  }
}

onMounted(() => {
  loadSearchHistory()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 暴露方法
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear: handleClear
})
</script>

<style scoped>
.enhanced-search-bar {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* 搜索输入框 */
.search-input-wrapper {
  position: relative;
  z-index: 51;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border);
  border-radius: 24px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-input-container:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px rgba(217, 84, 104, 0.15);
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  width: 20px;
  height: 20px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  flex: 1;
  width: 100%;
  padding: 1rem 9rem 1rem 3.5rem;
  font-size: 1rem;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.clear-btn {
  position: absolute;
  right: 7.5rem;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.clear-btn:hover {
  color: var(--color-text-primary);
}

.search-btn {
  position: absolute;
  right: 0.375rem;
  padding: 0.625rem 1.5rem;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.4);
}

/* 建议面板 */
.suggestions-panel {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  right: 0;
  max-height: 600px;
  overflow-y: auto;
  background: var(--color-bg-elevated);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  z-index: 50;
}

/* 滚动条样式 */
.suggestions-panel::-webkit-scrollbar {
  width: 6px;
}

.suggestions-panel::-webkit-scrollbar-track {
  background: transparent;
}

.suggestions-panel::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

/* 区块 */
.section {
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.section-icon {
  width: 16px;
  height: 16px;
  color: var(--color-primary);
}

/* 热门搜索 */
.hot-searches {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hot-search-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-bg-base);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hot-search-item:hover {
  background: var(--color-bg-hover);
}

.hot-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.hot-rank.rank-1 {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
}

.hot-rank.rank-2 {
  background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
  color: white;
}

.hot-rank.rank-3 {
  background: linear-gradient(135deg, #CD7F32, #8B4513);
  color: white;
}

.hot-keyword {
  flex: 1;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

.hot-trend {
  width: 16px;
  height: 16px;
}

.hot-trend.up {
  color: #ef4444;
}

.hot-trend.down {
  color: #10b981;
}

/* 搜索历史 */
.clear-history-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-history-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.clear-history-btn svg {
  width: 14px;
  height: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-bg-base);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  background: var(--color-bg-hover);
}

.history-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.history-keyword {
  flex: 1;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
}

.delete-history-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.delete-history-btn:hover {
  color: var(--color-primary);
}

/* 搜索建议 */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: var(--color-bg-hover);
}

.suggestion-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.suggestion-text {
  flex: 1;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
}

.suggestion-text :deep(.highlight) {
  background: transparent;
  color: var(--color-primary);
  font-weight: 600;
}

.suggestion-count {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* 小说预览 */
.view-all-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: var(--color-primary);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.view-all-link:hover {
  opacity: 0.8;
}

.view-all-link svg {
  width: 14px;
  height: 14px;
}

.novel-previews {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.novel-preview-card {
  display: flex;
  gap: 0.875rem;
  padding: 0.875rem;
  background: var(--color-bg-base);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.novel-preview-card:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
}

.novel-cover {
  width: 64px;
  height: 88px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.novel-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
}

.novel-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.novel-author {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.novel-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.novel-category,
.novel-status {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  background: var(--color-bg-hover);
  color: var(--color-text-muted);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 0.75rem;
}

.loading-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* 遮罩层 */
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 49;
}

/* 动画 */
.slide-fade-enter-active {
  animation: slideDown 0.3s ease-out;
}

.slide-fade-leave-active {
  animation: slideUp 0.2s ease-in;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .search-input {
    padding: 0.875rem 7.5rem 0.875rem 3rem;
    font-size: 0.9375rem;
  }

  .suggestions-panel {
    max-height: calc(100vh - 150px);
  }

  .novel-previews {
    grid-template-columns: 1fr;
  }
}
</style>

