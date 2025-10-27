<template>
  <div class="hot-search bg-white rounded-2xl shadow-lg p-6">
    <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
      <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
      </svg>
      热门搜索
    </h3>

    <div class="space-y-2">
      <div
        v-for="(item, index) in hotList"
        :key="index"
        @click="$emit('select', item.keyword)"
        class="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all group"
      >
        <!-- 排名 -->
        <div class="flex-shrink-0 w-6 mr-3 text-center">
          <span
            :class="[
              'font-bold',
              index < 3 ? 'text-red-500 text-lg' : 'text-gray-400'
            ]"
          >
            {{ index + 1 }}
          </span>
        </div>

        <!-- 关键词 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center">
            <span class="text-gray-800 truncate group-hover:text-blue-600 transition-colors">
              {{ item.keyword }}
            </span>
            <span
              v-if="item.hot"
              class="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full flex-shrink-0"
            >
              HOT
            </span>
            <span
              v-if="item.isNew"
              class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full flex-shrink-0"
            >
              NEW
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ item.count }} 次搜索</p>
        </div>

        <!-- 趋势图标 -->
        <div class="flex-shrink-0 ml-3">
          <div v-if="item.trend === 'up'" class="text-red-500">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <div v-else-if="item.trend === 'down'" class="text-green-500">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <div v-else class="text-gray-300">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hotList: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select'])
</script>

