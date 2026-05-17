import request from './request'

export function getAuthor(authorId) {
  return request({ url: `/authors/${authorId}`, method: 'get' })
}

export function listAuthorNovels(authorId, params = {}) {
  return request({ url: `/authors/${authorId}/novels`, method: 'get', params })
}

export function followAuthor(authorId) {
  return request({ url: `/authors/${authorId}/follow`, method: 'post' })
}

export function unfollowAuthor(authorId) {
  return request({ url: `/authors/${authorId}/follow`, method: 'delete' })
}

export function listFollowingAuthors(params = {}) {
  return request({ url: '/user/following-authors', method: 'get', params })
}
