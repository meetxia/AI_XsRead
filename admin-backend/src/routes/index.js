const express = require('express');
const router = express.Router();

// 导入各模块路由
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const novelRoutes = require('./novels');
const chapterRoutes = require('./chapters');
const userRoutes = require('./users');
const commentRoutes = require('./comments');
const uploadRoutes = require('./upload');
const codeRoutes = require('./codes');
const systemRoutes = require('./system');

// 挂载路由
router.use('/admin', authRoutes);
router.use('/admin/dashboard', dashboardRoutes);
router.use('/admin/novels', novelRoutes);
router.use('/admin/chapters', chapterRoutes);
router.use('/admin/users', userRoutes);
router.use('/admin/comments', commentRoutes);
router.use('/admin/upload', uploadRoutes);
router.use('/admin/codes', codeRoutes);
router.use('/admin/system', systemRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;

