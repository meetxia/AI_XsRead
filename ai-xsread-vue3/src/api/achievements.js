import request from './request'

/**
 * 获取当前用户的全部勋章规则及当前进度。
 * 后端响应结构：{ code, message, data: { summary, achievements, ... } }
 */
export function listAchievements() {
  return request({ url: '/user/achievements', method: 'get' })
}

/**
 * 别名：与 `@/api/user` 中的 getUserAchievements 保持一致命名，
 * 方便页面 / 测试按照"勋章模块独立 API"的语义引用。
 */
export function getUserAchievements() {
  return listAchievements()
}

export default {
  listAchievements,
  getUserAchievements,
}
