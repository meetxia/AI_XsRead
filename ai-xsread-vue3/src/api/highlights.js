import request from './request'

export function createHighlight(data) {
  return request({ url: '/highlights', method: 'post', data })
}

export function listChapterHighlights(params = {}) {
  return request({ url: '/highlights', method: 'get', params })
}

export function updateHighlight(id, data) {
  return request({ url: `/highlights/${id}`, method: 'patch', data })
}

export function deleteHighlight(id) {
  return request({ url: `/highlights/${id}`, method: 'delete' })
}

export function listMyHighlights(params = {}) {
  return request({ url: '/user/highlights', method: 'get', params })
}
