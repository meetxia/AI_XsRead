<template>
  <div class="author-works">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-bold text-gray-900">
        作品列表
        <span class="text-sm text-gray-500 font-normal ml-2">({{ works.length }}部)</span>
      </h3>
      
      <select 
        v-model="sortBy"
        class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
      >
        <option value="latest">最新发布</option>
        <option value="popular">最受欢迎</option>
        <option value="wordCount">字数最多</option>
      </select>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="h-40 bg-gray-100 rounded-xl animate-pulse"></div>
    </div>

    <!-- 作品列表 -->
    <div v-else-if="sortedWorks.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="work in sortedWorks"
        :key="work.id"
        @click="$emit('select-work', work.id)"
        class="work-item flex space-x-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
      >
        <!-- 封面 -->
        <div class="flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden bg-gray-100">
          <img
            v-if="work.cover"
            :src="work.cover"
            :alt="work.title"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-bold">
            {{ work.title.charAt(0) }}
          </div>
        </div>

        <!-- 信息 -->
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-gray-900 truncate mb-1 group-hover:text-blue-600 transition-colors">
            {{ work.title }}
          </h4>
          <p class="text-sm text-gray-500 line-clamp-2 mb-2">
            {{ work.description }}
          </p>
          <div class="flex items-center flex-wrap gap-2 text-xs text-gray-400">
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {{ formatWordCount(work.wordCount) }}
            </span>
            <span class="flex items-center">
              <svg class="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {{ work.rating || '0.0' }}
            </span>
            <span 
              class="px-2 py-0.5 rounded-full text-xs font-semibold"
              :class="work.status === 'finished' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'"
            >
              {{ work.status === 'finished' ? '完结' : '连载' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="py-20 text-center">
      <div class="text-gray-400 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <p class="text-gray-500">暂无作品</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  authorId: {
    type: [String, Number],
    required: true
  },
  works: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select-work'])

const loading = ref(false)
const sortBy = ref('latest')

// 排序后的作品
const sortedWorks = computed(() => {
  const works = [...props.works]
  
  switch (sortBy.value) {
    case 'latest':
      return works.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    case 'popular':
      return works.sort((a, b) => (b.views || 0) - (a.views || 0))
    case 'wordCount':
      return works.sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0))
    default:
      return works
  }
})

function formatWordCount(count) {
  if (!count) return '0字'
  if (count > 10000) {
    return `${(count / 10000).toFixed(1)}万字`
  }
  return `${count}字`
}
</script>

<style scoped>
.work-item {
  transition: all 0.2s ease;
}

.work-item:hover {
  transform: translateY(-2px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

