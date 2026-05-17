import { onBeforeUnmount, ref } from 'vue'

export function useReadingHeartbeat({ onBeat, interval = 60000, idleAfter = 60000 } = {}) {
  const active = ref(false)
  let beatTimer = null
  let idleTimer = null
  let startedAt = 0
  let pendingSeconds = 0
  let focused = true

  function canRun() {
    return document.visibilityState === 'visible' && focused
  }

  async function flush() {
    const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
    const duration = Math.max(0, pendingSeconds + elapsed)
    pendingSeconds = 0
    startedAt = Date.now()
    if (duration > 0) await onBeat?.(duration)
  }

  async function tick() {
    if (!canRun()) return stop()
    startedAt = Date.now()
    await onBeat?.(60)
  }

  function start() {
    if (!canRun() || active.value) return
    active.value = true
    startedAt = Date.now()
    beatTimer = window.setInterval(tick, interval)
  }

  function stop() {
    if (!active.value) return
    active.value = false
    if (startedAt) pendingSeconds += Math.floor((Date.now() - startedAt) / 1000)
    startedAt = 0
    clearInterval(beatTimer)
    beatTimer = null
  }

  function markActivity() {
    clearTimeout(idleTimer)
    if (canRun()) start()
    idleTimer = window.setTimeout(stop, idleAfter)
  }

  function handleVisibility() {
    if (canRun()) markActivity()
    else stop()
  }

  function handleFocus() {
    focused = true
    markActivity()
  }

  function handleBlur() {
    focused = false
    stop()
  }

  function mount() {
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('scroll', markActivity, { passive: true })
    window.addEventListener('touchstart', markActivity, { passive: true })
    window.addEventListener('click', markActivity, { passive: true })
    markActivity()
  }

  function cleanup() {
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('focus', handleFocus)
    window.removeEventListener('blur', handleBlur)
    window.removeEventListener('scroll', markActivity)
    window.removeEventListener('touchstart', markActivity)
    window.removeEventListener('click', markActivity)
    clearTimeout(idleTimer)
    stop()
  }

  onBeforeUnmount(cleanup)

  return {
    active,
    start,
    stop,
    flush,
    markActivity,
    mount,
    cleanup,
  }
}

export default useReadingHeartbeat
