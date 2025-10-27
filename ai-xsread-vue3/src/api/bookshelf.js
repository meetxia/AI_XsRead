import request from './request'

// 获取书架列表（使用后端已有接口）
export function getBookshelf(params) {
  return request({
    url: '/user/bookshelf',
    method: 'get',
    params
  })
}

// 添加到书架（使用后端已有接口）
export function addToBookshelf(data) {
  return request({
    url: '/user/bookshelf',
    method: 'post',
    data
  })
}

// 更新书架书籍
export function updateBookshelf(id, data) {
  return request({
    url: `/user/bookshelf/${id}`,
    method: 'put',
    data
  })
}

// 从书架移除
export function removeFromBookshelf(id) {
  return request({
    url: `/user/bookshelf/${id}`,
    method: 'delete'
  })
}

// 批量删除
export function batchDeleteBookshelf(ids) {
  return request({
    url: '/user/bookshelf/batch',
    method: 'post',
    data: { ids, action: 'delete' }
  })
}

// 检查是否在书架中
export function checkInBookshelf(novelId) {
  return request({
    url: `/user/bookshelf/check/${novelId}`,
    method: 'get'
  })
}

