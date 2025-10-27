import request from './request'

// 获取推荐小说（使用后端已有接口）
export function getRecommendNovels(params) {
  return request({
    url: '/novels/recommend',
    method: 'get',
    params
  })
}

// 获取本周必读（使用推荐接口）
export function getWeeklyPicks(params = {}) {
  return request({
    url: '/novels/recommend',
    method: 'get',
    params: { ...params, limit: params.limit || 1 }
  })
}

// 获取热门榜单（按浏览量排序）
export function getHotRankList(params = {}) {
  return request({
    url: '/novels',
    method: 'get',
    params: { 
      ...params, 
      sortBy: 'views',
      order: 'DESC',
      limit: params.limit || 10
    }
  })
}

// 获取编辑精选（使用推荐接口）
export function getEditorPicks(params = {}) {
  return request({
    url: '/novels/recommend',
    method: 'get',
    params: { ...params, limit: params.limit || 6 }
  })
}

// 获取分类推荐（按分类查询）
export function getCategoryRecommend(categoryId, params = {}) {
  return request({
    url: '/novels',
    method: 'get',
    params: { 
      ...params,
      categoryId,
      limit: params.limit || 10
    }
  })
}

// 获取新书推荐（按创建时间排序）
export function getNewBooks(params = {}) {
  return request({
    url: '/novels',
    method: 'get',
    params: { 
      ...params,
      sortBy: 'created_at',
      order: 'DESC',
      limit: params.limit || 10
    }
  })
}

// 获取个性化推荐（使用推荐接口）
export function getPersonalRecommend(params = {}) {
  return request({
    url: '/novels/recommend',
    method: 'get',
    params: { ...params, limit: params.limit || 10 }
  })
}

// 获取所有分类
export function getCategories() {
  return request({
    url: '/novels/categories',
    method: 'get'
  })
}

