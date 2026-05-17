/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 14: write guard sanitizer and rate limiter contract.
 */
const fc = require('fast-check');
const { unsafeTextArb } = require('../utils/fcArbitraries');
const { sanitizeComment } = require('../../src/utils/sanitizer');
const { createWriteRateLimiter } = require('../../src/middlewares/writeRateLimiter');

describe('[Property 14] sanitizeComment current guard', () => {
  test('removes executable script tags and event-handler attributes from arbitrary text', () => {
    fc.assert(
      fc.property(unsafeTextArb, (input) => {
        const output = sanitizeComment(input);

        expect(output).not.toMatch(/<script\b/i);
        expect(output).not.toMatch(/\son[a-z]+\s*=/i);
        expect(output).not.toMatch(/javascript\s*:/i);
      }),
      { numRuns: 100 }
    );
  });
});

describe('[Property 14] writeRateLimiter contract', () => {
  test('limits duplicate content to three writes per minute for one user and route', async () => {
    const limiter = createWriteRateLimiter({
      now: () => 1_000,
      store: new Map()
    });
    const req = {
      user: { id: 7 },
      baseUrl: '/api/highlights',
      route: { path: '/' },
      originalUrl: '/api/highlights',
      body: { content: '同一段想法' }
    };
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    const next = jest.fn();

    await limiter(req, res, next);
    await limiter(req, res, next);
    await limiter(req, res, next);
    await limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(3);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
