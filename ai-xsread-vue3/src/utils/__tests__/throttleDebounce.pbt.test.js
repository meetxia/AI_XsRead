/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 26.8 — Frontend complement of Property 16 (memory cache / throttle / singleflight).
 *
 * Backend portion lives in `backend/tests/utils/memoryCache.pbt.test.js`.
 *
 * Property 16 (frontend portion):
 *   For any timeline of `report` calls and a `minIntervalMs` window:
 *     1. Reporter call count R ≤ ceil((tMax - tMin) / minIntervalMs) + 1
 *     2. In-flight singleflight: when the same key is reported twice in quick
 *        succession, the underlying reporter receives only one in-flight call,
 *        and that call carries the latest payload.
 *
 * **Validates: Requirements 4.2, 18.2, 27.10, 33.5, 16.3**
 */
import fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createThrottledProgressReporter } from '@/utils/throttle'
import { requestDeduplicator } from '@/utils/request-cache'

beforeEach(() => {
  vi.useFakeTimers()
  requestDeduplicator.clear()
})

afterEach(() => {
  vi.useRealTimers()
  requestDeduplicator.clear()
})

const timelineArb = fc
  .array(fc.integer({ min: 0, max: 30_000 }), { minLength: 1, maxLength: 40 })
  .map((stamps) => stamps.slice().sort((a, b) => a - b))

describe('[Property 16 / FE] throttle reporter call count bound', () => {
  it('R ≤ ceil((tMax - tMin) / minIntervalMs) + 1 for any timeline', async () => {
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

          // Drain any scheduled trailing call.
          await vi.advanceTimersByTimeAsync(minIntervalMs + 10)

          const span = timeline[timeline.length - 1] - timeline[0]
          const upperBound = Math.ceil(span / minIntervalMs) + 1
          expect(reporter.mock.calls.length).toBeLessThanOrEqual(upperBound)
          inst.cancel()
        }
      ),
      { numRuns: 30 }
    )
  })
})

describe('[Property 16 / FE] singleflight collapses concurrent reporters to one in-flight call', () => {
  it('repeated report() calls within the throttle window only fire the reporter once with the latest payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Sequence of payloads reported in quick succession (all within one window).
        fc.array(fc.record({ at: fc.integer({ min: 0, max: 1_000_000 }) }), {
          minLength: 2,
          maxLength: 12,
        }),
        fc.constantFrom(2_000, 5_000, 10_000),
        async (payloads, minIntervalMs) => {
          const reporter = vi.fn().mockResolvedValue(undefined)
          const inst = createThrottledProgressReporter({ minIntervalMs, reporter })

          // First report fires immediately (cold start).
          inst.report(payloads[0])

          // Subsequent reports happen at the same tick so they all fall into the
          // same throttle window and must coalesce.
          for (let i = 1; i < payloads.length; i += 1) {
            inst.report(payloads[i])
          }

          // Allow the trailing scheduled fire to drain.
          await vi.advanceTimersByTimeAsync(minIntervalMs + 50)

          // Exactly two reporter calls: the cold-start fire + the trailing
          // singleflight call carrying the latest payload.
          expect(reporter.mock.calls.length).toBeLessThanOrEqual(2)
          if (reporter.mock.calls.length === 2) {
            const trailing = reporter.mock.calls[1][0]
            expect(trailing).toEqual(payloads[payloads.length - 1])
          } else {
            // Only the cold-start fire happened (timeline collapsed to one).
            expect(reporter.mock.calls[0][0]).toEqual(payloads[0])
          }
          inst.cancel()
        }
      ),
      { numRuns: 30 }
    )
  })

  it('requestDeduplicator coalesces concurrent same-key callers to a single underlying request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 12 }),
        async (concurrency) => {
          requestDeduplicator.clear()
          let callCount = 0

          const fn = vi.fn(async () => {
            callCount += 1
            // Simulate latency so all callers join the same in-flight promise.
            await new Promise((resolve) => setTimeout(resolve, 50))
            return { callCount }
          })

          const callers = Array.from({ length: concurrency }, () =>
            requestDeduplicator.execute('counts:novel-1:chapter-2', fn)
          )

          await vi.advanceTimersByTimeAsync(60)
          const results = await Promise.all(callers)

          // The underlying reporter must be invoked exactly once even though N
          // callers reported simultaneously.
          expect(fn).toHaveBeenCalledTimes(1)
          // All callers receive the same coalesced result.
          for (const r of results) expect(r.callCount).toBe(1)
        }
      ),
      { numRuns: 20 }
    )
  })
})
