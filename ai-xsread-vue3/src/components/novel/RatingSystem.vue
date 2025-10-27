<template>
  <div class="rating-system">
    <h3 class="text-xl font-bold text-gray-900 mb-4">作品评分</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 左侧：总评分 -->
      <div class="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
        <div class="text-5xl font-bold text-gray-900 mb-2">
          {{ overallRating.toFixed(1) }}
        </div>
        <div class="flex items-center mb-2">
          <StarRating :rating="overallRating" :size="24" :readonly="true" />
        </div>
        <div class="text-sm text-gray-500">
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
            <span class="text-sm text-gray-600">{{ star }}</span>
            <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div class="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
              :style="{ width: `${getRatingPercentage(star)}%` }"
            ></div>
          </div>
          <div class="text-sm text-gray-500 w-12 text-right">
            {{ ratingDistribution[star] || 0 }}
          </div>
        </div>
      </div>
    </div>

    <!-- 我的评分 -->
    <div class="mt-6 p-6 bg-gray-50 rounded-xl">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-semibold text-gray-900">我的评分</h4>
        <div v-if="userRating" class="text-sm text-gray-500">
          已评分于 {{ formatDate(userRating.createdAt) }}
        </div>
      </div>
      
      <div class="flex items-center justify-center space-x-4">
        <StarRating 
          :rating="currentRating" 
          :size="32"
          :readonly="false"
          @update:rating="handleRating"
        />
        <div v-if="currentRating > 0" class="text-2xl font-bold text-gray-900">
          {{ currentRating.toFixed(1) }}
        </div>
      </div>
      
      <div v-if="ratingMessage" class="mt-3 text-center">
        <p class="text-sm" :class="ratingMessageType === 'success' ? 'text-green-600' : 'text-red-600'">
          {{ ratingMessage }}
        </p>
      </div>

      <div v-if="currentRating > 0" class="mt-4 text-center">
        <button
          v-if="!userRating"
          @click="submitRating"
          :disabled="submitting"
          class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {{ submitting ? '提交中...' : '提交评分' }}
        </button>
        <button
          v-else-if="currentRating !== userRating.rating"
          @click="updateRating"
          :disabled="submitting"
          class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {{ submitting ? '更新中...' : '更新评分' }}
        </button>
      </div>
    </div>

    <!-- 评分趋势 (可选) -->
    <div v-if="showTrend" class="mt-6">
      <h4 class="font-semibold text-gray-900 mb-3">评分趋势</h4>
      <div class="h-40 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
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

const overallRating = ref(props.initialRating || 0)
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
    const data = res.data
    
    overallRating.value = data.averageRating || props.initialRating || 0
    totalRatings.value = data.totalRatings || 0
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
    if (props.initialRating) {
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
</style>

