const { body, param, query, validationResult } = require('express-validator');

/**
 * 验证结果处理中间件
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      })),
      timestamp: Date.now()
    });
  }
  next();
};

/**
 * 用户注册验证规则
 */
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6, max: 20 })
    .withMessage('密码长度必须在6-20个字符之间'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('两次输入的密码不一致'),
  
  handleValidationErrors
];

/**
 * 用户登录验证规则
 */
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空'),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
  
  handleValidationErrors
];

/**
 * ID参数验证
 */
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('无效的ID参数'),
  
  handleValidationErrors
];

/**
 * 分页参数验证
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数')
    .toInt(),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt(),
  
  handleValidationErrors
];

// 文本分页校验（用于整书按字符分页）
const textPaginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数')
    .toInt(),

  query('pageSize')
    .optional()
    .isInt({ min: 100, max: 20000 })
    .withMessage('每页字数必须在100-20000之间')
    .toInt(),

  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  idValidation,
  paginationValidation,
  textPaginationValidation
};

