const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在：管理端上传的封面要落到用户端/Nginx 对外暴露的共享目录
const uploadDir = path.resolve(__dirname, '../../..', 'backend', 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'image-' + uniqueSuffix + ext);
  }
});

// 严格白名单（与 contactController 一致；拒绝 image/svg+xml 防 XSS）
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('仅支持 jpg / png / webp 格式'), false);
  }
  cb(null, true);
};

// 创建上传中间件
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: fileFilter
});

module.exports = upload;

