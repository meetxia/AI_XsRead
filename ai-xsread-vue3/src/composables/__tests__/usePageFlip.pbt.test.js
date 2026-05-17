/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 8: 翻页几何与手势映射
 *
 * decideAction({ mode, startX, endX, dy, duration, viewportWidth }) 必须满足：
 *   tap 模式：
 *     - startX < W/3 → 'prev'
 *     - startX ≥ 2W/3 → 'next'
 *     - 中间 1/3 区间 → 'toggle'
 *   swipe 模式：
 *     - 仅当 |dx| ≥ 50 ∧ duration ≤ 300 ∧ dy === 0 才触发翻页
 *     - dx < 0 → 'next', dx > 0 → 'prev'
 *   边缘 x ∈ [0, 12] ∪ [W - 12, W] → 'ignore'（iOS edge swipe 守卫）
 *
 * Validates: Requirements 3.3, 3.4, 3.5, 3.7, 36.3
 */
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { decideAction } from '../usePageFlip'

const EDGE = 12
const SWIPE_DIST = 50
const SWIPE_DUR = 300

const widthArb = fc.integer({ min: 360, max: 1440 })

const tapLeftArb = widthArb.chain((W) =>
  fc.tuple(
    fc.constant(W),
    fc.integer({ min: EDGE + 1, max: Math.max(EDGE + 2, Math.floor(W / 3) - 1) })
  )
)

const tapRightArb = widthArb.chain((W) => {
  const lo = Math.ceil((2 * W) / 3)
  const hi = Math.max(lo + 1, W - EDGE - 1)
  return fc.tuple(fc.constant(W), fc.integer({ min: lo, max: hi }))
})

const tapMiddleArb = widthArb.chain((W) => {
  const lo = Math.ceil(W / 3) + 1
  const hi = Math.max(lo + 1, Math.floor((2 * W) / 3) - 1)
  return fc.tuple(fc.constant(W), fc.integer({ min: lo, max: hi }))
})

describe('[Property 8] decideAction — tap geometry', () => {
  it('left third returns "prev" when not at the edge', () => {
    fc.assert(
      fc.property(tapLeftArb, ([W, x]) => {
        const action = decideAction({
          mode: 'tap',
          startX: x,
          endX: x,
          dy: 0,
          duration: 0,
          viewportWidth: W
        })
        expect(action).toBe('prev')
      }),
      { numRuns: 100 }
    )
  })

  it('right third returns "next" when not at the edge', () => {
    fc.assert(
      fc.property(tapRightArb, ([W, x]) => {
        const action = decideAction({
          mode: 'tap',
          startX: x,
          endX: x,
          dy: 0,
          duration: 0,
          viewportWidth: W
        })
        expect(action).toBe('next')
      }),
      { numRuns: 100 }
    )
  })

  it('middle third returns "toggle"', () => {
    fc.assert(
      fc.property(tapMiddleArb, ([W, x]) => {
        const action = decideAction({
          mode: 'tap',
          startX: x,
          endX: x,
          dy: 0,
          duration: 0,
          viewportWidth: W
        })
        expect(action).toBe('toggle')
      }),
      { numRuns: 100 }
    )
  })
})

const swipeArb = widthArb.chain((W) =>
  fc.tuple(
    fc.constant(W),
    fc.integer({ min: EDGE + 1, max: Math.max(EDGE + 2, W - EDGE - 1) }),
    fc.integer({ min: -300, max: 300 }),
    fc.integer({ min: -50, max: 50 }),
    fc.integer({ min: 0, max: 800 })
  )
)

describe('[Property 8] decideAction — swipe geometry', () => {
  it('only triggers translation when |dx| ≥ 50 ∧ duration ≤ 300 ∧ dy === 0', () => {
    fc.assert(
      fc.property(swipeArb, ([W, sx, dx, dy, dur]) => {
        const ex = Math.max(0, Math.min(W, sx + dx))
        const realDx = ex - sx
        const action = decideAction({
          mode: 'swipe',
          startX: sx,
          endX: ex,
          dy,
          duration: dur,
          viewportWidth: W
        })
        const eligible =
          Math.abs(realDx) >= SWIPE_DIST && dur <= SWIPE_DUR && dy === 0
        if (!eligible) {
          expect(action).toBe('ignore')
        } else if (realDx < 0) {
          expect(action).toBe('next')
        } else {
          expect(action).toBe('prev')
        }
      }),
      { numRuns: 200 }
    )
  })
})

const edgeStartArb = widthArb.chain((W) =>
  fc.tuple(
    fc.constant(W),
    fc.oneof(
      fc.integer({ min: 0, max: EDGE }),
      fc.integer({ min: W - EDGE, max: W })
    ),
    fc.integer({ min: -300, max: 300 })
  )
)

describe('[Property 8] decideAction — edge guard', () => {
  it('ignores any gesture starting in [0, 12] or [W - 12, W] in swipe mode', () => {
    fc.assert(
      fc.property(edgeStartArb, ([W, sx, dx]) => {
        const ex = Math.max(0, Math.min(W, sx + dx))
        const action = decideAction({
          mode: 'swipe',
          startX: sx,
          endX: ex,
          dy: 0,
          duration: 100,
          viewportWidth: W
        })
        expect(action).toBe('ignore')
      }),
      { numRuns: 100 }
    )
  })

  it('ignores swipes with non-zero vertical delta', () => {
    fc.assert(
      fc.property(
        widthArb,
        fc.integer({ min: -200, max: 200 }).filter((d) => d !== 0),
        (W, dy) => {
          const sx = Math.floor(W / 2)
          const action = decideAction({
            mode: 'swipe',
            startX: sx,
            endX: sx + 80,
            dy,
            duration: 200,
            viewportWidth: W
          })
          expect(action).toBe('ignore')
        }
      ),
      { numRuns: 80 }
    )
  })
})
