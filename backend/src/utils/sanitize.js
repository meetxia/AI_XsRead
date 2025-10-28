/**
 * XSS防护 - 输入清理工具
 */
const xss = require('xss');

// XSS过滤选项配置
const xssOptions = {
  whiteList: {
    // 允许的HTML标签和属性
    p: [],
    br: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    span: ['style'],
    // 不允许任何危险标签如script、iframe等
  },
  stripIgnoreTag: true,  // 过滤所有非白名单标签
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'], // 移除这些标签及其内容
  css: false  // 禁止使用CSS
};

// 评论内容专用的XSS选项（更宽松）
const commentXssOptions = {
  whiteList: {
    p: [],
    br: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    blockquote: [],
    code: [],
    pre: []
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
  css: false
};

/**
 * 清理单个字符串输入
 * @param {string} input - 用户输入
 * @param {Object} options - XSS选项（可选）
 * @returns {string} 清理后的字符串
 */
function sanitizeInput(input, options = xssOptions) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // 去除首尾空格
  input = input.trim();
  
  // XSS过滤
  return xss(input, options);
}

/**
 * 清理评论内容
 * @param {string} content - 评论内容
 * @returns {string} 清理后的内容
 */
function sanitizeComment(content) {
  return sanitizeInput(content, commentXssOptions);
}

/**
 * 清理对象的所有字符串字段
 * @param {Object} obj - 要清理的对象
 * @param {Array<string>} excludeFields - 排除的字段（不清理）
 * @returns {Object} 清理后的对象
 */
function sanitizeObject(obj, excludeFields = []) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const cleaned = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // 跳过排除的字段
    if (excludeFields.includes(key)) {
      cleaned[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      // 清理字符串
      cleaned[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      // 清理数组
      cleaned[key] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeInput(item);
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item, excludeFields);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      // 递归清理嵌套对象
      cleaned[key] = sanitizeObject(value, excludeFields);
    } else {
      // 其他类型直接赋值
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * SQL注入防护 - 转义特殊字符
 * 注意：这只是辅助防护，主要防护应使用参数化查询
 * @param {string} input - 用户输入
 * @returns {string} 转义后的字符串
 */
function escapeSql(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // 转义特殊字符
  return input
    .replace(/\\/g, '\\\\')    // 反斜杠
    .replace(/'/g, "\\'")      // 单引号
    .replace(/"/g, '\\"')      // 双引号
    .replace(/\n/g, '\\n')     // 换行
    .replace(/\r/g, '\\r')     // 回车
    .replace(/\x00/g, '\\0')   // NULL字符
    .replace(/\x1a/g, '\\Z');  // EOF字符
}

/**
 * 验证和清理文件名
 * @param {string} filename - 文件名
 * @returns {string} 清理后的文件名
 */
function sanitizeFilename(filename) {
  if (typeof filename !== 'string') {
    return '';
  }
  
  // 移除路径分隔符和特殊字符
  return filename
    .replace(/[\/\\:*?"<>|]/g, '')  // 移除非法字符
    .replace(/\.\./g, '')            // 移除路径遍历
    .replace(/^\.+/, '')             // 移除开头的点
    .trim()
    .substring(0, 255);              // 限制长度
}

/**
 * 验证和清理URL
 * @param {string} url - URL
 * @returns {string|null} 清理后的URL，无效则返回null
 */
function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return null;
  }
  
  try {
    const parsed = new URL(url);
    
    // 只允许http和https协议
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.href;
  } catch (error) {
    return null;
  }
}

/**
 * 验证和清理邮箱
 * @param {string} email - 邮箱
 * @returns {string|null} 清理后的邮箱，无效则返回null
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return null;
  }
  
  email = email.trim().toLowerCase();
  
  // 简单的邮箱格式验证
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return null;
  }
  
  return email;
}

/**
 * 清理和验证手机号
 * @param {string} phone - 手机号
 * @returns {string|null} 清理后的手机号，无效则返回null
 */
function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    return null;
  }
  
  // 移除所有非数字字符
  phone = phone.replace(/\D/g, '');
  
  // 验证中国手机号格式（11位）
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return null;
  }
  
  return phone;
}

/**
 * HTML实体编码（用于输出转义）
 * @param {string} str - 字符串
 * @returns {string} 编码后的字符串
 */
function htmlEncode(str) {
  if (typeof str !== 'string') {
    return str;
  }
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * HTML实体解码
 * @param {string} str - 编码的字符串
 * @returns {string} 解码后的字符串
 */
function htmlDecode(str) {
  if (typeof str !== 'string') {
    return str;
  }
  
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * 创建XSS防护中间件
 * @param {Array<string>} excludeFields - 排除的字段
 * @returns {Function} Express中间件
 */
function createXssMiddleware(excludeFields = []) {
  return (req, res, next) => {
    // 清理请求体
    if (req.body) {
      req.body = sanitizeObject(req.body, excludeFields);
    }
    
    // 清理查询参数
    if (req.query) {
      req.query = sanitizeObject(req.query, excludeFields);
    }
    
    // 清理路径参数
    if (req.params) {
      req.params = sanitizeObject(req.params, excludeFields);
    }
    
    next();
  };
}

module.exports = {
  sanitizeInput,
  sanitizeComment,
  sanitizeObject,
  escapeSql,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  htmlEncode,
  htmlDecode,
  createXssMiddleware
};

