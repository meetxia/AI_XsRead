import fc from 'fast-check'

const hexChars = '0123456789abcdef'.split('')

export const paragraphTextArb = fc
  .string({ minLength: 1, maxLength: 240 })
  .filter((value) => value.trim().length > 0)

export const paragraphHashArb = fc
  .array(fc.constantFrom(...hexChars), { minLength: 16, maxLength: 16 })
  .map((chars) => chars.join(''))

export const anchorTripleArb = fc.record({
  chapterId: fc.integer({ min: 1, max: 100000 }),
  paragraphIndex: fc.integer({ min: 0, max: 5000 }),
  paragraphHash: paragraphHashArb
})

export const gestureArb = fc.record({
  startX: fc.integer({ min: 0, max: 430 }),
  startY: fc.integer({ min: 0, max: 932 }),
  deltaX: fc.integer({ min: -220, max: 220 }),
  deltaY: fc.integer({ min: -220, max: 220 }),
  durationMs: fc.integer({ min: 0, max: 800 })
})

export const currentReadingSettingsArb = fc.record({
  fontSize: fc.integer({ min: 12, max: 28 }),
  lineHeight: fc.constantFrom(1.4, 1.6, 1.8, 2.0, 2.2),
  fontFamily: fc.constantFrom('default', 'songti', 'heiti', 'kaiti', 'yahei'),
  background: fc.constantFrom('white', 'sepia', 'green', 'dark'),
  paragraphSpacing: fc.constantFrom('compact', 'normal', 'relaxed'),
  pageMargin: fc.constantFrom('narrow', 'normal', 'wide'),
  pageFlipMode: fc.constantFrom('scroll', 'tap', 'swipe'),
  brightness: fc.integer({ min: 50, max: 100 }),
  ttsRate: fc.constantFrom(0.5, 0.75, 1, 1.25, 1.5, 1.75, 2),
  keepAwake: fc.boolean()
})

export const specReadingSettingsArb = fc.record({
  fontSize: fc.integer({ min: 12, max: 28 }),
  lineHeight: fc.constantFrom(1.4, 1.6, 1.8, 2.0, 2.2),
  paragraphSpacing: fc.constantFrom('compact', 'normal', 'relaxed'),
  pageMargin: fc.constantFrom('narrow', 'normal', 'wide'),
  fontFamily: fc.constantFrom('default', 'songti', 'heiti', 'kaiti', 'yahei'),
  pageFlipMode: fc.constantFrom('scroll', 'tap', 'swipe'),
  brightness: fc.integer({ min: 50, max: 100 })
})

export const returnUrlArb = fc.oneof(
  fc.webPath(),
  fc.webUrl(),
  fc.string({ minLength: 0, maxLength: 120 })
)
