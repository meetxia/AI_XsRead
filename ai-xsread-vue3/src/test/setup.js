import { vi } from 'vitest'

class MockIntersectionObserver {
  constructor(callback = vi.fn()) {
    this.callback = callback
    this.elements = new Set()
  }

  observe(element) {
    this.elements.add(element)
  }

  unobserve(element) {
    this.elements.delete(element)
  }

  disconnect() {
    this.elements.clear()
  }

  trigger(entries) {
    this.callback(entries, this)
  }
}

class MockResizeObserver {
  constructor(callback = vi.fn()) {
    this.callback = callback
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver
})

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

Object.defineProperty(navigator, 'wakeLock', {
  writable: true,
  configurable: true,
  value: {
    request: vi.fn().mockResolvedValue({
      released: false,
      release: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })
  }
})

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  configurable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => [])
  }
})

Element.prototype.scrollIntoView = vi.fn()

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
})
