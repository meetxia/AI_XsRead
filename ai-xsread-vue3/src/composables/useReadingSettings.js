import { computed, reactive, watch } from 'vue'

export const READING_SETTINGS_KEY = 'reading-settings'

export const fontFamilies = [
  { name: '默认', value: 'default', family: '"Noto Serif SC", "Source Han Serif SC", serif' },
  { name: '宋体', value: 'songti', family: 'SimSun, "Songti SC", serif' },
  { name: '黑体', value: 'heiti', family: 'SimHei, "Heiti SC", sans-serif' },
  { name: '楷体', value: 'kaiti', family: 'KaiTi, "Kaiti SC", serif' },
  { name: '雅黑', value: 'yahei', family: '"Microsoft YaHei", "PingFang SC", sans-serif' },
]

export const lineHeights = [
  { name: '1.4', value: 1.4 },
  { name: '1.6', value: 1.6 },
  { name: '1.8', value: 1.8 },
  { name: '2.0', value: 2.0 },
  { name: '2.2', value: 2.2 },
]

export const paragraphSpacings = [
  { name: '紧凑', value: 'compact', margin: '0.5em' },
  { name: '标准', value: 'normal', margin: '1em' },
  { name: '疏朗', value: 'relaxed', margin: '1.5em' },
]

export const pageMargins = [
  { name: '窄', value: 'narrow', padding: 16 },
  { name: '标准', value: 'normal', padding: 24 },
  { name: '宽', value: 'wide', padding: 40 },
]

export const pageFlipModes = [
  { name: '滚动', value: 'scroll' },
  { name: '点击', value: 'tap' },
  { name: '滑动', value: 'swipe' },
]

export const backgroundColors = [
  { name: '日间', value: 'white', bg: '#fafaf9', text: '#1c1917' },
  { name: '柔黄', value: 'sepia', bg: '#f5eedc', text: '#3b2f25' },
  { name: '护眼', value: 'green', bg: '#e6efe4', text: '#223026' },
  { name: '夜间', value: 'dark', bg: '#12110f', text: '#ded8ce' },
]

export const ttsSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export const defaultReadingSettings = Object.freeze({
  fontSize: 18,
  lineHeight: 1.8,
  paragraphSpacing: 'normal',
  pageMargin: 'normal',
  fontFamily: 'default',
  brightness: 100,
  pageFlipMode: 'scroll',
  keepAwake: false,
  background: 'sepia',
  ttsRate: 1,
  ttsVoiceURI: '',
})

const settings = reactive({ ...defaultReadingSettings })
let loaded = false

function normalize(raw = {}) {
  const next = { ...defaultReadingSettings, ...raw }
  const fontSize = Number(next.fontSize)
  const brightness = Number(next.brightness)

  next.fontSize = Number.isFinite(fontSize) ? Math.min(28, Math.max(12, fontSize)) : defaultReadingSettings.fontSize
  next.brightness = Number.isFinite(brightness) ? Math.min(100, Math.max(50, brightness)) : defaultReadingSettings.brightness

  if (!lineHeights.some((item) => item.value === Number(next.lineHeight))) next.lineHeight = defaultReadingSettings.lineHeight
  else next.lineHeight = Number(next.lineHeight)

  if (!paragraphSpacings.some((item) => item.value === next.paragraphSpacing)) next.paragraphSpacing = defaultReadingSettings.paragraphSpacing
  if (!pageMargins.some((item) => item.value === next.pageMargin)) next.pageMargin = defaultReadingSettings.pageMargin
  if (!fontFamilies.some((item) => item.value === next.fontFamily)) next.fontFamily = defaultReadingSettings.fontFamily
  if (!pageFlipModes.some((item) => item.value === next.pageFlipMode)) next.pageFlipMode = defaultReadingSettings.pageFlipMode
  if (!backgroundColors.some((item) => item.value === next.background)) next.background = defaultReadingSettings.background
  if (!ttsSpeeds.includes(Number(next.ttsRate))) next.ttsRate = defaultReadingSettings.ttsRate
  else next.ttsRate = Number(next.ttsRate)

  next.keepAwake = Boolean(next.keepAwake)
  next.ttsVoiceURI = typeof next.ttsVoiceURI === 'string' ? next.ttsVoiceURI : ''
  return next
}

function readStoredSettings() {
  if (typeof localStorage === 'undefined') return {}

  try {
    const next = localStorage.getItem(READING_SETTINGS_KEY)
    if (next) return JSON.parse(next)

    const legacy = localStorage.getItem('xs-reading-prefs-v2')
    if (!legacy) return {}

    const parsed = JSON.parse(legacy)
    return {
      fontSize: parsed.fontSize,
      lineHeight: parsed.lineHeight,
      fontFamily: parsed.font === 'sans' ? 'yahei' : 'default',
      background: parsed.bg === 'eye' ? 'green' : parsed.bg,
    }
  } catch (error) {
    console.warn('[reading-settings] load failed', error)
    return {}
  }
}

function persistSettings() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(READING_SETTINGS_KEY, JSON.stringify({ ...settings }))
}

function load() {
  Object.assign(settings, normalize(readStoredSettings()))
  loaded = true
  return settings
}

function save(patch = {}) {
  Object.assign(settings, normalize({ ...settings, ...patch }))
  persistSettings()
}

function reset() {
  Object.assign(settings, { ...defaultReadingSettings })
  persistSettings()
}

function applyToDocument(root = document?.documentElement) {
  if (!root) return
  const font = fontFamilies.find((item) => item.value === settings.fontFamily) || fontFamilies[0]
  const spacing = paragraphSpacings.find((item) => item.value === settings.paragraphSpacing) || paragraphSpacings[1]
  const margin = pageMargins.find((item) => item.value === settings.pageMargin) || pageMargins[1]
  const bg = backgroundColors.find((item) => item.value === settings.background) || backgroundColors[1]

  root.style.setProperty('--reading-font-size', `${settings.fontSize}px`)
  root.style.setProperty('--reading-line-height', String(settings.lineHeight))
  root.style.setProperty('--reading-paragraph-spacing', spacing.margin)
  root.style.setProperty('--reading-page-padding', `${margin.padding}px`)
  root.style.setProperty('--reading-font', font.family)
  root.style.setProperty('--reading-bg', bg.bg)
  root.style.setProperty('--reading-text', bg.text)
  root.style.setProperty('--reading-dim-opacity', String((100 - settings.brightness) / 100))
}

watch(
  settings,
  () => {
    if (!loaded) return
    persistSettings()
    if (typeof document !== 'undefined') applyToDocument()
  },
  { deep: true }
)

export function useReadingSettings() {
  if (!loaded) load()
  if (typeof document !== 'undefined') applyToDocument()

  const currentBackground = computed(() => backgroundColors.find((item) => item.value === settings.background) || backgroundColors[1])
  const wakeLockSupported = computed(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator)

  return {
    settings,
    backgroundColors,
    fontFamilies,
    lineHeights,
    paragraphSpacings,
    pageMargins,
    pageFlipModes,
    ttsSpeeds,
    currentBackground,
    wakeLockSupported,
    load,
    save,
    reset,
    applyToDocument,
    setFontSize: (value) => save({ fontSize: value }),
    increaseFontSize: () => save({ fontSize: settings.fontSize + 1 }),
    decreaseFontSize: () => save({ fontSize: settings.fontSize - 1 }),
    setLineHeight: (value) => save({ lineHeight: value }),
    setParagraphSpacing: (value) => save({ paragraphSpacing: value }),
    setPageMargin: (value) => save({ pageMargin: value }),
    setFontFamily: (value) => save({ fontFamily: value }),
    setBrightness: (value) => save({ brightness: value }),
    setPageFlipMode: (value) => save({ pageFlipMode: value }),
    setBackground: (value) => save({ background: value }),
    setKeepAwake: (value) => save({ keepAwake: value }),
    setTtsRate: (value) => save({ ttsRate: value }),
    setTtsVoiceURI: (value) => save({ ttsVoiceURI: value }),
  }
}

export default useReadingSettings
