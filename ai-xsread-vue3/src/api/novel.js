import request from './request'

function getFilenameFromDisposition(disposition, fallback) {
  if (!disposition) return fallback
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/^"|"$/g, ''))
    } catch (error) {
      return utf8Match[1].replace(/^"|"$/g, '')
    }
  }
  const normalMatch = disposition.match(/filename="?([^";]+)"?/i)
  if (normalMatch?.[1]) {
    try {
      return decodeURIComponent(normalMatch[1])
    } catch (error) {
      return normalMatch[1]
    }
  }
  return fallback
}

// 获取小说列表
export function getNovelList(params) {
  return request({
    url: '/novels',
    method: 'get',
    params
  })
}

// 获取小说列表（别名，用于首页）
export function getNovels(params) {
  return getNovelList(params)
}

// 获取小说详情
export function getNovelDetail(id) {
  return request({
    url: `/novels/${id}`,
    method: 'get'
  })
}

// 获取当前用户对小说的书架/点赞状态
export function getNovelStatus(id) {
  return request({
    url: `/novels/${id}/status`,
    method: 'get'
  })
}

// 获取推荐小说
export function getRecommendNovels(params) {
  return request({
    url: '/novels/recommend',
    method: 'get',
    params
  })
}

// 获取章节列表
export function getChapterList(novelId, params) {
  return request({
    url: `/novels/${novelId}/chapters`,
    method: 'get',
    params
  })
}

// 获取章节内容
export function getChapterContent(chapterId) {
  return request({
    url: `/chapters/${chapterId}`,
    method: 'get'
  })
}

// 下载整本小说 TXT（VIP 权益）
export async function downloadNovelTxt(novelId) {
  const response = await request({
    url: `/novels/${novelId}/download`,
    method: 'get',
    responseType: 'blob',
    timeout: 60000,
    skipUnifiedResponse: true
  })

  const blob = response.data
  const filename = getFilenameFromDisposition(
    response.headers?.['content-disposition'],
    `novel-${novelId}.txt`
  )

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)

  return { filename }
}

// 按字符分页获取整本内容（无章节模式）
export function getNovelPages(novelId, params) {
  return request({
    url: `/novels/${novelId}/pages`,
    method: 'get',
    params
  })
}

// 点赞小说
export function likeNovel(novelId) {
  return request({
    url: `/novels/${novelId}/like`,
    method: 'post'
  })
}

// 取消点赞小说
export function unlikeNovel(novelId) {
  return request({
    url: `/novels/${novelId}/like`,
    method: 'delete'
  })
}

// 收藏小说
export function collectNovel(novelId) {
  return request({
    url: `/novels/${novelId}/collect`,
    method: 'post'
  })
}

// 获取同标签好书
export function getNovelByTags(params) {
  return request({
    url: '/novels',
    method: 'get',
    params
  })
}

// 获取搜索建议
export function getNovelSuggestions(keyword) {
  return request({
    url: '/novels/search/suggestions',
    method: 'get',
    params: { keyword }
  })
}

// 获取小说评分
export function getNovelRating(novelId) {
  return request({
    url: `/novels/${novelId}/rating`,
    method: 'get'
  })
}

// 提交小说评分
export function submitNovelRating(novelId, rating) {
  return request({
    url: `/novels/${novelId}/rating`,
    method: 'post',
    data: { rating }
  })
}

// 更新小说评分
export function updateNovelRating(novelId, rating) {
  return request({
    url: `/novels/${novelId}/rating`,
    method: 'put',
    data: { rating }
  })
}

// 获取评论列表
export function getComments(novelId, params) {
  return request({
    url: `/novels/${novelId}/comments`,
    method: 'get',
    params
  })
}

// 发表评论
export function submitComment(novelId, data) {
  return request({
    url: `/novels/${novelId}/comments`,
    method: 'post',
    data
  })
}

// 点赞评论
export function likeComment(commentId) {
  return request({
    url: `/comments/${commentId}/like`,
    method: 'post'
  })
}

// 回复评论
export function submitReply(commentId, data) {
  return request({
    url: `/comments/${commentId}/reply`,
    method: 'post',
    data
  })
}

// 获取作者信息
export function getAuthorInfo(authorId) {
  return request({
    url: `/authors/${authorId}`,
    method: 'get'
  })
}

// 获取作者作品
export function getAuthorWorks(authorId, params) {
  return request({
    url: `/authors/${authorId}/novels`,
    method: 'get',
    params
  })
}

// 关注作者
export function followAuthor(authorId) {
  return request({
    url: `/authors/${authorId}/follow`,
    method: 'post'
  })
}

