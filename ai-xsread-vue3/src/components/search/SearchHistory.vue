<template>
  <div v-if="history.length > 0" class="search-history bg-white rounded-2xl shadow-lg p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-gray-800 flex items-center">
        <svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        搜索历史
      </h3>
      <button
        @click="$emit('clear')"
        class="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        清空
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <div
        v-for="(item, index) in history"
        :key="index"
        class="group relative"
      >
        <button
          @click="$emit('select', item)"
          class="px-4 py-2 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg transition-all inline-flex items-center"
        >
          {{ item }}
        </button>
        <button
          @click.stop="$emit('delete', item)"
          class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select', 'delete', 'clear'])
</script>

