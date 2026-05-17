import request from './request'

/**
 * 查询当前登录用户的会员状态
 * 未登录时后端返回 401 → request 拦截器已经把"无 token 401"做成不跳转
 */
export function getMembership() {
  return request({
    url: '/user/membership',
    method: 'get'
  })
}

/**
 * 激活会员
 * @param {Object} payload
 * @param {string} payload.code 激活码（接受带 - 或不带 -，后端会做归一化）
 * @param {'profile'|'reading_wall'|'register'} [payload.channel='profile']
 */
export function activateMembership({ code, channel = 'profile' } = {}) {
  return request({
    url: '/user/membership/activate',
    method: 'post',
    data: { code, channel }
  })
}

/**
 * 客服联系方式（公开接口，无须登录）
 */
export function getContact() {
  return request({
    url: '/system/contact',
    method: 'get'
  })
}
