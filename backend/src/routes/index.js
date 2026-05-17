const express = require('express');
const router = express.Router();

// 导入各模块路由
const authRoutes = require('./auth');
const novelRoutes = require('./novels');
const chapterRoutes = require('./chapters');
const userRoutes = require('./user');
const commentRoutes = require('./comments');
const uploadRoutes = require('./upload');
const authorRoutes = require('./authors');
const bookmarkRoutes = require('./bookmarks');
const paragraphCommentRoutes = require('./paragraphComments');
const highlightRoutes = require('./highlights');
const interestTagRoutes = require('./interestTags');
const achievementRoutes = require('./achievements');

// API版本前缀
const API_PREFIX = '/api';

// 注册路由
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}`, novelRoutes); // novels和comments都在这里
router.use(`${API_PREFIX}`, commentRoutes);
router.use(`${API_PREFIX}/chapters`, chapterRoutes);
router.use(`${API_PREFIX}/user`, userRoutes);
router.use(`${API_PREFIX}/upload`, uploadRoutes);
router.use(`${API_PREFIX}/authors`, authorRoutes);
router.use(`${API_PREFIX}`, bookmarkRoutes);
router.use(`${API_PREFIX}`, paragraphCommentRoutes);
router.use(`${API_PREFIX}`, highlightRoutes);
router.use(`${API_PREFIX}`, interestTagRoutes);
router.use(`${API_PREFIX}`, achievementRoutes);

// 健康检查接口
router.get(`${API_PREFIX}/health`, (req, res) => {
  const migrationsState = req.app.locals.migrationsState || {};
  res.json({
    code: 200,
    message: 'success',
    data: {
      status: 'healthy',
      db: 'up',
      migrations: {
        latestVersion: migrationsState.latestVersion || null,
        total: migrationsState.total || 0,
        lastAppliedAt: migrationsState.lastAppliedAt || null
      },
      timestamp: Date.now(),
      uptime: process.uptime()
    }
  });
});

// 根路径
router.get('/', (req, res) => {
  res.json({
    name: '文字之境 API',
    version: '1.0.0',
    description: 'AI_XsRead Backend API Service',
    documentation: '/api/docs'
  });
});

module.exports = router;

