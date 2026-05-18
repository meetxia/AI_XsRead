/**
 * cacheWrapper.js
 *
 * 统一缓存入口，对 backend/cache/cacheManager.js 提供轻量包装：
 * - 暴露 getOrSet / invalidate / invalidatePattern 三个常用方法
 * - 缓存层任何异常都不影响主业务，回退到直接执行 fetch
 * - 懒加载底层 cacheManager（避免在 Redis 不可用时拖慢/阻塞 require）
 *
 * 用法示例：
 *   const cacheWrapper = require('../services/cacheWrapper')
 *   const data = await cacheWrapper.getOrSet('novel:detail:1', 600, async () => {
 *     return await db.query('SELECT * FROM novels WHERE id = 1')
 *   })
 *   await cacheWrapper.invalidate('novel:detail:1')
 */

let _manager = null
let _loaded = false

function _getManager() {
  if (_loaded) return _manager
  _loaded = true
  try {
    // 兼容两种导出形态：
    //   module.exports = { cacheManager }（当前实际形态）
    //   module.exports = cacheManager（兜底）
    const mod = require('../../cache/cacheManager')
    _manager = (mod && mod.cacheManager) || mod || null
  } catch (err) {
    console.warn('[cacheWrapper] failed to load cacheManager:', err.message)
    _manager = null
  }
  return _manager
}

const isFn = v => typeof v === 'function'

async function getOrSet(key, ttlSeconds, fetchFn) {
  if (!isFn(fetchFn)) {
    throw new TypeError('cacheWrapper.getOrSet: fetchFn must be a function')
  }

  const mgr = _getManager()

  // 读缓存
  if (mgr && isFn(mgr.get)) {
    try {
      const cached = await mgr.get(key)
      if (cached !== null && cached !== undefined && cached !== '__NULL__') {
        return cached
      }
    } catch (err) {
      console.warn(`[cacheWrapper] get failed (${key}):`, err.message)
    }
  }

  const fresh = await fetchFn()

  // 写缓存
  if (mgr && isFn(mgr.set)) {
    try {
      await mgr.set(key, fresh, ttlSeconds)
    } catch (err) {
      console.warn(`[cacheWrapper] set failed (${key}):`, err.message)
    }
  }

  return fresh
}

async function invalidate(key) {
  const mgr = _getManager()
  if (!mgr) return false
  try {
    if (isFn(mgr.delete)) return await mgr.delete(key)
    if (isFn(mgr.del))    return await mgr.del(key)
  } catch (err) {
    console.warn(`[cacheWrapper] invalidate failed (${key}):`, err.message)
  }
  return false
}

async function invalidatePattern(pattern) {
  const mgr = _getManager()
  if (!mgr) return 0
  try {
    if (isFn(mgr.deletePattern)) return await mgr.deletePattern(pattern)
  } catch (err) {
    console.warn(`[cacheWrapper] invalidatePattern failed (${pattern}):`, err.message)
  }
  return 0
}

module.exports = {
  getOrSet,
  invalidate,
  invalidatePattern,
}
