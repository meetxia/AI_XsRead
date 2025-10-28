/**
 * CSRF (跨站请求伪造) 防护中间件
 */
const csrf = require('csurf');
const { ErrorCodes, getErrorMessage } = require('../constants/errorCodes');
const AppError = require('../utils/AppError');

// CSRF保护配置
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // 生产环境使用HTTPS
    sameSite: 'strict',
    maxAge: 3600000 // 1小时
  }
});

/**
 * CSRF Token生成中间件
 */
const generateCsrfToken = (req, res, next) => {
  csrfProtection(req, res, (err) => {
    if (err) {
      return next(new AppError(
        ErrorCodes.FORBIDDEN,
        'CSRF验证失败',
        err.message
      ));
    }
    next();
  });
};

/**
 * 获取CSRF Token的路由处理器
 */
const getCsrfToken = (req, res) => {
  res.json({
    code: 200,
    message: '成功',
    data: {
      csrfToken: req.csrfToken()
    },
    timestamp: Date.now()
  });
};

/**
 * 验证CSRF Token
 * 可以通过以下方式提供token:
 * 1. 请求头: X-CSRF-Token
 * 2. 请求体: _csrf
 * 3. 查询参数: _csrf
 */
const verifyCsrfToken = (req, res, next) => {
  // GET、HEAD、OPTIONS请求不需要CSRF验证
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 开发环境可以选择性跳过CSRF验证
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_CSRF === 'true') {
    console.warn('⚠️  开发环境跳过CSRF验证');
    return next();
  }

  csrfProtection(req, res, (err) => {
    if (err) {
      return next(new AppError(
        ErrorCodes.FORBIDDEN,
        'CSRF验证失败，请刷新页面后重试',
        process.env.NODE_ENV === 'development' ? err.message : null
      ));
    }
    next();
  });
};

/**
 * 条件性CSRF保护
 * 只对指定的路由应用CSRF保护
 * @param {Array<string>} protectedPaths - 需要保护的路径（正则表达式字符串）
 */
const conditionalCsrfProtection = (protectedPaths = []) => {
  return (req, res, next) => {
    // 检查是否匹配保护路径
    const shouldProtect = protectedPaths.some(pathPattern => {
      const regex = new RegExp(pathPattern);
      return regex.test(req.path);
    });

    if (shouldProtect) {
      return verifyCsrfToken(req, res, next);
    }

    next();
  };
};

module.exports = {
  csrfProtection,
  generateCsrfToken,
  getCsrfToken,
  verifyCsrfToken,
  conditionalCsrfProtection
};

