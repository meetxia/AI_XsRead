/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 23.2 — useHighlightToolbar composable tests
 *
 * Coverage:
 *  - Selection inside containerRef triggers state.visible = true and clamps x.
 *  - Click outside containerRef closes the toolbar (visible = false).
 *  - Empty selection closes the toolbar.
 *  - Viewport width 360 → compact = true.
 *  - Viewport width 768 → compact = false.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useHighlightToolbar } from '../useHighlightToolbar'

function setViewportWidth(width) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    get: () => width,
  })
}

function createHarness() {
  let api = null
  let containerEl = null
  const container = ref(null)

  const Harness = defineComponent({
    setup() {
      api = useHighlightToolbar({ containerRef: container })
      return () =>
        h(
          'div',
          { ref: container, 'data-test-container': 'reader' },
          [
            h(
              'p',
              { 'data-paragraph-index': 0 },
              '春秋的雨落在江南的青石板上。'
            ),
            h(
              'p',
              { 'data-paragraph-index': 1 },
              '她在窗前望着远处的山色发呆。'
            ),
          ]
        )
    },
  })

  const wrapper = mount(Harness, { attachTo: document.body })
  containerEl = wrapper.element
  return { wrapper, api, container, containerEl }
}

function fakeRange({ startContainer, startOffset, endContainer, endOffset, text, rect }) {
  return {
    startContainer,
    startOffset,
    endContainer,
    endOffset,
    commonAncestorContainer: startContainer.parentNode || startContainer,
    getBoundingClientRect: () => rect,
    toString: () => text,
  }
}

function installSelection(range, text) {
  const sel = {
    rangeCount: range ? 1 : 0,
    getRangeAt: () => range,
    toString: () => text,
    removeAllRanges: vi.fn(),
  }
  vi.spyOn(window, 'getSelection').mockReturnValue(sel)
  return sel
}

beforeEach(() => {
  setViewportWidth(1024)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('useHighlightToolbar', () => {
  it('shows toolbar when selection is non-empty inside containerRef', async () => {
    const { wrapper, api, containerEl } = createHarness()

    const para = containerEl.querySelector('[data-paragraph-index="0"]')
    const textNode = para.firstChild
    const text = '江南的青石板'

    const range = fakeRange({
      startContainer: textNode,
      startOffset: 3,
      endContainer: textNode,
      endOffset: 3 + text.length,
      text,
      rect: { left: 100, top: 200, right: 200, bottom: 220, width: 100, height: 20 },
    })
    installSelection(range, text)

    document.dispatchEvent(new Event('selectionchange'))
    await nextTick()

    expect(api.state.visible).toBe(true)
    expect(api.state.text).toBe(text)
    expect(api.state.paragraphIndex).toBe(0)
    expect(api.state.startOffset).toBe(3)
    expect(api.state.endOffset).toBe(3 + text.length)

    wrapper.unmount()
  })

  it('clamps x into [8, viewportWidth - 8]', async () => {
    setViewportWidth(360)
    const { wrapper, api, containerEl } = createHarness()
    const para = containerEl.querySelector('[data-paragraph-index="1"]')
    const textNode = para.firstChild

    // Selection rect is way past the right edge → should clamp to 360 - 8 = 352.
    const text = '远处的山色'
    const range = fakeRange({
      startContainer: textNode,
      startOffset: 1,
      endContainer: textNode,
      endOffset: 1 + text.length,
      text,
      rect: { left: 1000, top: 50, right: 1100, bottom: 70, width: 100, height: 20 },
    })
    installSelection(range, text)

    document.dispatchEvent(new Event('selectionchange'))
    await nextTick()

    expect(api.state.visible).toBe(true)
    expect(api.state.x).toBeGreaterThanOrEqual(8)
    expect(api.state.x).toBeLessThanOrEqual(360 - 8)

    // Now: rect off the left edge → clamp to 8.
    const range2 = fakeRange({
      startContainer: textNode,
      startOffset: 1,
      endContainer: textNode,
      endOffset: 1 + text.length,
      text,
      rect: { left: -200, top: 50, right: -150, bottom: 70, width: 50, height: 20 },
    })
    installSelection(range2, text)
    document.dispatchEvent(new Event('selectionchange'))
    await nextTick()
    expect(api.state.x).toBe(8)

    wrapper.unmount()
  })

  it('closes when clicking outside containerRef', async () => {
    const { wrapper, api, containerEl } = createHarness()
    const para = containerEl.querySelector('[data-paragraph-index="0"]')
    const textNode = para.firstChild
    const text = '江南'

    const range = fakeRange({
      startContainer: textNode,
      startOffset: 3,
      endContainer: textNode,
      endOffset: 3 + text.length,
      text,
      rect: { left: 100, top: 200, right: 140, bottom: 220, width: 40, height: 20 },
    })
    installSelection(range, text)
    document.dispatchEvent(new Event('selectionchange'))
    await nextTick()
    expect(api.state.visible).toBe(true)

    // Now click on a node that lives outside the container.
    const outside = document.createElement('button')
    outside.textContent = 'outside'
    document.body.appendChild(outside)

    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    outside.dispatchEvent(event)
    await nextTick()

    expect(api.state.visible).toBe(false)
    wrapper.unmount()
  })

  it('closes when selection becomes empty', async () => {
    const { wrapper, api, containerEl } = createHarness()
    const para = containerEl.querySelector('[data-paragraph-index="0"]')
    const textNode = para.firstChild
    const text = '青石板'

    const range = fakeRange({
      startContainer: textNode,
      startOffset: 7,
      endContainer: textNode,
      endOffset: 7 + text.length,
      text,
      rect: { left: 100, top: 200, right: 160, bottom: 220, width: 60, height: 20 },
    })
    installSelection(range, text)
    document.dispatchEvent(new Event('selectionchange'))
    await nextTick()
    expect(api.state.visible).toBe(true)

    // Replace selection with empty.
    installSelection(null, '')
    document.dispatchEvent(new Event('selectionchange'))
    await nextTick()
    expect(api.state.visible).toBe(false)

    wrapper.unmount()
  })

  it('compact = true at 360px viewport', async () => {
    setViewportWidth(360)
    const { wrapper, api } = createHarness()
    // attach() runs onMounted which captures viewport width.
    await nextTick()
    expect(api.compact.value).toBe(true)
    wrapper.unmount()
  })

  it('compact = false at 768px viewport', async () => {
    setViewportWidth(768)
    const { wrapper, api } = createHarness()
    await nextTick()
    expect(api.compact.value).toBe(false)
    wrapper.unmount()
  })
})
