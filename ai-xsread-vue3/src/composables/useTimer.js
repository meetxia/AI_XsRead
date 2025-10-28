/**
 * 定时器管理 Composable
 * 自动清理定时器，防止内存泄漏
 */
import { onBeforeUnmount, ref } from 'vue'

/**
 * 使用 setTimeout（自动清理）
 * @param {Function} callback 回调函数
 * @param {number} delay 延迟时间（毫秒）
 * @returns {Object} 包含清理函数的对象
 */
export function useTimeout(callback, delay) {
  const timerId = ref(null)
  
  const start = () => {
    if (timerId.value !== null) {
      clearTimeout(timerId.value)
    }
    timerId.value = setTimeout(() => {
      callback()
      timerId.value = null
    }, delay)
  }
  
  const clear = () => {
    if (timerId.value !== null) {
      clearTimeout(timerId.value)
      timerId.value = null
    }
  }
  
  // 组件卸载时自动清理
  onBeforeUnmount(clear)
  
  return {
    start,
    clear,
    timerId
  }
}

/**
 * 使用 setInterval（自动清理）
 * @param {Function} callback 回调函数
 * @param {number} interval 间隔时间（毫秒）
 * @returns {Object} 包含启动、停止函数的对象
 */
export function useInterval(callback, interval) {
  const timerId = ref(null)
  const isActive = ref(false)
  
  const start = () => {
    if (timerId.value !== null) {
      return
    }
    isActive.value = true
    timerId.value = setInterval(callback, interval)
  }
  
  const stop = () => {
    if (timerId.value !== null) {
      clearInterval(timerId.value)
      timerId.value = null
      isActive.value = false
    }
  }
  
  const restart = () => {
    stop()
    start()
  }
  
  // 组件卸载时自动清理
  onBeforeUnmount(stop)
  
  return {
    start,
    stop,
    restart,
    isActive,
    timerId
  }
}

/**
 * 使用 requestAnimationFrame（自动清理）
 * @param {Function} callback 回调函数
 * @returns {Object} 包含启动、停止函数的对象
 */
export function useAnimationFrame(callback) {
  const rafId = ref(null)
  const isActive = ref(false)
  
  const loop = () => {
    callback()
    if (isActive.value) {
      rafId.value = requestAnimationFrame(loop)
    }
  }
  
  const start = () => {
    if (isActive.value) {
      return
    }
    isActive.value = true
    rafId.value = requestAnimationFrame(loop)
  }
  
  const stop = () => {
    if (rafId.value !== null) {
      cancelAnimationFrame(rafId.value)
      rafId.value = null
      isActive.value = false
    }
  }
  
  // 组件卸载时自动清理
  onBeforeUnmount(stop)
  
  return {
    start,
    stop,
    isActive,
    rafId
  }
}

