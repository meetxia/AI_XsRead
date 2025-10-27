/**
 * 主题管理 Composable Hook
 * 从高保真页面 theme.js 迁移并适配 Vue3
 */

import { computed, watch, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

// 主题配置
export const themeConfig = {
  // 主题1：玫瑰温情（默认）
  rose: {
    light: {
      name: '玫瑰温情',
      primary: '#d95468',
      secondary: '#ed7654',
      accent: '#FFBAAC',
      bg: 'linear-gradient(to bottom right, #fef7f3, #fdf4f5, #fce7f3)',
      bgCard: '#ffffff',
      textPrimary: '#1a202c',
      textSecondary: '#4a5568',
      textMuted: '#718096',
      border: '#e2e8f0',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    dark: {
      name: '玫瑰温情·夜',
      primary: '#d95468',
      secondary: '#ed7654',
      accent: '#FFBAAC',
      bg: 'linear-gradient(to bottom right, #1a1a2e, #16213e, #0f172a)',
      bgCard: '#1e293b',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#334155',
      shadow: 'rgba(0, 0, 0, 0.4)',
    }
  },
  
  // 主题2：雅致高级
  elegant: {
    light: {
      name: '雅致高级',
      primary: '#759148',
      secondary: '#FFBAAC',
      accent: '#E9EDF0',
      bg: 'linear-gradient(to bottom right, #f5f7f3, #fef7f3, #E9EDF0)',
      bgCard: '#ffffff',
      textPrimary: '#1a202c',
      textSecondary: '#4a5568',
      textMuted: '#718096',
      border: '#e2e8f0',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    dark: {
      name: '雅致高级·夜',
      primary: '#8ba856',
      secondary: '#FFBAAC',
      accent: '#4a5568',
      bg: 'linear-gradient(to bottom right, #0f1419, #1a1f2e, #1e2530)',
      bgCard: '#1e293b',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#334155',
      shadow: 'rgba(0, 0, 0, 0.4)',
    }
  },
  
  // 主题3：文物古韵
  vintage: {
    light: {
      name: '文物古韵',
      primary: '#FA8F79',
      secondary: '#6BA16D',
      accent: '#A2BB6A',
      tertiary: '#DBCF9B',
      highlight: '#CC99D3',
      bg: 'linear-gradient(to bottom right, #fef9f3, #fef5f0, #f8f5ed)',
      bgCard: '#ffffff',
      textPrimary: '#1a202c',
      textSecondary: '#4a5568',
      textMuted: '#718096',
      border: '#e2e8f0',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    dark: {
      name: '文物古韵·夜',
      primary: '#FA8F79',
      secondary: '#6BA16D',
      accent: '#A2BB6A',
      tertiary: '#8b7355',
      highlight: '#CC99D3',
      bg: 'linear-gradient(to bottom right, #1a1410, #1e1b16, #2a2419)',
      bgCard: '#2d2416',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#3d3428',
      shadow: 'rgba(0, 0, 0, 0.5)',
    }
  }
}

/**
 * 应用主题到 DOM
 * @param {string} theme - 主题名称
 * @param {string} mode - 模式 (light/dark)
 */
export const applyThemeToDOM = (theme, mode) => {
  // 安全检查
  if (!themeConfig[theme] || !themeConfig[theme][mode]) {
    console.error('主题配置错误，使用默认配置')
    theme = 'rose'
    mode = 'light'
  }
  
  const themeColors = themeConfig[theme][mode]
  const root = document.documentElement
  
  // 设置 CSS 变量
  root.style.setProperty('--color-primary', themeColors.primary)
  root.style.setProperty('--color-secondary', themeColors.secondary)
  root.style.setProperty('--color-accent', themeColors.accent)
  root.style.setProperty('--color-bg-card', themeColors.bgCard)
  root.style.setProperty('--color-text-primary', themeColors.textPrimary)
  root.style.setProperty('--color-text-secondary', themeColors.textSecondary)
  root.style.setProperty('--color-text-muted', themeColors.textMuted)
  root.style.setProperty('--color-border', themeColors.border)
  root.style.setProperty('--color-shadow', themeColors.shadow)
  
  // 设置可选颜色
  if (themeColors.tertiary) {
    root.style.setProperty('--color-tertiary', themeColors.tertiary)
  }
  if (themeColors.highlight) {
    root.style.setProperty('--color-highlight', themeColors.highlight)
  }
  
  // 设置背景渐变和文字颜色
  document.body.style.background = themeColors.bg
  document.body.style.color = themeColors.textPrimary
  document.body.style.minHeight = '100vh'
  
  // 添加主题和模式类
  document.body.className = `theme-${theme} mode-${mode}`
  
  console.log(`✓ 主题已应用: ${theme} (${mode})`)
}

/**
 * 主题管理 Hook
 */
export const useTheme = () => {
  const themeStore = useThemeStore()
  
  // 计算属性
  const currentTheme = computed(() => themeStore.currentTheme)
  const currentMode = computed(() => themeStore.currentMode)
  const currentThemeConfig = computed(() => {
    return themeConfig[currentTheme.value]?.[currentMode.value] || themeConfig.rose.light
  })
  
  /**
   * 设置主题
   * @param {string} theme - 主题名称
   */
  const setTheme = (theme) => {
    if (themeConfig[theme]) {
      themeStore.setTheme(theme)
      applyThemeToDOM(theme, currentMode.value)
    } else {
      console.error('无效的主题:', theme)
    }
  }
  
  /**
   * 切换明暗模式
   */
  const toggleMode = () => {
    themeStore.toggleMode()
    applyThemeToDOM(currentTheme.value, themeStore.currentMode)
  }
  
  /**
   * 设置模式
   * @param {string} mode - 模式 (light/dark)
   */
  const setMode = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      themeStore.setMode(mode)
      applyThemeToDOM(currentTheme.value, mode)
    } else {
      console.error('无效的模式:', mode)
    }
  }
  
  /**
   * 获取当前主题完整信息
   */
  const getCurrentThemeInfo = () => {
    return {
      theme: currentTheme.value,
      mode: currentMode.value,
      config: currentThemeConfig.value
    }
  }
  
  // 监听主题变化，应用到 DOM
  watch([currentTheme, currentMode], ([newTheme, newMode]) => {
    applyThemeToDOM(newTheme, newMode)
  })
  
  // 组件挂载时应用主题
  onMounted(() => {
    applyThemeToDOM(currentTheme.value, currentMode.value)
  })
  
  return {
    // 状态
    currentTheme,
    currentMode,
    currentThemeConfig,
    themeConfig,
    
    // 方法
    setTheme,
    toggleMode,
    setMode,
    getCurrentThemeInfo,
    applyThemeToDOM
  }
}

/**
 * 初始化主题系统
 * 在 main.js 中调用
 */
export const initTheme = () => {
  const theme = localStorage.getItem('theme') || 'rose'
  const mode = localStorage.getItem('mode') || 'light'
  
  // 验证主题和模式
  const validTheme = themeConfig[theme] ? theme : 'rose'
  const validMode = (mode === 'light' || mode === 'dark') ? mode : 'light'
  
  // 应用主题
  applyThemeToDOM(validTheme, validMode)
  
  console.log('✓ 主题系统已初始化')
  console.log('当前主题:', validTheme, '模式:', validMode)
}

export default useTheme

