import request from './request'

/**
 * 用户登录
 */
export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * 用户注册
 */
export const register = (data) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

/**
 * 刷新 Token
 */
export const refreshToken = (data) => {
  return request({
    url: '/auth/refresh-token',
    method: 'post',
    data
  })
}

/**
 * 退出登录
 */
export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

/**
 * 修改密码
 * @param {Object} data - { oldPassword, newPassword }
 */
export const changePassword = (data) => {
  return request({
    url: '/auth/change-password',
    method: 'post',
    data
  })
}

