import request from '@/utils/request'

/**
 * 获取评论列表
 */
export function getCommentList(params) {
  return request({
    url: '/admin/comments',
    method: 'get',
    params
  })
}

/**
 * 审核通过评论
 */
export function approveComment(id) {
  return request({
    url: `/admin/comments/${id}/approve`,
    method: 'put'
  })
}

/**
 * 拒绝/屏蔽评论
 */
export function rejectComment(id) {
  return request({
    url: `/admin/comments/${id}/reject`,
    method: 'put'
  })
}

/**
 * 删除评论
 */
export function deleteComment(id) {
  return request({
    url: `/admin/comments/${id}`,
    method: 'delete'
  })
}

