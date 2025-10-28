<template>
  <div class="reading-stats-chart">
    <!-- 基础统计卡片 -->
    <div class="stats-summary">
      <div class="stat-item">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.basic?.readingBooks || 0 }}</div>
          <div class="stat-label">正在阅读</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.basic?.finishedBooks || 0 }}</div>
          <div class="stat-label">已读完成</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.basic?.totalReadTime || 0 }}</div>
          <div class="stat-label">阅读时长(h)</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.basic?.consecutiveDays || 0 }}</div>
          <div class="stat-label">连续天数</div>
        </div>
      </div>
    </div>

    <!-- 近7天阅读趋势图 -->
    <div class="chart-section">
      <h4 class="chart-title">📊 近7天阅读趋势</h4>
      <div class="chart-container">
        <div class="chart-area" ref="weeklyChart">
          <div v-if="!hasWeeklyData" class="no-data">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <p>暂无数据</p>
          </div>
          <canvas v-else ref="weeklyChartCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- 阅读偏好分类 -->
    <div class="chart-section">
      <h4 class="chart-title">📚 阅读偏好分类</h4>
      <div class="preference-list">
        <div 
          v-for="(item, index) in categoryPreference" 
          :key="index"
          class="preference-item"
        >
          <div class="preference-info">
            <span class="rank">{{ index + 1 }}</span>
            <span class="category-name">{{ item.name }}</span>
          </div>
          <div class="preference-bar">
            <div 
              class="bar-fill" 
              :style="{ 
                width: `${(item.count / maxCategoryCount) * 100}%`,
                background: getCategoryGradient(index)
              }"
            ></div>
          </div>
          <div class="preference-count">{{ item.count }}次</div>
        </div>
        <div v-if="!hasCategoryData" class="no-data-text">
          暂无阅读记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { getUserStatistics } from '@/api/user'

const stats = ref({
  basic: {
    readingBooks: 0,
    finishedBooks: 0,
    totalReadTime: 0,
    consecutiveDays: 0
  },
  weeklyTrend: [],
  categoryPreference: []
})

const weeklyChart = ref(null)
const weeklyChartCanvas = ref(null)

// 计算属性
const hasWeeklyData = computed(() => {
  return stats.value.weeklyTrend && stats.value.weeklyTrend.length > 0
})

const hasCategoryData = computed(() => {
  return stats.value.categoryPreference && stats.value.categoryPreference.length > 0
})

const categoryPreference = computed(() => {
  return stats.value.categoryPreference || []
})

const maxCategoryCount = computed(() => {
  if (!categoryPreference.value.length) return 1
  return Math.max(...categoryPreference.value.map(item => item.count))
})

// 获取分类渐变色
function getCategoryGradient(index) {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ]
  return gradients[index % gradients.length]
}

// 绘制周趋势图
function drawWeeklyChart() {
  if (!hasWeeklyData.value || !weeklyChartCanvas.value) return
  
  const canvas = weeklyChartCanvas.value
  const ctx = canvas.getContext('2d')
  
  // 设置canvas尺寸
  canvas.width = canvas.offsetWidth * 2
  canvas.height = canvas.offsetHeight * 2
  ctx.scale(2, 2)
  
  const width = canvas.offsetWidth
  const height = canvas.offsetHeight
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  // 准备数据
  const data = stats.value.weeklyTrend || []
  const maxValue = Math.max(...data.map(d => d.count), 1)
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 绘制网格线
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()
  }
  
  // 绘制Y轴标签
  ctx.fillStyle = '#6b7280'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 4; i++) {
    const value = Math.round((maxValue / 4) * (4 - i))
    const y = padding.top + (chartHeight / 4) * i
    ctx.fillText(value.toString(), padding.left - 10, y + 4)
  }
  
  if (data.length === 0) return
  
  // 计算点的位置
  const points = data.map((d, i) => {
    const x = padding.left + (chartWidth / (data.length - 1 || 1)) * i
    const y = padding.top + chartHeight - (d.count / maxValue) * chartHeight
    return { x, y, count: d.count, date: d.date }
  })
  
  // 绘制渐变区域
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
  gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)')
  gradient.addColorStop(1, 'rgba(102, 126, 234, 0)')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(points[0].x, height - padding.bottom)
  points.forEach(p => ctx.lineTo(p.x, p.y))
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom)
  ctx.closePath()
  ctx.fill()
  
  // 绘制线条
  ctx.strokeStyle = '#667eea'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  points.forEach(p => ctx.lineTo(p.x, p.y))
  ctx.stroke()
  
  // 绘制点
  points.forEach(p => {
    ctx.fillStyle = '#667eea'
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  })
  
  // 绘制X轴标签（日期）
  ctx.fillStyle = '#6b7280'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  points.forEach(p => {
    const date = new Date(p.date)
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    ctx.fillText(label, p.x, height - padding.bottom + 20)
  })
}

// 加载统计数据
async function loadStats() {
  try {
    const res = await getUserStatistics()
    if (res.code === 200) {
      // 适配新的数据结构
      stats.value = {
        basic: {
          totalBooks: res.data.bookshelf?.total || 0,
          readingBooks: res.data.bookshelf?.reading || 0,
          finishedBooks: res.data.bookshelf?.finished || 0,
          totalReadTime: Math.round((res.data.readTime?.total || 0) / 60), // 转换为小时
          consecutiveDays: res.data.reading?.readingStreak || 0
        },
        weeklyTrend: res.data.readingTrend || [],
        categoryPreference: res.data.favoriteCategory ? [res.data.favoriteCategory] : []
      }
      // 等待DOM更新后绘制图表
      await nextTick()
      drawWeeklyChart()
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 监听数据变化重绘图表
watch(() => stats.value.weeklyTrend, () => {
  nextTick(() => {
    drawWeeklyChart()
  })
}, { deep: true })

// 初始化
onMounted(() => {
  loadStats()
  
  // 窗口大小改变时重绘
  window.addEventListener('resize', drawWeeklyChart)
})
</script>

<style scoped>
.reading-stats-chart {
  width: 100%;
}

/* 统计摘要 */
.stats-summary {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .stats-summary {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-item {
  background: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px var(--color-shadow);
  transition: all 0.3s ease;
}

.stat-item:hover {
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

/* 图表区域 */
.chart-section {
  background: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px var(--color-shadow);
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 1.5rem;
}

.chart-container {
  width: 100%;
}

.chart-area {
  width: 100%;
  height: 250px;
  position: relative;
}

.chart-area canvas {
  width: 100%;
  height: 100%;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
}

.no-data svg {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* 偏好列表 */
.preference-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preference-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
}

.preference-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 120px;
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.category-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.preference-bar {
  height: 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  overflow: hidden;
  min-width: 100px;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.6s ease;
}

.preference-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 50px;
  text-align: right;
}

.no-data-text {
  text-align: center;
  color: var(--color-text-muted);
  padding: 2rem;
}

/* 工具类 */
.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

.w-16 {
  width: 4rem;
}

.h-16 {
  height: 4rem;
}
</style>

