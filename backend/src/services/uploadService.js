const fs = require('fs');
const path = require('path');
const multer = require('multer');

// 确保目录存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const IMAGES_DIR = path.join(process.cwd(), 'uploads', 'images');
const THUMBS_DIR = path.join(process.cwd(), 'uploads', 'thumbnails');
ensureDir(IMAGES_DIR);
ensureDir(THUMBS_DIR);

// 生成唯一文件名
function generateFilename(originalname) {
  const ext = path.extname(originalname) || '.jpg';
  const base = `img-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return base + ext.toLowerCase();
}

// multer 存储配置（简单落盘到 uploads/images）
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, IMAGES_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, generateFilename(file.originalname));
  }
});

/**
 * 单文件上传中间件
 * @param {string} fieldName 表单字段名
 */
function uploadSingle(fieldName) {
  return multer({ storage }).single(fieldName);
}

/**
 * 处理图片：此处为轻量实现，不做真实压缩，仅生成可访问URL，并复制一份缩略图
 * @param {object} file multer 生成的 file 对象
 * @param {object} options 可选的处理参数（占位，便于后续接入 Sharp 等）
 * @returns {Promise<{ data: { url: string, thumbnail: string|null } }>} 结果
 */
async function processImage(file, options = {}) {
  if (!file || !file.filename) {
    throw new Error('无效的文件');
  }

  // 文件已存储至 IMAGES_DIR 下
  const filename = file.filename;
  const absPath = path.join(IMAGES_DIR, filename);

  // 复制一份作为“缩略图”（实际未缩放，满足接口期望）
  let thumbRel = null;
  try {
    const thumbName = `thumb_${filename}`;
    const thumbAbs = path.join(THUMBS_DIR, thumbName);
    fs.copyFileSync(absPath, thumbAbs);
    thumbRel = path.join('/uploads', 'thumbnails', thumbName).replace(/\\/g, '/');
  } catch (_) {
    thumbRel = null;
  }

  const urlRel = path.join('/uploads', 'images', filename).replace(/\\/g, '/');

  return {
    data: {
      url: urlRel,
      thumbnail: thumbRel
    }
  };
}

// 导出为 uploadService 对象以兼容现有 require 方式
module.exports = {
  uploadService: {
    uploadSingle,
    processImage
  }
};


