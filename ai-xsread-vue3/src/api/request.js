import axios from 'axios'
import { requestCache, requestDeduplicator } from '@/utils/request-cache'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000
  // 注意：不要设置 Accept-Encoding 等浏览器受限的请求头
  // 浏览器会自动处理压缩相关的请求头
})

// 请求去重 Map（防止并发重复请求）
const pendingRequests = new Map()

/**
 * 生成请求唯一标识
 */
function generateRequestKey(config) {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

/**
 * 添加待处理请求
 */
function addPendingRequest(config) {
  const requestKey = generateRequestKey(config)
  config.cancelToken = config.cancelToken || new axios.CancelToken((cancel) => {
    if (!pendingRequests.has(requestKey)) {
      pendingRequests.set(requestKey, cancel)
    }
  })
}

/**
 * 移除待处理请求
 */
function removePendingRequest(config) {
  const requestKey = generateRequestKey(config)
  if (pendingRequests.has(requestKey)) {
    const cancel = pendingRequests.get(requestKey)
    cancel(requestKey)
    pendingRequests.delete(requestKey)
  }
}

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 取消之前的重复请求
    removePendingRequest(config)

    // 添加当前请求到待处理队列
    addPendingRequest(config)

    // 添加认证 Token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      console.log('🔑 添加 Token 到请求头:', {
        url: config.url,
        method: config.method,
        tokenPreview: token.substring(0, 20) + '...',
        authHeader: config.headers['Authorization'].substring(0, 30) + '...'
      })
    } else {
      console.log('⚠️ 未找到 Token:', {
        url: config.url,
        method: config.method
      })
    }

    // 添加请求时间戳（用于性能监控）
    config.metadata = { startTime: Date.now() }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 移除已完成的请求
    removePendingRequest(response.config)
    
    // 性能监控（开发环境）
    if (process.env.NODE_ENV === 'development' && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime
      console.log(`⏱️ API [${response.config.method.toUpperCase()}] ${response.config.url}: ${duration}ms`)
    }
    
    const res = response.data
    
    // 统一错误处理（200-299 都是成功状态）
    if (res.code !== undefined && (res.code < 200 || res.code >= 300)) {
      console.error('API Error:', res.message)

      // 特殊错误码处理
      if (res.code === 401) {
        // Token 过期或无效，清除本地存储
        console.log('🔒 Token 失效，清除登录信息')
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('refreshToken')

        // 提示用户并跳转到登录页
        if (window.location.pathname !== '/login') {
          alert('登录已失效，请重新登录')
          window.location.href = '/login'
        }
      }

      return Promise.reject(new Error(res.message || 'Error'))
    }
    
    return res
  },
  error => {
    // 移除失败的请求
    if (error.config) {
      removePendingRequest(error.config)
    }
    
    // 请求被取消
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message)
      return Promise.reject(error)
    }
    
    // 网络错误处理
    if (error.message) {
      if (error.message.includes('timeout')) {
        console.error('请求超时，请检查网络连接')
      } else if (error.message.includes('Network Error')) {
        console.error('网络错误，请检查网络连接')
      }
    }
    
    console.error('Network Error:', error)
    return Promise.reject(error)
  }
)

/**
 * 带缓存的 GET 请求
 * @param {string} url 请求地址
 * @param {Object} params 请求参数
 * @param {Object} options 选项（包含 cache 配置）
 * @returns {Promise} 请求结果
 */
request.getCached = async function(url, params = {}, options = {}) {
  const { 
    cache = true, 
    cacheTTL = 5 * 60 * 1000 // 默认缓存 5 分钟
  } = options
  
  if (!cache) {
    return request.get(url, { params })
  }
  
  // 生成缓存键
  const cacheKey = requestCache.generateKey(url, params)
  
  // 尝试从缓存获取
  const cached = requestCache.get(cacheKey)
  if (cached !== null) {
    if (process.env.NODE_ENV === 'development') {
      console.log('✓ 使用缓存:', url)
    }
    return Promise.resolve(cached)
  }
  
  // 请求数据并缓存
  const response = await request.get(url, { params })
  requestCache.set(cacheKey, response, cacheTTL)
  
  return response
}

/**
 * 清除指定 URL 的缓存
 * @param {string|RegExp} pattern URL 匹配模式
 */
request.clearCache = function(pattern) {
  if (pattern) {
    requestCache.deletePattern(pattern)
  } else {
    requestCache.clear()
  }
}

/**
 * 批量请求（并发控制）
 * @param {Array} requests 请求配置数组
 * @param {number} concurrency 并发数
 * @returns {Promise<Array>} 请求结果数组
 */
request.batch = async function(requests, concurrency = 5) {
  const results = []
  const executing = []
  
  for (const [index, requestConfig] of requests.entries()) {
    const promise = request(requestConfig).then(result => {
      results[index] = { success: true, data: result }
    }).catch(error => {
      results[index] = { success: false, error }
    })
    
    executing.push(promise)
    
    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise), 1)
    }
  }
  
  await Promise.all(executing)
  return results
}

export default request

