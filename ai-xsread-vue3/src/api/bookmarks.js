import request from './request'

export function createBookmark(data) {
  return request({ url: '/user/bookmarks', method: 'post', data })
}

export function listMyBookmarks(params = {}) {
  return request({ url: '/user/bookmarks', method: 'get', params })
}

export function deleteBookmark(id) {
  return request({ url: `/user/bookmarks/${id}`, method: 'delete' })
}
