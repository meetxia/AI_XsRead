/**
 * 阅读设置管理 Composable
 * 管理字体大小、行间距、背景色等阅读偏好
 */

import { ref, watch, computed } from 'vue'

// 背景色预设
export const backgroundColors = [
  { name: '纯白', value: '#ffffff', textColor: '#1a202c' },
  { name: '米黄', value: '#f5f1e8', textColor: '#2d3748' },
  { name: '绿豆沙', value: '#e3edcd', textColor: '#2d3748' },
  { name: '护眼绿', value: '#cce8cf', textColor: '#2d3748' },
  { name: '暗夜', value: '#1a202c', textColor: '#e2e8f0' }
]

// 字体预设
export const fontFamilies = [
  { name: '默认', value: "'Noto Serif SC', serif" },
  { name: '宋体', value: "'SimSun', serif" },
  { name: '黑体', value: "'SimHei', sans-serif" },
  { name: '楷体', value: "'KaiTi', serif" },
  { name: '微软雅黑', value: "'Microsoft YaHei', sans-serif" }
]

// 行间距预设
export const lineHeights = [
  { name: '紧凑', value: 1.5 },
  { name: '适中', value: 1.8 },
  { name: '舒适', value: 2.0 },
  { name: '宽松', value: 2.2 },
  { name: '超宽', value: 2.5 }
]

// 翻页方式
export const pageFlipModes = [
  { name: '滚动', value: 'scroll' },
  { name: '点击', value: 'click' },
  { name: '滑动', value: 'swipe' }
]

// 默认设置
const defaultSettings = {
  fontSize: 18,          // 字体大小 (12-24px)
  lineHeight: 1.8,       // 行间距
  backgroundColor: '#f5f1e8',  // 背景色
  textColor: '#2d3748',  // 文字颜色
  fontFamily: "'Noto Serif SC', serif",  // 字体
  pageFlipMode: 'scroll',  // 翻页方式
  brightness: 1.0,       // 亮度 (0.5-1.0)
  autoRead: false,       // 自动朗读
  autoReadSpeed: 1.0     // 朗读速度
}

// 从 localStorage 加载设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('reading-settings')
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) }
    }
  } catch (error) {
    console.error('加载阅读设置失败:', error)
  }
  return { ...defaultSettings }
}

// 保存设置到 localStorage
const saveSettingsToStorage = (settings) => {
  try {
    localStorage.setItem('reading-settings', JSON.stringify(settings))
  } catch (error) {
    console.error('保存阅读设置失败:', error)
  }
}

/**
 * 阅读设置 Hook
 */
export const useReadingSettings = () => {
  // 设置状态
  const settings = ref(loadSettings())
  
  /**
   * 设置字体大小
   * @param {number} size - 字体大小 (12-24)
   */
  const setFontSize = (size) => {
    if (size >= 12 && size <= 24) {
      settings.value.fontSize = size
    }
  }
  
  /**
   * 增加字体大小
   */
  const increaseFontSize = () => {
    if (settings.value.fontSize < 24) {
      settings.value.fontSize += 1
    }
  }
  
  /**
   * 减小字体大小
   */
  const decreaseFontSize = () => {
    if (settings.value.fontSize > 12) {
      settings.value.fontSize -= 1
    }
  }
  
  /**
   * 设置行间距
   * @param {number} height - 行间距
   */
  const setLineHeight = (height) => {
    settings.value.lineHeight = height
  }
  
  /**
   * 设置背景色
   * @param {string} color - 背景色
   * @param {string} textColor - 文字颜色
   */
  const setBackgroundColor = (color, textColor) => {
    settings.value.backgroundColor = color
    settings.value.textColor = textColor
  }
  
  /**
   * 设置字体
   * @param {string} family - 字体族
   */
  const setFontFamily = (family) => {
    settings.value.fontFamily = family
  }
  
  /**
   * 设置翻页方式
   * @param {string} mode - 翻页方式
   */
  const setPageFlipMode = (mode) => {
    settings.value.pageFlipMode = mode
  }
  
  /**
   * 设置亮度
   * @param {number} brightness - 亮度 (0.5-1.0)
   */
  const setBrightness = (brightness) => {
    if (brightness >= 0.5 && brightness <= 1.0) {
      settings.value.brightness = brightness
    }
  }
  
  /**
   * 切换自动朗读
   */
  const toggleAutoRead = () => {
    settings.value.autoRead = !settings.value.autoRead
  }
  
  /**
   * 设置朗读速度
   * @param {number} speed - 速度 (0.5-2.0)
   */
  const setAutoReadSpeed = (speed) => {
    if (speed >= 0.5 && speed <= 2.0) {
      settings.value.autoReadSpeed = speed
    }
  }
  
  /**
   * 重置所有设置
   */
  const resetSettings = () => {
    settings.value = { ...defaultSettings }
  }
  
  /**
   * 获取当前背景色配置
   */
  const getCurrentBackgroundConfig = computed(() => {
    return backgroundColors.find(
      bg => bg.value === settings.value.backgroundColor
    ) || backgroundColors[0]
  })
  
  /**
   * 获取当前字体配置
   */
  const getCurrentFontConfig = computed(() => {
    return fontFamilies.find(
      font => font.value === settings.value.fontFamily
    ) || fontFamilies[0]
  })
  
  /**
   * 获取当前行间距配置
   */
  const getCurrentLineHeightConfig = computed(() => {
    return lineHeights.find(
      lh => lh.value === settings.value.lineHeight
    ) || lineHeights[1]
  })
  
  // 监听设置变化，自动保存
  watch(settings, (newSettings) => {
    saveSettingsToStorage(newSettings)
  }, { deep: true })
  
  return {
    // 状态
    settings,
    
    // 预设选项
    backgroundColors,
    fontFamilies,
    lineHeights,
    pageFlipModes,
    
    // 计算属性
    getCurrentBackgroundConfig,
    getCurrentFontConfig,
    getCurrentLineHeightConfig,
    
    // 方法
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    setLineHeight,
    setBackgroundColor,
    setFontFamily,
    setPageFlipMode,
    setBrightness,
    toggleAutoRead,
    setAutoReadSpeed,
    resetSettings
  }
}

export default useReadingSettings

