<template>
  <div class="book-list">
    <div v-if="books.length === 0" class="empty-state">
      <div class="text-center py-20">
        <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p class="text-gray-500 text-lg">暂无书籍</p>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="book in books"
        :key="book.id"
        @click="handleClick(book)"
        class="book-list-item bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-4 cursor-pointer flex items-center"
        :class="{ 'ring-2 ring-blue-500': selectedIds.includes(book.id) }"
      >
        <!-- 选择框 -->
        <div v-if="editMode" class="mr-4">
          <input
            type="checkbox"
            :checked="selectedIds.includes(book.id)"
            @change.stop="$emit('select', book.id)"
            class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>

        <!-- 封面 -->
        <div class="cover-container flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden bg-gray-100">
          <img
            v-if="book.cover"
            :src="book.cover"
            :alt="book.title"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xl font-bold">
            {{ book.title.charAt(0) }}
          </div>
        </div>

        <!-- 书籍信息 -->
        <div class="flex-1 ml-4 min-w-0">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-lg text-gray-800 truncate mb-1">
                {{ book.title }}
                <span v-if="book.hasUpdate" class="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">更新</span>
              </h3>
              <p class="text-sm text-gray-500 mb-2">{{ book.author }}</p>
              
              <!-- 阅读进度 -->
              <div v-if="book.readProgress > 0" class="mb-2">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>阅读进度</span>
                  <span>{{ book.readProgress }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all"
                    :style="{ width: book.readProgress + '%' }"
                  ></div>
                </div>
              </div>

              <!-- 统计信息 -->
              <div class="flex items-center space-x-4 text-sm text-gray-400">
                <span>{{ formatChapterCount(book.chapterCount) }}</span>
                <span>{{ formatWordCount(book.wordCount) }}</span>
                <span>最后阅读: {{ formatLastRead(book.lastReadTime) }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div v-if="!editMode" class="ml-4 flex items-center space-x-2">
              <button
                @click.stop="$emit('continue-read', book)"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                继续阅读
              </button>
              <button
                @click.stop="$emit('remove', book.id)"
                class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="移除"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
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
  },
  editMode: {
    type: Boolean,
    default: false
  },
  selectedIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'click', 'continue-read', 'remove'])

function handleClick(book) {
  emit('click', book)
}

function formatChapterCount(count) {
  if (!count) return '0章'
  return `${count}章`
}

function formatWordCount(count) {
  if (!count) return '0字'
  if (count > 10000) {
    return `${(count / 10000).toFixed(1)}万字`
  }
  return `${count}字`
}

function formatLastRead(timestamp) {
  if (!timestamp) return '未读'
  
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}-${date.getDate()}`
}
</script>

