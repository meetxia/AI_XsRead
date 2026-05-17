import request from './request'

export function listMyNotes(params = {}) {
  return request({ url: '/user/notes', method: 'get', params })
}

export function listHotNotesForNovel(novelId, params = {}) {
  return request({ url: `/novels/${novelId}/notes/hot`, method: 'get', params })
}
