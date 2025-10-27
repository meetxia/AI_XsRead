<template>
  <div class="author-notice">
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      </div>
      
      <div class="flex-1">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-semibold text-gray-900">作者公告</h4>
          <span class="text-xs text-gray-400">{{ formatDate(notice.createdAt) }}</span>
        </div>
        
        <h5 v-if="notice.title" class="text-lg font-medium text-gray-800 mb-2">
          {{ notice.title }}
        </h5>
        
        <div class="text-gray-600 leading-relaxed">
          <p :class="{ 'line-clamp-3': !expanded }">{{ notice.content }}</p>
          <button 
            v-if="notice.content.length > 100"
            @click="expanded = !expanded"
            class="text-blue-500 hover:text-blue-600 mt-2 text-sm font-medium"
          >
            {{ expanded ? '收起' : '展开全部' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  notice: {
    type: Object,
    required: true
  }
})

const expanded = ref(false)

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  if (diff < 86400000) return '今天'
  if (diff < 172800000) return '昨天'
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

