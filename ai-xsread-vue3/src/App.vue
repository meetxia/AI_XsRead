<template>
  <div id="app">
    <!-- 使用 keep-alive 缓存组件，提升性能 -->
    <router-view v-slot="{ Component, route }">
      <keep-alive :include="cachedViews">
        <component :is="Component" :key="route.path" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useRouter } from 'vue-router'

// 使用主题 composable - 这会自动监听和应用主题变化
const { currentTheme, currentMode, applyThemeToDOM } = useTheme()

const router = useRouter()

// 需要缓存的页面列表
const cachedViews = computed(() => {
  return router.getRoutes()
    .filter(route => route.meta?.keepAlive)
    .map(route => route.name)
})

onMounted(() => {
  // 确保主题已应用
  applyThemeToDOM(currentTheme.value, currentMode.value)
  console.log('✓ 主题已应用:', currentTheme.value, currentMode.value)
  
  // 性能监控
  if (process.env.NODE_ENV === 'development') {
    console.log('✓ 缓存页面:', cachedViews.value)
  }
})
</script>

<style>
/* 全局样式 */
#app, html, body {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}
#app {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden; /* 防止水平滚动 */
  max-width: 100vw; /* 限制最大宽度 */
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
