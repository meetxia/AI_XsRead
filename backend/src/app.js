const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const { pool, testConnection } = require('./config/database');
const { runPendingMigrations } = require('../database/migrate');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/logger');
const swaggerSpec = require('./config/swagger');

// 创建Express应用
const app = express();

// ================== 中间件配置 ==================

// 安全头部（允许跨域资源，如前端从不同端口加载图片）
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// 跨域配置
app.use(cors(config.cors));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 响应压缩
app.use(compression());

// Express 在 Nginx 反代后面：信任 X-Forwarded-For，否则 rate-limit 会把所有用户都当成同一个 IP
// 1 = 信任最近的一跳代理（Nginx），不信任更外层
app.set('trust proxy', 1);

// 请求日志
app.use(requestLogger);

// 限流配置（全局兜底，写接口在路由层另有 writeRateLimiter）
// 单 IP 每 15 分钟 600 次（约 40 req/min），覆盖正常浏览场景，恶意刷接口仍然挡得住
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  // 只对 API 路由限流；静态资源、上传文件、健康检查不参与
  skip: (req) => {
    if (req.path === '/api/health') return true;
    if (req.path.startsWith('/uploads/')) return true;
    if (!req.path.startsWith('/api/')) return true;
    return false;
  },
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    timestamp: Date.now()
  }
});

// 应用限流（始终启用，dev 环境放宽到 3000/15min 不影响本地开发）
const isProd = config.server.env === 'production';
const effectiveLimiter = isProd ? limiter : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.path === '/api/health') return true;
    if (req.path.startsWith('/uploads/')) return true;
    if (!req.path.startsWith('/api/')) return true;
    return false;
  }
});
app.use(effectiveLimiter);

// ================== 路由配置 ==================

// 静态文件（上传目录） - 显式允许跨域访问图片
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Timing-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// API 文档（仅非生产环境暴露）
if (config.server.env !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MOMO小说 API 文档'
  }));

  // API 文档 JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// 注册所有路由
app.use('/', routes);

// ================== 错误处理 ==================

// 404处理
app.use(notFound);

// 全局错误处理
app.use(errorHandler);

// ================== 服务器启动 ==================

const startServer = async () => {
  try {
    // 测试数据库连接
    console.log('🔍 正在测试数据库连接...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器启动中止');
      process.exit(1);
    }

    console.log('🔧 正在执行数据库迁移...');
    const migrationsState = await runPendingMigrations(pool);
    app.locals.migrationsState = migrationsState;
    console.log(`✅ 数据库迁移完成，最新版本: ${migrationsState.latestVersion || 'none'}`);

    if (process.env.ENABLE_SCHEDULED_JOBS !== 'false') {
      try {
        const { scheduledJobs } = require('../jobs/scheduledJobs');
        if (scheduledJobs && typeof scheduledJobs.start === 'function') {
          scheduledJobs.start();
          app.locals.scheduledJobs = scheduledJobs;
          console.log('⏰ 定时任务已启动');
        }
      } catch (jobErr) {
        console.warn('⚠️  定时任务启动失败（不影响主服务）:', jobErr.message);
      }
    }

    // 启动服务器
    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('🚀 MOMO小说后端服务启动成功！');
      console.log('========================================');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🌍 环境模式: ${config.server.env}`);
      console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
      console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
      console.log('========================================\n');
      
      console.log('✅ 可用的API端点:');
      console.log('  - POST   /api/auth/register       用户注册');
      console.log('  - POST   /api/auth/login          用户登录');
      console.log('  - GET    /api/auth/me             获取当前用户');
      console.log('  - GET    /api/novels              获取小说列表');
      console.log('  - GET    /api/novels/:id          获取小说详情');
      console.log('  - GET    /api/novels/recommend    获取推荐小说');
      console.log('  - GET    /api/novels/search       搜索小说');
      console.log('  - GET    /api/chapters/:id        获取章节内容');
      console.log('  - GET    /api/user/bookshelf      获取书架');
      console.log('  - POST   /api/user/bookshelf      添加到书架');
      console.log('  - GET    /api/health              健康检查\n');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅退出
process.on('SIGTERM', () => {
  console.log('👋 收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

// 直接运行时启动服务器；测试或 supertest require(app) 时只导出 Express 实例。
if (require.main === module) {
  startServer();
}

module.exports = app;

