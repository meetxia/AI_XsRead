/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 22.1 — useTTS composable
 *
 * 基于 window.speechSynthesis 的轻量朗读控制器：
 *   - 保持 composable 自身只关心调度与状态；DOM 高亮 / 滚动由调用方
 *     通过 onIndexChange 回调处理（保持 ReadingPage 单一上下文）；
 *   - getVoices() 返回空数组 → supported = false，onUnsupported 触发一次，
 *     start() 直接 no-op（Requirement 8.7）；
 *   - 自动 visibilitychange 暂停 / 恢复（Requirement 8.6 的协助实现）；
 *   - 卸载 / 路由离开 / 调用 stop() → speechSynthesis.cancel()。
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'

function isVoiceUsable(voice) {
  return voice && typeof voice.voiceURI === 'string' && voice.voiceURI.length > 0
}

function pickVoice(voices, voiceId) {
  if (!voices?.length) return null
  if (voiceId) {
    const matched = voices.find((voice) => voice?.voiceURI === voiceId)
    if (matched) return matched
  }
  return voices.find(isVoiceUsable) || null
}

export function useTTS({
  paragraphs,
  onIndexChange,
  onFinish,
  onUnsupported,
  defaultRate = 1,
  defaultVoiceId = '',
} = {}) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
  const supported = ref(Boolean(synth))
  const voices = ref([])
  const currentVoiceId = ref(defaultVoiceId || '')
  const rate = ref(Number.isFinite(Number(defaultRate)) ? Number(defaultRate) : 1)
  const playing = ref(false)
  const paused = ref(false)
  const currentIndex = ref(0)
  const finished = ref(false)

  let currentUtterance = null
  let unsupportedNotified = false
  let resumeOnVisible = false

  function notifyUnsupported() {
    if (unsupportedNotified) return
    unsupportedNotified = true
    if (typeof onUnsupported === 'function') onUnsupported()
  }

  function refreshVoices() {
    if (!synth) {
      supported.value = false
      voices.value = []
      return
    }
    const list = synth.getVoices?.() || []
    voices.value = Array.isArray(list) ? list.filter(Boolean) : []
    if (voices.value.length === 0) {
      supported.value = false
    } else {
      supported.value = true
      if (!currentVoiceId.value) {
        const fallback = pickVoice(voices.value, '')
        if (fallback?.voiceURI) currentVoiceId.value = fallback.voiceURI
      }
    }
  }

  // Subscribe to async voice loading (Chrome / Edge populate voices later).
  if (synth && typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', refreshVoices)
  } else if (synth && 'onvoiceschanged' in synth) {
    try {
      synth.onvoiceschanged = refreshVoices
    } catch (_) {
      /* ignore */
    }
  }
  refreshVoices()

  function getParagraphList() {
    const raw = typeof paragraphs === 'function' ? paragraphs() : paragraphs
    if (!raw) return []
    const value = 'value' in Object(raw) ? raw.value : raw
    if (!Array.isArray(value)) return []
    return value
  }

  function pickUtteranceFor(index) {
    const list = getParagraphList()
    if (index < 0 || index >= list.length) return null
    const text = String(list[index] || '').trim()
    if (!text) return null
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = Math.min(2, Math.max(0.5, rate.value || 1))
    const voice = pickVoice(voices.value, currentVoiceId.value)
    if (voice) utterance.voice = voice
    return utterance
  }

  function speakIndex(index) {
    if (!synth || !supported.value) return false

    const utterance = pickUtteranceFor(index)
    if (!utterance) {
      // Either out-of-range or empty paragraph → treat as finished.
      stopInternal({ silent: true })
      finished.value = true
      if (typeof onFinish === 'function') onFinish()
      return false
    }

    synth.cancel()
    currentUtterance = utterance
    currentIndex.value = index
    playing.value = true
    paused.value = false
    finished.value = false

    if (typeof onIndexChange === 'function') {
      try {
        onIndexChange(index)
      } catch (error) {
        console.warn('[useTTS] onIndexChange failed', error)
      }
    }

    utterance.onend = () => {
      // Guard against late callbacks after a cancel.
      if (currentUtterance !== utterance) return
      currentUtterance = null
      const list = getParagraphList()
      const next = index + 1
      if (next >= list.length) {
        playing.value = false
        paused.value = false
        finished.value = true
        if (typeof onFinish === 'function') onFinish()
        return
      }
      speakIndex(next)
    }

    utterance.onerror = () => {
      if (currentUtterance !== utterance) return
      currentUtterance = null
      playing.value = false
      paused.value = false
    }

    synth.speak(utterance)
    return true
  }

  function start(initialIndex = 0) {
    if (!synth) {
      notifyUnsupported()
      return false
    }
    refreshVoices()
    if (!supported.value || voices.value.length === 0) {
      notifyUnsupported()
      return false
    }

    const list = getParagraphList()
    if (!list.length) return false

    const index = Math.max(0, Math.min(list.length - 1, Number(initialIndex) || 0))
    return speakIndex(index)
  }

  function pause() {
    if (!synth || !playing.value) return
    try {
      synth.pause()
    } catch (_) {
      /* ignore */
    }
    paused.value = true
    playing.value = false
  }

  function resume() {
    if (!synth) return
    try {
      synth.resume()
    } catch (_) {
      /* ignore */
    }
    paused.value = false
    playing.value = true
  }

  function stopInternal({ silent = false } = {}) {
    currentUtterance = null
    if (synth) {
      try {
        synth.cancel()
      } catch (_) {
        /* ignore */
      }
    }
    playing.value = false
    paused.value = false
    if (!silent) finished.value = false
  }

  function stop() {
    stopInternal()
  }

  function next() {
    const list = getParagraphList()
    const target = Math.min(list.length - 1, currentIndex.value + 1)
    if (target === currentIndex.value && target === list.length - 1) {
      // Already on last → emulate end-of-list semantics.
      stopInternal({ silent: true })
      finished.value = true
      if (typeof onFinish === 'function') onFinish()
      return
    }
    speakIndex(target)
  }

  function prev() {
    const target = Math.max(0, currentIndex.value - 1)
    speakIndex(target)
  }

  function setRate(value) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return
    rate.value = Math.min(2, Math.max(0.5, numeric))
    // Apply on next utterance — current one keeps its rate (Requirement 8.3).
  }

  function setVoice(voiceId) {
    currentVoiceId.value = String(voiceId || '')
  }

  function handleVisibilityChange() {
    if (typeof document === 'undefined') return
    if (document.visibilityState === 'hidden') {
      if (playing.value) {
        resumeOnVisible = true
        pause()
      }
    } else if (resumeOnVisible) {
      resumeOnVisible = false
      resume()
    }
  }

  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  onBeforeUnmount(() => {
    if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    if (synth && typeof synth.removeEventListener === 'function') {
      synth.removeEventListener('voiceschanged', refreshVoices)
    }
    stopInternal({ silent: true })
  })

  // Keep utterance rate synced for the *next* utterance — current one is intentionally
  // not interrupted (Requirement 8.3 "下一段开始时生效").
  watch(rate, () => {})

  const availableVoices = computed(() => voices.value.filter(isVoiceUsable))

  return {
    supported,
    voices: availableVoices,
    currentVoiceId,
    rate,
    playing,
    paused,
    currentIndex,
    finished,
    start,
    pause,
    resume,
    stop,
    next,
    prev,
    setRate,
    setVoice,
    refreshVoices,
  }
}

export default useTTS
