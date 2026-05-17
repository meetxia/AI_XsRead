const jwt = require('jsonwebtoken');
const config = require('../config');
const Response = require('../utils/response');

/**
 * JWT认证中间件
 */
const authenticate = async (req, res, next) => {
  try {
    // 获取token
    const authHeader = req.headers.authorization;

    console.log('🔐 认证检查:', {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? authHeader.substring(0, 20) + '...' : 'null'
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ 认证失败: 未提供认证令牌或格式错误');
      return Response.error(res, '请先登录', 401);
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);

    console.log('✅ Token验证成功:', {
      userId: decoded.id,
      username: decoded.username
    });

    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.log('❌ Token验证失败:', {
      errorName: error.name,
      errorMessage: error.message
    });

    if (error.name === 'TokenExpiredError') {
      return Response.error(res, '请先登录', 401);
    } else if (error.name === 'JsonWebTokenError') {
      // Token 签名无效,可能是密钥更改了
      return Response.error(res, '请先登录', 401);
    }
    return Response.error(res, '请先登录', 401);
  }
};

/**
 * 可选认证中间件（不强制要求登录）
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret);
      
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      };
    }
    
    next();
  } catch (error) {
    // 认证失败不阻止请求，继续执行
    next();
  }
};

/**
 * 角色验证中间件
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return Response.error(res, '请先登录', 401);
    }
    
    if (!roles.includes(req.user.role)) {
      return Response.error(res, '权限不足', 403);
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  optionalAuth: optionalAuthenticate,
  authorize
};

