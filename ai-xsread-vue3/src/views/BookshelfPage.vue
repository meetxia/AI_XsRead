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
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.readingBooks }}</div>
              <div class="stat-label">正在阅读</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.finishedBooks }}</div>
              <div class="stat-label">已读完成</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalReadTime }}</div>
              <div class="stat-label">阅读时长(h)</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalBooks }}</div>
              <div class="stat-label">书架总数</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 书架标签和操作栏 -->
      <section class="tabs-section fade-in" style="animation-delay: 0.2s">
        <div class="tabs-header">
          <div class="tabs-container">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="handleTabChange(tab.key)"
              :class="['tab-btn', { active: activeTab === tab.key }]"
            >
              {{ tab.label }}
              <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
            </button>
          </div>
          
          <!-- 操作按钮 -->
          <div class="toolbar">
            <button 
              v-if="!editMode"
              class="tool-btn"
              @click="toggleEditMode"
              title="批量管理"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            <button 
              v-if="editMode"
              class="tool-btn cancel-btn"
              @click="toggleEditMode"
            >
              取消
            </button>
            
            <button 
              v-if="editMode && selectedIds.length > 0"
              class="tool-btn delete-btn"
              @click="handleBatchDelete"
            >
              删除 ({{ selectedIds.length }})
            </button>

            <div class="sort-select">
              <select
                :value="sortBy"
                @change="handleSortChange($event.target.value)"
                class="sort-dropdown"
              >
                <option value="lastRead">最近阅读</option>
                <option value="addTime">加入时间</option>
                <option value="updateTime">更新时间</option>
                <option value="title">书名排序</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- 书籍展示区 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>

      <section v-else class="books-section fade-in" style="animation-delay: 0.3s">
        <!-- 空状态 -->
        <div v-if="filteredBooks.length === 0" class="empty-state">
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
          <p class="empty-text">书架空空如也</p>
          <p class="empty-hint">去发现更多好书吧~</p>
          <button class="discover-btn" @click="router.push('/')">
            探索书库
          </button>
        </div>

        <!-- 书籍列表 -->
        <div v-else class="books-grid">
          <div 
            v-for="book in filteredBooks" 
            :key="book.id" 
            :class="['book-card', { 'edit-mode': editMode, 'selected': selectedIds.includes(book.id) }]"
          >
            <!-- 编辑模式选择框 -->
            <div v-if="editMode" class="select-checkbox" @click.stop="toggleSelect(book.id)">
              <div class="checkbox" :class="{ checked: selectedIds.includes(book.id) }">
                <svg v-if="selectedIds.includes(book.id)" class="check-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </div>
            </div>

            <!-- 书籍封面 -->
            <div class="book-cover" 
                 :style="{ background: book.coverGradient || getRandomGradient() }"
                 @click="handleBookClick(book)">
              <div class="book-cover-content">
                <h3 class="book-cover-title">{{ book.title }}</h3>
              </div>
              
              <!-- 阅读进度徽章 -->
              <div v-if="activeTab === 'reading'" class="book-progress-badge">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                </svg>
                第{{ book.currentChapter || 3 }}章
              </div>
              
              <!-- 完成徽章 -->
              <div v-if="activeTab === 'finished'" class="book-finished-badge">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>

              <!-- 更多操作按钮 -->
              <div v-if="!editMode" class="book-actions" @click.stop>
                <button class="action-btn" @click="handleRemove(book.id)" title="移除">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- 书籍信息 -->
            <div class="book-info" @click="handleBookClick(book)">
              <h4 class="book-title">{{ book.title }}</h4>
              <p class="book-author">{{ book.author }}</p>
              
              <!-- 阅读进度条 -->
              <div v-if="activeTab === 'reading'" class="book-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: (book.progress || 35) + '%' }"></div>
                </div>
                <p class="progress-text">已读 {{ book.progress || 35 }}%</p>
              </div>
              
              <!-- 完成时间 -->
              <p v-else-if="activeTab === 'finished'" class="book-finish-time">
                <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                </svg>
                {{ book.finishDays || 2 }}天前读完
              </p>

              <!-- 快捷操作按钮 -->
              <div v-if="!editMode && activeTab === 'reading'" class="quick-actions">
                <button class="quick-btn primary" @click.stop="handleContinueRead(book)">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  继续阅读
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 删除确认对话框 -->
      <div v-if="showDeleteDialog" class="modal-overlay" @click="showDeleteDialog = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">确认删除</h3>
            <button class="modal-close" @click="showDeleteDialog = false">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p>确定要从书架中移除这{{ deleteTarget.length }}本书吗？</p>
            <p class="modal-hint">移除后可以重新添加到书架</p>
          </div>
          <div class="modal-footer">
            <button class="modal-btn cancel" @click="showDeleteDialog = false">取消</button>
            <button class="modal-btn confirm" @click="confirmDelete">确认删除</button>
          </div>
        </div>
      </div>

    </div>
    
    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookshelfStore } from '@/stores/bookshelf'
import { getUserStatistics } from '@/api/user'
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

// 统计数据
const stats = ref({
  totalBooks: 0,
  readingBooks: 0,
  finishedBooks: 0,
  totalReadTime: 0
})

// 标签配置
const tabs = computed(() => [
  { key: 'reading', label: '正在读', count: stats.value.readingBooks },
  { key: 'finished', label: '已读完', count: stats.value.finishedBooks },
  { key: 'collected', label: '收藏', count: 0 }
])

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

// 加载统计数据
async function loadStats() {
  try {
    const res = await getUserStatistics()
    if (res.code === 200) {
      stats.value = {
        totalBooks: res.data.bookshelf?.total || 0,
        readingBooks: res.data.bookshelf?.reading || 0,
        finishedBooks: res.data.bookshelf?.finished || 0,
        totalReadTime: Math.round((res.data.readTime?.total || 0) / 60) // 转换为小时
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 初始化
onMounted(async () => {
  loading.value = true
  await Promise.all([
    bookshelfStore.fetchBookshelf(),
    loadStats()
  ])
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
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px var(--color-shadow);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px var(--color-shadow);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

/* 标签切换和工具栏 */
.tabs-section {
  margin-bottom: 3rem;
}

.tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.tabs-container {
  display: flex;
  background-color: var(--color-bg-card);
  border-radius: 9999px;
  padding: 0.25rem;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
}

.tab-btn {
  position: relative;
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

.tab-badge {
  display: inline-block;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  margin-left: 0.375rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  font-size: 0.75rem;
  line-height: 1.25rem;
  text-align: center;
}

.tab-btn.active .tab-badge {
  background: rgba(255, 255, 255, 0.3);
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tool-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tool-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.tool-btn.cancel-btn {
  color: var(--color-text-muted);
}

.tool-btn.delete-btn {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

.tool-btn.delete-btn:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

.sort-select {
  position: relative;
}

.sort-dropdown {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1rem;
}

.sort-dropdown:hover {
  border-color: var(--color-primary);
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

