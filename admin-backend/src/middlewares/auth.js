const JWTUtil = require('../utils/jwt');
const Response = require('../utils/response');

/**
 * 认证中间件
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.error(res, '未提供认证令牌', 401);
    }

    const token = authHeader.substring(7); // 移除 "Bearer "

    try {
      // 验证token
      const decoded = JWTUtil.verifyToken(token);
      
      // 将用户信息附加到请求对象
      req.user = decoded;
      
      next();
    } catch (error) {
      return Response.error(res, 'Token无效或已过期', 401);
    }
  } catch (error) {
    return Response.error(res, '认证失败', 401);
  }
};

/**
 * 管理员权限中间件
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return Response.error(res, '需要管理员权限', 403);
  }
  next();
};

/**
 * 超级管理员权限中间件
 */
const superAdminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return Response.error(res, '需要超级管理员权限', 403);
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  superAdminMiddleware
};

