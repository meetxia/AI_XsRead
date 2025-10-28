const AppError = require('../utils/AppError');
const { ErrorCodes, getErrorMessage } = require('../constants/errorCodes');

/**
 * 日志记录器
 */
const logError = (err, req) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    }
  };

  // 区分错误级别
  if (err.httpStatus >= 500) {
    console.error('❌ 服务器错误:', JSON.stringify(errorLog, null, 2));
  } else if (err.httpStatus >= 400) {
    console.warn('⚠️  客户端错误:', JSON.stringify(errorLog, null, 2));
  } else {
    console.log('ℹ️  请求错误:', JSON.stringify(errorLog, null, 2));
  }
};

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 自定义应用错误
  if (err instanceof AppError) {
    logError(err, req);
    return res.status(err.httpStatus).json(err.toJSON(process.env.NODE_ENV === 'development'));
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    const appError = new AppError(
      ErrorCodes.AUTH_TOKEN_INVALID,
      getErrorMessage(ErrorCodes.AUTH_TOKEN_INVALID)
    );
    logError(appError, req);
    return res.status(401).json(appError.toJSON());
  }

  if (err.name === 'TokenExpiredError') {
    const appError = new AppError(
      ErrorCodes.AUTH_TOKEN_EXPIRED,
      getErrorMessage(ErrorCodes.AUTH_TOKEN_EXPIRED)
    );
    logError(appError, req);
    return res.status(401).json(appError.toJSON());
  }

  // 数据库错误
  if (err.code) {
    // MySQL错误码
    if (err.code === 'ER_DUP_ENTRY') {
      const appError = new AppError(
        ErrorCodes.DB_DUPLICATE_ENTRY,
        getErrorMessage(ErrorCodes.DB_DUPLICATE_ENTRY),
        process.env.NODE_ENV === 'development' ? err.sqlMessage : null
      );
      logError(appError, req);
      return res.status(409).json(appError.toJSON());
    }

    if (err.code.startsWith('ER_')) {
      const appError = new AppError(
        ErrorCodes.DB_QUERY_ERROR,
        getErrorMessage(ErrorCodes.DB_QUERY_ERROR),
        process.env.NODE_ENV === 'development' ? err.sqlMessage : null
      );
      logError(appError, req);
      return res.status(500).json(appError.toJSON());
    }

    // 数据库连接错误
    if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      const appError = new AppError(
        ErrorCodes.DB_CONNECTION_ERROR,
        getErrorMessage(ErrorCodes.DB_CONNECTION_ERROR)
      );
      logError(appError, req);
      return res.status(503).json(appError.toJSON());
    }
  }

  // Multer文件上传错误
  if (err.name === 'MulterError') {
    let errorCode = ErrorCodes.FILE_UPLOAD_ERROR;
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorCode = ErrorCodes.FILE_SIZE_EXCEEDED;
    }
    const appError = new AppError(errorCode, getErrorMessage(errorCode), err.message);
    logError(appError, req);
    return res.status(400).json(appError.toJSON());
  }

  // Express Validator错误
  if (err.array && typeof err.array === 'function') {
    const appError = new AppError(
      ErrorCodes.VALIDATION_ERROR,
      getErrorMessage(ErrorCodes.VALIDATION_ERROR),
      err.array()
    );
    logError(appError, req);
    return res.status(400).json(appError.toJSON());
  }

  // 未知错误
  const appError = new AppError(
    ErrorCodes.INTERNAL_ERROR,
    err.message || getErrorMessage(ErrorCodes.INTERNAL_ERROR),
    process.env.NODE_ENV === 'development' ? { originalError: err.toString() } : null
  );
  
  logError(appError, req);
  
  res.status(appError.httpStatus).json(
    appError.toJSON(process.env.NODE_ENV === 'development')
  );
};

/**
 * 404错误处理
 */
const notFound = (req, res) => {
  const appError = new AppError(
    ErrorCodes.NOT_FOUND,
    `请求的资源不存在: ${req.method} ${req.originalUrl}`
  );
  
  res.status(404).json(appError.toJSON());
};

/**
 * 异步路由处理器包装器
 * 自动捕获异步函数中的错误
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 未捕获的Promise错误
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未捕获的Promise拒绝:', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString()
  });
  
  // 生产环境可以选择优雅关闭
  if (process.env.NODE_ENV === 'production') {
    // process.exit(1);
  }
});

// 未捕获的同步错误
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // 严重错误，建议退出进程
  console.error('进程将在3秒后退出...');
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError
};

