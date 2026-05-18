<template>
  <div class="analytics-container">
    <div class="page-title">
      <h2>数据统计</h2>
      <p class="subtitle">小说运营、用户活跃、阅读时长全景视图</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #ecf5ff;">
            <el-icon color="#409eff" :size="32"><Reading /></el-icon>
          </div>
          <div class="stat-content">
            <el-skeleton :loading="loadingStats" :rows="1" animated>
              <template #default>
                <div class="stat-value">{{ formatNumber(novelStats.totalNovels) }}</div>
                <div class="stat-label">小说总数</div>
                <div class="stat-desc">本月新增 {{ novelStats.newThisMonth }}</div>
              </template>
            </el-skeleton>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0f9ff;">
            <el-icon color="#67c23a" :size="32"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <el-skeleton :loading="loadingStats" :rows="1" animated>
              <template #default>
                <div class="stat-value">{{ formatNumber(novelStats.totalChapters) }}</div>
                <div class="stat-label">章节总数</div>
                <div class="stat-desc">全平台累计</div>
              </template>
            </el-skeleton>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fef0f0;">
            <el-icon color="#f56c6c" :size="32"><Edit /></el-icon>
          </div>
          <div class="stat-content">
            <el-skeleton :loading="loadingStats" :rows="1" animated>
              <template #default>
                <div class="stat-value">{{ formatWords(novelStats.totalWords) }}</div>
                <div class="stat-label">总字数</div>
                <div class="stat-desc">已发布作品</div>
              </template>
            </el-skeleton>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fdf6ec;">
            <el-icon color="#e6a23c" :size="32"><Star /></el-icon>
          </div>
          <div class="stat-content">
            <el-skeleton :loading="loadingStats" :rows="1" animated>
              <template #default>
                <div class="stat-value">{{ formatRating(novelStats.avgRating) }}</div>
                <div class="stat-label">平均评分</div>
                <div class="stat-desc">满分 5.0</div>
              </template>
            </el-skeleton>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="14">
        <div class="chart-card">
          <div class="card-header">
            <h3>用户活跃趋势</h3>
            <el-radio-group v-model="activityRange" size="small" @change="loadActivity">
              <el-radio-button label="7">最近7天</el-radio-button>
              <el-radio-button label="30">最近30天</el-radio-button>
            </el-radio-group>
          </div>
          <el-skeleton :loading="loadingActivity" :rows="6" animated>
            <template #default>
              <div ref="activityChart" class="chart" style="height: 320px;"></div>
            </template>
          </el-skeleton>
        </div>
      </el-col>

      <el-col :xs="24" :lg="10">
        <div class="chart-card">
          <div class="card-header">
            <h3>阅读时长分布</h3>
          </div>
          <el-skeleton :loading="loadingDuration" :rows="6" animated>
            <template #default>
              <div ref="durationChart" class="chart" style="height: 320px;"></div>
            </template>
          </el-skeleton>
        </div>
      </el-col>
    </el-row>

    <!-- 热门作品 TOP10 -->
    <div class="table-card">
      <div class="card-header">
        <h3>热门作品 TOP10</h3>
      </div>
      <el-table
        v-loading="loadingTop"
        :data="topNovels"
        stripe
        :empty-text="loadingTop ? '加载中...' : '暂无数据'"
      >
        <el-table-column label="排名" width="80" align="center">
          <template #default="{ $index }">
            <span class="rank-badge" :class="`rank-${$index + 1}`">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <el-image
              v-if="row.cover_url"
              :src="row.cover_url"
              fit="cover"
              style="width: 50px; height: 70px; border-radius: 4px;"
              :preview-src-list="[row.cover_url]"
            />
            <div v-else class="cover-placeholder">无封面</div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="书名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="author" label="作者" width="140" show-overflow-tooltip />
        <el-table-column label="阅读次数" width="120" align="right">
          <template #default="{ row }">{{ formatNumber(row.read_count || 0) }}</template>
        </el-table-column>
        <el-table-column label="累计浏览" width="120" align="right">
          <template #default="{ row }">{{ formatNumber(row.views || 0) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Reading, Document, Edit, Star } from '@element-plus/icons-vue'
import {
  getNovelStats,
  getUserActivity,
  getReadingTimeDistribution,
  getTopNovels
} from '@/api/dashboard'
import { formatNumber } from '@/utils/format'

// 图表 DOM 与实例
const activityChart = ref(null)
const durationChart = ref(null)
let activityChartInstance = null
let durationChartInstance = null

// 状态
const activityRange = ref('30')
const loadingStats = ref(false)
const loadingActivity = ref(false)
const loadingDuration = ref(false)
const loadingTop = ref(false)

// 数据
const novelStats = reactive({
  totalNovels: 0,
  totalChapters: 0,
  totalWords: 0,
  newThisMonth: 0,
  avgRating: 0
})
const topNovels = ref([])

// 工具：字数 -> 万字 / 亿字
const formatWords = (n) => {
  const num = Number(n) || 0
  if (num >= 1e8) return (num / 1e8).toFixed(2) + ' 亿字'
  if (num >= 1e4) return (num / 1e4).toFixed(1) + ' 万字'
  return formatNumber(num) + ' 字'
}

const formatRating = (n) => {
  const v = Number(n) || 0
  return v.toFixed(1)
}

// 渲染活跃趋势
const renderActivityChart = (dates = [], values = []) => {
  if (!activityChart.value) return
  if (!activityChartInstance) {
    activityChartInstance = echarts.init(activityChart.value)
  }

  const hasData = dates.length > 0 && values.some(v => Number(v) > 0)

  const option = hasData
    ? {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates.map(d => {
            const dt = new Date(d)
            return `${dt.getMonth() + 1}-${dt.getDate()}`
          })
        },
        yAxis: { type: 'value', minInterval: 1 },
        series: [
          {
            name: '活跃用户',
            type: 'line',
            data: values,
            smooth: true,
            areaStyle: { opacity: 0.15 },
            itemStyle: { color: '#409eff' }
          }
        ]
      }
    : {
        graphic: [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: { text: '暂无数据', fill: '#909399', fontSize: 14 }
        }]
      }

  activityChartInstance.setOption(option, true)
}

// 渲染阅读时长分布
const renderDurationChart = (buckets = []) => {
  if (!durationChart.value) return
  if (!durationChartInstance) {
    durationChartInstance = echarts.init(durationChart.value)
  }

  const hasData = Array.isArray(buckets) && buckets.length > 0 && buckets.some(b => Number(b.count) > 0)

  const option = hasData
    ? {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: buckets.map(b => b.label) },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          name: '用户数',
          type: 'bar',
          data: buckets.map(b => Number(b.count) || 0),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#67c23a' },
              { offset: 1, color: '#409eff' }
            ])
          },
          barMaxWidth: 48
        }]
      }
    : {
        graphic: [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: { text: '暂无数据', fill: '#909399', fontSize: 14 }
        }]
      }

  durationChartInstance.setOption(option, true)
}

// 加载方法
const loadStats = async () => {
  loadingStats.value = true
  try {
    const res = await getNovelStats()
    if (res.code === 200) Object.assign(novelStats, res.data)
  } catch (err) {
    console.error('加载小说统计失败:', err)
    ElMessage.error('加载小说统计失败')
  } finally {
    loadingStats.value = false
  }
}

const loadActivity = async () => {
  loadingActivity.value = true
  try {
    const res = await getUserActivity({ days: activityRange.value })
    if (res.code === 200) {
      await nextTick()
      renderActivityChart(res.data?.dates || [], res.data?.values || [])
    }
  } catch (err) {
    console.error('加载用户活跃趋势失败:', err)
    ElMessage.error('加载用户活跃趋势失败')
    renderActivityChart([], [])
  } finally {
    loadingActivity.value = false
  }
}

const loadDuration = async () => {
  loadingDuration.value = true
  try {
    const res = await getReadingTimeDistribution()
    if (res.code === 200) {
      await nextTick()
      renderDurationChart(res.data?.buckets || [])
    }
  } catch (err) {
    console.error('加载阅读时长分布失败:', err)
    ElMessage.error('加载阅读时长分布失败')
    renderDurationChart([])
  } finally {
    loadingDuration.value = false
  }
}

const loadTop = async () => {
  loadingTop.value = true
  try {
    const res = await getTopNovels({ limit: 10 })
    if (res.code === 200) topNovels.value = res.data || []
  } catch (err) {
    console.error('加载热门作品失败:', err)
    ElMessage.error('加载热门作品失败')
  } finally {
    loadingTop.value = false
  }
}

const handleResize = () => {
  activityChartInstance?.resize()
  durationChartInstance?.resize()
}

onMounted(async () => {
  await nextTick()
  window.addEventListener('resize', handleResize)
  await Promise.all([
    loadStats(),
    loadActivity(),
    loadDuration(),
    loadTop()
  ])
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  activityChartInstance?.dispose()
  durationChartInstance?.dispose()
  activityChartInstance = null
  durationChartInstance = null
})
</script>

<style scoped lang="scss">
.analytics-container {
  .page-title {
    margin-bottom: 20px;

    h2 {
      font-size: 24px;
      color: #333;
      margin: 0 0 5px;

      .dark & { color: #f9fafb; }
    }

    .subtitle {
      color: #909399;
      font-size: 14px;
    }
  }
}

.stats-row { margin-bottom: 20px; }

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

  .dark & { background: #1F2937; }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
    min-width: 0;

    .stat-value {
      font-size: 26px;
      font-weight: bold;
      color: #333;
      .dark & { color: #f9fafb; }
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
      margin: 5px 0;
    }

    .stat-desc {
      font-size: 12px;
      color: #909399;
    }
  }
}

.charts-row { margin-bottom: 20px; }

.chart-card,
.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;

  .dark & { background: #1F2937; }

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
      .dark & { color: #f9fafb; }
    }
  }
}

.cover-placeholder {
  width: 50px;
  height: 70px;
  border-radius: 4px;
  background: #f5f7fa;
  color: #c0c4cc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.rank-badge {
  display: inline-flex;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f5f7fa;
  color: #909399;
  font-weight: bold;
  align-items: center;
  justify-content: center;

  &.rank-1 { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: #fff; }
  &.rank-2 { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #fff; }
  &.rank-3 { background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%); color: #fff; }
}
</style>
