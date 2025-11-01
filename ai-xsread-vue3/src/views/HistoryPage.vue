<template>
  <div class="history-page">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <div class="main-content">
      <!-- 页面标题 -->
      <div class="page-header fade-in">
        <div class="container">
          <h1 class="page-title">浏览记录</h1>
          <p class="page-subtitle">记录每一次相遇，不错过任何精彩</p>
        </div>
      </div>

      <!-- 浏览统计 -->
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
                <div class="stat-number">{{ stats.totalViews }}</div>
                <div class="stat-label">浏览总数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.todayViews }}</div>
                <div class="stat-label">今日浏览</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.recentDays }}</div>
                <div class="stat-label">连续天数</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 操作栏 -->
      <section class="toolbar-section fade-in" style="animation-delay: 0.2s">
        <div class="container">
          <div class="toolbar">
            <div class="toolbar-left">
              <span class="record-count">共 {{ historyList.length }} 条记录</span>
            </div>
            <div class="toolbar-right">
              <button 
                v-if="historyList.length > 0"
                class="tool-btn clear-btn"
                @click="handleClearAll"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                清空记录
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>

      <!-- 浏览记录列表 -->
      <section v-else class="history-section fade-in" style="animation-delay: 0.3s">
        <div class="container">
          <!-- 空状态 -->
          <div v-if="historyList.length === 0" class="empty-state">
            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="empty-text">暂无浏览记录</p>
            <p class="empty-hint">去发现更多好书吧~</p>
            <button class="discover-btn" @click="router.push('/')">
              探索书库
            </button>
          </div>

          <!-- 记录列表 -->
          <div v-else class="history-list">
            <div 
              v-for="item in paginatedHistory" 
              :key="item.id || `${item.novel_id}-${item.read_time}`"
              class="history-item"
              @click="goToNovel(item.novel_id)"
            >
              <!-- 小说封面 -->
              <div class="history-cover">
                <img 
                  v-if="item.cover" 
                  :src="item.cover" 
                  :alt="item.title"
                  class="cover-img"
                  @error="onImageError"
                />
                <div v-else class="cover-placeholder" :style="{ background: getGradientBg(item.novel_id) }">
                  <span class="placeholder-text">{{ item.title?.substring(0, 2) || '书' }}</span>
                </div>
              </div>

              <!-- 小说信息 -->
              <div class="history-info">
                <h3 class="history-title">{{ item.title }}</h3>
                <div class="history-meta">
                  <span class="meta-item author">{{ item.author || '未知作者' }}</span>
                  <span v-if="item.chapter_title" class="meta-item chapter">
                    阅读至：{{ item.chapter_title }}
                  </span>
                  <span v-else class="meta-item chapter">
                    浏览过
                  </span>
                </div>
                <div class="history-time">
                  <svg class="time-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                  </svg>
                  {{ formatTime(item.read_time) }}
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="history-actions">
                <button 
                  class="action-btn continue-btn"
                  @click.stop="goToNovel(item.novel_id)"
                  title="继续阅读"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </button>
                <button 
                  class="action-btn delete-btn"
                  @click.stop="handleDelete(item)"
                  title="删除记录"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              class="page-btn"
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              上一页
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button 
              class="page-btn"
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            >
              下一页
            </button>
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
import { useUserStore } from '@/stores/user'
import AppHeader from '@/components/common/AppHeader.vue'
import BottomNav from '@/components/common/BottomNav.vue'
import { getReadingHistory } from '@/api/user'
import message from '@/utils/message'

const router = useRouter()
const userStore = useUserStore()

// 数据状态
const loading = ref(false)
const historyList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)

// 统计数据
const stats = ref({
  totalViews: 0,
  todayViews: 0,
  recentDays: 0
})

// 预设的渐变背景
const gradientBackgrounds = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #fa8bff 0%, #2bd2ff 90%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
]

// 计算属性
const totalPages = computed(() => {
  return Math.ceil(historyList.value.length / pageSize.value)
})

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return historyList.value.slice(start, end)
})

// 加载浏览记录
async function loadHistory() {
  if (!userStore.isLogin) {
    router.push('/login')
    return
  }

  loading.value = true
  try {
    // 使用合理的pageSize，后端限制最大100
    const res = await getReadingHistory({ page: 1, pageSize: 100 })
    if (res.data && res.data.data) {
      historyList.value = res.data.data
    } else if (Array.isArray(res.data)) {
      historyList.value = res.data
    }
    
    // 计算统计数据
    calculateStats()
  } catch (error) {
    console.error('加载浏览记录失败:', error)
    message.error('加载浏览记录失败')
  } finally {
    loading.value = false
  }
}

// 计算统计数据
function calculateStats() {
  stats.value.totalViews = historyList.value.length
  
  // 计算今日浏览
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  stats.value.todayViews = historyList.value.filter(item => {
    const readTime = new Date(item.read_time)
    return readTime >= today
  }).length
  
  // 计算连续浏览天数（简化版本）
  const uniqueDays = new Set()
  historyList.value.forEach(item => {
    const date = new Date(item.read_time)
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    uniqueDays.add(dateStr)
  })
  stats.value.recentDays = uniqueDays.size
}

// 获取渐变背景
function getGradientBg(novelId) {
  const index = (novelId || 0) % gradientBackgrounds.length
  return gradientBackgrounds[index]
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '未知时间'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分钟前`
  }
  
  // 小于1天
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }
  
  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }
  
  // 格式化日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  // 如果是今年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}-${day} ${hour}:${minute}`
  }
  
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 图片加载失败处理
function onImageError(e) {
  e.target.style.display = 'none'
  e.target.parentElement.innerHTML = `
    <div class="cover-placeholder" style="background: ${gradientBackgrounds[0]}">
      <span class="placeholder-text">书</span>
    </div>
  `
}

// 跳转到小说详情
function goToNovel(novelId) {
  router.push(`/novel/${novelId}`)
}

// 删除单条记录
async function handleDelete(item) {
  if (!confirm(`确定要删除《${item.title}》的浏览记录吗？`)) {
    return
  }
  
  try {
    // 这里需要后端提供删除单条记录的接口
    // 暂时在前端移除
    const index = historyList.value.findIndex(h => 
      h.novel_id === item.novel_id && h.read_time === item.read_time
    )
    if (index > -1) {
      historyList.value.splice(index, 1)
      calculateStats()
      message.success('删除成功')
    }
  } catch (error) {
    console.error('删除失败:', error)
    message.error('删除失败')
  }
}

// 清空所有记录
async function handleClearAll() {
  if (!confirm('确定要清空所有浏览记录吗？此操作不可恢复！')) {
    return
  }
  
  try {
    // 这里需要后端提供清空记录的接口
    // 暂时在前端清空
    historyList.value = []
    calculateStats()
    message.success('已清空浏览记录')
  } catch (error) {
    console.error('清空失败:', error)
    message.error('清空失败')
  }
}

// 切换页码
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 初始化
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  padding-top: 4rem;
  padding-bottom: 5rem;
  background: var(--color-bg-primary);
}

@media (min-width: 768px) {
  .history-page {
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
  padding: 2rem 0 1rem;
}

.container {
  width: 100%;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.stat-card {
  background: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
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
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

/* 工具栏 */
.toolbar-section {
  margin-bottom: 1.5rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-bg-card);
  border-radius: 1rem;
  box-shadow: 0 2px 8px var(--color-shadow);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.record-count {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.toolbar-right {
  display: flex;
  gap: 0.5rem;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn {
  background: #fee;
  color: #e53e3e;
}

.clear-btn:hover {
  background: #fdd;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border);
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
  font-size: 0.875rem;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
}

.empty-icon {
  width: 96px;
  height: 96px;
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.empty-text {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
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
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.discover-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 浏览记录列表 */
.history-section {
  margin-bottom: 2rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-card);
  border-radius: 1rem;
  box-shadow: 0 2px 8px var(--color-shadow);
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow);
}

.history-cover {
  width: 80px;
  height: 106px;
  flex-shrink: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.meta-item {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.meta-item.author::before {
  content: '👤 ';
}

.meta-item.chapter::before {
  content: '📖 ';
}

.history-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.time-icon {
  width: 1rem;
  height: 1rem;
}

.history-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.continue-btn {
  background: var(--color-primary);
  color: white;
}

.continue-btn:hover {
  background: var(--color-primary-dark);
}

.delete-btn {
  background: #fee;
  color: #e53e3e;
}

.delete-btn:hover {
  background: #fdd;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* 工具类 */
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

.mt-xl {
  margin-top: 2rem;
}

/* 淡入动画 */
.fade-in {
  animation: fadeIn 0.8s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端优化 */
@media (max-width: 640px) {
  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 1rem 0.75rem;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .toolbar {
    flex-direction: column;
    gap: 0.75rem;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .history-item {
    padding: 0.75rem;
  }

  .history-cover {
    width: 60px;
    height: 80px;
  }

  .history-title {
    font-size: 0.9375rem;
  }

  .history-meta {
    gap: 0.5rem;
  }

  .meta-item {
    font-size: 0.75rem;
  }

  .history-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 32px;
    height: 32px;
  }
}
</style>

