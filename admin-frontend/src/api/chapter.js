import request from '@/utils/request'

/**
 * 获取章节列表
 */
export function getChapterList(params) {
  return request({
    url: '/admin/chapters',
    method: 'get',
    params
  })
}

/**
 * 获取章节详情
 */
export function getChapterDetail(id) {
  return request({
    url: `/admin/chapters/${id}`,
    method: 'get'
  })
}

/**
 * 创建章节
 */
export function createChapter(data) {
  return request({
    url: '/admin/chapters',
    method: 'post',
    data
  })
}

/**
 * 更新章节
 */
export function updateChapter(id, data) {
  return request({
    url: `/admin/chapters/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除章节
 */
export function deleteChapter(id) {
  return request({
    url: `/admin/chapters/${id}`,
    method: 'delete'
  })
}

/**
 * 批量导入章节
 */
export function batchImportChapters(data) {
  return request({
    url: '/admin/chapters/batch-import',
    method: 'post',
    data
  })
}

