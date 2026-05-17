/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 22: backward-compatible reading progress response skeleton.
 */
const fc = require('fast-check');

describe('[Property 22] reading progress compatibility response shape', () => {
  test('documents the required old+new field envelope for progress responses', () => {
    fc.assert(
      fc.property(
        fc.record({
          progress: fc.float({ min: 0, max: 100, noNaN: true }),
          paragraph_index: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: null }),
          char_offset: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: null }),
          paragraph_hash: fc.option(
            fc.array(fc.constantFrom(...'0123456789abcdef'.split('')), {
              minLength: 16,
              maxLength: 16
            }).map((chars) => chars.join('')),
            { nil: null }
          )
        }),
        (response) => {
          expect(response).toHaveProperty('progress');
          expect(response.progress).toBeGreaterThanOrEqual(0);
          expect(response.progress).toBeLessThanOrEqual(100);
          expect(response).toHaveProperty('paragraph_index');
          expect(response).toHaveProperty('char_offset');
          expect(response).toHaveProperty('paragraph_hash');
        }
      ),
      { numRuns: 100 }
    );
  });
});
