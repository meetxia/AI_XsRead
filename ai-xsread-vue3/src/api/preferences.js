import request from './request'

/**
 * 获取当前登录用户的阅读偏好
 * @returns {Promise<{code:number,message:string,data:{fontSize:number,lineHeight:number,theme:string,pageMode:string,eyeProtection:boolean}}>}
 */
export const getMyPreferences = () =>
  request({ url: '/user/preferences', method: 'get' })

/**
 * 更新当前登录用户的阅读偏好（部分字段可选）
 * @param {Object} data - { fontSize?, lineHeight?, theme?, pageMode?, eyeProtection? }
 * @returns {Promise} data 返回完整偏好对象
 */
export const updateMyPreferences = (data) =>
  request({ url: '/user/preferences', method: 'put', data })
