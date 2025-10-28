/**
 * 请求缓存工具
 * 实现前端请求级别的缓存，减少不必要的网络请求
 */

class RequestCache {
  constructor(options = {}) {
    this.cache = new Map()
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000 // 默认5分钟
    this.maxSize = options.maxSize || 100 // 最多缓存100个请求
  }

  /**
   * 生成缓存键
   * @param {string} url 请求 URL
   * @param {Object} params 请求参数
   * @returns {string} 缓存键
   */
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key]
        return acc
      }, {})
    
    return `${url}?${JSON.stringify(sortedParams)}`
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @returns {any} 缓存的数据
   */
  get(key) {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    // 检查是否过期
    if (Date.now() > item.expireAt) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} data 数据
   * @param {number} ttl 过期时间（毫秒）
   */
  set(key, data, ttl = this.defaultTTL) {
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      data,
      expireAt: Date.now() + ttl,
      createdAt: Date.now()
    })
  }

  /**
   * 删除缓存
   * @param {string} key 缓存键
   */
  delete(key) {
    this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear()
  }

  /**
   * 删除匹配的缓存
   * @param {string|RegExp} pattern 匹配模式
   */
  deletePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }
}

// 创建全局缓存实例
export const requestCache = new RequestCache({
  defaultTTL: 5 * 60 * 1000, // 5分钟
  maxSize: 100
})

/**
 * 带缓存的请求装饰器
 * @param {Function} requestFunc 请求函数
 * @param {Object} options 选项
 * @returns {Function} 包装后的请求函数
 */
export function withCache(requestFunc, options = {}) {
  const {
    ttl = 5 * 60 * 1000,
    useCache = true,
    cacheKey: customCacheKey
  } = options

  return async function cachedRequest(...args) {
    // 如果不使用缓存，直接请求
    if (!useCache) {
      return await requestFunc(...args)
    }

    // 生成缓存键
    const cacheKey = customCacheKey || requestCache.generateKey(
      requestFunc.name || 'request',
      args[0] // 通常第一个参数是配置对象
    )

    // 尝试从缓存获取
    const cached = requestCache.get(cacheKey)
    if (cached !== null) {
      console.log('✓ 使用缓存:', cacheKey)
      return cached
    }

    // 请求数据
    try {
      const result = await requestFunc(...args)
      
      // 缓存结果
      requestCache.set(cacheKey, result, ttl)
      
      return result
    } catch (error) {
      throw error
    }
  }
}

/**
 * 请求去重工具
 * 防止同时发起多个相同的请求
 */
class RequestDeduplicator {
  constructor() {
    this.pending = new Map()
  }

  /**
   * 执行请求（带去重）
   * @param {string} key 请求键
   * @param {Function} requestFunc 请求函数
   * @returns {Promise} 请求结果
   */
  async execute(key, requestFunc) {
    // 如果已有相同请求在进行中，返回该请求的 Promise
    if (this.pending.has(key)) {
      console.log('⚡ 请求去重:', key)
      return this.pending.get(key)
    }

    // 创建新请求
    const promise = requestFunc()
      .finally(() => {
        // 请求完成后移除
        this.pending.delete(key)
      })

    this.pending.set(key, promise)
    return promise
  }

  /**
   * 取消所有待处理的请求
   */
  clear() {
    this.pending.clear()
  }
}

// 创建全局去重实例
export const requestDeduplicator = new RequestDeduplicator()

/**
 * 请求重试工具
 * @param {Function} requestFunc 请求函数
 * @param {Object} options 选项
 * @returns {Promise} 请求结果
 */
export async function retryRequest(requestFunc, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = (error) => true
  } = options

  let lastError

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFunc()
    } catch (error) {
      lastError = error

      // 检查是否应该重试
      if (i < maxRetries && shouldRetry(error)) {
        console.log(`⚠️ 请求失败，${retryDelay}ms 后重试 (${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)))
      } else {
        break
      }
    }
  }

  throw lastError
}

export default {
  requestCache,
  withCache,
  requestDeduplicator,
  retryRequest
}

