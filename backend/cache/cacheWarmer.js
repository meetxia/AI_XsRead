/**
 * ============================================
 * 文字之境 - 缓存预热与更新策略
 * 开发者: 开发者C
 * 创建日期: 2025-10-27
 * 版本: v1.0
 * ============================================
 * 
 * 功能:
 * - 启动时缓存预热
 * - 定时刷新缓存
 * - 主动更新机制
 * - 延迟双删策略
 */

const { cacheManager, CacheKeyGenerator } = require('./cacheManager');
const mysql = require('mysql2/promise');

// ============================================
// 配置
// ============================================
const CONFIG = {
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root123',
    database: 'ai_xsread',
  },
  
  warmup: {
    enabled: true,
    hotNovelsCount: 100,      // 预热热门小说数量
    categoriesAll: true,       // 预热所有分类
    systemConfig: true,        // 预热系统配置
  },
  
  refresh: {
    interval: 3600000,         // 刷新间隔: 1小时
    hotRankInterval: 1800000,  // 热门排行刷新: 30分钟
  },
};

// ============================================
// 缓存预热器
// ============================================
class CacheWarmer {
  constructor(config = CONFIG) {
    this.config = config;
    this.pool = null;
    this.refreshTimers = [];
    this.isWarmedUp = false;
    
    this.initialize();
  }

  /**
   * 初始化数据库连接
   */
  async initialize() {
    try {
      this.pool = mysql.createPool(this.config.database);
      console.log('✅ 缓存预热器数据库连接成功');
    } catch (error) {
      console.error('❌ 缓存预热器初始化失败:', error);
    }
  }

  /**
   * 启动缓存预热
   */
  async warmup() {
    if (!this.config.warmup.enabled) {
      console.log('⚠️ 缓存预热已禁用');
      return;
    }
    
    console.log('🔥 开始缓存预热...');
    const startTime = Date.now();
    
    try {
      await Promise.all([
        this.warmupCategories(),
        this.warmupHotNovels(),
        this.warmupHotRanks(),
        this.warmupSystemConfig(),
      ]);
      
      this.isWarmedUp = true;
      const duration = Date.now() - startTime;
      console.log(`✅ 缓存预热完成! (${duration}ms)`);
      
      // 启动定时刷新
      this.startRefresh();
      
    } catch (error) {
      console.error('❌ 缓存预热失败:', error);
    }
  }

  /**
   * 预热分类数据
   */
  async warmupCategories() {
    try {
      console.log('📂 预热分类数据...');
      
      const [categories] = await this.pool.query(`
        SELECT id, name, icon, description, novel_count, sort_order
        FROM categories
        WHERE status = 1
        ORDER BY sort_order
      `);
      
      const key = CacheKeyGenerator.categories();
      await cacheManager.set(key, categories, 86400); // 24小时
      
      console.log(`✅ 预热了 ${categories.length} 个分类`);
      return categories.length;
      
    } catch (error) {
      console.error('❌ 预热分类失败:', error);
      throw error;
    }
  }

  /**
   * 预热热门小说
   */
  async warmupHotNovels() {
    try {
      console.log('🔥 预热热门小说...');
      
      // 获取所有分类
      const [categories] = await this.pool.query('SELECT id FROM categories WHERE status = 1');
      
      let totalWarmed = 0;
      
      for (const category of categories) {
        // 获取每个分类的热门小说
        const [novels] = await this.pool.query(`
          SELECT * FROM novels
          WHERE category_id = ? AND status = 1
          ORDER BY views DESC
          LIMIT ?
        `, [category.id, this.config.warmup.hotNovelsCount]);
        
        // 缓存小说列表
        const listKey = CacheKeyGenerator.novelList(category.id, 1, 20);
        await cacheManager.set(listKey, novels.slice(0, 20), 300);
        
        // 缓存每本小说的详情
        for (const novel of novels) {
          const detailKey = CacheKeyGenerator.novelDetail(novel.id);
          await cacheManager.set(detailKey, novel, 3600);
        }
        
        totalWarmed += novels.length;
      }
      
      console.log(`✅ 预热了 ${totalWarmed} 本热门小说`);
      return totalWarmed;
      
    } catch (error) {
      console.error('❌ 预热热门小说失败:', error);
      throw error;
    }
  }

  /**
   * 预热热门排行榜
   */
  async warmupHotRanks() {
    try {
      console.log('📊 预热热门排行榜...');
      
      const rankTypes = ['views', 'likes', 'collections', 'hot_score'];
      const [categories] = await this.pool.query('SELECT id FROM categories WHERE status = 1');
      
      let totalRanks = 0;
      
      for (const type of rankTypes) {
        for (const category of categories) {
          const [novels] = await this.pool.query(`
            SELECT id, title, author, ${type} as score
            FROM novels
            WHERE category_id = ? AND status = 1
            ORDER BY ${type} DESC
            LIMIT 50
          `, [category.id]);
          
          const key = CacheKeyGenerator.hotRank(type, category.id);
          await cacheManager.set(key, novels, 3600);
          
          totalRanks++;
        }
      }
      
      console.log(`✅ 预热了 ${totalRanks} 个排行榜`);
      return totalRanks;
      
    } catch (error) {
      console.error('❌ 预热排行榜失败:', error);
      throw error;
    }
  }

  /**
   * 预热系统配置
   */
  async warmupSystemConfig() {
    try {
      console.log('⚙️ 预热系统配置...');
      
      const [configs] = await this.pool.query('SELECT `key`, `value` FROM system_config');
      
      let warmedCount = 0;
      
      for (const config of configs) {
        const key = CacheKeyGenerator.systemConfig(config.key);
        await cacheManager.set(key, config.value, 86400); // 24小时
        warmedCount++;
      }
      
      console.log(`✅ 预热了 ${warmedCount} 个系统配置`);
      return warmedCount;
      
    } catch (error) {
      console.error('❌ 预热系统配置失败:', error);
      throw error;
    }
  }

  /**
   * 启动定时刷新
   */
  startRefresh() {
    console.log('🔄 启动定时刷新...');
    
    // 每小时刷新热门数据
    const hotRefreshTimer = setInterval(async () => {
      console.log('🔄 刷新热门数据...');
      try {
        await this.warmupHotNovels();
      } catch (error) {
        console.error('❌ 刷新热门数据失败:', error);
      }
    }, this.config.refresh.interval);
    
    // 每30分钟刷新排行榜
    const rankRefreshTimer = setInterval(async () => {
      console.log('🔄 刷新排行榜...');
      try {
        await this.warmupHotRanks();
      } catch (error) {
        console.error('❌ 刷新排行榜失败:', error);
      }
    }, this.config.refresh.hotRankInterval);
    
    this.refreshTimers.push(hotRefreshTimer, rankRefreshTimer);
  }

  /**
   * 停止定时刷新
   */
  stopRefresh() {
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.refreshTimers = [];
    console.log('⏹️ 定时刷新已停止');
  }

  /**
   * 主动更新小说缓存
   */
  async updateNovel(novelId, updateData = null) {
    try {
      let novelData = updateData;
      
      // 如果没有提供数据，从数据库获取
      if (!novelData) {
        const [novels] = await this.pool.query(
          'SELECT * FROM novels WHERE id = ?',
          [novelId]
        );
        
        if (novels.length === 0) {
          return false;
        }
        
        novelData = novels[0];
      }
      
      // 更新缓存
      const key = CacheKeyGenerator.novelDetail(novelId);
      await cacheManager.set(key, novelData, 3600);
      
      console.log(`✅ 更新小说缓存: ${novelId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ 更新小说缓存失败 (${novelId}):`, error);
      return false;
    }
  }

  /**
   * 延迟双删策略
   * 用于数据更新时保证缓存一致性
   */
  async updateNovelWithDoubleDelete(novelId, updateFunc) {
    try {
      const key = CacheKeyGenerator.novelDetail(novelId);
      
      // 1. 先删除缓存
      await cacheManager.delete(key);
      console.log(`🗑️ 第一次删除缓存: ${key}`);
      
      // 2. 更新数据库
      const result = await updateFunc();
      
      // 3. 延迟后再删除一次 (防止脏读)
      setTimeout(async () => {
        await cacheManager.delete(key);
        console.log(`🗑️ 第二次删除缓存: ${key}`);
        
        // 4. 重新加载到缓存
        const [novels] = await this.pool.query(
          'SELECT * FROM novels WHERE id = ?',
          [novelId]
        );
        
        if (novels.length > 0) {
          await cacheManager.set(key, novels[0], 3600);
          console.log(`✅ 重新加载缓存: ${key}`);
        }
      }, 1000);
      
      return result;
      
    } catch (error) {
      console.error(`❌ 延迟双删失败 (${novelId}):`, error);
      throw error;
    }
  }

  /**
   * 批量预热小说
   */
  async warmupNovels(novelIds) {
    try {
      console.log(`📚 批量预热 ${novelIds.length} 本小说...`);
      
      const [novels] = await this.pool.query(
        'SELECT * FROM novels WHERE id IN (?)',
        [novelIds]
      );
      
      let warmedCount = 0;
      
      for (const novel of novels) {
        const key = CacheKeyGenerator.novelDetail(novel.id);
        await cacheManager.set(key, novel, 3600);
        warmedCount++;
      }
      
      console.log(`✅ 批量预热完成: ${warmedCount} 本小说`);
      return warmedCount;
      
    } catch (error) {
      console.error('❌ 批量预热失败:', error);
      throw error;
    }
  }

  /**
   * 清除过期缓存
   */
  async clearExpired() {
    try {
      console.log('🧹 清除过期缓存...');
      
      // Redis会自动清除过期键
      // 这里主要清理L1缓存
      cacheManager.l1Cache.purgeStale();
      
      console.log('✅ 过期缓存清除完成');
      
    } catch (error) {
      console.error('❌ 清除过期缓存失败:', error);
    }
  }

  /**
   * 获取预热状态
   */
  getStatus() {
    return {
      isWarmedUp: this.isWarmedUp,
      refreshTimersCount: this.refreshTimers.length,
      cacheStats: cacheManager.getStats(),
    };
  }

  /**
   * 关闭
   */
  async close() {
    this.stopRefresh();
    
    if (this.pool) {
      await this.pool.end();
      console.log('✅ 缓存预热器已关闭');
    }
  }
}

// ============================================
// 缓存更新策略
// ============================================
class CacheUpdateStrategy {
  /**
   * Cache-Aside 模式 (旁路缓存)
   * 最常用的缓存模式
   */
  static async cacheAside(key, fetchFunc, ttl) {
    return await cacheManager.getOrSet(key, fetchFunc, ttl);
  }

  /**
   * Read-Through 模式 (穿透读)
   * 缓存代理自动加载数据
   */
  static async readThrough(key, fetchFunc, ttl) {
    let value = await cacheManager.get(key);
    
    if (value === null) {
      value = await fetchFunc();
      if (value !== null) {
        await cacheManager.set(key, value, ttl);
      }
    }
    
    return value;
  }

  /**
   * Write-Through 模式 (穿透写)
   * 写缓存的同时写数据库
   */
  static async writeThrough(key, value, writeFunc, ttl) {
    // 1. 写数据库
    await writeFunc(value);
    
    // 2. 写缓存
    await cacheManager.set(key, value, ttl);
  }

  /**
   * Write-Behind 模式 (异步写)
   * 先写缓存，异步写数据库
   */
  static async writeBehind(key, value, writeFunc, ttl) {
    // 1. 先写缓存
    await cacheManager.set(key, value, ttl);
    
    // 2. 异步写数据库
    setImmediate(async () => {
      try {
        await writeFunc(value);
      } catch (error) {
        console.error('❌ 异步写数据库失败:', error);
      }
    });
  }

  /**
   * Refresh-Ahead 模式 (提前刷新)
   * 在缓存过期前提前刷新
   */
  static async refreshAhead(key, fetchFunc, ttl, refreshThreshold = 0.8) {
    let value = await cacheManager.get(key);
    
    if (value === null) {
      value = await fetchFunc();
      if (value !== null) {
        await cacheManager.set(key, value, ttl);
      }
    } else {
      // 检查TTL，如果即将过期则提前刷新
      const remainingTTL = await cacheManager.ttl(key);
      if (remainingTTL < ttl * refreshThreshold) {
        // 异步刷新
        setImmediate(async () => {
          const newValue = await fetchFunc();
          if (newValue !== null) {
            await cacheManager.set(key, newValue, ttl);
          }
        });
      }
    }
    
    return value;
  }
}

// ============================================
// 导出
// ============================================
const cacheWarmer = new CacheWarmer();

module.exports = {
  CacheWarmer,
  CacheUpdateStrategy,
  cacheWarmer,
};

// ============================================
// 使用示例
// ============================================
/*
const { cacheWarmer, CacheUpdateStrategy } = require('./cacheWarmer');

// 1. 启动时预热缓存
await cacheWarmer.warmup();

// 2. 主动更新小说缓存
await cacheWarmer.updateNovel(1);

// 3. 延迟双删 (更新数据时)
await cacheWarmer.updateNovelWithDoubleDelete(1, async () => {
  await db.query('UPDATE novels SET views = views + 1 WHERE id = ?', [1]);
});

// 4. 使用不同的缓存策略
const novel = await CacheUpdateStrategy.cacheAside(
  'novel:detail:1',
  async () => {
    const [rows] = await db.query('SELECT * FROM novels WHERE id = 1');
    return rows[0];
  },
  3600
);

// 5. 查看预热状态
const status = cacheWarmer.getStatus();
console.log('预热状态:', status);

// 6. 优雅关闭
process.on('SIGINT', async () => {
  await cacheWarmer.close();
  process.exit(0);
});
*/

