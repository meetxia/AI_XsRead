/**
 * 互动质量分（Interaction Quality Score）。
 *
 * Feature: wechat-jjwxc-parity-upgrade
 * 关联 Requirement 35.1 / Property 12。
 *
 * 公式：score = likes + replyCount × 2 + min(content.length / 50, 5)
 *
 * 设计意图：让"短句赞"无法压制"中长篇有内容"的评论；同时给回复数更高权重，
 * 鼓励真正引发讨论的内容。
 *
 * 该函数为纯函数（无 IO / 无副作用 / 输出仅依赖输入），便于在 SQL 排序之外
 * 单独可测、可在前端镜像同样的算法。
 */

const REPLY_WEIGHT = 2;
const LENGTH_BONUS_DIVISOR = 50;
const LENGTH_BONUS_CAP = 5;

/**
 * @param {{ likes?: number, replyCount?: number, content?: string }} payload
 * @returns {number} 非负互动质量分（可能为浮点数，未做四舍五入）
 */
function interactionScore(payload = {}) {
  const { likes = 0, replyCount = 0, content = '' } = payload;
  const safeLikes = Math.max(0, Number(likes) || 0);
  const safeReplies = Math.max(0, Number(replyCount) || 0);
  const length = typeof content === 'string' ? content.length : 0;
  const lengthBonus = Math.min(length / LENGTH_BONUS_DIVISOR, LENGTH_BONUS_CAP);
  return safeLikes + safeReplies * REPLY_WEIGHT + lengthBonus;
}

module.exports = {
  LENGTH_BONUS_CAP,
  LENGTH_BONUS_DIVISOR,
  REPLY_WEIGHT,
  interactionScore
};
