<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

// 使用主题 composable - 这会自动监听和应用主题变化
const { currentTheme, currentMode, applyThemeToDOM } = useTheme()

onMounted(() => {
  // 确保主题已应用
  applyThemeToDOM(currentTheme.value, currentMode.value)
  console.log('✓ 主题已应用:', currentTheme.value, currentMode.value)
})
</script>

<style>
/* 全局样式 */
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
