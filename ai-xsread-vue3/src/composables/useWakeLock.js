import { computed, onBeforeUnmount, ref, watch } from 'vue'

export function useWakeLock(enabledRef) {
  const supported = computed(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator)
  const active = ref(false)
  const error = ref('')
  let sentinel = null

  async function request() {
    if (!supported.value || !enabledRef.value || document.visibilityState !== 'visible') return
    try {
      sentinel = await navigator.wakeLock.request('screen')
      active.value = true
      sentinel.addEventListener('release', () => {
        active.value = false
        sentinel = null
      })
      error.value = ''
    } catch (err) {
      error.value = err?.message || '无法保持屏幕常亮'
      active.value = false
    }
  }

  async function release() {
    if (!sentinel) return
    await sentinel.release().catch(() => {})
    sentinel = null
    active.value = false
  }

  function handleVisibility() {
    if (document.visibilityState === 'visible') request()
    else release()
  }

  document.addEventListener('visibilitychange', handleVisibility)

  watch(enabledRef, (enabled) => {
    if (enabled) request()
    else release()
  }, { immediate: true })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibility)
    release()
  })

  return { supported, active, error, request, release }
}

export default useWakeLock
