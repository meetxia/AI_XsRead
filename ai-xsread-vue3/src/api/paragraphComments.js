import request from './request'

export function getParagraphCommentCounts(params) {
  return request({
    url: '/paragraph-comments/counts',
    method: 'get',
    params,
  })
}

/**
 * Thin alias for getParagraphCommentCounts used by the bubble layer
 * (`useParagraphCommentBubble` + `stores/paragraphComments`). Always queries
 * the aggregate-only endpoint so unread chapters do not pull any list rows.
 *
 * Validates: Requirements 27.2, 27.10
 */
export function getAggregatedCount(novelId, chapterId) {
  return getParagraphCommentCounts({ novelId, chapterId })
}

export function listParagraphComments(params) {
  return request({
    url: '/paragraph-comments',
    method: 'get',
    params,
  })
}

export function createParagraphComment(data) {
  return request({
    url: '/paragraph-comments',
    method: 'post',
    data,
  })
}

export function likeParagraphComment(id) {
  return request({
    url: `/paragraph-comments/${id}/like`,
    method: 'post',
  })
}

export function unlikeParagraphComment(id) {
  return request({
    url: `/paragraph-comments/${id}/like`,
    method: 'delete',
  })
}

export function deleteParagraphComment(id) {
  return request({
    url: `/paragraph-comments/${id}`,
    method: 'delete',
  })
}
