const xss = require('xss');

function createCommentTooLongError(maxLen) {
  const error = new Error(`内容长度不能超过 ${maxLen} 字`);
  error.code = 'COMMENT_TOO_LONG';
  error.httpStatus = 400;
  return error;
}

function sanitizeText(input, options = {}) {
  const { maxLen = 500 } = options;

  if (input === null || input === undefined) {
    return '';
  }

  const text = String(input).trim();
  if (text.length > maxLen) {
    throw createCommentTooLongError(maxLen);
  }

  return xss(text, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    css: false
  })
    .replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, '')
    .trim();
}

function sanitizeComment(input) {
  return sanitizeText(input, { maxLen: 500 });
}

module.exports = {
  sanitizeComment,
  sanitizeText
};
