/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 5: reading_history.duration 累加与 clamp
 * Validates: Requirements 5.4, 5.5
 *
 * 任务 20.5 — 心跳 duration 单次 clamp + 单条累计 ≤ 86400 的不变量。
 *
 * 测试目标（基于 backend/src/utils/heartbeat.js 中的纯函数）：
 *   1) clampHeartbeat(input):
 *       - input < 0 / NaN  → applied = 0
 *       - 0 ≤ input ≤ 60   → applied = input
 *       - 60 < input ≤ 120 → applied = 60
 *       - input > 120      → applied = 60, warn = true
 *   2) accumulateDuration(prev, applieds):
 *       - prev ∈ [0, 86400] 时累加结果仍 ∈ [0, 86400]
 *       - 上限 = min(prev + Σ applied_i, 86400)
 */

const fc = require('fast-check');
const {
  PER_HEARTBEAT_CAP,
  TOTAL_DURATION_CAP,
  accumulateDuration,
  clampHeartbeat
} = require('../../src/utils/heartbeat');

describe('[Property 5] heartbeat clamp invariants', () => {
  test('negative or NaN input returns applied=0, warn=false', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ min: -10000, max: -0.01, noNaN: true }),
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity)
        ),
        (input) => {
          const { applied, warn } = clampHeartbeat(input);
          expect(applied).toBe(0);
          expect(warn).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('0 ≤ input ≤ 60 → applied = input, warn = false', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 60, noNaN: true }), (input) => {
        const { applied, warn } = clampHeartbeat(input);
        expect(applied).toBe(Math.min(input, PER_HEARTBEAT_CAP));
        expect(applied).toBeLessThanOrEqual(PER_HEARTBEAT_CAP);
        expect(warn).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  test('60 < input ≤ 120 → applied = 60, warn = false', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 60.0001, max: 120, noNaN: true }),
        (input) => {
          const { applied, warn } = clampHeartbeat(input);
          expect(applied).toBe(PER_HEARTBEAT_CAP);
          expect(warn).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('input > 120 → applied = 60, warn = true', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 120.0001, max: 1_000_000, noNaN: true }),
        (input) => {
          const { applied, warn } = clampHeartbeat(input);
          expect(applied).toBe(PER_HEARTBEAT_CAP);
          expect(warn).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('accumulateDuration is bounded by 86400 and equal to min(prev + Σ, 86400)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: TOTAL_DURATION_CAP }),
        fc.array(fc.integer({ min: 0, max: PER_HEARTBEAT_CAP }), {
          minLength: 0,
          maxLength: 200
        }),
        (prev, applieds) => {
          const result = accumulateDuration(prev, applieds);
          const naive = applieds.reduce((acc, a) => acc + a, prev);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(TOTAL_DURATION_CAP);
          expect(result).toBe(Math.min(naive, TOTAL_DURATION_CAP));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('end-to-end: clampHeartbeat then accumulateDuration stays bounded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: TOTAL_DURATION_CAP }),
        fc.array(fc.double({ min: -50, max: 250, noNaN: true }), {
          minLength: 0,
          maxLength: 200
        }),
        (prev, raw) => {
          const applieds = raw.map((r) => clampHeartbeat(r).applied);
          const result = accumulateDuration(prev, applieds);
          // 每次 applied ∈ [0, 60]
          for (const a of applieds) {
            expect(a).toBeGreaterThanOrEqual(0);
            expect(a).toBeLessThanOrEqual(PER_HEARTBEAT_CAP);
          }
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(TOTAL_DURATION_CAP);
        }
      ),
      { numRuns: 100 }
    );
  });
});
