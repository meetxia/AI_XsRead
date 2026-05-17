/**
 * 评分分布构造器（rating distribution builder）。
 *
 * Feature: wechat-jjwxc-parity-upgrade
 * 关联 Requirement 11.2 / 11.3 / Property 21。
 *
 * 输入：一个评分整数数组（每项 ∈ [1, 5]，非整数或越界自动忽略）。
 * 输出：
 *   {
 *     ratingCount: number,                                  // 有效评分总数
 *     average:     number,                                  // 平均分，保留 2 位小数；空输入返回 0
 *     distribution:{ 1:pct, 2:pct, 3:pct, 4:pct, 5:pct }    // 整数百分比，Σ ∈ [99, 100]
 *   }
 *
 * 百分比使用 "largest-remainder / Hamilton" 方法分配：先取每档的整数下界，
 * 再把剩余 100 - Σfloor 个百分点按 (实际百分比 - 下界) 的余数大小依次补给，
 * 这样可以保证 Σ = 100（除非全为空 → 全 0）。
 *
 * 该函数为纯函数（无 IO / 无副作用），可被 controller 直接复用，也方便单测 / PBT。
 */

const STAR_KEYS = [1, 2, 3, 4, 5];

function emptyDistribution() {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

/**
 * @param {Array<number>} ratingsArray
 * @returns {{
 *   ratingCount: number,
 *   average: number,
 *   distribution: { 1: number, 2: number, 3: number, 4: number, 5: number }
 * }}
 */
function buildRatingDistribution(ratingsArray = []) {
  const valid = (Array.isArray(ratingsArray) ? ratingsArray : [])
    .map((r) => Number(r))
    .filter((r) => Number.isFinite(r) && r >= 1 && r <= 5)
    .map((r) => Math.round(r));

  const ratingCount = valid.length;
  if (ratingCount === 0) {
    return { ratingCount: 0, average: 0, distribution: emptyDistribution() };
  }

  const counts = emptyDistribution();
  let sum = 0;
  for (const r of valid) {
    counts[r] += 1;
    sum += r;
  }

  const exact = {};
  const floors = emptyDistribution();
  let floorTotal = 0;
  const remainders = [];
  for (const k of STAR_KEYS) {
    exact[k] = (counts[k] / ratingCount) * 100;
    floors[k] = Math.floor(exact[k]);
    floorTotal += floors[k];
    remainders.push({ k, rem: exact[k] - floors[k] });
  }

  // 把剩余的百分点按余数大小依次发放（余数大者优先），
  // 余数相等时按 star key 升序，保证函数输出稳定。
  remainders.sort((a, b) => (b.rem - a.rem) || (a.k - b.k));

  const distribution = { ...floors };
  let remaining = Math.round(100 - floorTotal);
  for (let i = 0; i < remainders.length && remaining > 0; i += 1) {
    distribution[remainders[i].k] += 1;
    remaining -= 1;
  }

  for (const k of STAR_KEYS) {
    distribution[k] = Math.min(100, Math.max(0, distribution[k]));
  }

  const average = Math.round((sum / ratingCount) * 100) / 100;
  return { ratingCount, average, distribution };
}

module.exports = {
  STAR_KEYS,
  buildRatingDistribution
};
