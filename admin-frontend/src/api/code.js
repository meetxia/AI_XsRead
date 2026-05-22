import request from '@/utils/request'

/**
 * 激活码后端 API 封装。
 *
 * 对应 admin-backend/src/routes/codes.js 暴露的 7 个端点：
 *   POST   /admin/codes/batches            createBatch
 *   GET    /admin/codes/batches            getBatches
 *   GET    /admin/codes/batches/:id        getBatchDetail
 *   GET    /admin/codes/batches/:id/export      CSV
 *   GET    /admin/codes/batches/:id/export.txt  TXT（一码一行）
 *   POST   /admin/codes/void               voidCodes
 *   GET    /admin/codes/redemptions        getRedemptions
 *
 * 导出的文件下载链接走完整 URL，需要拿 token 鉴权 → 用 fetch 拉 blob 后 a.click 触发下载。
 */

/**
 * 创建激活码批次（生成 N 张码）
 * @param {{ code_type:'monthly'|'yearly'|'permanent', count:number, name?:string }} data
 */
export function createCodeBatch(data) {
  return request({
    url: '/admin/codes/batches',
    method: 'post',
    data
  })
}

/**
 * 批次列表（分页 + 关键字 + 类型过滤）
 */
export function getCodeBatches(params) {
  return request({
    url: '/admin/codes/batches',
    method: 'get',
    params
  })
}

/**
 * 批次详情（含分页码列表 + 状态过滤）
 */
export function getCodeBatchDetail(id, params) {
  return request({
    url: `/admin/codes/batches/${id}`,
    method: 'get',
    params
  })
}

/**
 * 批量作废未使用码
 * @param {{ code_ids:number[], reason?:string }} data
 */
export function voidCodes(data) {
  return request({
    url: '/admin/codes/void',
    method: 'post',
    data
  })
}

/**
 * 兑换记录查询
 */
export function getRedemptions(params) {
  return request({
    url: '/admin/codes/redemptions',
    method: 'get',
    params
  })
}

const BASE_URL = (import.meta.env.VITE_APP_BASE_API || '/api').replace(/\/+$/, '')

async function downloadBlob(url, fallbackName) {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include'
  })
  if (!res.ok) {
    let message = `下载失败（HTTP ${res.status}）`
    try {
      const data = await res.clone().json()
      if (data?.message) message = data.message
    } catch (_) {
      // 非 JSON 响应（例如真的是文件），用默认 message
    }
    throw new Error(message)
  }

  // 优先从 Content-Disposition 解析后端给的文件名
  let filename = fallbackName
  const cd = res.headers.get('Content-Disposition') || ''
  const utf8Match = cd.match(/filename\*=UTF-8''([^;]+)/i)
  const asciiMatch = cd.match(/filename="?([^";]+)"?/i)
  if (utf8Match) {
    try { filename = decodeURIComponent(utf8Match[1]) } catch (_) { /* ignore */ }
  } else if (asciiMatch) {
    filename = asciiMatch[1]
  }

  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 让浏览器拿到 blob 后再回收
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}

/**
 * 下载该批次的 TXT（一码一行）
 * @param {number} batchId
 * @param {{ status?: 'unused'|'used'|'void'|'all', format?: 'plain'|'dashed' }} options
 */
export function downloadBatchTxt(batchId, options = {}) {
  const status = options.status || 'unused'
  const format = options.format || 'dashed'
  const url = `${BASE_URL}/admin/codes/batches/${batchId}/export.txt?status=${encodeURIComponent(status)}&format=${encodeURIComponent(format)}`
  return downloadBlob(url, `batch-${batchId}-${status}.txt`)
}

/**
 * 下载该批次的 CSV（含元信息）
 */
export function downloadBatchCsv(batchId) {
  const url = `${BASE_URL}/admin/codes/batches/${batchId}/export`
  return downloadBlob(url, `batch-${batchId}.csv`)
}
