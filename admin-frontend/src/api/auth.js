import request from '@/utils/request'

/**
 * 管理员登录
 */
export function login(data) {
  return request({
    url: '/admin/login',
    method: 'post',
    data
  })
}

/**
 * 退出登录
 */
export function logout() {
  return request({
    url: '/admin/logout',
    method: 'post'
  })
}

/**
 * 获取当前管理员信息
 */
export function getProfile() {
  return request({
    url: '/admin/profile',
    method: 'get'
  })
}

/**
 * 刷新Token
 */
export function refreshToken() {
  return request({
    url: '/admin/refresh-token',
    method: 'post'
  })
}

