<template>
  <div class="bookshelf-page">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <div class="main-content">
      <!-- 页面标题 -->
      <div class="page-header fade-in">
        <div class="container">
          <h1 class="page-title">我的书架</h1>
          <p class="page-subtitle">书架是港湾，每本书都等待重逢</p>
        </div>
      </div>

      <!-- 阅读统计 -->
      <section class="stats-section fade-in mt-xl" style="animation-delay: 0.1s">
        <div class="container">
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
        </div>
      </section>

      <!-- 书架标签和操作栏 -->
      <section class="tabs-section fade-in" style="animation-delay: 0.2s">
        <div class="container">
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
        </div>
      </section>

      <!-- 书籍展示区 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>

      <section v-else class="books-section fade-in" style="animation-delay: 0.3s">
        <div class="container">
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
              
              <!-- 阅读进度徽章 - 显示实际阅读进度 -->
              <div v-if="activeTab === 'reading' && book.progress > 0" class="book-progress-badge">
                {{ Math.round(book.progress) }}%
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
            
            <!-- 书籍信息 - 简化版：仅显示书名 -->
            <div class="book-info" @click="handleBookClick(book)">
              <h4 class="book-title">{{ book.title }}</h4>
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

// 过滤后的书籍列表（不使用模拟数据）
const filteredBooks = computed(() => {
  return currentBooks.value || []
})

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

// 点击书籍 - 直接跳转到阅读页面
function handleBookClick(book) {
  // 编辑模式下不跳转，只选择
  if (editMode.value) {
    toggleSelect(book.id)
    return
  }
  
  // 直接跳转到阅读页面，定位到上次阅读的章节
  const chapter = book.currentChapter || 1
  router.push(`/read/${book.id}/${chapter}`)
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
    // 统计数据失败不影响页面显示，保持默认值
    stats.value = {
      totalBooks: 0,
      readingBooks: 0,
      finishedBooks: 0,
      totalReadTime: 0
    }
  }
}

// 初始化
onMounted(async () => {
  // 检查登录状态
  const token = localStorage.getItem('token')
  if (!token) {
    console.warn('未登录，跳转到登录页')
    router.push('/login?redirect=/bookshelf')
    return
  }

  loading.value = true
  try {
    await Promise.all([
      bookshelfStore.fetchBookshelf(),
      loadStats()
    ])
  } catch (error) {
    console.error('加载书架数据失败:', error)
    // 如果是401错误，说明token无效，跳转到登录页
    if (error.response?.status === 401 || error.message?.includes('401')) {
      console.warn('Token无效或已过期，跳转到登录页')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      router.push('/login?redirect=/bookshelf')
    }
  } finally {
    loading.value = false
  }
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

/* ===== 主内容区域 - 确保左右边距一致 ===== */
.main-content {
  width: 100%;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
}

@media (max-width: 640px) {
  .container {
    padding: 0 0.75rem;
  }
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

/* 移动端优化：隐藏标题 */
@media (max-width: 767px) {
  .page-header {
    display: none;
  }
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

/* 移动端统计卡片优化 */
@media (max-width: 767px) {
  .stats-section {
    margin-bottom: 1.5rem;
  }

  .stats-grid {
    gap: 0.5rem;
  }

  .stat-card {
    padding: 0.75rem;
    gap: 0.625rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 4px var(--color-shadow);
  }

  .stat-card:hover {
    transform: none;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .stat-icon svg {
    width: 1.125rem;
    height: 1.125rem;
  }

  .stat-number {
    font-size: 1.125rem;
    font-weight: 600;
  }

  .stat-label {
    font-size: 0.625rem;
    margin-top: 0.125rem;
  }
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

/* 移动端标签优化 */
@media (max-width: 767px) {
  .tabs-section {
    margin-bottom: 1.5rem;
  }

  .tabs-header {
    gap: 0.5rem;
  }

  .tabs-container {
    padding: 0.2rem;
    box-shadow: 0 2px 4px var(--color-shadow);
  }

  .tab-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
  }

  .tab-badge {
    min-width: 1rem;
    height: 1rem;
    padding: 0 0.25rem;
    margin-left: 0.25rem;
    font-size: 0.625rem;
    line-height: 1rem;
  }
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

/* 移动端工具栏优化 */
@media (max-width: 767px) {
  .toolbar {
    gap: 0.5rem;
  }

  .tool-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    border-radius: 0.375rem;
  }

  .tool-btn svg {
    width: 1rem;
    height: 1rem;
  }

  .sort-dropdown {
    padding: 0.375rem 1.75rem 0.375rem 0.625rem;
    font-size: 0.8125rem;
    border-radius: 0.375rem;
    background-size: 0.875rem;
  }
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

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 5rem 2rem;
}

.empty-icon {
  width: 8rem;
  height: 8rem;
  margin: 0 auto 1.5rem;
  color: var(--color-text-muted);
  opacity: 0.5;
}

.empty-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.discover-btn {
  padding: 0.75rem 2rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.discover-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 书籍网格 */
.books-section {
  margin-bottom: 2rem;
}

.books-grid {
  display: grid;
  gap: 0.625rem;
  grid-template-columns: repeat(3, 1fr);
}

@media (min-width: 640px) {
  .books-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .books-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 1.25rem;
  }
}

@media (min-width: 1280px) {
  .books-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 1.5rem;
  }
}

.book-card {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 0;
  box-sizing: border-box;
}

.book-card.edit-mode {
  padding-top: 2rem;
}

.book-card:hover {
  transform: scale(1.05);
}

.book-card.edit-mode:hover {
  transform: none;
}

/* 选择框 */
.select-checkbox {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 10;
  cursor: pointer;
}

.checkbox {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  border: 2px solid var(--color-border);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.check-icon {
  width: 1rem;
  height: 1rem;
  color: white;
}

.book-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.book-card:hover .book-cover {
  box-shadow: 0 10px 25px -5px var(--color-shadow);
}

/* 操作按钮 */
.book-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.book-card:hover .book-actions {
  opacity: 1;
}

.action-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #ef4444;
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
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-progress-badge {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.375rem 0.625rem;
  border-radius: 9999px;
  text-align: center;
  backdrop-filter: blur(4px);
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
  width: 100%;
  box-sizing: border-box;
}

.book-title {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}

/* 不再需要的样式已移除：进度条、完成时间、快捷按钮 */

/* 模态框 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fadeIn 0.2s ease-in;
}

.modal-content {
  background: var(--color-bg-card);
  border-radius: 1rem;
  max-width: 28rem;
  width: calc(100% - 2rem);
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(1rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal-close {
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-muted);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.modal-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.modal-btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn.cancel {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.modal-btn.cancel:hover {
  background: var(--color-bg-hover);
}

.modal-btn.confirm {
  background: #ef4444;
  color: white;
}

.modal-btn.confirm:hover {
  background: #dc2626;
}

/* 工具类 */
.w-3 {
  width: 0.75rem;
}

.h-3 {
  height: 0.75rem;
}

.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

.inline {
  display: inline;
}

.mr-1 {
  margin-right: 0.25rem;
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

/* 移动端书籍卡片和布局优化 */
@media (max-width: 767px) {
  /* 整体内边距 - 移除额外的padding，使用container的padding */
  .main-content {
    padding: 0;
  }

  .mt-xl {
    margin-top: 1rem;
  }

  .bookshelf-page {
    padding-top: 3.5rem;
  }

  /* 书籍网格间距 - 3列布局专用 */
  .books-grid {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 0.5rem !important;
  }

  /* 书籍卡片 - grid布局中不需要width:100% */
  .book-card {
    min-width: 0;
  }

  /* 书籍封面 - 优化尺寸 */
  .book-cover {
    border-radius: 0.375rem;
    box-shadow: 0 1px 3px var(--color-shadow);
    margin-bottom: 0.4rem;
    /* aspect-ratio已在基础样式中定义为3/4，移动端保持不变 */
  }

  .book-card:hover .book-cover {
    box-shadow: 0 2px 6px var(--color-shadow);
  }

  /* 书籍封面内容 - 紧凑内边距 */
  .book-cover-content {
    padding: 0.5rem 0.4rem;
  }

  /* 书籍封面标题 - 合适字体 */
  .book-cover-title {
    font-size: 0.8125rem;
    line-height: 1.25;
    font-weight: 600;
  }

  /* 书籍信息 */
  .book-info {
    padding: 0 0.125rem;
  }

  .book-title {
    font-size: 0.8125rem;
    margin-bottom: 0.125rem;
    font-weight: 500;
    line-height: 1.3;
  }

  .book-author {
    font-size: 0.6875rem;
    margin-bottom: 0.3rem;
    line-height: 1.2;
  }

  /* 进度徽章 - 移动端优化 */
  .book-progress-badge {
    font-size: 0.625rem;
    padding: 0.25rem 0.5rem;
    bottom: 0.375rem;
    right: 0.375rem;
  }

  /* 完成徽章 - 移动端优化 */
  .book-finished-badge {
    width: 1rem;
    height: 1rem;
    top: 0.375rem;
    right: 0.375rem;
  }

  /* 空状态 */
  .empty-state {
    padding: 3rem 1rem;
  }

  .empty-icon {
    width: 5rem;
    height: 5rem;
    margin-bottom: 1rem;
  }

  .empty-text {
    font-size: 1rem;
  }

  .empty-hint {
    font-size: 0.8125rem;
    margin-bottom: 1.5rem;
  }

  .discover-btn {
    padding: 0.625rem 1.5rem;
    font-size: 0.875rem;
  }

  /* 加载状态 */
  .loading-container {
    padding: 3rem 0;
  }

  .loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
  }

  /* 模态框 */
  .modal-content {
    width: calc(100% - 1.5rem);
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-body p {
    font-size: 0.875rem;
  }

  .modal-hint {
    font-size: 0.8125rem;
  }

  .modal-footer {
    padding: 1rem;
    gap: 0.5rem;
  }

  .modal-btn {
    padding: 0.625rem;
    font-size: 0.875rem;
  }

  /* 选择框 - 缩小 */
  .select-checkbox {
    top: 0.25rem;
    left: 0.25rem;
  }

  .checkbox {
    width: 1rem;
    height: 1rem;
    border-width: 1.5px;
  }

  .check-icon {
    width: 0.75rem;
    height: 0.75rem;
  }

  .book-card.edit-mode {
    padding-top: 1.5rem;
  }

  /* 操作按钮 - 缩小 */
  .book-actions {
    top: 0.25rem;
    right: 0.25rem;
  }

  .action-btn {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
  }

  .action-btn svg {
    width: 0.75rem;
    height: 0.75rem;
  }

  /* 移动端禁用hover效果 */
  .book-card:hover {
    transform: none;
  }
}
</style>

