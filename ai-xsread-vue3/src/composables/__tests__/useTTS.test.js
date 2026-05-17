/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 22.4 — useTTS 关键分支测试
 *
 * 覆盖 useTTS 的三个核心分支：
 *   1) getVoices() 返回空数组 → supported=false / onUnsupported 触发 / start() no-op
 *   2) 正常 start(0) → 推入 utterance / onend 推进 currentIndex 到 1
 *   3) 朗读完最后一段 → onFinish 触发
 *   4) 卸载 → speechSynthesis.cancel() 被调用
 *
 * Validates: Requirements 8.5, 8.6, 8.7
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useTTS } from '../useTTS'

class FakeUtterance {
  constructor(text) {
    this.text = text
    this.lang = ''
    this.rate = 1
    this.voice = null
    this.onend = null
    this.onerror = null
  }
}

function installSynthMock({ voices = [], speakBehavior = 'auto' } = {}) {
  const speakSpy = vi.fn()
  const cancelSpy = vi.fn()
  const synth = {
    speak: speakSpy,
    cancel: cancelSpy,
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }

  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    configurable: true,
    value: synth,
  })

  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    writable: true,
    configurable: true,
    value: FakeUtterance,
  })

  // Make the utterance global match the window one (composable uses bare `new SpeechSynthesisUtterance`).
  globalThis.SpeechSynthesisUtterance = FakeUtterance

  if (speakBehavior === 'auto') {
    // No-op: callers will manually invoke onend to simulate playback.
  }

  return { synth, speakSpy, cancelSpy }
}

function createHarness(options) {
  let api = null
  const Harness = defineComponent({
    setup() {
      api = useTTS(options)
      return () => h('div')
    },
  })
  const wrapper = mount(Harness)
  return { wrapper, api }
}

beforeEach(() => {
  // Make sure each test starts from a clean synth mock.
  delete window.speechSynthesis
})

afterEach(() => {
  delete window.speechSynthesis
  delete window.SpeechSynthesisUtterance
  delete globalThis.SpeechSynthesisUtterance
})

describe('useTTS — unsupported branch', () => {
  it('marks supported=false and invokes onUnsupported when getVoices() is empty', () => {
    const { speakSpy } = installSynthMock({ voices: [] })
    const onUnsupported = vi.fn()
    const paragraphs = ref(['第一段', '第二段'])

    const { wrapper, api } = createHarness({ paragraphs, onUnsupported })

    expect(api.supported.value).toBe(false)
    expect(api.voices.value).toEqual([])

    const ok = api.start(0)
    expect(ok).toBe(false)
    expect(onUnsupported).toHaveBeenCalledTimes(1)
    expect(speakSpy).not.toHaveBeenCalled()
    // Subsequent start() calls should not re-fire the unsupported callback.
    api.start(0)
    expect(onUnsupported).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })
})

describe('useTTS — happy path', () => {
  it('start(0) speaks paragraph 0 and onend advances currentIndex to 1', () => {
    const voices = [{ voiceURI: 'zh-cn-female', name: '小美', lang: 'zh-CN' }]
    const { synth, speakSpy } = installSynthMock({ voices })
    const onIndexChange = vi.fn()
    const onFinish = vi.fn()
    const paragraphs = ref(['第一段', '第二段', '第三段'])

    const { wrapper, api } = createHarness({ paragraphs, onIndexChange, onFinish })

    expect(api.supported.value).toBe(true)
    expect(api.voices.value).toHaveLength(1)

    api.start(0)
    expect(api.playing.value).toBe(true)
    expect(api.currentIndex.value).toBe(0)
    expect(speakSpy).toHaveBeenCalledTimes(1)
    expect(onIndexChange).toHaveBeenLastCalledWith(0)

    const utterance = speakSpy.mock.calls[0][0]
    expect(utterance).toBeInstanceOf(FakeUtterance)
    expect(utterance.text).toBe('第一段')
    expect(utterance.voice).toEqual(voices[0])
    expect(typeof utterance.onend).toBe('function')

    // Simulate end-of-utterance: should advance to paragraph 1.
    utterance.onend()
    expect(api.currentIndex.value).toBe(1)
    expect(speakSpy).toHaveBeenCalledTimes(2)
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    expect(onFinish).not.toHaveBeenCalled()

    wrapper.unmount()
    expect(synth.cancel).toHaveBeenCalled()
  })
})

describe('useTTS — finish branch', () => {
  it('fires onFinish after the last paragraph ends', () => {
    const voices = [{ voiceURI: 'zh-cn', name: 'voice', lang: 'zh-CN' }]
    const { speakSpy } = installSynthMock({ voices })
    const onFinish = vi.fn()
    const paragraphs = ref(['only paragraph'])

    const { wrapper, api } = createHarness({ paragraphs, onFinish })

    api.start(0)
    expect(speakSpy).toHaveBeenCalledTimes(1)
    const utterance = speakSpy.mock.calls[0][0]
    utterance.onend()

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(api.playing.value).toBe(false)
    expect(api.finished.value).toBe(true)

    wrapper.unmount()
  })
})

describe('useTTS — unmount cleanup', () => {
  it('calls speechSynthesis.cancel() on unmount', () => {
    const voices = [{ voiceURI: 'zh-cn', name: 'voice', lang: 'zh-CN' }]
    const { cancelSpy, speakSpy } = installSynthMock({ voices })
    const paragraphs = ref(['一段', '二段'])

    const { wrapper, api } = createHarness({ paragraphs })
    api.start(0)
    expect(speakSpy).toHaveBeenCalled()
    expect(cancelSpy).toHaveBeenCalledTimes(1) // start() pre-cancel

    wrapper.unmount()
    // Unmount should call cancel exactly one more time.
    expect(cancelSpy).toHaveBeenCalledTimes(2)
  })
})
