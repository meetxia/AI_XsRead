import request from '@/utils/request'

/**
 * 获取用户列表
 */
export function getUserList(params) {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

/**
 * 获取用户详情
 */
export function getUserDetail(id) {
  return request({
    url: `/admin/users/${id}`,
    method: 'get'
  })
}

/**
 * 更新用户信息
 */
export function updateUser(id, data) {
  return request({
    url: `/admin/users/${id}`,
    method: 'put',
    data
  })
}

/**
 * 修改用户状态
 */
export function updateUserStatus(id, status) {
  return request({
    url: `/admin/users/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 获取用户统计数据
 */
export function getUserStatistics(id) {
  return request({
    url: `/admin/users/${id}/statistics`,
    method: 'get'
  })
}

/**
 * 获取用户时间轴
 */
export function getUserTimeline(id, params) {
  return request({
    url: `/admin/users/${id}/timeline`,
    method: 'get',
    params
  })
}

/**
 * 获取用户行为分析
 */
export function getUserAnalysis() {
  return request({
    url: '/admin/users/analysis',
    method: 'get'
  })
}

