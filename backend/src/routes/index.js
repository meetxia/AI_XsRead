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
const systemRoutes = require('./system');
const seoRoutes = require('./seo');
const notificationRoutes = require('./notifications');

// API版本前缀
const API_PREFIX = '/api';

// SEO 索引控制文件（根路径，便于被站点或反代直接暴露）
router.use('/', seoRoutes);

// ============================================================
// 公开端点（必须先于子路由注册，避免被 router.use(authenticate) 误拦）
// ============================================================

// 健康检查（无需登录）
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

// API 根（无需登录）
router.get('/', (req, res) => {
  res.json({
    name: 'MOMO小说 API',
    version: '1.0.0',
    description: 'AI_XsRead Backend API Service',
    documentation: '/api/docs'
  });
});

// 公开的系统端点（必须放在 /api/user 等子路由之前，避免被 authenticate 误拦）
router.use(`${API_PREFIX}/system`, systemRoutes);

// ============================================================
// 子路由注册
// 注意：bookmarkRoutes / interestTagRoutes / achievementRoutes 三个子路由内部使用了
// router.use(authenticate)，必须挂在更具体的前缀（/api/user）下，否则会拦截
// /api/health 等公开端点。
// ============================================================
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}`, novelRoutes); // novels 路径都是 /novels/...
router.use(`${API_PREFIX}`, commentRoutes);
router.use(`${API_PREFIX}/chapters`, chapterRoutes);
router.use(`${API_PREFIX}/user`, userRoutes);
router.use(`${API_PREFIX}/upload`, uploadRoutes);
router.use(`${API_PREFIX}/authors`, authorRoutes);
router.use(`${API_PREFIX}/user`, bookmarkRoutes);          // 路径形如 /api/user/bookmarks
router.use(`${API_PREFIX}`, paragraphCommentRoutes);       // 内部路径 /paragraph-comments/...
router.use(`${API_PREFIX}`, highlightRoutes);              // 内部路径 /highlights、/novels/:id/notes、/user/highlights
router.use(`${API_PREFIX}/user`, interestTagRoutes);       // 路径形如 /api/user/interest-tags
router.use(`${API_PREFIX}/user`, achievementRoutes);       // 路径形如 /api/user/achievements
router.use(`${API_PREFIX}/notifications`, notificationRoutes); // 通知中心 /api/notifications/*

module.exports = router;
