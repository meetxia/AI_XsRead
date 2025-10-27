<template>
  <div class="bookshelf-page">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <div class="main-content">
      <!-- 页面标题 -->
      <div class="page-header fade-in">
        <h1 class="page-title">我的书架</h1>
        <p class="page-subtitle">书架是港湾，每本书都等待重逢</p>
      </div>

      <!-- 阅读统计 -->
      <section class="stats-section fade-in" style="animation-delay: 0.1s">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number" style="color: var(--color-primary)">{{ readingStats.readingBooks }}</div>
            <div class="stat-label">正在阅读</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color: var(--color-secondary)">{{ readingStats.finishedBooks }}</div>
            <div class="stat-label">已读完成</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color: #9333ea">{{ readingStats.totalReadTime }}</div>
            <div class="stat-label">阅读时长(h)</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color: #ec4899">{{ readingStats.weeklyReadTime }}</div>
            <div class="stat-label">本月阅读</div>
          </div>
        </div>
      </section>

      <!-- 书架标签 -->
      <section class="tabs-section fade-in" style="animation-delay: 0.2s">
        <div class="tabs-container">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="handleTabChange(tab.key)"
            :class="['tab-btn', { active: activeTab === tab.key }]"
          >
            {{ tab.label }}
          </button>
        </div>
      </section>

      <!-- 书籍展示区 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>

      <section v-else class="books-section fade-in" style="animation-delay: 0.3s">
        <div class="books-grid">
          <div v-for="book in filteredBooks" :key="book.id" 
               class="book-card" @click="handleBookClick(book)">
            <div class="book-cover" :style="{ background: book.coverGradient || getRandomGradient() }">
              <div class="book-cover-content">
                <h3 class="book-cover-title">{{ book.title }}</h3>
              </div>
              <div v-if="activeTab === 'reading'" class="book-progress-badge">
                阅读至 第{{ book.currentChapter || 3 }}章
              </div>
              <div v-if="activeTab === 'finished'" class="book-finished-badge">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
            </div>
            <div class="book-info">
              <h4 class="book-title">{{ book.title }}</h4>
              <p class="book-author">{{ book.author }}</p>
              <div v-if="activeTab === 'reading'" class="book-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: (book.progress || 35) + '%' }"></div>
                </div>
                <p class="progress-text">已读 {{ book.progress || 35 }}%</p>
              </div>
              <p v-else-if="activeTab === 'finished'" class="book-finish-time">
                {{ book.finishDays || 2 }}天前读完
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
    
    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookshelfStore } from '@/stores/bookshelf'
import AppHeader from '@/components/common/AppHeader.vue'
import BottomNav from '@/components/common/BottomNav.vue'

const router = useRouter()
const bookshelfStore = useBookshelfStore()

// 状态
const activeTab = ref('reading')
const viewMode = ref('grid')
const sortBy = ref('lastRead')
const editMode = ref(false)
const searchKeyword = ref('')
const selectedIds = ref([])
const loading = ref(false)
const showDeleteDialog = ref(false)
const deleteTarget = ref([])

// 标签配置
const tabs = computed(() => [
  { key: 'reading', label: '正在读', count: bookshelfStore.readingCount },
  { key: 'finished', label: '已读完', count: bookshelfStore.finishedCount },
  { key: 'collected', label: '收藏', count: bookshelfStore.collectedCount }
])

// 阅读统计
const readingStats = computed(() => ({
  totalBooks: bookshelfStore.totalCount || 12,
  readingBooks: bookshelfStore.readingCount || 12,
  finishedBooks: bookshelfStore.finishedCount || 35,
  totalReadTime: 128, // 示例数据
  weeklyReadTime: 58, // 示例数据
  consecutiveDays: 5 // 示例数据
}))

// 生成随机渐变色
const gradients = [
  'linear-gradient(to bottom right, #ec4899, #d95468)',
  'linear-gradient(to bottom right, #fbbf24, #f97316)',
  'linear-gradient(to bottom right, #a78bfa, #6366f1)',
  'linear-gradient(to bottom right, #60a5fa, #06b6d4)'
]

function getRandomGradient() {
  return gradients[Math.floor(Math.random() * gradients.length)]
}

// 当前展示的书籍列表
const currentBooks = computed(() => {
  switch (activeTab.value) {
    case 'reading':
      return bookshelfStore.reading
    case 'finished':
      return bookshelfStore.finished
    case 'collected':
      return bookshelfStore.collected
    default:
      return []
  }
})

// 过滤后的书籍列表（使用模拟数据）
const filteredBooks = computed(() => {
  if (currentBooks.value && currentBooks.value.length > 0) {
    return currentBooks.value
  }
  // 返回模拟数据
  return getMockBooks()
})

// 生成模拟书籍数据
function getMockBooks() {
  const books = []
  const count = activeTab.value === 'reading' ? 4 : activeTab.value === 'finished' ? 2 : 2
  const titles = ['时光里的温柔相遇', '长安月下，归人未归', '雨夜迷雾中的真相', '操场上的秘密约定']
  const authors = ['温柔笔触', '墨染流年', '悬疑女王', '青春记忆']
  
  for (let i = 0; i < count; i++) {
    books.push({
      id: i + 1,
      title: titles[i] || `小说标题 ${i + 1}`,
      author: authors[i] || `作者 ${i + 1}`,
      coverGradient: gradients[i % gradients.length],
      currentChapter: [3, 15, 8, 20][i] || 1,
      progress: [35, 60, 25, 80][i] || 50,
      finishDays: [2, 5][i] || 1
    })
  }
  
  return books
}

// 切换标签
function handleTabChange(tab) {
  activeTab.value = tab
  selectedIds.value = []
  searchKeyword.value = ''
}

// 切换视图
function handleViewChange(mode) {
  viewMode.value = mode
}

// 排序变化
function handleSortChange(sort) {
  sortBy.value = sort
  bookshelfStore.sortBookshelf(activeTab.value, sort)
}

// 搜索
function handleSearch(keyword) {
  searchKeyword.value = keyword
}

// 切换编辑模式
function toggleEditMode() {
  editMode.value = !editMode.value
  if (!editMode.value) {
    selectedIds.value = []
  }
}

// 切换选择
function toggleSelect(id) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

// 点击书籍
function handleBookClick(book) {
  if (!editMode.value) {
    router.push(`/novel/${book.id}`)
  }
}

// 继续阅读
function handleContinueRead(book) {
  router.push(`/read/${book.id}/${book.currentChapter || 1}`)
}

// 移除书籍
function handleRemove(id) {
  deleteTarget.value = [id]
  showDeleteDialog.value = true
}

// 批量删除
function handleBatchDelete() {
  deleteTarget.value = [...selectedIds.value]
  showDeleteDialog.value = true
}

// 确认删除
async function confirmDelete() {
  if (deleteTarget.value.length === 1) {
    await bookshelfStore.removeBook(deleteTarget.value[0], activeTab.value)
  } else {
    await bookshelfStore.batchDelete(deleteTarget.value)
  }
  
  selectedIds.value = []
  deleteTarget.value = []
  showDeleteDialog.value = false
  editMode.value = false
}

// 计算总阅读时长
function calculateTotalReadTime() {
  // 这里应该从后端获取真实数据，现在返回示例数据
  return 1250 // 分钟
}

// 初始化
onMounted(async () => {
  loading.value = true
  await bookshelfStore.fetchBookshelf()
  loading.value = false
})
</script>

<style scoped>
.bookshelf-page {
  min-height: 100vh;
  padding-top: 4rem;
  padding-bottom: 5rem;
}

@media (min-width: 768px) {
  .bookshelf-page {
    padding-bottom: 2rem;
  }
}

.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 页面头部 */
.page-header {
  text-align: center;
  padding: 3rem 0 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background-color: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* 标签切换 */
.tabs-section {
  margin-bottom: 3rem;
}

.tabs-container {
  display: flex;
  justify-content: center;
  background-color: var(--color-bg-card);
  border-radius: 9999px;
  padding: 0.25rem;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
  max-width: max-content;
  margin: 0 auto;
}

.tab-btn {
  padding: 0.625rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab-btn.active {
  color: white;
  background-color: var(--color-primary);
}

/* 加载状态 */
.loading-container {
  text-align: center;
  padding: 5rem 0;
}

.loading-spinner {
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 1rem;
  color: var(--color-text-muted);
}

/* 书籍网格 */
.books-section {
  margin-bottom: 2rem;
}

.books-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 640px) {
  .books-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .books-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1280px) {
  .books-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.book-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.book-card:hover {
  transform: scale(1.05);
}

.book-cover {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.book-card:hover .book-cover {
  box-shadow: 0 10px 25px -5px var(--color-shadow);
}

.book-cover-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.book-cover-title {
  color: white;
  text-align: center;
  font-weight: 700;
  font-size: 1.125rem;
}

.book-progress-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.75rem;
  padding: 0.5rem;
  text-align: center;
}

.book-finished-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #fbbf24;
  width: 1.5rem;
  height: 1.5rem;
}

.book-info {
  padding: 0 0.25rem;
}

.book-title {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.book-progress {
  margin-top: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 0.375rem;
  background-color: var(--color-border);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

.book-finish-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

/* 淡入动画 */
.fade-in {
  animation: fadeIn 0.8s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

