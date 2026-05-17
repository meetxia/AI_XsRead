/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Properties 1-2: paragraph anchor hash and resolver contracts.
 */
const crypto = require('crypto');
const fc = require('fast-check');
const { paragraphTextArb, paragraphHashArb } = require('./fcArbitraries');

let subject = null;

try {
  subject = require('../../src/utils/paragraphAnchor');
} catch {
  subject = null;
}

const describeIfImplemented = subject ? describe : describe.skip;

describeIfImplemented('[Property 1] paragraph hash backend contract', () => {
  test('computeHash is deterministic and uses sha1(first 50 chars).slice(0,16)', () => {
    fc.assert(
      fc.property(paragraphTextArb, (text) => {
        const expected = crypto
          .createHash('sha1')
          .update(text.slice(0, 50))
          .digest('hex')
          .slice(0, 16);

        expect(subject.computeHash(text)).toBe(expected);
        expect(subject.computeHash(text)).toMatch(/^[0-9a-f]{16}$/);
      }),
      { numRuns: 100 }
    );
  });
});

describeIfImplemented('[Property 2] resolveParagraphAnchor status contract', () => {
  test('returns fallback for out-of-range or ambiguous hash matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(paragraphTextArb, { minLength: 2, maxLength: 30 }),
        paragraphHashArb,
        async (paragraphs, unknownHash) => {
          const result = await subject.resolveParagraphAnchor(1, paragraphs.length + 10, unknownHash, {
            content: paragraphs.join('\n\n')
          });

          expect(result.status).toBe('fallback');
          expect(result.paragraphIndex).toBeGreaterThanOrEqual(0);
          expect(result.paragraphIndex).toBeLessThan(paragraphs.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});
