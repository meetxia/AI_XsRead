import request from './request'

/**
 * 拉取通知列表
 * @param {{page?:number,pageSize?:number,onlyUnread?:0|1}} params
 */
export const listNotifications = (params) =>
  request({ url: '/notifications', method: 'get', params })

/**
 * 获取未读通知数量
 */
export const getUnreadCount = () =>
  request({ url: '/notifications/unread-count', method: 'get' })

/**
 * 将单条通知标记为已读
 * @param {number|string} id
 */
export const markNotificationRead = (id) =>
  request({ url: `/notifications/${id}/read`, method: 'post' })

/**
 * 批量将所有通知标记为已读
 */
export const markAllNotificationsRead = () =>
  request({ url: '/notifications/read-all', method: 'post' })
