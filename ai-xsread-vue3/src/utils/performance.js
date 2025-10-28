/**
 * 性能优化工具函数
 * 包含防抖、节流、虚拟滚动等性能优化相关工具
 */

/**
 * 防抖函数
 * @param {Function} func 需要防抖的函数
 * @param {number} wait 等待时间（毫秒）
 * @param {boolean} immediate 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout
  
  return function executedFunction(...args) {
    const context = this
    
    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    
    const callNow = immediate && !timeout
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func.apply(context, args)
  }
}

/**
 * 节流函数
 * @param {Function} func 需要节流的函数
 * @param {number} limit 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle
  
  return function executedFunction(...args) {
    const context = this
    
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 请求动画帧节流
 * 使用 requestAnimationFrame 实现的节流，适合处理滚动等高频事件
 * @param {Function} func 需要节流的函数
 * @returns {Function} 节流后的函数
 */
export function rafThrottle(func) {
  let rafId = null
  
  return function executedFunction(...args) {
    const context = this
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(context, args)
        rafId = null
      })
    }
  }
}

/**
 * 图片懒加载
 * @param {HTMLImageElement} img 图片元素
 * @param {string} src 图片地址
 */
export function lazyLoadImage(img, src) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target
        image.src = src
        image.classList.add('loaded')
        observer.unobserve(image)
      }
    })
  })
  
  observer.observe(img)
}

/**
 * 预加载图片
 * @param {string|string[]} urls 图片地址或地址数组
 * @returns {Promise} 加载完成的 Promise
 */
export function preloadImages(urls) {
  const images = Array.isArray(urls) ? urls : [urls]
  
  const promises = images.map(url => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(url)
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  })
  
  return Promise.all(promises)
}

/**
 * 延迟执行
 * @param {number} ms 延迟时间（毫秒）
 * @returns {Promise} 延迟 Promise
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 分批处理大量数据
 * @param {Array} data 数据数组
 * @param {Function} handler 处理函数
 * @param {number} batchSize 每批数量
 * @param {number} interval 批次间隔（毫秒）
 * @returns {Promise} 处理完成的 Promise
 */
export async function processBatch(data, handler, batchSize = 100, interval = 0) {
  const batches = Math.ceil(data.length / batchSize)
  
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize
    const end = Math.min(start + batchSize, data.length)
    const batch = data.slice(start, end)
    
    await handler(batch, i)
    
    if (interval > 0 && i < batches - 1) {
      await delay(interval)
    }
  }
}

/**
 * 监听元素进入视口
 * @param {HTMLElement} element 要监听的元素
 * @param {Function} callback 回调函数
 * @param {Object} options IntersectionObserver 选项
 * @returns {IntersectionObserver} Observer 实例
 */
export function observeElement(element, callback, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry)
      }
    })
  }, {
    threshold: 0.1,
    ...options
  })
  
  observer.observe(element)
  return observer
}

/**
 * 清理定时器 Composable
 * 在组件卸载时自动清理
 */
export function useCleanup() {
  const timers = []
  const observers = []
  const listeners = []
  
  // 添加定时器
  const addTimer = (timer) => {
    timers.push(timer)
    return timer
  }
  
  // 添加观察器
  const addObserver = (observer) => {
    observers.push(observer)
    return observer
  }
  
  // 添加事件监听器
  const addListener = (target, event, handler, options) => {
    target.addEventListener(event, handler, options)
    listeners.push({ target, event, handler, options })
  }
  
  // 清理所有资源
  const cleanup = () => {
    // 清理定时器
    timers.forEach(timer => {
      if (typeof timer === 'number') {
        clearTimeout(timer)
        clearInterval(timer)
      }
    })
    
    // 清理观察器
    observers.forEach(observer => {
      if (observer && observer.disconnect) {
        observer.disconnect()
      }
    })
    
    // 清理事件监听器
    listeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options)
    })
    
    // 清空数组
    timers.length = 0
    observers.length = 0
    listeners.length = 0
  }
  
  return {
    addTimer,
    addObserver,
    addListener,
    cleanup
  }
}

/**
 * 内存监控（仅开发环境）
 */
export function memoryMonitor() {
  if (process.env.NODE_ENV !== 'development' || !performance.memory) {
    return null
  }
  
  const formatBytes = (bytes) => {
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(2)} MB`
  }
  
  return {
    used: formatBytes(performance.memory.usedJSHeapSize),
    total: formatBytes(performance.memory.totalJSHeapSize),
    limit: formatBytes(performance.memory.jsHeapSizeLimit)
  }
}

/**
 * 性能标记
 * @param {string} name 标记名称
 */
export function mark(name) {
  if (process.env.NODE_ENV === 'development' && performance.mark) {
    performance.mark(name)
  }
}

/**
 * 测量性能
 * @param {string} name 测量名称
 * @param {string} startMark 开始标记
 * @param {string} endMark 结束标记
 */
export function measure(name, startMark, endMark) {
  if (process.env.NODE_ENV === 'development' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name)[0]
      console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`)
    } catch (e) {
      console.warn('Performance measurement failed:', e)
    }
  }
}

