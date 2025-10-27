<template>
  <div class="dashboard-container">
    <div class="page-title">
      <h2>数据看板</h2>
      <p class="subtitle">实时监控平台运营数据</p>
    </div>

    <!-- 概览统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #ecf5ff;">
            <el-icon color="#409eff" :size="32"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(overview.totalUsers) }}</div>
            <div class="stat-label">总用户数</div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon>
              今日新增 {{ overview.newUsersToday }}
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0f9ff;">
            <el-icon color="#67c23a" :size="32"><Reading /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overview.totalNovels }}</div>
            <div class="stat-label">作品总数</div>
            <div class="stat-desc">{{ overview.totalChapters }} 章节</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fef0f0;">
            <el-icon color="#f56c6c" :size="32"><View /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(overview.todayViews) }}</div>
            <div class="stat-label">今日浏览量</div>
            <div class="stat-desc">人均 {{ overview.avgReadTime }}分钟</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f4f4f5;">
            <el-icon color="#909399" :size="32"><ChatDotRound /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overview.pendingComments }}</div>
            <div class="stat-label">待审核评论</div>
            <el-button type="primary" size="small" @click="router.push('/comments')">
              立即处理
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="16">
        <div class="chart-card">
          <div class="card-header">
            <h3>用户增长趋势</h3>
            <el-radio-group v-model="trendRange" size="small" @change="loadTrends">
              <el-radio-button label="7">最近7天</el-radio-button>
              <el-radio-button label="30">最近30天</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="userTrendChart" class="chart" style="height: 300px;"></div>
        </div>
      </el-col>

      <el-col :xs="24" :lg="8">
        <div class="chart-card">
          <div class="card-header">
            <h3>分类占比</h3>
          </div>
          <div ref="categoryChart" class="chart" style="height: 300px;"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 热门排行 -->
    <el-row :gutter="20" class="ranking-row">
      <el-col :xs="24" :lg="12">
        <div class="ranking-card">
          <div class="card-header">
            <h3>热门作品排行</h3>
            <el-radio-group v-model="rankType" size="small">
              <el-radio-button label="views">浏览榜</el-radio-button>
              <el-radio-button label="collections">收藏榜</el-radio-button>
            </el-radio-group>
          </div>
          <div class="ranking-list">
            <div v-for="(item, index) in hotNovels" :key="item.id" class="ranking-item">
              <div class="rank-badge" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
              <div class="novel-info">
                <div class="novel-title">{{ item.title }}</div>
                <div class="novel-stats">
                  浏览: {{ formatNumber(item.views) }} | 收藏: {{ formatNumber(item.collections) }}
                </div>
              </div>
              <div class="trend">
                <el-icon v-if="item.trend > 0" color="#67c23a"><Top /></el-icon>
                <el-icon v-else color="#f56c6c"><Bottom /></el-icon>
                {{ Math.abs(item.trend) }}%
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :lg="12">
        <div class="ranking-card">
          <div class="card-header">
            <h3>实时动态</h3>
          </div>
          <div class="activity-list">
            <div v-for="activity in realtimeActivities" :key="activity.id" class="activity-item">
              <div class="activity-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-text">{{ activity.text }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getOverview, getTrends, getRanking } from '@/api/dashboard'
import { formatNumber } from '@/utils/format'

const router = useRouter()

// 图表实例
const userTrendChart = ref(null)
const categoryChart = ref(null)
let userTrendChartInstance = null
let categoryChartInstance = null

// 数据
const trendRange = ref('7')
const rankType = ref('views')

const overview = reactive({
  totalUsers: 12458,
  newUsersToday: 127,
  totalNovels: 23,
  totalChapters: 1456,
  todayViews: 45678,
  avgReadTime: 22,
  pendingComments: 15
})

const hotNovels = ref([
  { id: 1, title: '长安月下归人未归', views: 32400, collections: 2100, trend: 15.6 },
  { id: 2, title: '时光里的温柔相遇', views: 28100, collections: 1890, trend: 12.3 },
  { id: 3, title: '星河尽头的她', views: 25700, collections: 1560, trend: -3.2 },
  { id: 4, title: '浮生若梦', views: 22300, collections: 1420, trend: 8.5 },
  { id: 5, title: '月色与君眠', views: 19800, collections: 1280, trend: 5.7 }
])

const realtimeActivities = ref([
  { id: 1, text: '用户 reader_001 收藏了《时光里的温柔相遇》', time: '刚刚' },
  { id: 2, text: '用户 reader_123 评论了《长安月下归人未归》', time: '1分钟前' },
  { id: 3, text: '用户 reader_456 开始阅读《星河尽头的她》', time: '2分钟前' },
  { id: 4, text: '用户 reader_789 点赞了《浮生若梦》', time: '3分钟前' },
  { id: 5, text: '用户 reader_012 收藏了《月色与君眠》', time: '5分钟前' }
])

// 初始化用户趋势图表
const initUserTrendChart = () => {
  if (!userTrendChart.value) return
  
  userTrendChartInstance = echarts.init(userTrendChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['新增用户', '活跃用户']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['10-21', '10-22', '10-23', '10-24', '10-25', '10-26', '10-27']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210],
        smooth: true,
        itemStyle: { color: '#409eff' }
      },
      {
        name: '活跃用户',
        type: 'line',
        data: [2200, 2400, 2100, 2350, 2180, 2580, 2450],
        smooth: true,
        itemStyle: { color: '#67c23a' }
      }
    ]
  }
  
  userTrendChartInstance.setOption(option)
}

// 初始化分类占比图表
const initCategoryChart = () => {
  if (!categoryChart.value) return
  
  categoryChartInstance = echarts.init(categoryChart.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '分类占比',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 38, name: '都市言情' },
          { value: 28, name: '古风穿越' },
          { value: 22, name: '治愈系' },
          { value: 12, name: '悬疑推理' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  categoryChartInstance.setOption(option)
}

// 加载趋势数据
const loadTrends = async () => {
  // TODO: 调用API加载实际数据
  console.log('加载趋势数据:', trendRange.value)
}

// 窗口大小改变时重新渲染图表
const handleResize = () => {
  userTrendChartInstance?.resize()
  categoryChartInstance?.resize()
}

onMounted(async () => {
  // 初始化图表
  await nextTick()
  initUserTrendChart()
  initCategoryChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // TODO: 加载实际数据
  // const res = await getOverview()
  // Object.assign(overview, res.data)
})
</script>

<style scoped lang="scss">
.dashboard-container {
  .page-title {
    margin-bottom: 20px;
    
    h2 {
      font-size: 24px;
      color: #333;
      margin: 0 0 5px;
      
      .dark & {
        color: #f9fafb;
      }
    }
    
    .subtitle {
      color: #909399;
      font-size: 14px;
    }
  }
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
  
  .dark & {
    background: #1F2937;
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
  }
  
  .stat-content {
    flex: 1;
    
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
      
      .dark & {
        color: #f9fafb;
      }
    }
    
    .stat-label {
      font-size: 14px;
      color: #909399;
      margin: 5px 0;
    }
    
    .stat-trend {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #67c23a;
      
      &.up {
        color: #67c23a;
      }
      
      &.down {
        color: #f56c6c;
      }
    }
    
    .stat-desc {
      font-size: 12px;
      color: #909399;
    }
  }
}

.charts-row,
.ranking-row {
  margin-bottom: 20px;
}

.chart-card,
.ranking-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  
  .dark & {
    background: #1F2937;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0;
      
      .dark & {
        color: #f9fafb;
      }
    }
  }
}

.ranking-list {
  .ranking-item {
    display: flex;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid #f0f0f0;
    
    .dark & {
      border-bottom-color: #374151;
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    .rank-badge {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 15px;
      background: #f5f7fa;
      color: #909399;
      
      &.rank-1 {
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
        color: #fff;
      }
      
      &.rank-2 {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        color: #fff;
      }
      
      &.rank-3 {
        background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
        color: #fff;
      }
    }
    
    .novel-info {
      flex: 1;
      
      .novel-title {
        font-size: 14px;
        color: #333;
        margin-bottom: 5px;
        
        .dark & {
          color: #f9fafb;
        }
      }
      
      .novel-stats {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .trend {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
      font-weight: 600;
    }
  }
}

.activity-list {
  .activity-item {
    display: flex;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    
    .dark & {
      border-bottom-color: #374151;
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #ecf5ff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      
      .el-icon {
        color: #409eff;
      }
    }
    
    .activity-content {
      flex: 1;
      
      .activity-text {
        font-size: 14px;
        color: #333;
        margin-bottom: 5px;
        
        .dark & {
          color: #f9fafb;
        }
      }
      
      .activity-time {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>
