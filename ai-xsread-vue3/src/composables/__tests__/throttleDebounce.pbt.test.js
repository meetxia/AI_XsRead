/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 6: 进度同步节流（≤ 1 次 / minIntervalMs + onUnmount flush）
 *
 * createThrottledProgressReporter({ minIntervalMs }) 包装一个异步上报函数。
 * 性质：
 *   - 对任意时间线 [t1, t2, …, tn]（在 T_total 毫秒内触发），触发期间实际
 *     reporter 调用数 R_active ≤ ceil((max(t) - min(t)) / minIntervalMs) + 1
 *   - Drain trailing timer 后最多额外补发 1 次 latest payload
 *   - flush() 始终至少触发 1 次（如果存在挂起的 payload）
 *
 * Validates: Requirements 4.2, 4.7
 */
import fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createThrottledProgressReporter } from '../../utils/throttle'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const timelineArb = fc
  .array(fc.integer({ min: 0, max: 30_000 }), { minLength: 1, maxLength: 50 })
  .map((stamps) => stamps.slice().sort((a, b) => a - b))

describe('[Property 6] createThrottledProgressReporter', () => {
  it('emits at most ceil((tMax - tMin) / minIntervalMs) + 1 reporter calls for any timeline', async () => {
    await fc.assert(
      fc.asyncProperty(
        timelineArb,
        fc.constantFrom(1000, 2000, 5000, 10_000),
        async (timeline, minIntervalMs) => {
          const reporter = vi.fn().mockResolvedValue(undefined)
          const inst = createThrottledProgressReporter({ minIntervalMs, reporter })

          const start = Date.now()
          for (const t of timeline) {
            const target = start + t
            const now = Date.now()
            if (target > now) {
              await vi.advanceTimersByTimeAsync(target - now)
            }
            inst.report({ at: t })
          }

          const span = timeline[timeline.length - 1] - timeline[0]
          const upperBound = Math.ceil(span / minIntervalMs) + 1
          const activeCallCount = reporter.mock.calls.length
          expect(activeCallCount).toBeLessThanOrEqual(upperBound)

          // Drain any scheduled trailing call. With leading + trailing throttle
          // semantics, a burst may legitimately produce one final latest-payload
          // sync after the triggering timeline has ended.
          await vi.advanceTimersByTimeAsync(minIntervalMs + 10)
          expect(reporter.mock.calls.length).toBeLessThanOrEqual(upperBound + 1)
          inst.cancel()
        }
      ),
      { numRuns: 30 }
    )
  })

  it('reports at least once when at least one event was queued', async () => {
    const reporter = vi.fn().mockResolvedValue(undefined)
    const inst = createThrottledProgressReporter({ minIntervalMs: 5000, reporter })

    inst.report({ at: 0 })
    expect(reporter).toHaveBeenCalledTimes(1) // First call fires immediately.

    await vi.advanceTimersByTimeAsync(10_000)
    inst.cancel()
  })

  it('flush() always invokes the reporter once at the end if there is pending data', async () => {
    const reporter = vi.fn().mockResolvedValue(undefined)
    const inst = createThrottledProgressReporter({ minIntervalMs: 5000, reporter })

    inst.report({ at: 0 }) // Immediate fire.
    inst.report({ at: 1 }) // Queued (within window).

    expect(reporter).toHaveBeenCalledTimes(1)

    await inst.flush()
    expect(reporter).toHaveBeenCalledTimes(2)
    expect(reporter.mock.calls[1][0]).toEqual({ at: 1 })
  })

  it('flush() is a no-op when no payload was reported', async () => {
    const reporter = vi.fn().mockResolvedValue(undefined)
    const inst = createThrottledProgressReporter({ minIntervalMs: 5000, reporter })
    await inst.flush()
    expect(reporter).not.toHaveBeenCalled()
  })
})
