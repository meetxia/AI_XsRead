/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 16: 时间窗内单飞 / 节流 / 缓存
 * Validates: Requirements 4.2, 18.2, 27.10, 33.5, 16.3
 *
 * 任务 26.8 — backend/src/utils/memoryCache.js 的核心不变量：
 *   1) 在 TTL 内重复 get(key) 返回同一缓存值（不重计算）
 *   2) TTL 过期后下一次 get 返回 null（即"触发重计算"信号）
 *   3) set(key, value, ttl) 后 N 个并发 get 都拿到同一个 value
 *
 * 不依赖真实时间：本测试通过反复 set / del / get 来推演缓存语义；
 * 对 TTL 过期使用 jest.useFakeTimers + Date.now mock。
 */

const fc = require('fast-check');
const memoryCache = require('../../src/utils/memoryCache');

beforeEach(() => {
  memoryCache.clear();
});

describe('[Property 16] memoryCache invariants', () => {
  test('within TTL, repeated get(key) returns same value without recomputation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 16 }),
        // memoryCache.get 把 cache miss 表示为 null；为了让 memoize 模式下
        // 第二次 get 不被误判为 miss，这里限制候选值不能等价于 null。
        fc
          .anything()
          .filter((v) => v !== null && v !== undefined),
        fc.integer({ min: 5, max: 20 }),
        (key, value, repeats) => {
          memoryCache.clear();
          let computeCount = 0;
          const compute = () => {
            computeCount += 1;
            return value;
          };
          const ttl = 60_000; // 大 TTL 保证不过期
          // memoize 模式：cache miss 才计算
          const get = () => {
            const cached = memoryCache.get(key);
            if (cached !== null) return cached;
            const v = compute();
            memoryCache.set(key, v, ttl);
            return v;
          };

          const results = [];
          for (let i = 0; i < repeats; i += 1) {
            results.push(get());
          }
          // 所有结果都等于第一次计算的值
          for (const r of results) {
            expect(r).toEqual(value);
          }
          // 仅计算一次
          expect(computeCount).toBe(1);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('after TTL expires, next get returns null (signals recomputation)', () => {
    const realDateNow = Date.now;
    let now = 1_000_000;
    Date.now = () => now;
    try {
      memoryCache.clear();
      memoryCache.set('k', 'v1', 1000);
      expect(memoryCache.get('k')).toBe('v1');

      now += 999;
      expect(memoryCache.get('k')).toBe('v1'); // 还在 TTL 内

      now += 2;
      // TTL 过期 → null
      expect(memoryCache.get('k')).toBeNull();
    } finally {
      Date.now = realDateNow;
    }
  });

  test('TTL expiry property: get returns null iff Date.now() > expiresAt', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 5_000 }), // ttl
        fc.integer({ min: 0, max: 10_000 }), // 时间偏移
        (ttl, offset) => {
          const realDateNow = Date.now;
          let now = 1_000_000;
          Date.now = () => now;
          try {
            memoryCache.clear();
            memoryCache.set('k', 42, ttl);
            now += offset;
            const got = memoryCache.get('k');
            if (offset <= ttl) {
              expect(got).toBe(42);
            } else {
              expect(got).toBeNull();
            }
          } finally {
            Date.now = realDateNow;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('set(key, value, ttl) followed by N concurrent get returns same value to all', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 16 }),
        fc.anything().filter((v) => v !== null && v !== undefined),
        fc.integer({ min: 2, max: 30 }),
        async (key, value, concurrency) => {
          memoryCache.clear();
          memoryCache.set(key, value, 60_000);

          const reads = await Promise.all(
            Array.from({ length: concurrency }, () =>
              Promise.resolve().then(() => memoryCache.get(key))
            )
          );
          for (const r of reads) {
            expect(r).toEqual(value);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('del(key) immediately invalidates cached value', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 16 }),
        fc.anything().filter((v) => v !== null && v !== undefined),
        (key, value) => {
          memoryCache.clear();
          memoryCache.set(key, value, 60_000);
          expect(memoryCache.get(key)).toEqual(value);
          memoryCache.del(key);
          expect(memoryCache.get(key)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
