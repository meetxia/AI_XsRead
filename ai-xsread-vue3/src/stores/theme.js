import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 主题状态管理（V1.0 简化版）
 * 仅保留浅色/深色两种模式，不再支持多主题切换。
 * - mode: 'light' | 'dark'
 * - 跨页面通过 localStorage('xs-theme') 同步
 */
export const useThemeStore = defineStore('theme', () => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('xs-theme') : null
  const prefersDark = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches

  const currentMode = ref(stored || (prefersDark ? 'dark' : 'light'))

  function applyToDOM(mode) {
    const root = document.documentElement
    if (mode === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    // 同步 meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#1A1714' : '#FAF6F1')
  }

  function setMode(mode) {
    if (mode !== 'light' && mode !== 'dark') return
    currentMode.value = mode
    localStorage.setItem('xs-theme', mode)
    applyToDOM(mode)
  }

  function toggleMode() {
    setMode(currentMode.value === 'dark' ? 'light' : 'dark')
  }

  // 立即应用一次
  if (typeof window !== 'undefined') {
    applyToDOM(currentMode.value)
  }

  return {
    currentMode,
    setMode,
    toggleMode,
    applyToDOM,
  }
})
