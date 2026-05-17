const { createWriteRateLimiter } = require('../../src/middlewares/writeRateLimiter');

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe('writeRateLimiter middleware', () => {
  test('limits same normalized content after the configured duplicate threshold', async () => {
    const limiter = createWriteRateLimiter({
      windowMs: 60_000,
      maxWrites: 30,
      maxDuplicateWrites: 3,
      now: () => 1_000
    });

    for (let i = 0; i < 3; i += 1) {
      const req = { user: { id: 1 }, route: { path: '/comments' }, body: { content: '  同一句话  ' } };
      const res = createRes();
      const next = jest.fn();
      await limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    }

    const blockedReq = { user: { id: 1 }, route: { path: '/comments' }, body: { content: '同一句话' } };
    const blockedRes = createRes();
    await limiter(blockedReq, blockedRes, jest.fn());

    expect(blockedRes.statusCode).toBe(429);
    expect(blockedRes.body).toMatchObject({ code: 'RATE_LIMITED' });
  });
});
