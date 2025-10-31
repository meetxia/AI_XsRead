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
      // 强化背景渐变 - 粉色调明显
      bg: 'linear-gradient(135deg, #fef7f3 0%, #fdf4f5 40%, #fce7f3 70%, #ffeef5 100%)',
      bgSolid: '#fef7f3', // 纯色背景备用
      // 封面渐变 - 温暖粉色调
      coverGradient: 'linear-gradient(135deg, #f5e8e8 0%, #f0dede 40%, #e8d8d5 75%, #ffeef5 100%)',
      bgCard: '#ffffff',
      textPrimary: '#1a202c',
      textSecondary: '#4a5568',
      textMuted: '#718096',
      border: '#e2e8f0',
      shadow: 'rgba(217, 84, 104, 0.15)',
    },
    dark: {
      name: '玫瑰温情·夜',
      primary: '#d95468',
      secondary: '#ed7654',
      accent: '#FFBAAC',
      // 强化暗色背景渐变 - 深紫红调
      bg: 'linear-gradient(135deg, #1a1a2e 0%, #2a1f3a 40%, #3a1f45 70%, #1a1623 100%)',
      bgSolid: '#1a1a2e',
      // 封面渐变 - 深紫红调
      coverGradient: 'linear-gradient(135deg, #2a1f3a 0%, #3a1f45 40%, #2a1f3a 75%, #1a1623 100%)',
      bgCard: '#1e293b',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#334155',
      shadow: 'rgba(217, 84, 104, 0.3)',
    }
  },
  
  // 主题2：雅致高级
  elegant: {
    light: {
      name: '雅致高级',
      primary: '#759148',
      secondary: '#FFBAAC',
      accent: '#E9EDF0',
      // 强化背景渐变 - 淡绿灰调明显
      bg: 'linear-gradient(135deg, #f5f7f3 0%, #f0f4f0 40%, #e8ede8 70%, #e2e8e0 100%)',
      bgSolid: '#f5f7f3',
      // 封面渐变 - 淡绿灰调
      coverGradient: 'linear-gradient(135deg, #e8f0e8 0%, #e0e8e0 40%, #d8e0d5 70%, #e5e8e0 100%)',
      bgCard: '#ffffff',
      textPrimary: '#1a202c',
      textSecondary: '#4a5568',
      textMuted: '#718096',
      border: '#e2e8f0',
      shadow: 'rgba(117, 145, 72, 0.15)',
    },
    dark: {
      name: '雅致高级·夜',
      primary: '#8ba856',
      secondary: '#FFBAAC',
      accent: '#4a5568',
      // 强化暗色背景渐变 - 深绿灰调
      bg: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 40%, #1e2530 70%, #141a1f 100%)',
      bgSolid: '#0f1419',
      // 封面渐变 - 深绿灰调
      coverGradient: 'linear-gradient(135deg, #2a2f2d 0%, #252a28 40%, #202523 70%, #1c211e 100%)',
      bgCard: '#1e293b',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#334155',
      shadow: 'rgba(139, 168, 86, 0.3)',
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
      // 强化背景渐变 - 暖橙米色调明显
      bg: 'linear-gradient(135deg, #fef9f3 0%, #fef5f0 40%, #f8f5ed 70%, #f5ede3 100%)',
      bgSolid: '#fef9f3',
      // 封面渐变 - 暖橙米色调
      coverGradient: 'linear-gradient(135deg, #f8f0e8 0%, #f0e8d8 40%, #e8ddd0 70%, #e0d8cc 100%)',
      bgCard: '#ffffff',
      textPrimary: '#1a202c',
      textSecondary: '#4a5568',
      textMuted: '#718096',
      border: '#e2e8f0',
      shadow: 'rgba(250, 143, 121, 0.15)',
    },
    dark: {
      name: '文物古韵·夜',
      primary: '#FA8F79',
      secondary: '#6BA16D',
      accent: '#A2BB6A',
      tertiary: '#8b7355',
      highlight: '#CC99D3',
      // 强化暗色背景渐变 - 深棕暖调
      bg: 'linear-gradient(135deg, #1a1410 0%, #1e1b16 40%, #2a2419 70%, #1f1a15 100%)',
      bgSolid: '#1a1410',
      // 封面渐变 - 深棕暖调
      coverGradient: 'linear-gradient(135deg, #302d2a 0%, #2a2825 40%, #252320 70%, #201f1c 100%)',
      bgCard: '#2d2416',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#3d3428',
      shadow: 'rgba(250, 143, 121, 0.3)',
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
  
  // 设置 CSS 变量 - 基础颜色
  root.style.setProperty('--color-primary', themeColors.primary)
  root.style.setProperty('--color-secondary', themeColors.secondary)
  root.style.setProperty('--color-accent', themeColors.accent)
  root.style.setProperty('--color-bg-card', themeColors.bgCard)
  root.style.setProperty('--color-text-primary', themeColors.textPrimary)
  root.style.setProperty('--color-text-secondary', themeColors.textSecondary)
  root.style.setProperty('--color-text-muted', themeColors.textMuted)
  root.style.setProperty('--color-border', themeColors.border)
  root.style.setProperty('--color-shadow', themeColors.shadow)
  
  // 设置主题背景渐变变量（关键！）
  root.style.setProperty('--color-bg-gradient', themeColors.bg)
  root.style.setProperty('--color-bg-solid', themeColors.bgSolid || themeColors.bgCard)
  root.style.setProperty('--color-cover-gradient', themeColors.coverGradient || themeColors.bg)
  
  // 设置额外的背景变量（确保所有组件都能正确显示）
  root.style.setProperty('--color-bg-base', themeColors.bgSolid || (mode === 'dark' ? '#1a1a1a' : '#fefefe'))
  root.style.setProperty('--color-bg-elevated', themeColors.bgCard)
  root.style.setProperty('--color-bg-hover', mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)')
  
  // 设置主色调的变体
  root.style.setProperty('--color-primary-dark', mode === 'dark' ? '#ff5569' : '#c23d52')
  root.style.setProperty('--color-primary-light', mode === 'dark' ? '#ff8191' : '#ff6b7f')
  
  // 设置可选颜色
  if (themeColors.tertiary) {
    root.style.setProperty('--color-tertiary', themeColors.tertiary)
  }
  if (themeColors.highlight) {
    root.style.setProperty('--color-highlight', themeColors.highlight)
  }
  
  // 设置背景渐变和文字颜色 - 添加平滑过渡
  document.body.style.transition = 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1), color 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  document.body.style.background = themeColors.bg
  document.body.style.backgroundAttachment = 'fixed' // 固定背景，滚动时背景不动
  document.body.style.color = themeColors.textPrimary
  document.body.style.minHeight = '100vh'
  
  // 为根元素添加平滑过渡
  root.style.transition = 'background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  
  // 添加主题和模式类到根元素和body
  root.className = mode === 'dark' ? 'dark' : ''
  document.body.className = `theme-${theme} mode-${mode}`
  
  // 触发自定义事件，通知其他组件主题已变化
  window.dispatchEvent(new CustomEvent('theme-applied', {
    detail: { theme, mode, colors: themeColors }
  }))
  
  console.log(`✓ 主题已应用: ${theme} (${mode})`, {
    textPrimary: themeColors.textPrimary,
    bgCard: themeColors.bgCard,
    bgGradient: themeColors.bg,
    coverGradient: themeColors.coverGradient
  })
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

