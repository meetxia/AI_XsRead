import request from '@/utils/request'

/**
 * 获取数据看板概览统计
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
 * 获取排行榜数据
 */
export function getRanking(params) {
  return request({
    url: '/admin/dashboard/ranking',
    method: 'get',
    params
  })
}

