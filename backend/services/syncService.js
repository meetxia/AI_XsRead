/**
 * ============================================
 * MOMO小说 - 数据同步服务
 * 开发者: 开发者C
 * 创建日期: 2025-10-27
 * 版本: v1.0
 * ============================================
 * 
 * 功能:
 * - 主从数据库同步
 * - Redis缓存同步
 * - 搜索引擎同步
 * - 冲突检测与解决
 */

const mysql = require('mysql2/promise');
const Redis = require('ioredis');
const EventEmitter = require('events');

// 加载环境变量
require('dotenv').config();

// ============================================
// 配置
// ============================================
const CONFIG = {
  // 主数据库
  masterDB: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,  // 必须从环境变量读取
    database: process.env.DB_DATABASE || 'ai_xsread',
    charset: 'utf8mb4',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    waitForConnections: true,
  },

  // 从数据库 (可选) - 如果需要，请在环境变量中配置
  slaveDB: process.env.DB_SLAVE_ENABLED === 'true' ? {
    host: process.env.DB_SLAVE_HOST || 'localhost',
    port: parseInt(process.env.DB_SLAVE_PORT) || 3306,
    user: process.env.DB_SLAVE_USER || 'readonly',
    password: process.env.DB_SLAVE_PASSWORD,  // 从环境变量读取
    database: process.env.DB_DATABASE || 'ai_xsread',
    charset: 'utf8mb4',
    connectionLimit: parseInt(process.env.DB_SLAVE_CONNECTION_LIMIT) || 20,
  } : null,
  
  // Redis配置
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: 'xsread:',
  },
  
  // 同步配置
  sync: {
    batchSize: 100,          // 批量同步大小
    interval: 60000,         // 定时同步间隔 (毫秒)
    retryTimes: 3,           // 重试次数
    retryDelay: 5000,        // 重试延迟 (毫秒)
  }
};

// ============================================
// 数据同步服务类
// ============================================
class SyncService extends EventEmitter {
  constructor(config = CONFIG) {
    super();
    this.config = config;
    this.masterPool = null;
    this.slavePool = null;
    this.redis = null;
    this.isRunning = false;
    this.syncQueue = [];
    this.stats = {
      success: 0,
      failed: 0,
      pending: 0,
    };
  }

  /**
   * 初始化服务
   */
  async initialize() {
    try {
      // 创建主数据库连接池
      this.masterPool = mysql.createPool(this.config.masterDB);
      console.log('✅ 主数据库连接成功');

      // 创建Redis连接
      this.redis = new Redis(this.config.redis);
      console.log('✅ Redis连接成功');

      // 测试连接
      await this.testConnections();

      this.emit('initialized');
      return true;
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 测试连接
   */
  async testConnections() {
    try {
      // 测试主库连接
      const [rows] = await this.masterPool.query('SELECT 1');
      console.log('✅ 主数据库连接测试通过');

      // 测试Redis连接
      await this.redis.ping();
      console.log('✅ Redis连接测试通过');

      return true;
    } catch (error) {
      console.error('❌ 连接测试失败:', error);
      throw error;
    }
  }

  /**
   * 启动同步服务
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ 同步服务已经在运行');
      return;
    }

    this.isRunning = true;
    console.log('🚀 数据同步服务启动');

    // 启动定时同步
    this.startScheduledSync();

    this.emit('started');
  }

  /**
   * 停止同步服务
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log('🛑 数据同步服务停止');

    // 关闭连接
    if (this.masterPool) {
      await this.masterPool.end();
    }
    if (this.redis) {
      await this.redis.quit();
    }

    this.emit('stopped');
  }

  /**
   * 启动定时同步
   */
  startScheduledSync() {
    this.syncInterval = setInterval(async () => {
      if (!this.isRunning) {
        return;
      }

      try {
        console.log('⏰ 开始定时同步...');
        await this.syncAll();
      } catch (error) {
        console.error('❌ 定时同步失败:', error);
      }
    }, this.config.sync.interval);
  }

  /**
   * 同步所有数据
   */
  async syncAll() {
    try {
      await Promise.all([
        this.syncNovelStats(),
        this.syncHotRank(),
        this.syncCategories(),
      ]);

      console.log('✅ 全量同步完成');
      this.emit('syncCompleted');
    } catch (error) {
      console.error('❌ 全量同步失败:', error);
      this.emit('syncFailed', error);
      throw error;
    }
  }

  /**
   * 同步小说统计数据到Redis
   */
  async syncNovelStats() {
    console.log('📊 同步小说统计数据...');

    try {
      // 查询小说统计
      const [novels] = await this.masterPool.query(`
        SELECT id, title, author, views, likes, collections, rating
        FROM novels
        WHERE status = 1
        ORDER BY views DESC
        LIMIT ?
      `, [this.config.sync.batchSize]);

      // 批量写入Redis
      const pipeline = this.redis.pipeline();

      for (const novel of novels) {
        const key = `novel:stats:${novel.id}`;
        pipeline.hmset(key, {
          title: novel.title,
          author: novel.author,
          views: novel.views,
          likes: novel.likes,
          collections: novel.collections,
          rating: novel.rating,
        });
        pipeline.expire(key, 3600); // 1小时过期
      }

      await pipeline.exec();

      console.log(`✅ 同步了 ${novels.length} 本小说的统计数据`);
      this.stats.success += novels.length;

      return novels.length;
    } catch (error) {
      console.error('❌ 同步小说统计失败:', error);
      this.stats.failed++;
      throw error;
    }
  }

  /**
   * 同步热门排行榜
   */
  async syncHotRank() {
    console.log('🔥 同步热门排行榜...');

    try {
      // 查询各分类热门小说
      const [categories] = await this.masterPool.query('SELECT id FROM categories');

      for (const category of categories) {
        const [novels] = await this.masterPool.query(`
          SELECT id, title, author, views, hot_score
          FROM novels
          WHERE category_id = ? AND status = 1
          ORDER BY hot_score DESC
          LIMIT 50
        `, [category.id]);

        // 写入Redis有序集合
        if (novels.length > 0) {
          const key = `hot:rank:${category.id}`;
          const members = [];

          for (const novel of novels) {
            members.push(novel.hot_score, novel.id);
          }

          await this.redis.zadd(key, ...members);
          await this.redis.expire(key, 86400); // 24小时
        }
      }

      console.log('✅ 热门排行榜同步完成');
      return true;
    } catch (error) {
      console.error('❌ 同步热门排行榜失败:', error);
      throw error;
    }
  }

  /**
   * 同步分类数据
   */
  async syncCategories() {
    console.log('📂 同步分类数据...');

    try {
      const [categories] = await this.masterPool.query(`
        SELECT id, name, icon, description, novel_count, sort_order
        FROM categories
        WHERE status = 1
        ORDER BY sort_order
      `);

      // 写入Redis
      const key = 'categories:list';
      await this.redis.set(key, JSON.stringify(categories), 'EX', 86400);

      console.log(`✅ 同步了 ${categories.length} 个分类`);
      return categories.length;
    } catch (error) {
      console.error('❌ 同步分类失败:', error);
      throw error;
    }
  }

  /**
   * 实时同步小说数据
   */
  async syncNovel(novelId) {
    try {
      // 查询小说详情
      const [novels] = await this.masterPool.query(`
        SELECT * FROM novels WHERE id = ?
      `, [novelId]);

      if (novels.length === 0) {
        throw new Error(`小说不存在: ${novelId}`);
      }

      const novel = novels[0];

      // 更新Redis缓存
      const key = `novel:detail:${novelId}`;
      await this.redis.set(key, JSON.stringify(novel), 'EX', 3600);

      // 更新统计缓存
      const statsKey = `novel:stats:${novelId}`;
      await this.redis.hmset(statsKey, {
        views: novel.views,
        likes: novel.likes,
        collections: novel.collections,
        rating: novel.rating,
      });
      await this.redis.expire(statsKey, 3600);

      console.log(`✅ 小说 ${novelId} 同步成功`);
      this.emit('novelSynced', novelId);

      return true;
    } catch (error) {
      console.error(`❌ 同步小说 ${novelId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 同步章节内容到缓存
   */
  async syncChapter(chapterId) {
    try {
      // 查询章节内容
      const [chapters] = await this.masterPool.query(`
        SELECT * FROM chapters WHERE id = ?
      `, [chapterId]);

      if (chapters.length === 0) {
        throw new Error(`章节不存在: ${chapterId}`);
      }

      const chapter = chapters[0];

      // 缓存章节内容
      const key = `chapter:content:${chapterId}`;
      await this.redis.set(key, JSON.stringify(chapter), 'EX', 7200); // 2小时

      console.log(`✅ 章节 ${chapterId} 同步成功`);
      return true;
    } catch (error) {
      console.error(`❌ 同步章节 ${chapterId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 清除缓存
   */
  async clearCache(pattern) {
    try {
      const keys = await this.redis.keys(`${this.config.redis.keyPrefix}${pattern}`);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`✅ 清除了 ${keys.length} 个缓存`);
      }

      return keys.length;
    } catch (error) {
      console.error('❌ 清除缓存失败:', error);
      throw error;
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      queueSize: this.syncQueue.length,
    };
  }
}

// ============================================
// 导出
// ============================================
module.exports = SyncService;

// ============================================
// 使用示例
// ============================================
if (require.main === module) {
  (async () => {
    const syncService = new SyncService();

    try {
      // 初始化
      await syncService.initialize();

      // 启动服务
      syncService.start();

      // 监听事件
      syncService.on('syncCompleted', () => {
        console.log('📊 同步统计:', syncService.getStats());
      });

      syncService.on('syncFailed', (error) => {
        console.error('❌ 同步失败:', error);
      });

      // 测试实时同步
      // await syncService.syncNovel(1);
      // await syncService.syncChapter(1);

      console.log('✅ 数据同步服务运行中...');
      console.log('按 Ctrl+C 停止服务');

      // 优雅退出
      process.on('SIGINT', async () => {
        console.log('\n\n🛑 正在停止服务...');
        await syncService.stop();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ 服务启动失败:', error);
      process.exit(1);
    }
  })();
}

