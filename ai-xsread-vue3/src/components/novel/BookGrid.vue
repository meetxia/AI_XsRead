<template>
  <div class="book-grid">
    <div v-if="books.length === 0" class="empty-state">
      <slot name="empty">
        <div class="text-center py-20">
          <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p class="text-gray-500 text-lg">书架空空如也</p>
          <p class="text-gray-400 text-sm mt-2">快去添加你喜欢的书吧~</p>
        </div>
      </slot>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <div
        v-for="book in books"
        :key="book.id"
        class="book-item group relative"
        @click="handleBookClick(book)"
      >
        <!-- 选择模式复选框 -->
        <div v-if="editMode" class="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            :checked="selectedIds.includes(book.id)"
            @click.stop="toggleSelect(book.id)"
            class="w-5 h-5 rounded border-2 border-white shadow-lg cursor-pointer"
          />
        </div>

        <!-- 书籍封面 -->
        <div class="book-cover relative overflow-hidden rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300">
          <img
            :src="book.cover || '/placeholder-book.jpg'"
            :alt="book.title"
            class="w-full aspect-[3/4] object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
          
          <!-- 阅读进度条 -->
          <div v-if="book.readProgress > 0" class="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50">
            <div
              class="h-full bg-blue-500"
              :style="{ width: book.readProgress + '%' }"
            ></div>
          </div>

          <!-- 悬停操作按钮 -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              @click.stop="$emit('read', book)"
              class="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all transform hover:scale-105"
            >
              继续阅读
            </button>
          </div>
        </div>

        <!-- 书籍信息 -->
        <div class="book-info mt-3">
          <h4 class="font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
            {{ book.title }}
          </h4>
          <p class="text-sm text-gray-500 truncate mt-1">{{ book.author }}</p>
          
          <div class="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span v-if="book.currentChapter">{{ book.currentChapter }}/{{ book.totalChapters }}章</span>
            <span v-if="book.lastReadTime">{{ formatTime(book.lastReadTime) }}</span>
          </div>
        </div>

        <!-- 删除按钮 (编辑模式) -->
        <button
          v-if="editMode"
          @click.stop="$emit('remove', book.id)"
          class="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-all z-10"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
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

const emit = defineEmits(['read', 'remove', 'select', 'click'])

function handleBookClick(book) {
  if (!props.editMode) {
    emit('click', book)
  }
}

function toggleSelect(id) {
  emit('select', id)
}

function formatTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(timestamp).toLocaleDateString()
}
</script>

<style scoped>
.book-item {
  cursor: pointer;
}
</style>

