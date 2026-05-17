/**
 * 节流型进度上报器。
 * 接受一个异步上报函数 `reporter(payload)`，返回一个具有以下方法的实例：
 *   - report(payload): 接受最新 payload；若距上次成功上报已超过 minIntervalMs，
 *     立即调用 reporter；否则把 payload 缓存并安排一次延迟调用，使得在窗口
 *     [t0, t0 + minIntervalMs] 内最多发送 1 次。
 *   - flush(): 立即调用 reporter 一次（如果有未上报的 payload），常用于 onUnmount。
 *   - cancel(): 清掉挂起的 timer，不再触发延迟调用。
 *
 * 上报次数 R 的不变量：在任意时间窗 [t_min, t_max] 内的 N 次 report 调用，
 * 其触发的实际 reporter 调用数满足 R ≤ ceil((t_max - t_min) / minIntervalMs) + 1。
 *
 * 该函数是纯函数（不依赖 Vue 生命周期），便于单元 / PBT 测试。
 */
export function createThrottledProgressReporter({ minIntervalMs = 5000, reporter } = {}) {
  if (typeof reporter !== 'function') {
    throw new TypeError('createThrottledProgressReporter requires a reporter function')
  }
  if (!Number.isFinite(minIntervalMs) || minIntervalMs < 0) {
    throw new RangeError('minIntervalMs must be a non-negative finite number')
  }

  let lastSentAt = -Infinity
  let pendingPayload = null
  let pendingTimer = null

  function clearTimer() {
    if (pendingTimer != null) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }
  }

  async function fire(payload) {
    lastSentAt = Date.now()
    pendingPayload = null
    try {
      return await reporter(payload)
    } catch (err) {
      // 由调用方决定是否重试；这里吞掉异常以避免影响计时器循环。
      return undefined
    }
  }

  function schedule(delay) {
    clearTimer()
    pendingTimer = setTimeout(async () => {
      pendingTimer = null
      if (pendingPayload != null) {
        const payload = pendingPayload
        await fire(payload)
      }
    }, Math.max(0, delay))
  }

  function report(payload) {
    pendingPayload = payload
    const now = Date.now()
    const elapsed = now - lastSentAt
    if (elapsed >= minIntervalMs) {
      clearTimer()
      return fire(payload)
    }
    if (pendingTimer == null) {
      schedule(minIntervalMs - elapsed)
    }
    return undefined
  }

  async function flush() {
    clearTimer()
    if (pendingPayload != null) {
      const payload = pendingPayload
      await fire(payload)
    }
  }

  function cancel() {
    clearTimer()
    pendingPayload = null
  }

  return { report, flush, cancel }
}

export default createThrottledProgressReporter
