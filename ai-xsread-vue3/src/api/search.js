import request from './request'

// 搜索建议（使用搜索接口）
export function getSearchSuggest(keyword) {
  return request({
    url: '/novels/search',
    method: 'get',
    params: { keyword, pageSize: 5 }
  })
}

// 搜索小说（使用后端已有接口）
export function searchNovels(params) {
  return request({
    url: '/novels/search',
    method: 'get',
    params
  })
}

// 获取热门搜索（使用热门小说列表）
export function getHotSearch() {
  return request({
    url: '/novels',
    method: 'get',
    params: { 
      sortBy: 'views',
      order: 'DESC',
      pageSize: 10
    }
  })
}

// 获取搜索历史
export function getSearchHistory() {
  const history = localStorage.getItem('searchHistory')
  return history ? JSON.parse(history) : []
}

// 保存搜索历史
export function saveSearchHistory(keyword) {
  let history = getSearchHistory()
  
  // 移除重复项
  history = history.filter(item => item !== keyword)
  
  // 添加到开头
  history.unshift(keyword)
  
  // 最多保存20条
  if (history.length > 20) {
    history = history.slice(0, 20)
  }
  
  localStorage.setItem('searchHistory', JSON.stringify(history))
  return history
}

// 删除单条历史
export function deleteSearchHistory(keyword) {
  let history = getSearchHistory()
  history = history.filter(item => item !== keyword)
  localStorage.setItem('searchHistory', JSON.stringify(history))
  return history
}

// 清空搜索历史
export function clearSearchHistory() {
  localStorage.removeItem('searchHistory')
  return []
}

