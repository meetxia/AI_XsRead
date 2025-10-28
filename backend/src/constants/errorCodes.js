/**
 * 统一错误码体系
 * 
 * 错误码分类:
 * - 1xxx: 通用错误
 * - 2xxx: 认证/授权错误
 * - 3xxx: 业务逻辑错误
 * - 4xxx: 数据库错误
 * - 5xxx: 外部服务错误
 */

const ErrorCodes = {
  // ========== 通用错误 (1xxx) ==========
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,

  // ========== 认证/授权错误 (2xxx) ==========
  AUTH_TOKEN_INVALID: 2001,
  AUTH_TOKEN_EXPIRED: 2002,
  AUTH_TOKEN_MISSING: 2003,
  AUTH_LOGIN_FAILED: 2004,
  AUTH_USER_EXISTS: 2005,
  AUTH_USER_NOT_FOUND: 2006,
  AUTH_PASSWORD_INCORRECT: 2007,
  AUTH_PERMISSION_DENIED: 2008,
  AUTH_ACCOUNT_DISABLED: 2009,
  AUTH_EMAIL_NOT_VERIFIED: 2010,

  // ========== 业务逻辑错误 (3xxx) ==========
  // 小说相关 (30xx)
  NOVEL_NOT_FOUND: 3001,
  NOVEL_ALREADY_EXISTS: 3002,
  NOVEL_ACCESS_DENIED: 3003,
  NOVEL_STATUS_INVALID: 3004,

  // 章节相关 (31xx)
  CHAPTER_NOT_FOUND: 3101,
  CHAPTER_ACCESS_DENIED: 3102,
  CHAPTER_ORDER_INVALID: 3103,

  // 书架相关 (32xx)
  BOOKSHELF_FULL: 3201,
  BOOKSHELF_ITEM_EXISTS: 3202,
  BOOKSHELF_ITEM_NOT_FOUND: 3203,

  // 评论相关 (33xx)
  COMMENT_NOT_FOUND: 3301,
  COMMENT_FORBIDDEN: 3302,
  COMMENT_TOO_LONG: 3303,
  COMMENT_TOO_SHORT: 3304,
  COMMENT_ALREADY_LIKED: 3305,
  COMMENT_NOT_LIKED: 3306,

  // 点赞/收藏相关 (34xx)
  ALREADY_LIKED: 3401,
  NOT_LIKED: 3402,
  ALREADY_COLLECTED: 3403,
  NOT_COLLECTED: 3404,

  // 用户相关 (35xx)
  USER_NOT_FOUND: 3501,
  USER_ALREADY_EXISTS: 3502,
  USERNAME_TAKEN: 3503,
  EMAIL_TAKEN: 3504,
  PHONE_TAKEN: 3505,

  // ========== 数据库错误 (4xxx) ==========
  DB_CONNECTION_ERROR: 4001,
  DB_QUERY_ERROR: 4002,
  DB_INSERT_ERROR: 4003,
  DB_UPDATE_ERROR: 4004,
  DB_DELETE_ERROR: 4005,
  DB_TRANSACTION_ERROR: 4006,
  DB_DUPLICATE_ENTRY: 4007,
  DB_FOREIGN_KEY_ERROR: 4008,

  // ========== 外部服务错误 (5xxx) ==========
  CACHE_ERROR: 5001,
  CACHE_SET_ERROR: 5002,
  CACHE_GET_ERROR: 5003,
  CACHE_DELETE_ERROR: 5004,
  
  FILE_UPLOAD_ERROR: 5101,
  FILE_SIZE_EXCEEDED: 5102,
  FILE_TYPE_INVALID: 5103,
  FILE_NOT_FOUND: 5104,
  
  SMS_SEND_ERROR: 5201,
  EMAIL_SEND_ERROR: 5202,
  
  THIRD_PARTY_API_ERROR: 5301,
  THIRD_PARTY_TIMEOUT: 5302,

  // ========== 验证错误 (6xxx) ==========
  VALIDATION_ERROR: 6001,
  INVALID_PARAMETER: 6002,
  MISSING_PARAMETER: 6003,
  INVALID_EMAIL: 6004,
  INVALID_PHONE: 6005,
  INVALID_PASSWORD: 6006,
  INVALID_DATE: 6007,
  INVALID_URL: 6008
};

// 错误消息映射
const ErrorMessages = {
  // 通用错误
  200: '成功',
  400: '请求参数错误',
  401: '未授权，请先登录',
  403: '没有权限访问',
  404: '请求的资源不存在',
  405: '不支持的请求方法',
  409: '资源冲突',
  429: '请求过于频繁，请稍后再试',
  500: '服务器内部错误',
  503: '服务暂时不可用',

  // 认证/授权错误
  2001: '无效的Token',
  2002: 'Token已过期，请重新登录',
  2003: '缺少Token',
  2004: '登录失败，用户名或密码错误',
  2005: '用户已存在',
  2006: '用户不存在',
  2007: '密码错误',
  2008: '权限不足',
  2009: '账号已被禁用',
  2010: '邮箱未验证',

  // 业务逻辑错误 - 小说
  3001: '小说不存在',
  3002: '小说已存在',
  3003: '无权访问该小说',
  3004: '小说状态无效',

  // 业务逻辑错误 - 章节
  3101: '章节不存在',
  3102: '无权访问该章节',
  3103: '章节顺序无效',

  // 业务逻辑错误 - 书架
  3201: '书架已满',
  3202: '该小说已在书架中',
  3203: '书架中没有该小说',

  // 业务逻辑错误 - 评论
  3301: '评论不存在',
  3302: '无权操作该评论',
  3303: '评论内容过长',
  3304: '评论内容过短',
  3305: '已经点赞过该评论',
  3306: '还未点赞该评论',

  // 业务逻辑错误 - 点赞/收藏
  3401: '已经点赞过了',
  3402: '还未点赞',
  3403: '已经收藏过了',
  3404: '还未收藏',

  // 业务逻辑错误 - 用户
  3501: '用户不存在',
  3502: '用户已存在',
  3503: '用户名已被占用',
  3504: '邮箱已被注册',
  3505: '手机号已被注册',

  // 数据库错误
  4001: '数据库连接失败',
  4002: '数据库查询失败',
  4003: '数据插入失败',
  4004: '数据更新失败',
  4005: '数据删除失败',
  4006: '事务处理失败',
  4007: '数据已存在',
  4008: '外键约束错误',

  // 外部服务错误 - 缓存
  5001: '缓存服务错误',
  5002: '缓存设置失败',
  5003: '缓存读取失败',
  5004: '缓存删除失败',

  // 外部服务错误 - 文件
  5101: '文件上传失败',
  5102: '文件大小超出限制',
  5103: '文件类型不支持',
  5104: '文件不存在',

  // 外部服务错误 - 通知
  5201: '短信发送失败',
  5202: '邮件发送失败',

  // 外部服务错误 - 第三方
  5301: '第三方API调用失败',
  5302: '第三方服务超时',

  // 验证错误
  6001: '数据验证失败',
  6002: '参数格式错误',
  6003: '缺少必需参数',
  6004: '邮箱格式不正确',
  6005: '手机号格式不正确',
  6006: '密码格式不正确',
  6007: '日期格式不正确',
  6008: 'URL格式不正确'
};

/**
 * 根据错误码获取错误消息
 * @param {number} code - 错误码
 * @returns {string} 错误消息
 */
function getErrorMessage(code) {
  return ErrorMessages[code] || ErrorMessages[500];
}

/**
 * 判断是否为成功状态码
 * @param {number} code - 状态码
 * @returns {boolean}
 */
function isSuccessCode(code) {
  return code >= 200 && code < 300;
}

/**
 * 判断是否为客户端错误
 * @param {number} code - 状态码
 * @returns {boolean}
 */
function isClientError(code) {
  return code >= 400 && code < 500;
}

/**
 * 判断是否为服务器错误
 * @param {number} code - 状态码
 * @returns {boolean}
 */
function isServerError(code) {
  return code >= 500 && code < 600;
}

module.exports = {
  ErrorCodes,
  ErrorMessages,
  getErrorMessage,
  isSuccessCode,
  isClientError,
  isServerError
};

