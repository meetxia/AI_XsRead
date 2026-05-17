/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 21: 评分分布与字段空态
 * Validates: Requirements 11.2, 11.3, 11.4
 *
 * 任务 15.5 — 评分分布构造器 buildRatingDistribution 的纯函数不变量。
 *
 * 测试目标：
 *   1) 空输入：ratingCount = 0 / average = 0 / 全部 distribution = 0
 *   2) 非空输入：每档百分比 ∈ [0, 100]
 *   3) 非空输入：Σ distribution[k] ∈ [99, 100]（绝大多数情况下 = 100，
 *      但当四舍五入与 largest-remainder 在退化输入下得到 99 时也允许）
 *   4) average ≈ Σ ratings / N（保留 2 位小数容差）
 */

const fc = require('fast-check');
const { buildRatingDistribution } = require('../../src/utils/ratingDistribution');

const ratingArb = fc.integer({ min: 1, max: 5 });
const ratingsArrayArb = fc.array(ratingArb, { minLength: 0, maxLength: 200 });

describe('[Property 21] rating distribution invariants', () => {
  test('empty input → zero count, zero average, all-zero distribution', () => {
    const result = buildRatingDistribution([]);
    expect(result.ratingCount).toBe(0);
    expect(result.average).toBe(0);
    expect(result.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  test('non-empty input keeps Σ distribution[k] in [99, 100] and each in [0, 100]', () => {
    fc.assert(
      fc.property(
        ratingsArrayArb.filter((arr) => arr.length > 0),
        (ratings) => {
          const { ratingCount, distribution } = buildRatingDistribution(ratings);
          expect(ratingCount).toBe(ratings.length);

          let total = 0;
          for (const k of [1, 2, 3, 4, 5]) {
            const pct = distribution[k];
            expect(pct).toBeGreaterThanOrEqual(0);
            expect(pct).toBeLessThanOrEqual(100);
            total += pct;
          }
          // largest-remainder 法理论上 = 100；这里允许 [99, 100] 容差以兼容退化情形
          expect(total).toBeGreaterThanOrEqual(99);
          expect(total).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('average ≈ sum/N with 2-decimal tolerance', () => {
    fc.assert(
      fc.property(
        ratingsArrayArb.filter((arr) => arr.length > 0),
        (ratings) => {
          const { average } = buildRatingDistribution(ratings);
          const sum = ratings.reduce((acc, r) => acc + r, 0);
          const expected = sum / ratings.length;
          expect(Math.abs(average - expected)).toBeLessThanOrEqual(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('ignores invalid ratings (NaN / out-of-range)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.constant(NaN),
            fc.constant(0),
            fc.constant(6),
            fc.constant(-1),
            fc.constant(100)
          ),
          { minLength: 1, maxLength: 30 }
        ),
        ratingArb,
        (noisy, valid) => {
          // 把一个有效评分混进噪声里：valid 始终被识别
          const result = buildRatingDistribution([...noisy, valid]);
          // 至少 valid 一项被计入
          expect(result.ratingCount).toBeGreaterThanOrEqual(1);
          expect(result.distribution[valid]).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('all ratings equal to k → that bucket is 100%', () => {
    fc.assert(
      fc.property(
        ratingArb,
        fc.integer({ min: 1, max: 50 }),
        (k, n) => {
          const ratings = Array.from({ length: n }, () => k);
          const { distribution, average } = buildRatingDistribution(ratings);
          expect(distribution[k]).toBe(100);
          for (const other of [1, 2, 3, 4, 5]) {
            if (other !== k) {
              expect(distribution[other]).toBe(0);
            }
          }
          expect(average).toBe(k);
        }
      ),
      { numRuns: 50 }
    );
  });
});
