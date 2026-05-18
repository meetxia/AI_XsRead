const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

// 确保目录存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const IMAGES_DIR = path.join(process.cwd(), 'uploads', 'images');
const THUMBS_DIR = path.join(process.cwd(), 'uploads', 'thumbnails');
const COVERS_DIR = path.join(IMAGES_DIR, 'covers');
ensureDir(IMAGES_DIR);
ensureDir(THUMBS_DIR);
ensureDir(COVERS_DIR);

// 生成唯一文件名
function generateFilename(originalname, ext) {
  const finalExt = ext || path.extname(originalname) || '.jpg';
  const base = `img-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return base + finalExt.toLowerCase();
}

// multer 存储配置（临时落盘，后续由 processImage 压缩处理）
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
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('仅支持 JPG、PNG、GIF、WebP 格式的图片'));
      }
    }
  }).single(fieldName);
}

/**
 * 使用 sharp 压缩图片并转为 WebP 格式
 * @param {string} inputPath 原始图片路径
 * @param {object} options 处理选项
 * @returns {Promise<{ outputPath: string, filename: string }>}
 */
async function compressImage(inputPath, options = {}) {
  const {
    format = 'webp',
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 80,
    outputDir = IMAGES_DIR,
  } = options;

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputExt = format === 'webp' ? '.webp' : `.${format}`;
  const outputFilename = `${baseName}${outputExt}`;
  const outputPath = path.join(outputDir, outputFilename);

  let pipeline = sharp(inputPath).resize(maxWidth, maxHeight, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality, effort: 4 });
      break;
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 8 });
      break;
    default:
      pipeline = pipeline.webp({ quality, effort: 4 });
  }

  await pipeline.toFile(outputPath);

  return { outputPath, filename: outputFilename };
}

/**
 * 生成缩略图
 * @param {string} inputPath 原始图片路径
 * @param {object} options 缩略图选项
 * @returns {Promise<{ outputPath: string, filename: string }>}
 */
async function generateThumbnail(inputPath, options = {}) {
  const {
    width = 300,
    height = 400,
    quality = 70,
    format = 'webp',
  } = options;

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputExt = format === 'webp' ? '.webp' : `.${format}`;
  const thumbFilename = `thumb_${baseName}${outputExt}`;
  const thumbPath = path.join(THUMBS_DIR, thumbFilename);

  let pipeline = sharp(inputPath).resize(width, height, {
    fit: 'cover',
    position: 'top',
  });

  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality, effort: 4 });
      break;
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    default:
      pipeline = pipeline.webp({ quality, effort: 4 });
  }

  await pipeline.toFile(thumbPath);

  return { outputPath: thumbPath, filename: thumbFilename };
}

/**
 * 处理上传的图片：压缩 + 生成缩略图
 * @param {object} file multer 生成的 file 对象
 * @param {object} options 处理参数
 * @returns {Promise<{ data: { url: string, thumbnail: string|null, originalSize: number, compressedSize: number } }>}
 */
async function processImage(file, options = {}) {
  if (!file || !file.filename) {
    throw new Error('无效的文件');
  }

  const {
    format = 'webp',
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 80,
    thumbnailWidth = 300,
    thumbnailHeight = 400,
    thumbnailQuality = 70,
  } = options;

  const originalPath = path.join(IMAGES_DIR, file.filename);
  const originalSize = fs.statSync(originalPath).size;

  // 1. 压缩主图
  const { outputPath: compressedPath, filename: compressedFilename } = await compressImage(
    originalPath,
    { format, maxWidth, maxHeight, quality, outputDir: IMAGES_DIR }
  );

  const compressedSize = fs.statSync(compressedPath).size;

  // 如果压缩后的文件名与原文件不同，删除原文件
  if (compressedFilename !== file.filename) {
    try { fs.unlinkSync(originalPath); } catch (_) { /* ignore */ }
  }

  // 2. 生成缩略图
  let thumbRel = null;
  try {
    const { filename: thumbFilename } = await generateThumbnail(
      compressedPath,
      { width: thumbnailWidth, height: thumbnailHeight, quality: thumbnailQuality, format }
    );
    thumbRel = `/uploads/thumbnails/${thumbFilename}`;
  } catch (err) {
    console.warn('[uploadService] 缩略图生成失败:', err.message);
    thumbRel = null;
  }

  const urlRel = `/uploads/images/${compressedFilename}`;

  const savings = originalSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0;

  console.log(
    `[uploadService] 图片压缩完成: ${file.filename} → ${compressedFilename} ` +
    `(${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB, 节省 ${savings}%)`
  );

  return {
    data: {
      url: urlRel,
      thumbnail: thumbRel,
      originalSize,
      compressedSize,
      savings: `${savings}%`,
    }
  };
}

// 导出
module.exports = {
  uploadService: {
    uploadSingle,
    processImage,
    compressImage,
    generateThumbnail,
  },
  // 便于脚本直接引用
  IMAGES_DIR,
  THUMBS_DIR,
  COVERS_DIR,
};
