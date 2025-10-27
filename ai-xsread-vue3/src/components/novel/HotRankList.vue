<template>
  <div class="hot-rank-list bg-white rounded-2xl shadow-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-2xl font-bold text-gray-800 flex items-center">
        <svg class="w-7 h-7 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        热门榜单
      </h3>
      <a href="#" class="text-blue-500 hover:text-blue-600 text-sm">查看更多 →</a>
    </div>

    <div class="space-y-3">
      <div
        v-for="(book, index) in books"
        :key="book.id"
        @click="$emit('click', book)"
        class="rank-item flex items-center p-3 rounded-lg hover:bg-gray-50 transition-all cursor-pointer group"
      >
        <!-- 排名 -->
        <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-4">
          <span
            :class="[
              'font-bold text-lg',
              index < 3 ? 'text-red-500' : 'text-gray-400'
            ]"
          >
            {{ index + 1 }}
          </span>
        </div>

        <!-- 封面 -->
        <div class="flex-shrink-0 w-12 h-16 rounded overflow-hidden mr-4">
          <img
            v-if="book.cover"
            :src="book.cover"
            :alt="book.title"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <div v-else class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            {{ book.title.charAt(0) }}
          </div>
        </div>

        <!-- 信息 -->
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
            {{ book.title }}
          </h4>
          <p class="text-sm text-gray-500 truncate">{{ book.author }}</p>
          <div class="flex items-center mt-1 text-xs text-gray-400 space-x-3">
            <span class="flex items-center">
              <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {{ book.rating }}
            </span>
            <span>{{ formatHotValue(book.hotValue) }} 热度</span>
          </div>
        </div>

        <!-- 趋势 -->
        <div class="flex-shrink-0 ml-4">
          <div v-if="book.trend === 'up'" class="flex items-center text-red-500">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm ml-1">{{ book.trendValue }}</span>
          </div>
          <div v-else-if="book.trend === 'down'" class="flex items-center text-green-500">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm ml-1">{{ book.trendValue }}</span>
          </div>
          <div v-else class="text-gray-400">
            <span class="text-sm">-</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  books: {
    type: Array,
    default: () => []
  }
})

defineEmits(['click'])

function formatHotValue(value) {
  if (value > 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  return value
}
</script>

<style scoped>
.rank-item:hover {
  transform: translateX(4px);
}
</style>

