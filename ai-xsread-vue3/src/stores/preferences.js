import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { debounce } from 'lodash-es'
import { getMyPreferences, updateMyPreferences } from '@/api/preferences'
import { useUserStore } from '@/stores/user'
import { useReadingSettingsStore } from '@/stores/readingSettings'

const LOCAL_KEY = 'xs:preferences'

const VALID_THEMES = ['cream', 'night', 'eye']
const VALID_PAGE_MODES = ['scroll', 'page']

const DEFAULTS = Object.freeze({
  fontSize: 16,
  lineHeight: 1.8,
  theme: 'cream',
  pageMode: 'scroll',
  eyeProtection: false,
})

/**
 * 把"用户偏好"映射到 readingSettings store 字段
 * theme:    cream  -> sepia  / night -> dark  / eye  -> green
 * pageMode: scroll -> scroll / page  -> tap
 */
function mapThemeToBackground(theme) {
  if (theme === 'night') return 'dark'
  if (theme === 'eye') return 'green'
  return 'sepia'
}
function mapPageModeToFlip(pageMode) {
  return pageMode === 'page' ? 'tap' : 'scroll'
}

function clampFontSize(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return DEFAULTS.fontSize
  return Math.min(24, Math.max(12, Math.round(n)))
}
function clampLineHeight(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return DEFAULTS.lineHeight
  return Math.min(2.2, Math.max(1.4, n))
}
function normalizeTheme(value) {
  return VALID_THEMES.includes(value) ? value : DEFAULTS.theme
}
function normalizePageMode(value) {
  return VALID_PAGE_MODES.includes(value) ? value : DEFAULTS.pageMode
}
function normalize(raw = {}) {
  return {
    fontSize: clampFontSize(raw.fontSize ?? DEFAULTS.fontSize),
    lineHeight: clampLineHeight(raw.lineHeight ?? DEFAULTS.lineHeight),
    theme: normalizeTheme(raw.theme ?? DEFAULTS.theme),
    pageMode: normalizePageMode(raw.pageMode ?? DEFAULTS.pageMode),
    eyeProtection: Boolean(raw.eyeProtection ?? DEFAULTS.eyeProtection),
  }
}

function readLocal() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.warn('[preferences] read local failed', err)
    return null
  }
}
function writeLocal(value) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(value))
  } catch (err) {
    console.warn('[preferences] write local failed', err)
  }
}

export const usePreferencesStore = defineStore('preferences', () => {
  // ── State ────────────────────────────────────────────────
  const fontSize = ref(DEFAULTS.fontSize)
  const lineHeight = ref(DEFAULTS.lineHeight)
  const theme = ref(DEFAULTS.theme)
  const pageMode = ref(DEFAULTS.pageMode)
  const eyeProtection = ref(DEFAULTS.eyeProtection)
  const loaded = ref(false)
  const loading = ref(false)

  // 上一次成功保存的值，用于失败回滚
  let lastSnapshot = { ...DEFAULTS }

  const snapshot = computed(() => ({
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    theme: theme.value,
    pageMode: pageMode.value,
    eyeProtection: eyeProtection.value,
  }))

  /** 把当前 state 同步到 readingSettings（阅读器内部使用） */
  function syncToReadingSettings() {
    try {
      const reading = useReadingSettingsStore()
      // useReadingSettings 暴露的是 reactive settings + 一组 setter
      reading.save({
        fontSize: fontSize.value,
        lineHeight: lineHeight.value,
        background: mapThemeToBackground(theme.value),
        pageFlipMode: mapPageModeToFlip(pageMode.value),
      })
    } catch (err) {
      // pinia 还未初始化或运行环境无 readingSettings 时安全降级
      console.warn('[preferences] sync to readingSettings skipped', err)
    }
  }

  /** 应用一份偏好到 state（不触发任何接口） */
  function applyState(values) {
    const next = normalize(values)
    fontSize.value = next.fontSize
    lineHeight.value = next.lineHeight
    theme.value = next.theme
    pageMode.value = next.pageMode
    eyeProtection.value = next.eyeProtection
    lastSnapshot = { ...next }
    syncToReadingSettings()
  }

  /** 从 localStorage 恢复（未登录或服务端不可用时使用） */
  function restore() {
    const local = readLocal()
    if (local) {
      applyState(local)
    } else {
      applyState(DEFAULTS)
    }
    loaded.value = true
  }

  /** 防抖保存到服务端 */
  const debouncedPush = debounce(async (patch, prevSnapshot) => {
    try {
      const res = await updateMyPreferences(patch)
      if (res?.data) {
        // 服务端返回完整对象，回写一次（防止字段被服务端修正）
        const next = normalize(res.data)
        fontSize.value = next.fontSize
        lineHeight.value = next.lineHeight
        theme.value = next.theme
        pageMode.value = next.pageMode
        eyeProtection.value = next.eyeProtection
        lastSnapshot = { ...next }
        syncToReadingSettings()
      } else {
        lastSnapshot = { ...snapshot.value }
      }
    } catch (err) {
      console.warn('[preferences] update failed, rollback', err)
      // 回滚到上一次成功值
      fontSize.value = prevSnapshot.fontSize
      lineHeight.value = prevSnapshot.lineHeight
      theme.value = prevSnapshot.theme
      pageMode.value = prevSnapshot.pageMode
      eyeProtection.value = prevSnapshot.eyeProtection
      writeLocal(prevSnapshot)
      syncToReadingSettings()
    }
  }, 500)

  /** 拉取服务端偏好（登录态） */
  async function fetch() {
    let userStore
    try {
      userStore = useUserStore()
    } catch (err) {
      userStore = null
    }
    if (!userStore || !userStore.isLogin) {
      restore()
      return
    }
    loading.value = true
    try {
      const res = await getMyPreferences()
      if (res?.data) {
        applyState(res.data)
        writeLocal(snapshot.value)
      } else {
        restore()
      }
      loaded.value = true
    } catch (err) {
      console.warn('[preferences] fetch failed, fallback to local', err)
      restore()
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新偏好：本地立即合并 + 防抖推送服务端 + 失败回滚
   * @param {Partial<typeof DEFAULTS>} patch
   */
  function update(patch = {}) {
    if (!patch || typeof patch !== 'object') return
    const prev = { ...snapshot.value }

    // 本地立即合并（先归一化，避免用户传入越界值导致 UI 抖动）
    const merged = normalize({ ...prev, ...patch })
    fontSize.value = merged.fontSize
    lineHeight.value = merged.lineHeight
    theme.value = merged.theme
    pageMode.value = merged.pageMode
    eyeProtection.value = merged.eyeProtection
    syncToReadingSettings()
    writeLocal(merged)

    let userStore
    try {
      userStore = useUserStore()
    } catch (err) {
      userStore = null
    }
    if (!userStore || !userStore.isLogin) {
      // 未登录：仅本地 + readingSettings
      lastSnapshot = { ...merged }
      return
    }

    // 登录态：防抖推送，使用上一次成功值作为回滚基准
    debouncedPush(patch, prev)
  }

  /** 登出 / 切账号时调用，重新回到默认/本地 */
  function reset() {
    debouncedPush.cancel?.()
    applyState(DEFAULTS)
    loaded.value = false
  }

  return {
    // state
    fontSize,
    lineHeight,
    theme,
    pageMode,
    eyeProtection,
    loaded,
    loading,
    snapshot,
    // actions
    fetch,
    update,
    restore,
    reset,
  }
})
