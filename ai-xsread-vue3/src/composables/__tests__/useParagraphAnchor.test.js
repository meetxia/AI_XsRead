/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 19.1 — useParagraphAnchor unit tests
 *
 * Validates:
 *  - computeParagraphHash 与后端 `crypto.createHash('sha1').update(text.slice(0,50)).digest('hex').slice(0,16)`
 *    位逐位一致（Requirements 4.1, 29.1, 29.7）。
 *  - useParagraphAnchor 暴露 currentAnchor / activeIndex / observe / restore；
 *    段落停留 ≥ 1s 才会更新为当前锚点（Requirement 4.1）。
 */
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  computeParagraphHash,
  normalizeParagraphs,
  useParagraphAnchor
} from '../useParagraphAnchor'

// ---- Known test vectors（与 backend/src/utils/paragraphAnchor.js 同源算法） ----
// node -e "console.log(require('crypto').createHash('sha1').update('hello world').digest('hex').slice(0,16))"
const HELLO_WORLD_HASH = '2aae6c35c94fcfb4'
// node -e "console.log(require('crypto').createHash('sha1').update('').digest('hex').slice(0,16))"
const EMPTY_HASH = 'da39a3ee5e6b4b0d'

describe('computeParagraphHash', () => {
  it('returns the SHA-1 hex prefix matching the backend reference vector for "hello world"', async () => {
    const hex = await computeParagraphHash('hello world')
    expect(hex).toBe(HELLO_WORLD_HASH)
  })

  it('matches the backend reference vector for an empty string', async () => {
    const hex = await computeParagraphHash('')
    expect(hex).toBe(EMPTY_HASH)
  })

  it('only hashes the first 50 characters (slice semantics from backend)', async () => {
    const prefix = 'hello world'
    const padded = prefix + 'x'.repeat(200) // > 50 chars
    // Both should still hash on the first 50 chars
    const a = await computeParagraphHash(prefix.padEnd(50, 'y'))
    const b = await computeParagraphHash(prefix.padEnd(50, 'y') + 'extra-tail')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{16}$/)
    // padded ≠ prefix because they share fewer than 50 leading chars
    const padHex = await computeParagraphHash(padded)
    expect(padHex).toMatch(/^[0-9a-f]{16}$/)
  })

  it('is stable across repeated invocations on the same input', async () => {
    const a = await computeParagraphHash('MOMO小说 / AI-XsRead 段落锚点')
    const b = await computeParagraphHash('MOMO小说 / AI-XsRead 段落锚点')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{16}$/)
  })
})

describe('normalizeParagraphs', () => {
  it('normalizes arrays and newline-delimited strings to trimmed non-empty paragraphs', () => {
    expect(normalizeParagraphs(['  a  ', '', ' b'])).toEqual(['a', 'b'])
    expect(normalizeParagraphs('line1\n\nline2\n   \nline3')).toEqual(['line1', 'line2', 'line3'])
    expect(normalizeParagraphs(null)).toEqual([])
  })
})

// -------------------------------------------------------------------------
// Helper component to host the composable so onBeforeUnmount works as expected.
// -------------------------------------------------------------------------
function createHost(paragraphs, chapterId = 1) {
  const containerRef = ref(null)
  const Comp = defineComponent({
    setup(_, { expose }) {
      const api = useParagraphAnchor({
        containerRef,
        paragraphs: ref(paragraphs),
        chapterId: ref(chapterId)
      })
      expose({ api, containerRef })
      return () =>
        h(
          'div',
          { ref: containerRef },
          paragraphs.map((text, i) =>
            h('p', { 'data-paragraph-index': String(i), key: i }, text)
          )
        )
    }
  })
  return mount(Comp)
}

describe('useParagraphAnchor settle timing', () => {
  let observers = []
  let originalIO

  beforeEach(() => {
    observers = []
    originalIO = window.IntersectionObserver
    // Replace the jsdom mock with one that exposes a `trigger()` we can call.
    class TestIO {
      constructor(callback) {
        this.callback = callback
        this.observed = new Set()
        observers.push(this)
      }
      observe(el) {
        this.observed.add(el)
      }
      unobserve(el) {
        this.observed.delete(el)
      }
      disconnect() {
        this.observed.clear()
      }
      trigger(entries) {
        this.callback(entries, this)
      }
    }
    window.IntersectionObserver = TestIO
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.IntersectionObserver = originalIO
  })

  it('only promotes a paragraph to current anchor after a ≥1s settle delay', async () => {
    const wrapper = createHost(['p0 alpha beta', 'p1 gamma delta', 'p2 epsilon zeta'], 42)
    // Mount + render the host so query selectors see <p data-paragraph-index>.
    await nextTick()
    // ReadingPage calls observe() explicitly after content renders; mirror that.
    await wrapper.vm.api.observe()
    // observe() awaits nextTick + rebuildHashes (crypto.subtle digest microtasks).
    // Flush microtasks so the observer is ready and hashes are populated.
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()

    expect(observers.length).toBeGreaterThan(0)
    const io = observers[observers.length - 1]
    const targets = wrapper.element.querySelectorAll('[data-paragraph-index]')
    expect(targets.length).toBe(3)

    // Simulate paragraph index 1 entering screen-center.
    io.trigger([
      {
        isIntersecting: true,
        target: targets[1]
      }
    ])

    // Before 1s, the active index must NOT advance.
    await vi.advanceTimersByTimeAsync(800)
    expect(wrapper.vm.api.activeIndex.value).toBe(0)

    // After ≥1s the anchor settles to index 1.
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.vm.api.activeIndex.value).toBe(1)
    expect(wrapper.vm.api.currentAnchor.value).toMatchObject({
      chapterId: 42,
      paragraphIndex: 1
    })
    // paragraphHash is the 16-hex prefix of SHA-1
    expect(wrapper.vm.api.currentAnchor.value.paragraphHash).toMatch(/^[0-9a-f]{16}$/)
    wrapper.unmount()
  })
})
