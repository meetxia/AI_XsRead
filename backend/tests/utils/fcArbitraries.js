const fc = require('fast-check');

const hexChars = '0123456789abcdef'.split('');

const paragraphTextArb = fc
  .string({ minLength: 1, maxLength: 240 })
  .filter((value) => value.trim().length > 0);

const paragraphHashArb = fc
  .array(fc.constantFrom(...hexChars), { minLength: 16, maxLength: 16 })
  .map((chars) => chars.join(''));

const anchorTripleArb = fc.record({
  chapterId: fc.integer({ min: 1, max: 100000 }),
  paragraphIndex: fc.integer({ min: 0, max: 5000 }),
  paragraphHash: paragraphHashArb
});

const heartbeatTimelineArb = fc.array(
  fc.record({
    type: fc.constantFrom('visible', 'hidden', 'focus', 'blur', 'input', 'tick', 'unmount'),
    atMs: fc.integer({ min: 0, max: 60 * 60 * 1000 })
  }),
  { minLength: 1, maxLength: 80 }
).map((events) => events.sort((a, b) => a.atMs - b.atMs));

const unsafeTextArb = fc.oneof(
  fc.string({ minLength: 0, maxLength: 500 }),
  fc.constantFrom(
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<a href="javascript:alert(1)">x</a>',
    '<div onclick="alert(1)">x</div>'
  )
);

module.exports = {
  paragraphTextArb,
  paragraphHashArb,
  anchorTripleArb,
  heartbeatTimelineArb,
  unsafeTextArb
};
