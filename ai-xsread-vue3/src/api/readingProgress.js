import request from './request'

export function getReadingProgress(novelId) {
  return request({
    url: `/user/reading-progress/${novelId}`,
    method: 'get',
  })
}

export function updateReadingProgress(data) {
  return request({
    url: '/user/reading-progress',
    method: 'post',
    data,
  })
}
