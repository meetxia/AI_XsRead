/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 21.3 — useWakeLock 状态机 + 不支持降级
 *
 * 单元测试覆盖：
 *   - 浏览器不支持时 supported.value = false 且不调用 navigator.wakeLock.request
 *   - 浏览器支持时 request() 调用 navigator.wakeLock.request('screen') 一次
 *   - visibilitychange → visible 时自动重新申请（auto-renew）
 *   - 关闭开关时调用 release()
 *
 * Validates: Requirements 6.2, 6.3, 6.4, 6.5
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import { useWakeLock } from '../useWakeLock'

function createHarness(enabled) {
  let api = null
  const Harness = defineComponent({
    setup() {
      api = useWakeLock(enabled)
      return () => h('div')
    }
  })
  const wrapper = mount(Harness)
  return { wrapper, get api() { return api } }
}

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

let originalWakeLock = null

beforeEach(() => {
  originalWakeLock = Object.getOwnPropertyDescriptor(navigator, 'wakeLock')
  setVisibility('visible')
})

afterEach(() => {
  if (originalWakeLock) {
    Object.defineProperty(navigator, 'wakeLock', originalWakeLock)
  }
})

describe('useWakeLock — unsupported browser fallback', () => {
  it('supported.value is false and request() is never called when navigator.wakeLock is missing', async () => {
    // Simulate an unsupported browser by removing wakeLock entirely.
    delete navigator.wakeLock

    const enabled = ref(true)
    const { wrapper, api } = createHarness(enabled)
    await flushPromises()

    expect(api.supported.value).toBe(false)
    expect(api.active.value).toBe(false)

    // Manual request also no-ops without throwing.
    await api.request()
    expect(api.active.value).toBe(false)

    wrapper.unmount()
  })
})

describe('useWakeLock — supported browser request lifecycle', () => {
  it('calls navigator.wakeLock.request("screen") exactly once when enabled becomes true', async () => {
    const sentinel = {
      released: false,
      release: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
    const requestSpy = vi.fn().mockResolvedValue(sentinel)
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      writable: true,
      value: { request: requestSpy }
    })

    const enabled = ref(true)
    const { wrapper, api } = createHarness(enabled)
    await flushPromises()

    expect(api.supported.value).toBe(true)
    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenCalledWith('screen')
    expect(api.active.value).toBe(true)

    wrapper.unmount()
  })

  it('release() is called when the toggle goes from true → false', async () => {
    const sentinel = {
      released: false,
      release: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
    const requestSpy = vi.fn().mockResolvedValue(sentinel)
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      writable: true,
      value: { request: requestSpy }
    })

    const enabled = ref(true)
    const { wrapper, api } = createHarness(enabled)
    await flushPromises()
    expect(api.active.value).toBe(true)

    enabled.value = false
    await flushPromises()
    expect(sentinel.release).toHaveBeenCalled()
    expect(api.active.value).toBe(false)

    wrapper.unmount()
  })

  it('auto-renews on visibilitychange visible after a hidden phase', async () => {
    const releaseFn = vi.fn().mockResolvedValue(undefined)
    const requestSpy = vi.fn().mockImplementation(async () => ({
      released: false,
      release: releaseFn,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      writable: true,
      value: { request: requestSpy }
    })

    const enabled = ref(true)
    const { wrapper } = createHarness(enabled)
    await flushPromises()
    expect(requestSpy).toHaveBeenCalledTimes(1)

    // Hidden → release.
    setVisibility('hidden')
    await flushPromises()
    expect(releaseFn).toHaveBeenCalled()

    // Visible → request again.
    setVisibility('visible')
    await flushPromises()
    expect(requestSpy).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })
})
