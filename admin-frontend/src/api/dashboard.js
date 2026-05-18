import request from '@/utils/request'

/**
 * 获取概览统计
 */
export function getOverview() {
  return request({
    url: '/admin/dashboard/overview',
    method: 'get'
  })
}

/**
 * 获取趋势数据
 */
export function getTrends(params) {
  return request({
    url: '/admin/dashboard/trends',
    method: 'get',
    params
  })
}

/**
 * 获取实时动态
 */
export function getRealtime() {
  return request({
    url: '/admin/dashboard/realtime',
    method: 'get'
  })
}

/**
 * 获取排行榜
 */
export function getRanking(params) {
  return request({
    url: '/admin/dashboard/ranking',
    method: 'get',
    params
  })
}

/**
 * 分类占比（饼图）
 */
export function getCategoryDistribution() {
  return request({
    url: '/admin/dashboard/category-distribution',
    method: 'get'
  })
}

/**
 * 用户活跃趋势
 * @param {Object} params - { days: 7 | 30 }
 */
export function getUserActivity(params) {
  return request({
    url: '/admin/dashboard/user-activity',
    method: 'get',
    params
  })
}

/**
 * 阅读时长分布
 */
export function getReadingTimeDistribution() {
  return request({
    url: '/admin/dashboard/reading-time-distribution',
    method: 'get'
  })
}

/**
 * 小说统计概览（Analytics 用）
 */
export function getNovelStats() {
  return request({
    url: '/admin/dashboard/novel-stats',
    method: 'get'
  })
}

/**
 * 热门小说 TOP N
 */
export function getTopNovels(params) {
  return request({
    url: '/admin/dashboard/top-novels',
    method: 'get',
    params
  })
}
