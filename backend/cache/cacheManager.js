/**
 * ============================================
 * 文字之境 - 多级缓存管理系统
 * 开发者: 开发者C
 * 创建日期: 2025-10-27
 * 版本: v1.0
 * ============================================
 * 
 * 功能:
 * - 多级缓存 (L1本地 + L2 Redis)
 * - 缓存预热
 * - 缓存更新策略
 * - 缓存穿透/雪崩/击穿防护
 * - 缓存监控统计
 */

const LRU = require('lru-cache');
const Redis = require('ioredis');
const crypto = require('crypto');

// ============================================
// 配置
// ============================================
const CONFIG = {
  // L1本地缓存配置
  l1Cache: {
    max: 500,                    // 最大缓存条目数
    ttl: 1000 * 60,             // 1分钟过期
    updateAgeOnGet: true,       // 读取时更新过期时间
    updateAgeOnHas: false,
  },
  
  // L2 Redis缓存配置
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: 'xsread:',
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  },
  
  // 缓存TTL配置 (秒)
  ttl: {
    novel: 3600,              // 小说详情: 1小时
    novelList: 300,           // 小说列表: 5分钟
    chapter: 7200,            // 章节内容: 2小时
    category: 86400,          // 分类: 24小时
    hotRank: 3600,            // 热门排行: 1小时
    userInfo: 1800,           // 用户信息: 30分钟
    config: 86400,            // 系统配置: 24小时
  },
  
  // 防护配置
  protection: {
    bloomFilter: true,        // 布隆过滤器
    nullCache: true,          // 空值缓存
    nullCacheTTL: 60,         // 空值缓存时间: 1分钟
    lockTimeout: 5000,        // 分布式锁超时: 5秒
  },
};

// ============================================
// 多级缓存管理器
// ============================================
class CacheManager {
  constructor(config = CONFIG) {
    this.config = config;
    
    // L1缓存: 本地内存 (LRU)
    this.l1Cache = new LRU(config.l1Cache);
    
    // L2缓存: Redis
    this.redis = new Redis(config.redis);
    
    // 统计信息
    this.stats = {
      l1: { hits: 0, misses: 0, sets: 0 },
      l2: { hits: 0, misses: 0, sets: 0 },
      total: { hits: 0, misses: 0 },
    };
    
    // 布隆过滤器 (简化实现)
    this.bloomFilter = new Set();
    
    this.initialize();
  }

  /**
   * 初始化
   */
  async initialize() {
    try {
      // 测试Redis连接
      await this.redis.ping();
      console.log('✅ 缓存管理器初始化成功');
      
      // 设置事件监听
      this.redis.on('error', (err) => {
        console.error('❌ Redis错误:', err);
      });
      
      this.redis.on('connect', () => {
        console.log('✅ Redis连接成功');
      });
      
    } catch (error) {
      console.error('❌ 缓存管理器初始化失败:', error);
    }
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @returns {Promise<any>} 缓存值
   */
  async get(key) {
    const startTime = Date.now();
    
    // 1. 尝试L1缓存
    let value = this.l1Cache.get(key);
    if (value !== undefined) {
      this.stats.l1.hits++;
      this.stats.total.hits++;
      console.log(`🎯 L1命中: ${key} (${Date.now() - startTime}ms)`);
      return value;
    }
    this.stats.l1.misses++;
    
    // 2. 尝试L2缓存 (Redis)
    try {
      const redisValue = await this.redis.get(key);
      
      if (redisValue !== null) {
        // 解析JSON
        value = JSON.parse(redisValue);
        
        // 回写L1缓存
        this.l1Cache.set(key, value);
        
        this.stats.l2.hits++;
        this.stats.total.hits++;
        console.log(`🎯 L2命中: ${key} (${Date.now() - startTime}ms)`);
        return value;
      }
      
      this.stats.l2.misses++;
      
    } catch (error) {
      console.error(`❌ Redis读取失败 (${key}):`, error);
    }
    
    // 3. 缓存未命中
    this.stats.total.misses++;
    console.log(`❌ 缓存未命中: ${key} (${Date.now() - startTime}ms)`);
    return null;
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} value 缓存值
   * @param {number} ttl 过期时间(秒)
   */
  async set(key, value, ttl = 3600) {
    try {
      // 1. 设置L1缓存
      this.l1Cache.set(key, value);
      this.stats.l1.sets++;
      
      // 2. 设置L2缓存 (Redis)
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      this.stats.l2.sets++;
      
      // 3. 添加到布隆过滤器
      if (this.config.protection.bloomFilter) {
        this.bloomFilter.add(key);
      }
      
      console.log(`💾 缓存设置成功: ${key} (TTL: ${ttl}s)`);
      return true;
      
    } catch (error) {
      console.error(`❌ 缓存设置失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 获取或设置缓存 (Cache-Aside模式)
   * @param {string} key 缓存键
   * @param {Function} fetchFunc 数据获取函数
   * @param {number} ttl 过期时间(秒)
   */
  async getOrSet(key, fetchFunc, ttl = 3600) {
    // 1. 尝试获取缓存
    let value = await this.get(key);
    
    if (value !== null) {
      return value;
    }
    
    // 2. 缓存穿透防护: 布隆过滤器
    if (this.config.protection.bloomFilter && !this.bloomFilter.has(key)) {
      console.log(`🛡️ 布隆过滤器拦截: ${key}`);
      return null;
    }
    
    // 3. 缓存击穿防护: 分布式锁
    const lockKey = `lock:${key}`;
    const lockValue = crypto.randomBytes(16).toString('hex');
    
    try {
      // 尝试获取锁
      const locked = await this.redis.set(
        lockKey,
        lockValue,
        'PX',
        this.config.protection.lockTimeout,
        'NX'
      );
      
      if (!locked) {
        // 未获取到锁，等待后重试
        await this.sleep(100);
        return await this.get(key);
      }
      
      // 4. 获取数据
      console.log(`📡 从数据源获取: ${key}`);
      value = await fetchFunc();
      
      // 5. 空值缓存 (防止缓存穿透)
      if (value === null && this.config.protection.nullCache) {
        await this.set(key, '__NULL__', this.config.protection.nullCacheTTL);
        return null;
      }
      
      // 6. 设置缓存
      if (value !== null) {
        // 缓存雪崩防护: 随机TTL
        const randomTTL = ttl + Math.floor(Math.random() * 300);
        await this.set(key, value, randomTTL);
      }
      
      return value;
      
    } finally {
      // 释放锁
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await this.redis.eval(script, 1, lockKey, lockValue);
    }
  }

  /**
   * 删除缓存
   * @param {string} key 缓存键
   */
  async delete(key) {
    try {
      // 删除L1缓存
      this.l1Cache.delete(key);
      
      // 删除L2缓存
      await this.redis.del(key);
      
      // 从布隆过滤器移除
      this.bloomFilter.delete(key);
      
      console.log(`🗑️ 缓存删除: ${key}`);
      return true;
      
    } catch (error) {
      console.error(`❌ 缓存删除失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 批量删除缓存 (模式匹配)
   * @param {string} pattern 匹配模式
   */
  async deletePattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      // 删除Redis中的键
      await this.redis.del(...keys);
      
      // 删除L1缓存中匹配的键
      const l1Keys = Array.from(this.l1Cache.keys());
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      l1Keys.forEach(key => {
        if (regex.test(key)) {
          this.l1Cache.delete(key);
        }
      });
      
      console.log(`🗑️ 批量删除缓存: ${pattern} (${keys.length}个)`);
      return keys.length;
      
    } catch (error) {
      console.error(`❌ 批量删除缓存失败 (${pattern}):`, error);
      return 0;
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key 缓存键
   */
  async exists(key) {
    if (this.l1Cache.has(key)) {
      return true;
    }
    
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * 获取缓存TTL
   * @param {string} key 缓存键
   */
  async ttl(key) {
    return await this.redis.ttl(key);
  }

  /**
   * 刷新缓存过期时间
   * @param {string} key 缓存键
   * @param {number} ttl 新的过期时间(秒)
   */
  async expire(key, ttl) {
    return await this.redis.expire(key, ttl);
  }

  /**
   * 清空所有缓存
   */
  async clear() {
    try {
      // 清空L1缓存
      this.l1Cache.clear();
      
      // 清空L2缓存 (仅删除带前缀的键)
      const pattern = `${this.config.redis.keyPrefix}*`;
      await this.deletePattern(pattern);
      
      // 清空布隆过滤器
      this.bloomFilter.clear();
      
      console.log('🧹 所有缓存已清空');
      return true;
      
    } catch (error) {
      console.error('❌ 清空缓存失败:', error);
      return false;
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const l1HitRate = this.stats.l1.hits / (this.stats.l1.hits + this.stats.l1.misses) || 0;
    const l2HitRate = this.stats.l2.hits / (this.stats.l2.hits + this.stats.l2.misses) || 0;
    const totalHitRate = this.stats.total.hits / (this.stats.total.hits + this.stats.total.misses) || 0;
    
    return {
      l1: {
        ...this.stats.l1,
        hitRate: (l1HitRate * 100).toFixed(2) + '%',
        size: this.l1Cache.size,
        max: this.config.l1Cache.max,
      },
      l2: {
        ...this.stats.l2,
        hitRate: (l2HitRate * 100).toFixed(2) + '%',
      },
      total: {
        ...this.stats.total,
        hitRate: (totalHitRate * 100).toFixed(2) + '%',
      },
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      l1: { hits: 0, misses: 0, sets: 0 },
      l2: { hits: 0, misses: 0, sets: 0 },
      total: { hits: 0, misses: 0 },
    };
  }

  /**
   * 辅助函数: 延迟
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
      console.log('✅ 缓存管理器已关闭');
    }
  }
}

// ============================================
// 缓存键生成器
// ============================================
class CacheKeyGenerator {
  /**
   * 小说详情键
   */
  static novelDetail(novelId) {
    return `novel:detail:${novelId}`;
  }

  /**
   * 小说列表键
   */
  static novelList(category, page, pageSize) {
    return `novel:list:${category}:${page}:${pageSize}`;
  }

  /**
   * 章节内容键
   */
  static chapterContent(chapterId) {
    return `chapter:content:${chapterId}`;
  }

  /**
   * 分类列表键
   */
  static categories() {
    return 'categories:list';
  }

  /**
   * 热门排行键
   */
  static hotRank(type, category) {
    return `hot:rank:${type}:${category}`;
  }

  /**
   * 用户信息键
   */
  static userInfo(userId) {
    return `user:info:${userId}`;
  }

  /**
   * 系统配置键
   */
  static systemConfig(key) {
    return `config:${key}`;
  }
}

// ============================================
// 导出
// ============================================
const cacheManager = new CacheManager();

module.exports = {
  CacheManager,
  CacheKeyGenerator,
  cacheManager,
};

// ============================================
// 使用示例
// ============================================
/*
const { cacheManager, CacheKeyGenerator } = require('./cacheManager');

// 1. 基本使用
const novelId = 1;
const key = CacheKeyGenerator.novelDetail(novelId);

// 获取缓存
const novel = await cacheManager.get(key);

// 设置缓存
await cacheManager.set(key, { id: 1, title: '小说标题' }, 3600);

// 2. Cache-Aside模式 (推荐)
const novelData = await cacheManager.getOrSet(
  key,
  async () => {
    // 从数据库获取数据
    const result = await db.query('SELECT * FROM novels WHERE id = ?', [novelId]);
    return result[0];
  },
  3600
);

// 3. 删除缓存
await cacheManager.delete(key);

// 4. 批量删除
await cacheManager.deletePattern('novel:*');

// 5. 查看统计
const stats = cacheManager.getStats();
console.log('缓存统计:', stats);

// 6. 优雅关闭
process.on('SIGINT', async () => {
  await cacheManager.close();
  process.exit(0);
});
*/

