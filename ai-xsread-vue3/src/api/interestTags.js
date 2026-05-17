import request from './request'

export function getMyInterestTags() {
  return request({ url: '/user/interest-tags', method: 'get' })
}

export function saveInterestTags(tags) {
  return request({ url: '/user/interest-tags', method: 'post', data: { tags } })
}
