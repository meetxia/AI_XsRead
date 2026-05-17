/**
 * 阅读心跳时长（heartbeat duration）的纯函数 helper。
 *
 * Feature: wechat-jjwxc-parity-upgrade
 * 关联 Requirement 5.4 / 5.5（reading_history.duration 单次累加 ≤ 60、单条 ≤ 86400 秒）。
 *
 * 仅做纯计算，无任何 DB / IO / 副作用，便于在 service 与 PBT 中直接复用。
 */

const PER_HEARTBEAT_CAP = 60;
const PER_HEARTBEAT_WARN_THRESHOLD = 120;
const TOTAL_DURATION_CAP = 86400; // 一天 = 24h × 3600s

/**
 * 把一次心跳的 duration（秒）限制到合法范围内。
 *
 * 规则（与 Requirement 5.4 / 5.5 对齐）：
 *  - 输入为负、NaN、非有限数 → applied = 0，warn = false；
 *  - 0 ≤ 输入 ≤ 60        → applied = 输入，warn = false；
 *  - 60 < 输入 ≤ 120      → applied = 60，warn = false；
 *  - 输入 > 120           → applied = 60，warn = true（异常值，可能客户端时钟错乱）。
 *
 * @param {number} input 客户端上报的本次心跳 duration（秒）
 * @returns {{ applied: number, warn: boolean }}
 */
function clampHeartbeat(input) {
  const value = Number(input);
  if (!Number.isFinite(value) || value < 0) {
    return { applied: 0, warn: false };
  }
  if (value > PER_HEARTBEAT_WARN_THRESHOLD) {
    return { applied: PER_HEARTBEAT_CAP, warn: true };
  }
  return { applied: Math.min(value, PER_HEARTBEAT_CAP), warn: false };
}

/**
 * 把一组已 clamp 的 applied 秒数累加到 prev 上，并整体不超过 86400 秒。
 *
 * @param {number} prev 之前累计的 duration（秒）
 * @param {number[]} appliedList 已经 clamp 过的本次累加列表
 * @returns {number} 新的累计 duration（秒），∈ [0, TOTAL_DURATION_CAP]
 */
function accumulateDuration(prev, appliedList = []) {
  let total = Math.max(0, Number(prev) || 0);
  for (const applied of appliedList) {
    const safe = Math.max(0, Number(applied) || 0);
    total = Math.min(total + safe, TOTAL_DURATION_CAP);
  }
  return total;
}

module.exports = {
  PER_HEARTBEAT_CAP,
  PER_HEARTBEAT_WARN_THRESHOLD,
  TOTAL_DURATION_CAP,
  accumulateDuration,
  clampHeartbeat
};
