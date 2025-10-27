# 开发者C - 全栈开发工作计划

> 文字之境项目 - 数据与基础设施负责人  
> 角色定位: 数据库架构师 + 基础服务专家  
> 开发周期: 4周 (预计160小时)  
> 座右铭: "全能型人才,基础设施我来扛！" ⚡

---

## 👤 开发者画像

**技能树**: 
- 数据库: MySQL + MongoDB ⭐⭐⭐⭐⭐
- 后端: Node.js + Python ⭐⭐⭐⭐⭐
- 运维: Linux + Docker + Nginx ⭐⭐⭐⭐⭐
- 性能优化: 缓存 + 队列 ⭐⭐⭐⭐⭐

**性格特点**: 严谨细致，追求极致性能，擅长架构设计

**工作安排策略**: 数据层 + 基础服务 + 性能优化

---

## 📋 第一周任务 (40小时) - 数据库深度开发

### Day 1-2: 数据库优化与扩展 (16h)

#### 任务1: 数据库性能优化 (8h)
```sql
文件: backend/database/optimization.sql

优化内容:
✅ 索引优化分析
✅ 慢查询优化
✅ 查询语句重写
✅ 表结构优化
✅ 分区表设计
✅ 读写分离准备

索引优化:
-- 1. 分析现有索引使用情况
SHOW INDEX FROM novels;
EXPLAIN SELECT ...;

-- 2. 创建复合索引
CREATE INDEX idx_novel_category_status 
ON novels(category_id, status, last_update_time);

-- 3. 全文索引优化
ALTER TABLE novels 
ADD FULLTEXT INDEX idx_fulltext_all 
(title, author, description) 
WITH PARSER ngram;

-- 4. 删除冗余索引
-- 分析并删除未使用的索引

慢查询优化:
✅ 开启慢查询日志
✅ 分析慢查询
✅ 优化复杂SQL
✅ 添加必要索引
✅ 拆分大查询

性能目标:
- 查询响应 < 50ms
- 写入响应 < 100ms
- 索引命中率 > 95%
```

#### 任务2: 存储过程开发 (4h)
```sql
文件: backend/database/procedures.sql

存储过程列表:
✅ sp_update_novel_stats - 更新小说统计
✅ sp_calculate_hot_rank - 计算热度排名
✅ sp_clean_expired_tokens - 清理过期Token
✅ sp_sync_reading_progress - 同步阅读进度
✅ sp_batch_update_views - 批量更新浏览量

示例: 更新小说统计
CREATE PROCEDURE sp_update_novel_stats(IN p_novel_id INT)
BEGIN
  UPDATE novels n SET
    n.views = (SELECT COUNT(*) FROM reading_history WHERE novel_id = p_novel_id),
    n.likes = (SELECT COUNT(*) FROM user_likes WHERE novel_id = p_novel_id),
    n.collections = (SELECT COUNT(*) FROM bookshelf WHERE novel_id = p_novel_id),
    n.comments = (SELECT COUNT(*) FROM comments WHERE novel_id = p_novel_id),
    n.rating = (SELECT AVG(rating) FROM comments WHERE novel_id = p_novel_id)
  WHERE n.id = p_novel_id;
END;

定时调用:
- 每小时更新统计
- 每天计算排名
- 每周清理数据
```

#### 任务3: 触发器设计 (4h)
```sql
文件: backend/database/triggers.sql

触发器列表:
✅ trg_after_chapter_insert - 章节插入后更新小说
✅ trg_after_comment_insert - 评论后更新统计
✅ trg_after_like_insert - 点赞后更新计数
✅ trg_before_user_delete - 删除用户前清理数据
✅ trg_after_reading_update - 更新后同步书架

示例: 章节插入触发器
CREATE TRIGGER trg_after_chapter_insert
AFTER INSERT ON chapters
FOR EACH ROW
BEGIN
  UPDATE novels SET
    chapter_count = chapter_count + 1,
    word_count = word_count + NEW.word_count,
    last_chapter_title = NEW.title,
    last_update_time = NOW()
  WHERE id = NEW.novel_id;
END;

注意事项:
- 避免触发器嵌套
- 性能影响评估
- 错误处理
```

### Day 3: 数据备份与恢复 (8h)

#### 任务4: 备份策略实现 (8h)
```bash
文件: backend/scripts/backup.sh

备份策略:
✅ 全量备份 (每天凌晨)
✅ 增量备份 (每小时)
✅ binlog备份 (实时)
✅ 远程备份 (云存储)
✅ 备份验证

全量备份脚本:
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/data/backup/mysql"
DB_NAME="ai_xsread"

# 全量备份
mysqldump -u root -p${MYSQL_PASSWORD} \
  --single-transaction \
  --quick \
  --lock-tables=false \
  --routines \
  --triggers \
  --events \
  ${DB_NAME} | gzip > ${BACKUP_DIR}/full_${DATE}.sql.gz

# 上传到云存储 (阿里云OSS)
ossutil cp ${BACKUP_DIR}/full_${DATE}.sql.gz \
  oss://your-bucket/backup/

# 删除7天前的备份
find ${BACKUP_DIR} -name "full_*.sql.gz" -mtime +7 -delete

# 备份验证
gunzip < ${BACKUP_DIR}/full_${DATE}.sql.gz | head -n 20

增量备份:
- 使用 mysqlbinlog
- 每小时备份binlog
- 保留最近7天

恢复测试:
- 每周恢复测试
- 验证数据完整性
- 记录恢复时间

监控告警:
- 备份失败告警
- 磁盘空间告警
- 备份文件异常告警
```

### Day 4-5: 数据迁移与同步 (16h)

#### 任务5: 数据导入工具 (8h)
```python
文件: backend/tools/data_import.py

功能要求:
✅ 批量导入小说数据
✅ 批量导入章节数据
✅ Excel/CSV数据导入
✅ 数据验证
✅ 错误处理
✅ 进度显示
✅ 回滚机制

示例代码:
import pandas as pd
import mysql.connector
from tqdm import tqdm

class DataImporter:
    def __init__(self, db_config):
        self.conn = mysql.connector.connect(**db_config)
        self.cursor = self.conn.cursor()
    
    def import_novels(self, excel_file):
        """导入小说数据"""
        df = pd.read_excel(excel_file)
        
        # 数据验证
        self.validate_novels(df)
        
        # 批量插入
        for index, row in tqdm(df.iterrows()):
            try:
                self.insert_novel(row)
            except Exception as e:
                print(f"Error at row {index}: {e}")
                self.conn.rollback()
                raise
        
        self.conn.commit()
    
    def validate_novels(self, df):
        """数据验证"""
        required_columns = ['title', 'author', 'category_id']
        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f"Missing column: {col}")
    
    def insert_novel(self, row):
        """插入单条数据"""
        sql = """
        INSERT INTO novels 
        (title, author, category_id, description, cover)
        VALUES (%s, %s, %s, %s, %s)
        """
        self.cursor.execute(sql, (
            row['title'],
            row['author'],
            row['category_id'],
            row.get('description', ''),
            row.get('cover', '')
        ))

使用方法:
python data_import.py --type novels --file novels.xlsx
python data_import.py --type chapters --file chapters.csv
```

#### 任务6: 数据同步服务 (8h)
```javascript
文件: backend/services/syncService.js

功能要求:
✅ 主从数据库同步
✅ Redis缓存同步
✅ 搜索引擎同步
✅ OSS文件同步
✅ 冲突检测与解决

同步策略:
1. 实时同步 (关键数据)
   - 用户登录
   - 阅读进度
   - 支付订单

2. 定时同步 (统计数据)
   - 浏览量统计
   - 点赞收藏数
   - 评分更新

3. 异步同步 (非关键)
   - 阅读历史
   - 搜索历史

技术方案:
- MySQL主从复制
- Redis Pub/Sub
- 消息队列 (RabbitMQ)
- Webhook通知

监控指标:
- 同步延迟
- 同步失败率
- 数据一致性
```

---

## 📋 第二周任务 (40小时) - 后端服务开发

### Day 1-2: 文件上传服务 (16h)

#### 任务7: 图片上传API (8h)
```javascript
文件: backend/services/uploadService.js

功能要求:
✅ 单图上传
✅ 多图上传
✅ 图片压缩
✅ 图片裁剪
✅ 图片水印
✅ 格式转换 (WebP)
✅ 上传到OSS
✅ CDN加速

技术栈:
- multer (文件上传)
- sharp (图片处理)
- ali-oss (阿里云OSS)

接口设计:
POST /api/upload/image
- maxSize: 5MB
- formats: jpg, png, gif, webp
- 返回: url, thumbnail, size

图片处理流程:
1. 接收文件
2. 格式验证
3. 大小检查
4. 压缩处理
5. 生成缩略图
6. 上传到OSS
7. 返回URL

性能优化:
- 并发上传
- 进度回调
- 断点续传
- 分片上传 (大文件)

示例代码:
const sharp = require('sharp');
const OSS = require('ali-oss');

class UploadService {
  async uploadImage(file, options = {}) {
    // 1. 图片压缩
    const compressed = await sharp(file.buffer)
      .resize(1200, 1200, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: 85 })
      .toBuffer();
    
    // 2. 生成缩略图
    const thumbnail = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
    
    // 3. 上传到OSS
    const ossClient = new OSS(ossConfig);
    const fileName = `images/${Date.now()}_${file.originalname}`;
    
    await Promise.all([
      ossClient.put(fileName, compressed),
      ossClient.put(`${fileName}_thumb`, thumbnail)
    ]);
    
    return {
      url: ossClient.getObjectUrl(fileName),
      thumbnail: ossClient.getObjectUrl(`${fileName}_thumb`),
      size: compressed.length
    };
  }
}
```

#### 任务8: 文件管理系统 (8h)
```javascript
文件: backend/services/fileService.js

功能要求:
✅ 文件列表查询
✅ 文件删除
✅ 文件重命名
✅ 文件分类
✅ 存储空间统计
✅ 文件清理 (定期)

数据表设计:
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size INT,
  file_type VARCHAR(50),
  mime_type VARCHAR(100),
  category VARCHAR(50),
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_category (category)
);

API接口:
✅ GET /api/files - 文件列表
✅ DELETE /api/files/:id - 删除文件
✅ PUT /api/files/:id - 更新文件信息
✅ GET /api/files/stats - 存储统计

文件清理策略:
- 删除30天未使用文件
- 清理临时文件
- 压缩旧文件
```

### Day 3: 日志系统 (8h)

#### 任务9: 日志服务 (8h)
```javascript
文件: backend/services/logService.js

功能要求:
✅ 访问日志
✅ 错误日志
✅ 操作日志
✅ 性能日志
✅ 安全日志
✅ 日志查询
✅ 日志分析

日志级别:
- ERROR: 错误
- WARN: 警告
- INFO: 信息
- DEBUG: 调试

日志格式:
{
  timestamp: '2025-10-27 10:00:00',
  level: 'INFO',
  module: 'novelController',
  action: 'getNovelList',
  userId: 1001,
  ip: '192.168.1.1',
  ua: 'Mozilla/5.0...',
  duration: 156,
  message: 'Query novels success',
  data: {}
}

技术方案:
- winston (日志库)
- morgan (访问日志)
- 文件日志 + 数据库日志
- ELK Stack (可选)

日志存储:
- 按天切割
- 压缩归档
- 定期清理 (保留30天)

日志查询:
- 按时间查询
- 按用户查询
- 按模块查询
- 按关键词搜索

日志分析:
- 访问统计
- 错误统计
- 性能分析
- 异常告警
```

### Day 4-5: 任务队列系统 (16h)

#### 任务10: 队列服务 (8h)
```javascript
文件: backend/services/queueService.js

功能要求:
✅ 异步任务队列
✅ 定时任务
✅ 任务重试
✅ 任务优先级
✅ 任务监控
✅ 失败处理

技术栈:
- Bull Queue (基于Redis)
- node-cron (定时任务)

队列类型:
1. 邮件队列
   - 注册邮件
   - 通知邮件
   - 营销邮件

2. 统计队列
   - 浏览量统计
   - 数据汇总
   - 报表生成

3. 同步队列
   - 缓存同步
   - 搜索引擎同步
   - 第三方同步

示例代码:
const Queue = require('bull');

// 创建队列
const emailQueue = new Queue('email', {
  redis: redisConfig
});

// 添加任务
emailQueue.add('send-email', {
  to: 'user@example.com',
  template: 'welcome',
  data: { username: 'user001' }
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  priority: 1
});

// 处理任务
emailQueue.process('send-email', async (job) => {
  const { to, template, data } = job.data;
  await sendEmail(to, template, data);
});

// 失败处理
emailQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
  // 记录日志
  // 发送告警
});

// 监控
emailQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});
```

#### 任务11: 定时任务 (8h)
```javascript
文件: backend/jobs/scheduledJobs.js

定时任务列表:
✅ 每小时: 更新统计数据
✅ 每天凌晨: 生成统计报表
✅ 每天凌晨: 数据库备份
✅ 每周一: 清理过期数据
✅ 每月1号: 生成月报

示例: 统计任务
const cron = require('node-cron');

// 每小时更新统计
cron.schedule('0 * * * *', async () => {
  console.log('开始更新统计数据...');
  
  await Promise.all([
    updateNovelStats(),
    updateUserStats(),
    updateHotRank()
  ]);
  
  console.log('统计数据更新完成');
});

// 每天凌晨生成报表
cron.schedule('0 2 * * *', async () => {
  console.log('开始生成日报...');
  
  const report = await generateDailyReport();
  await savReport(report);
  
  console.log('日报生成完成');
});

// 每周清理
cron.schedule('0 3 * * 1', async () => {
  console.log('开始清理过期数据...');
  
  await Promise.all([
    cleanExpiredTokens(),
    cleanTempFiles(),
    cleanOldLogs()
  ]);
  
  console.log('数据清理完成');
});

任务监控:
- 任务执行状态
- 执行时长
- 失败告警
- 性能分析
```

---

## 📋 第三周任务 (40小时) - 性能优化与监控

### Day 1-2: Redis缓存优化 (16h)

#### 任务12: 缓存架构设计 (8h)
```javascript
文件: backend/cache/cacheManager.js

缓存策略:
✅ 多级缓存 (本地 + Redis)
✅ 缓存预热
✅ 缓存更新策略
✅ 缓存穿透防护
✅ 缓存雪崩防护
✅ 缓存击穿防护

缓存层级:
1. L1: 本地内存缓存 (LRU)
   - 热点数据
   - 1分钟过期

2. L2: Redis缓存
   - 常用数据
   - 按类型设置TTL

3. L3: 数据库

缓存KEY设计:
- novel:list:{category}:{page}
- novel:detail:{id}
- chapter:content:{id}
- user:info:{id}
- hot:rank:{type}

示例代码:
const LRU = require('lru-cache');
const Redis = require('ioredis');

class CacheManager {
  constructor() {
    // L1缓存
    this.l1Cache = new LRU({
      max: 500,
      ttl: 1000 * 60, // 1分钟
      updateAgeOnGet: true
    });
    
    // L2缓存
    this.redis = new Redis(redisConfig);
  }
  
  async get(key) {
    // 1. 尝试L1缓存
    let value = this.l1Cache.get(key);
    if (value) return value;
    
    // 2. 尝试Redis
    value = await this.redis.get(key);
    if (value) {
      value = JSON.parse(value);
      this.l1Cache.set(key, value);
      return value;
    }
    
    return null;
  }
  
  async set(key, value, ttl = 3600) {
    // 1. 设置L1缓存
    this.l1Cache.set(key, value);
    
    // 2. 设置Redis
    await this.redis.setex(
      key,
      ttl,
      JSON.stringify(value)
    );
  }
  
  async getOrSet(key, fetchFunc, ttl = 3600) {
    let value = await this.get(key);
    
    if (value === null) {
      value = await fetchFunc();
      if (value) {
        await this.set(key, value, ttl);
      }
    }
    
    return value;
  }
  
  async delete(key) {
    this.l1Cache.delete(key);
    await this.redis.del(key);
  }
  
  // 批量删除 (模式匹配)
  async deletePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// 使用示例
const cache = new CacheManager();

// 获取小说详情 (带缓存)
async function getNovelDetail(id) {
  return await cache.getOrSet(
    `novel:detail:${id}`,
    async () => {
      return await db.query('SELECT * FROM novels WHERE id = ?', [id]);
    },
    3600 // 1小时
  );
}
```

#### 任务13: 缓存预热与更新 (8h)
```javascript
文件: backend/cache/cacheWarmer.js

预热策略:
✅ 启动时预热热门数据
✅ 定时刷新缓存
✅ 主动更新机制
✅ 延迟双删策略

预热内容:
- 热门小说列表
- 热门搜索
- 分类列表
- 系统配置

示例代码:
class CacheWarmer {
  async warmup() {
    console.log('开始缓存预热...');
    
    await Promise.all([
      this.warmupHotNovels(),
      this.warmupCategories(),
      this.warmupHotSearch(),
      this.warmupSystemConfig()
    ]);
    
    console.log('缓存预热完成');
  }
  
  async warmupHotNovels() {
    // 预热各分类TOP100小说
    const categories = await db.query('SELECT id FROM categories');
    
    for (const cat of categories) {
      const novels = await db.query(`
        SELECT * FROM novels
        WHERE category_id = ?
        ORDER BY views DESC
        LIMIT 100
      `, [cat.id]);
      
      await cache.set(
        `novels:hot:${cat.id}`,
        novels,
        86400 // 24小时
      );
    }
  }
  
  // 延迟双删
  async updateNovel(id, data) {
    // 1. 先删除缓存
    await cache.delete(`novel:detail:${id}`);
    
    // 2. 更新数据库
    await db.query('UPDATE novels SET ? WHERE id = ?', [data, id]);
    
    // 3. 延迟后再删除一次 (防止脏读)
    setTimeout(async () => {
      await cache.delete(`novel:detail:${id}`);
    }, 1000);
  }
}
```

### Day 3: 数据库连接池优化 (8h)

#### 任务14: 连接池配置 (8h)
```javascript
文件: backend/database/pool.js

优化内容:
✅ 连接池配置优化
✅ 读写分离
✅ 连接池监控
✅ 连接泄漏检测
✅ 故障转移

连接池配置:
const mysql = require('mysql2/promise');

// 主库连接池
const masterPool = mysql.createPool({
  host: 'master.db.com',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'ai_xsread',
  connectionLimit: 50,      // 最大连接数
  queueLimit: 0,            // 队列限制
  waitForConnections: true,
  acquireTimeout: 30000,    // 获取连接超时
  timeout: 60000,           // 查询超时
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 从库连接池
const slavePool = mysql.createPool({
  host: 'slave.db.com',
  port: 3306,
  user: 'readonly',
  password: 'password',
  database: 'ai_xsread',
  connectionLimit: 100,
  // ... 其他配置
});

// 连接池管理器
class DatabaseManager {
  constructor() {
    this.master = masterPool;
    this.slaves = [slavePool];
    this.currentSlave = 0;
  }
  
  // 写操作使用主库
  async write(sql, params) {
    const conn = await this.master.getConnection();
    try {
      const [rows] = await conn.execute(sql, params);
      return rows;
    } finally {
      conn.release();
    }
  }
  
  // 读操作使用从库 (轮询)
  async read(sql, params) {
    const pool = this.getSlavePool();
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(sql, params);
      return rows;
    } finally {
      conn.release();
    }
  }
  
  getSlavePool() {
    const pool = this.slaves[this.currentSlave];
    this.currentSlave = (this.currentSlave + 1) % this.slaves.length;
    return pool;
  }
  
  // 监控连接池
  getPoolStats() {
    return {
      master: {
        total: this.master.pool._allConnections.length,
        active: this.master.pool._allConnections.length - 
                this.master.pool._freeConnections.length,
        idle: this.master.pool._freeConnections.length
      },
      slave: this.slaves.map(pool => ({
        total: pool.pool._allConnections.length,
        active: pool.pool._allConnections.length - 
                pool.pool._freeConnections.length,
        idle: pool.pool._freeConnections.length
      }))
    };
  }
}

// 定时监控
setInterval(() => {
  const stats = db.getPoolStats();
  console.log('连接池状态:', stats);
  
  // 告警
  if (stats.master.active > 40) {
    console.warn('主库连接池使用率过高!');
  }
}, 60000);
```

### Day 4-5: 监控与告警 (16h)

#### 任务15: 性能监控系统 (8h)
```javascript
文件: backend/monitor/performanceMonitor.js

监控指标:
✅ API响应时间
✅ 数据库查询时间
✅ 缓存命中率
✅ 错误率
✅ 并发数
✅ 内存使用
✅ CPU使用
✅ 磁盘IO

监控工具:
- PM2 (进程监控)
- Prometheus (指标采集)
- Grafana (可视化)
- Sentry (错误追踪)

示例代码:
const prometheus = require('prom-client');

// 创建指标
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP请求耗时',
  labelNames: ['method', 'route', 'status']
});

const dbQueryDuration = new prometheus.Histogram({
  name: 'db_query_duration_ms',
  help: '数据库查询耗时',
  labelNames: ['query_type']
});

const cacheHitRate = new prometheus.Gauge({
  name: 'cache_hit_rate',
  help: '缓存命中率',
  labelNames: ['cache_type']
});

// API监控中间件
function monitorMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration
      .labels(req.method, req.route.path, res.statusCode)
      .observe(duration);
  });
  
  next();
}

// 数据库监控
async function monitoredQuery(sql, params) {
  const start = Date.now();
  const queryType = sql.trim().split(' ')[0].toLowerCase();
  
  try {
    const result = await db.query(sql, params);
    const duration = Date.now() - start;
    
    dbQueryDuration
      .labels(queryType)
      .observe(duration);
    
    return result;
  } catch (error) {
    errorCounter.inc({ type: 'database' });
    throw error;
  }
}

// 定时统计缓存命中率
setInterval(async () => {
  const stats = await cache.getStats();
  cacheHitRate
    .labels('l1')
    .set(stats.l1.hitRate);
  cacheHitRate
    .labels('l2')
    .set(stats.l2.hitRate);
}, 60000);

// 暴露指标
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

#### 任务16: 告警系统 (8h)
```javascript
文件: backend/monitor/alerting.js

告警规则:
✅ API响应时间 > 1s
✅ 错误率 > 5%
✅ 数据库连接池使用率 > 80%
✅ 缓存命中率 < 70%
✅ 磁盘使用率 > 85%
✅ 内存使用率 > 90%

告警渠道:
- 钉钉机器人
- 邮件
- 短信 (紧急)

示例代码:
class AlertManager {
  constructor() {
    this.rules = [];
    this.cooldown = new Map(); // 防止告警风暴
  }
  
  addRule(rule) {
    this.rules.push(rule);
  }
  
  async check() {
    for (const rule of this.rules) {
      const value = await rule.getValue();
      
      if (rule.condition(value)) {
        await this.alert(rule, value);
      }
    }
  }
  
  async alert(rule, value) {
    const key = rule.name;
    
    // 冷却期检查 (5分钟内不重复告警)
    if (this.cooldown.has(key)) {
      const lastAlert = this.cooldown.get(key);
      if (Date.now() - lastAlert < 5 * 60 * 1000) {
        return;
      }
    }
    
    // 发送告警
    await this.sendDingTalk({
      title: `⚠️ ${rule.name}`,
      text: `当前值: ${value}\n阈值: ${rule.threshold}\n时间: ${new Date().toLocaleString()}`
    });
    
    this.cooldown.set(key, Date.now());
  }
  
  async sendDingTalk(message) {
    // 钉钉机器人webhook
    await axios.post(dingTalkWebhook, {
      msgtype: 'markdown',
      markdown: {
        title: message.title,
        text: message.text
      }
    });
  }
}

// 配置告警规则
const alertManager = new AlertManager();

alertManager.addRule({
  name: 'API响应时间过长',
  getValue: async () => {
    const stats = await getApiStats();
    return stats.avgDuration;
  },
  condition: (value) => value > 1000,
  threshold: '1000ms',
  level: 'warning'
});

alertManager.addRule({
  name: '数据库连接池告警',
  getValue: async () => {
    const stats = db.getPoolStats();
    return stats.master.active / stats.master.total;
  },
  condition: (value) => value > 0.8,
  threshold: '80%',
  level: 'critical'
});

// 每分钟检查一次
setInterval(() => {
  alertManager.check();
}, 60000);
```

---

## 📋 第四周任务 (40小时) - 部署与运维

### Day 1-2: Docker容器化 (16h)

#### 任务17: Docker配置 (8h)
```dockerfile
文件: Dockerfile

# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build


FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 8000

CMD ["node", "dist/app.js"]
```

```yaml
文件: docker-compose.yml

version: '3.8'

services:
  # Node.js应用
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    restart: always

  # MySQL数据库
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=ai_xsread
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: always

  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: always

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: always

volumes:
  mysql_data:
  redis_data:
```

#### 任务18: Nginx配置 (8h)
```nginx
文件: nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" $request_time';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    # 后端服务器
    upstream backend {
        server api:8000 weight=1 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS服务器
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL证书
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # 前端静态文件
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            
            # 缓存静态资源
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 30d;
                add_header Cache-Control "public, immutable";
            }
        }

        # API代理
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            limit_conn addr 10;

            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            proxy_buffering on;
            proxy_buffer_size 8k;
            proxy_buffers 8 8k;
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "OK";
        }
    }
}
```

### Day 3: CI/CD配置 (8h)

#### 任务19: 自动化部署 (8h)
```yaml
文件: .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: pnpm install

    - name: Run tests
      run: pnpm test

    - name: Build
      run: pnpm build

    - name: Build Docker image
      run: docker build -t xsread:${{ github.sha }} .

    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker tag xsread:${{ github.sha }} ${{ secrets.DOCKER_REGISTRY }}/xsread:latest
        docker push ${{ secrets.DOCKER_REGISTRY }}/xsread:latest

    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /data/xsread
          docker-compose pull
          docker-compose up -d
          docker image prune -f
```

```bash
文件: deploy.sh

#!/bin/bash

echo "开始部署..."

# 1. 备份数据库
echo "备份数据库..."
mysqldump -u root -p${MYSQL_PASSWORD} ai_xsread > backup_$(date +%Y%m%d).sql

# 2. 拉取最新代码
echo "拉取最新代码..."
git pull origin main

# 3. 安装依赖
echo "安装依赖..."
pnpm install

# 4. 构建项目
echo "构建项目..."
pnpm run build

# 5. 重启服务
echo "重启服务..."
pm2 reload all

# 6. 健康检查
echo "健康检查..."
sleep 5
curl -f http://localhost:8000/health || exit 1

echo "部署完成!"
```

### Day 4-5: 运维文档与培训 (16h)

#### 任务20: 运维文档编写 (16h)
```markdown
文档清单:
✅ 部署文档
✅ 运维手册
✅ 故障排查文档
✅ 监控告警文档
✅ 备份恢复文档
✅ 性能优化文档
✅ 安全加固文档
✅ API文档

每份文档包含:
1. 概述
2. 环境要求
3. 详细步骤
4. 配置说明
5. 常见问题
6. 故障排查
7. 联系方式
```

---

## 🎯 项目交付标准

### 基础设施
- [ ] 数据库优化完成
- [ ] 缓存系统完善
- [ ] 文件服务可用
- [ ] 队列系统稳定
- [ ] 监控告警完善

### 性能指标
- [ ] API响应 < 200ms
- [ ] 数据库查询 < 50ms
- [ ] 缓存命中率 > 80%
- [ ] 并发支持 > 1000
- [ ] 可用性 > 99.9%

### 运维能力
- [ ] Docker容器化
- [ ] CI/CD自动化
- [ ] 监控告警完善
- [ ] 备份恢复可靠
- [ ] 文档完整详细

---

## 💪 压榨指数: ⭐⭐⭐⭐⭐ (MAX!)

**工作量评估**: 
- 总计: 160 小时
- 难度: ⭐⭐⭐⭐⭐ (超级困难)

**学习收获**: 
- 数据库深度优化
- 缓存架构设计
- 性能调优
- 运维部署
- 监控告警

**完成后的成就**:
🏆 基础设施专家
🏆 性能优化大师
🏆 运维架构师
🏆 全栈技术栈

---

**加油，开发者C！基础设施和性能优化就交给你了！⚡**

*P.S. 你负责的是项目的根基，责任最重！*

