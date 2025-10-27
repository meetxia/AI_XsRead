<template>
  <div class="reading-stats bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
    <h3 class="text-xl font-bold mb-4 flex items-center">
      <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      阅读统计
    </h3>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="stat-item bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition-all">
        <div class="text-3xl font-bold mb-1">{{ stats.totalBooks }}</div>
        <div class="text-sm opacity-90">藏书总数</div>
      </div>
      
      <div class="stat-item bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition-all">
        <div class="text-3xl font-bold mb-1">{{ stats.readingBooks }}</div>
        <div class="text-sm opacity-90">正在阅读</div>
      </div>
      
      <div class="stat-item bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition-all">
        <div class="text-3xl font-bold mb-1">{{ stats.finishedBooks }}</div>
        <div class="text-sm opacity-90">已读完</div>
      </div>
      
      <div class="stat-item bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition-all">
        <div class="text-3xl font-bold mb-1">{{ formatReadTime(stats.totalReadTime) }}</div>
        <div class="text-sm opacity-90">阅读时长</div>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-white/20">
      <div class="flex items-center justify-between text-sm">
        <span class="opacity-90">本周阅读</span>
        <span class="font-semibold">{{ stats.weeklyReadTime }} 小时</span>
      </div>
      <div class="flex items-center justify-between text-sm mt-2">
        <span class="opacity-90">连续阅读天数</span>
        <span class="font-semibold">{{ stats.consecutiveDays }} 天</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalBooks: 0,
      readingBooks: 0,
      finishedBooks: 0,
      totalReadTime: 0,
      weeklyReadTime: 0,
      consecutiveDays: 0
    })
  }
})

function formatReadTime(minutes) {
  if (minutes < 60) {
    return `${minutes}分`
  }
  const hours = Math.floor(minutes / 60)
  return `${hours}时`
}
</script>

<style scoped>
.stat-item {
  cursor: default;
}
</style>

