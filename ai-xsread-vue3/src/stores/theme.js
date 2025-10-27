import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 主题状态管理 Store
 * 配合 useTheme composable 使用
 */
export const useThemeStore = defineStore('theme', () => {
  // 状态
  const currentTheme = ref(localStorage.getItem('theme') || 'rose')
  const currentMode = ref(localStorage.getItem('mode') || 'light')

  /**
   * 设置主题
   * @param {string} theme - 主题名称 (rose/elegant/vintage)
   */
  function setTheme(theme) {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
    
    // 触发自定义事件通知其他组件
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme, mode: currentMode.value } 
    }))
  }

  /**
   * 切换明暗模式
   */
  function toggleMode() {
    currentMode.value = currentMode.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('mode', currentMode.value)
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: currentTheme.value, mode: currentMode.value } 
    }))
  }

  /**
   * 设置模式
   * @param {string} mode - 模式 (light/dark)
   */
  function setMode(mode) {
    if (mode === 'light' || mode === 'dark') {
      currentMode.value = mode
      localStorage.setItem('mode', mode)
      
      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: currentTheme.value, mode } 
      }))
    }
  }

  return {
    currentTheme,
    currentMode,
    setTheme,
    toggleMode,
    setMode
  }
})

