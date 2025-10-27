import request from '@/utils/request'

/**
 * 获取小说列表
 */
export function getNovelList(params) {
  return request({
    url: '/admin/novels',
    method: 'get',
    params
  })
}

/**
 * 获取小说详情
 */
export function getNovelDetail(id) {
  return request({
    url: `/admin/novels/${id}`,
    method: 'get'
  })
}

/**
 * 创建小说
 */
export function createNovel(data) {
  return request({
    url: '/admin/novels',
    method: 'post',
    data
  })
}

/**
 * 更新小说
 */
export function updateNovel(id, data) {
  return request({
    url: `/admin/novels/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除小说
 */
export function deleteNovel(id) {
  return request({
    url: `/admin/novels/${id}`,
    method: 'delete'
  })
}

/**
 * 获取小说统计数据
 */
export function getNovelStatistics(id) {
  return request({
    url: `/admin/novels/${id}/statistics`,
    method: 'get'
  })
}

