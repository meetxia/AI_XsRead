import request from './request'

/**
 * 获取用户阅读统计数据
 */
export const getUserStatistics = () => {
  return request({
    url: '/user/statistics',
    method: 'get'
  })
}

/**
 * 获取用户成就列表
 */
export const getUserAchievements = () => {
  return request({
    url: '/user/achievements',
    method: 'get'
  })
}

/**
 * 获取用户资料
 */
export const getUserProfile = () => {
  return request({
    url: '/user/profile',
    method: 'get'
  })
}

/**
 * 获取用户书架
 */
export const getBookshelf = (params) => {
  return request({
    url: '/user/bookshelf',
    method: 'get',
    params
  })
}

/**
 * 添加到书架
 */
export const addToBookshelf = (data) => {
  return request({
    url: '/user/bookshelf',
    method: 'post',
    data
  })
}

/**
 * 从书架移除
 */
export const removeFromBookshelf = (novelId) => {
  return request({
    url: `/user/bookshelf/${novelId}`,
    method: 'delete'
  })
}

/**
 * 获取阅读进度
 */
export const getReadingProgress = (novelId) => {
  return request({
    url: `/user/reading-progress/${novelId}`,
    method: 'get'
  })
}

/**
 * 更新阅读进度
 */
export const updateReadingProgress = (data) => {
  return request({
    url: '/user/reading-progress',
    method: 'post',
    data
  })
}

/**
 * 获取阅读历史
 */
export const getReadingHistory = (params) => {
  return request({
    url: '/user/reading-history',
    method: 'get',
    params
  })
}

/**
 * 上传头像
 */
export const uploadAvatarApi = (formData, onProgress) => {
  return request({
    url: '/upload/avatar',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  })
}

/**
 * 修改密码
 */
export const changePassword = (data) => {
  return request({
    url: '/user/change-password',
    method: 'post',
    data
  })
}

