const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { devLogger } = require('./middlewares/logger');

// 创建Express应用
const app = express();

// ===== 安全中间件 =====
app.use(helmet());

// ===== CORS配置 =====
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// ===== 速率限制 =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100个请求
  message: '请求过于频繁，请稍后再试'
});

app.use('/api/admin/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: '登录尝试次数过多，请15分钟后再试'
}));

app.use('/api', limiter);

// ===== 基础中间件 =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 开发环境日志
if (config.env === 'development') {
  app.use(devLogger);
}

// ===== 静态文件服务 =====
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== 根路由 =====
app.get('/', (req, res) => {
  res.json({
    name: 'MOMO小说后台管理API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// ===== API路由 =====
app.use('/api', routes);

// ===== 404处理 =====
app.use(notFoundHandler);

// ===== 错误处理 =====
app.use(errorHandler);

module.exports = app;
