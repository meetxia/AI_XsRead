<template>
  <div class="rating-system">
    <h3 class="text-xl font-bold text-gray-900 mb-3 section-title">作品评分</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 左侧：总评分 -->
      <div class="flex flex-col items-center justify-center p-4 rounded-xl score-card">
        <div class="text-4xl font-bold text-gray-900 mb-1 score-number">
          {{ overallRatingDisplay }}
        </div>
        <div class="flex items-center mb-1">
          <StarRating :rating="overallRating" :size="20" :readonly="true" />
        </div>
        <div class="text-xs text-gray-500 sub-text">
          {{ totalRatings }} 人评分
        </div>
      </div>

      <!-- 右侧：评分分布 -->
      <div class="space-y-2">
        <div 
          v-for="star in [5, 4, 3, 2, 1]" 
          :key="star"
          class="flex items-center space-x-3"
        >
          <div class="flex items-center space-x-1 w-16">
            <span class="text-sm text-gray-600 muted-text">{{ star }}</span>
            <svg class="w-4 h-4 themed-star" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div class="flex-1 h-3 rounded-full overflow-hidden bar-bg">
            <div class="h-full bar-fill transition-all duration-500" :style="{ width: `${getRatingPercentage(star)}%` }"></div>
          </div>
          <div class="text-sm text-gray-500 w-12 text-right muted-text">
            {{ ratingDistribution[star] || 0 }}
          </div>
        </div>
      </div>
    </div>

    <!-- 我的评分 -->
    <div class="mt-4 p-4 rounded-xl themed-card small-radius">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-semibold text-gray-900 panel-title">我的评分</h4>
        <div v-if="userRating" class="text-sm text-gray-500 muted-text">
          已评分于 {{ formatDate(userRating.createdAt) }}
        </div>
      </div>
      
      <div class="flex items-center justify-center space-x-4">
        <StarRating 
          :rating="currentRating" 
          :size="28"
          :readonly="false"
          @update:rating="handleRating"
        />
        <div v-if="hasCurrentRating" class="text-2xl font-bold text-gray-900 score-inline">
          {{ currentRatingDisplay }}
        </div>
      </div>
      
      <div v-if="ratingMessage" class="mt-3 text-center">
        <p class="text-sm" :class="ratingMessageType === 'success' ? 'text-success' : 'text-danger'">
          {{ ratingMessage }}
        </p>
      </div>

      <div v-if="currentRating > 0" class="mt-3 text-center">
        <button
          v-if="!userRating"
          @click="submitRating"
          :disabled="submitting"
          class="btn-primary"
        >
          {{ submitting ? '提交中...' : '提交评分' }}
        </button>
        <button
          v-else-if="currentRating !== userRating.rating"
          @click="updateRating"
          :disabled="submitting"
          class="btn-secondary"
        >
          {{ submitting ? '更新中...' : '更新评分' }}
        </button>
      </div>
    </div>

    <!-- 评分趋势 (可选) -->
    <div v-if="showTrend" class="mt-4">
      <h4 class="font-semibold text-gray-900 mb-2 panel-title">评分趋势</h4>
      <div class="trend-placeholder">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StarRating from './StarRating.vue'
import { getNovelRating, submitNovelRating, updateNovelRating } from '@/api/novel'

const props = defineProps({
  novelId: {
    type: [String, Number],
    required: true
  },
  initialRating: {
    type: Number,
    default: 0
  },
  showTrend: {
    type: Boolean,
    default: false
  }
})

const overallRating = ref(Number(props.initialRating || 0))
const totalRatings = ref(0)
const ratingDistribution = ref({
  5: 0,
  4: 0,
  3: 0,
  2: 0,
  1: 0
})
const userRating = ref(null)
const currentRating = ref(0)
const submitting = ref(false)
const ratingMessage = ref('')
const ratingMessageType = ref('success')

// 当前评分展示/判定，确保数值安全
const hasCurrentRating = computed(() => Number(currentRating.value) > 0)
const currentRatingDisplay = computed(() => {
  const val = Number(currentRating.value)
  return Number.isFinite(val) ? val.toFixed(1) : '0.0'
})

// 展示用：评分保留一位小数，保证安全
const overallRatingDisplay = computed(() => {
  const val = Number(overallRating.value)
  if (Number.isFinite(val)) {
    return val.toFixed(1)
  }
  return '0.0'
})

// 获取评分百分比
const getRatingPercentage = computed(() => {
  return (star) => {
    if (totalRatings.value === 0) return 0
    return (ratingDistribution.value[star] / totalRatings.value) * 100
  }
})

// 加载评分数据
async function loadRatingData() {
  try {
    const res = await getNovelRating(props.novelId)
    const data = (res && (res.data || res)) || {}
    
    overallRating.value = Number(data.averageRating ?? props.initialRating ?? 0)
    totalRatings.value = Number(data.totalRatings ?? 0)
    ratingDistribution.value = data.distribution || {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    }
    userRating.value = data.userRating || null
    
    if (userRating.value) {
      currentRating.value = userRating.value.rating
    }
  } catch (err) {
    console.error('加载评分数据失败:', err)
    // 使用模拟数据
    if (Number(props.initialRating)) {
      generateMockDistribution()
    }
  }
}

// 生成模拟评分分布
function generateMockDistribution() {
  const total = Math.floor(Math.random() * 1000) + 100
  totalRatings.value = total
  
  // 基于平均分生成合理的分布
  const avg = overallRating.value
  if (avg >= 4.5) {
    ratingDistribution.value = {
      5: Math.floor(total * 0.7),
      4: Math.floor(total * 0.2),
      3: Math.floor(total * 0.07),
      2: Math.floor(total * 0.02),
      1: Math.floor(total * 0.01)
    }
  } else if (avg >= 4.0) {
    ratingDistribution.value = {
      5: Math.floor(total * 0.5),
      4: Math.floor(total * 0.3),
      3: Math.floor(total * 0.15),
      2: Math.floor(total * 0.03),
      1: Math.floor(total * 0.02)
    }
  } else {
    ratingDistribution.value = {
      5: Math.floor(total * 0.3),
      4: Math.floor(total * 0.3),
      3: Math.floor(total * 0.25),
      2: Math.floor(total * 0.1),
      1: Math.floor(total * 0.05)
    }
  }
}

// 处理评分
function handleRating(rating) {
  currentRating.value = rating
  clearMessage()
}

// 提交评分
async function submitRating() {
  try {
    submitting.value = true
    await submitNovelRating(props.novelId, currentRating.value)
    
    showMessage('评分成功！感谢您的评价', 'success')
    
    // 重新加载评分数据
    setTimeout(() => {
      loadRatingData()
    }, 1000)
  } catch (err) {
    console.error('提交评分失败:', err)
    showMessage('评分失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

// 更新评分
async function updateRating() {
  try {
    submitting.value = true
    await updateNovelRating(props.novelId, currentRating.value)
    
    showMessage('评分已更新！', 'success')
    
    // 重新加载评分数据
    setTimeout(() => {
      loadRatingData()
    }, 1000)
  } catch (err) {
    console.error('更新评分失败:', err)
    showMessage('更新失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

// 显示消息
function showMessage(message, type = 'success') {
  ratingMessage.value = message
  ratingMessageType.value = type
  setTimeout(() => {
    clearMessage()
  }, 3000)
}

// 清除消息
function clearMessage() {
  ratingMessage.value = ''
}

// 格式化日期
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  loadRatingData()
})
</script>

<style scoped>
/* 动画效果 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rating-system {
  animation: slideIn 0.3s ease-out;
}

/* 移动端优化与主题色适配 */
.section-title {
  color: var(--color-text-primary);
}

.score-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
}

.score-number {
  color: var(--color-text-primary);
}

.sub-text, .muted-text {
  color: var(--color-text-muted);
}

.bar-bg {
  background: var(--color-border);
}

.bar-fill {
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
}

.themed-star {
  color: var(--color-primary);
}

.themed-card {
  background: var(--color-bg-card);
}

.small-radius {
  border: 1px solid var(--color-border);
}

.panel-title {
  color: var(--color-text-primary);
}

.score-inline {
  color: var(--color-text-primary);
}

.text-success {
  color: #16a34a;
}

.text-danger {
  color: #ef4444;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: #fff;
  border-radius: 10px;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: var(--color-secondary);
  color: #fff;
  border-radius: 10px;
}

.trend-placeholder {
  height: 8rem;
  background: var(--color-bg-card);
  color: var(--color-text-muted);
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

