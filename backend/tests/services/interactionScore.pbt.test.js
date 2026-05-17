/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 12: Interaction score 计算（单调性 / 上界 / 非负性）
 * Validates: Requirements 35.1
 *
 * 任务 25.5 — 互动质量分纯函数 interactionScore 的不变量。
 *
 * 公式：score = likes + replyCount × 2 + min(content.length / 50, 5)
 *
 * 测试目标：
 *   1) 在 likes / replyCount 不变时，score 关于 content.length 单调非递减
 *   2) 长度奖励项 ≤ 5（content.length 多大都不再加分）
 *   3) 非负输入下 score ≥ 0
 */

const fc = require('fast-check');
const {
  LENGTH_BONUS_CAP,
  LENGTH_BONUS_DIVISOR,
  REPLY_WEIGHT,
  interactionScore
} = require('../../src/utils/interactionScore');

const positivePayloadArb = fc.record({
  likes: fc.integer({ min: 0, max: 100000 }),
  replyCount: fc.integer({ min: 0, max: 5000 })
});

describe('[Property 12] interaction score', () => {
  test('non-decreasing in content.length when likes / replyCount fixed', () => {
    fc.assert(
      fc.property(
        positivePayloadArb,
        fc.integer({ min: 0, max: 5000 }),
        fc.integer({ min: 0, max: 5000 }),
        ({ likes, replyCount }, lenA, lenB) => {
          const a = interactionScore({
            likes,
            replyCount,
            content: 'x'.repeat(lenA)
          });
          const b = interactionScore({
            likes,
            replyCount,
            content: 'x'.repeat(lenB)
          });
          if (lenA <= lenB) {
            expect(a).toBeLessThanOrEqual(b);
          } else {
            expect(a).toBeGreaterThanOrEqual(b);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('length bonus contribution ≤ 5', () => {
    fc.assert(
      fc.property(
        positivePayloadArb,
        fc.integer({ min: 0, max: 100000 }),
        ({ likes, replyCount }, length) => {
          const score = interactionScore({
            likes,
            replyCount,
            content: 'x'.repeat(length)
          });
          const bonus = score - (likes + replyCount * REPLY_WEIGHT);
          expect(bonus).toBeGreaterThanOrEqual(0);
          expect(bonus).toBeLessThanOrEqual(LENGTH_BONUS_CAP + 1e-9);
          // 当 length ≥ LENGTH_BONUS_DIVISOR * LENGTH_BONUS_CAP（默认 250）时，奖励正好 = 5
          if (length >= LENGTH_BONUS_DIVISOR * LENGTH_BONUS_CAP) {
            expect(Math.abs(bonus - LENGTH_BONUS_CAP)).toBeLessThan(1e-9);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('score ≥ 0 for non-negative inputs', () => {
    fc.assert(
      fc.property(
        positivePayloadArb,
        fc.string({ minLength: 0, maxLength: 5000 }),
        ({ likes, replyCount }, content) => {
          const score = interactionScore({ likes, replyCount, content });
          expect(score).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('safely handles non-string content / negative numbers (defensive defaults)', () => {
    expect(interactionScore({ likes: -5, replyCount: -1, content: null })).toBe(0);
    expect(interactionScore({ likes: 'NaN', replyCount: undefined, content: 'abc' })).toBeGreaterThanOrEqual(0);
    expect(interactionScore({})).toBe(0);
  });
});
