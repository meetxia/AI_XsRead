/**
 * 主题管理 Composable（V1.0 简化版）
 * 仅暴露浅深模式，对外保留旧接口以兼容历史代码。
 */
import { computed, watchEffect } from 'vue'
import { useThemeStore } from '@/stores/theme'

export const useTheme = () => {
  const store = useThemeStore()

  const currentMode = computed(() => store.currentMode)
  const isDark = computed(() => store.currentMode === 'dark')

  // 兼容旧接口
  const currentTheme = computed(() => 'cream') // 旧 API 占位
  const currentThemeConfig = computed(() => ({}))

  const setMode = store.setMode
  const toggleMode = store.toggleMode
  const setTheme = () => { /* 已废弃：仅保留浅深 */ }
  const applyThemeToDOM = (_theme, mode) => store.applyToDOM(mode || store.currentMode)

  watchEffect(() => store.applyToDOM(store.currentMode))

  return {
    currentMode,
    isDark,
    setMode,
    toggleMode,

    // 兼容旧 API（避免引用错误）
    currentTheme,
    currentThemeConfig,
    setTheme,
    applyThemeToDOM,
  }
}

/**
 * 在 main.js 调用，启动时同步主题到 DOM。
 */
export const initTheme = () => {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem('xs-theme')
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const mode = stored || (prefersDark ? 'dark' : 'light')

  const root = document.documentElement
  if (mode === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#1A1714' : '#FAF6F1')
}

export default useTheme
