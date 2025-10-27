/**
 * ============================================
 * 文字之境 - 文件上传服务
 * 开发者: 开发者C
 * 创建日期: 2025-10-27
 * 版本: v1.0
 * ============================================
 * 
 * 功能:
 * - 单图/多图上传
 * - 图片压缩和裁剪
 * - 格式转换 (WebP)
 * - 水印添加
 * - OSS云存储
 * - CDN加速
 */

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// ============================================
// 配置
// ============================================
const CONFIG = {
  // 本地存储配置
  localStorage: {
    uploadDir: './uploads',
    tempDir: './uploads/temp',
  },
  
  // 图片配置
  image: {
    maxSize: 5 * 1024 * 1024,  // 5MB
    formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    quality: 85,
    thumbnail: {
      width: 300,
      height: 300,
      quality: 80,
    },
    watermark: {
      enabled: false,
      text: '文字之境',
      position: 'southeast',
    },
  },
  
  // OSS配置 (阿里云示例)
  oss: {
    enabled: false,  // 开启后使用OSS
    region: 'oss-cn-hangzhou',
    accessKeyId: 'your-access-key-id',
    accessKeySecret: 'your-access-key-secret',
    bucket: 'your-bucket-name',
    endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
    cdnDomain: 'https://cdn.yourdomain.com',
  },
};

// ============================================
// Multer配置
// ============================================
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  
  if (CONFIG.image.formats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件格式: ${ext}，支持格式: ${CONFIG.image.formats.join(', ')}`));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: CONFIG.image.maxSize,
  },
});

// ============================================
// 上传服务类
// ============================================
class UploadService {
  constructor(config = CONFIG) {
    this.config = config;
    this.ossClient = null;
    
    // 初始化OSS客户端 (如果启用)
    if (config.oss.enabled) {
      this.initOSS();
    }
    
    // 确保目录存在
    this.ensureDirectories();
  }

  /**
   * 初始化OSS客户端
   */
  initOSS() {
    try {
      const OSS = require('ali-oss');
      this.ossClient = new OSS({
        region: this.config.oss.region,
        accessKeyId: this.config.oss.accessKeyId,
        accessKeySecret: this.config.oss.accessKeySecret,
        bucket: this.config.oss.bucket,
      });
      console.log('✅ OSS客户端初始化成功');
    } catch (error) {
      console.error('❌ OSS客户端初始化失败:', error);
    }
  }

  /**
   * 确保上传目录存在
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.config.localStorage.uploadDir, { recursive: true });
      await fs.mkdir(this.config.localStorage.tempDir, { recursive: true });
      await fs.mkdir(path.join(this.config.localStorage.uploadDir, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.config.localStorage.uploadDir, 'thumbnails'), { recursive: true });
    } catch (error) {
      console.error('创建目录失败:', error);
    }
  }

  /**
   * Multer中间件 - 单文件上传
   */
  uploadSingle(fieldName = 'image') {
    return upload.single(fieldName);
  }

  /**
   * Multer中间件 - 多文件上传
   */
  uploadMultiple(fieldName = 'images', maxCount = 10) {
    return upload.array(fieldName, maxCount);
  }

  /**
   * 处理图片上传
   */
  async processImage(file, options = {}) {
    try {
      const startTime = Date.now();
      
      // 1. 图片压缩
      const compressed = await this.compressImage(file.buffer, options);
      
      // 2. 生成缩略图
      const thumbnail = await this.generateThumbnail(file.buffer, options);
      
      // 3. 生成文件名
      const fileName = this.generateFileName(file.originalname);
      const thumbName = `thumb_${fileName}`;
      
      // 4. 上传文件
      let imageUrl, thumbnailUrl;
      
      if (this.config.oss.enabled && this.ossClient) {
        // 上传到OSS
        [imageUrl, thumbnailUrl] = await Promise.all([
          this.uploadToOSS(compressed, `images/${fileName}`),
          this.uploadToOSS(thumbnail, `thumbnails/${thumbName}`),
        ]);
      } else {
        // 保存到本地
        [imageUrl, thumbnailUrl] = await Promise.all([
          this.saveToLocal(compressed, `images/${fileName}`),
          this.saveToLocal(thumbnail, `thumbnails/${thumbName}`),
        ]);
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          url: imageUrl,
          thumbnail: thumbnailUrl,
          size: compressed.length,
          originalSize: file.size,
          compressionRatio: ((1 - compressed.length / file.size) * 100).toFixed(2) + '%',
          processingTime: processingTime + 'ms',
          fileName: fileName,
        },
      };
    } catch (error) {
      console.error('图片处理失败:', error);
      throw error;
    }
  }

  /**
   * 压缩图片
   */
  async compressImage(buffer, options = {}) {
    try {
      let image = sharp(buffer);
      
      // 获取图片元数据
      const metadata = await image.metadata();
      
      // 调整大小 (如果需要)
      const maxWidth = options.maxWidth || 1200;
      const maxHeight = options.maxHeight || 1200;
      
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        image = image.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
      
      // 转换为WebP格式 (更好的压缩率)
      const format = options.format || 'webp';
      const quality = options.quality || this.config.image.quality;
      
      if (format === 'webp') {
        image = image.webp({ quality });
      } else if (format === 'jpeg' || format === 'jpg') {
        image = image.jpeg({ quality });
      } else if (format === 'png') {
        image = image.png({ quality });
      }
      
      // 添加水印 (如果启用)
      if (this.config.image.watermark.enabled) {
        image = await this.addWatermark(image);
      }
      
      return await image.toBuffer();
    } catch (error) {
      console.error('图片压缩失败:', error);
      throw error;
    }
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(buffer, options = {}) {
    try {
      const width = options.thumbnailWidth || this.config.image.thumbnail.width;
      const height = options.thumbnailHeight || this.config.image.thumbnail.height;
      const quality = options.thumbnailQuality || this.config.image.thumbnail.quality;
      
      return await sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality })
        .toBuffer();
    } catch (error) {
      console.error('生成缩略图失败:', error);
      throw error;
    }
  }

  /**
   * 添加水印
   */
  async addWatermark(image) {
    try {
      const watermarkText = this.config.image.watermark.text;
      const position = this.config.image.watermark.position;
      
      // 创建水印SVG
      const svgText = `
        <svg width="200" height="40">
          <text 
            x="10" 
            y="30" 
            font-family="Arial" 
            font-size="20" 
            fill="rgba(255,255,255,0.5)"
          >
            ${watermarkText}
          </text>
        </svg>
      `;
      
      const watermarkBuffer = Buffer.from(svgText);
      
      return image.composite([
        {
          input: watermarkBuffer,
          gravity: position,
        },
      ]);
    } catch (error) {
      console.error('添加水印失败:', error);
      return image;
    }
  }

  /**
   * 上传到OSS
   */
  async uploadToOSS(buffer, fileName) {
    try {
      const result = await this.ossClient.put(fileName, buffer);
      
      // 返回CDN地址 (如果配置了)
      if (this.config.oss.cdnDomain) {
        return `${this.config.oss.cdnDomain}/${fileName}`;
      }
      
      return result.url;
    } catch (error) {
      console.error('上传到OSS失败:', error);
      throw error;
    }
  }

  /**
   * 保存到本地
   */
  async saveToLocal(buffer, filePath) {
    try {
      const fullPath = path.join(this.config.localStorage.uploadDir, filePath);
      await fs.writeFile(fullPath, buffer);
      
      // 返回相对URL
      return `/uploads/${filePath}`;
    } catch (error) {
      console.error('保存到本地失败:', error);
      throw error;
    }
  }

  /**
   * 生成唯一文件名
   */
  generateFileName(originalName) {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}_${hash}${ext}`;
  }

  /**
   * 删除文件
   */
  async deleteFile(fileUrl) {
    try {
      if (this.config.oss.enabled && this.ossClient) {
        // 从OSS删除
        const fileName = fileUrl.split('/').pop();
        await this.ossClient.delete(fileName);
      } else {
        // 从本地删除
        const filePath = path.join(process.cwd(), fileUrl);
        await fs.unlink(filePath);
      }
      
      return true;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }

  /**
   * 批量上传
   */
  async processBatch(files, options = {}) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.processImage(files[i], options);
        results.push(result);
      } catch (error) {
        errors.push({
          file: files[i].originalname,
          error: error.message,
        });
      }
    }
    
    return {
      success: errors.length === 0,
      results,
      errors,
      total: files.length,
      succeeded: results.length,
      failed: errors.length,
    };
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(fileUrl) {
    try {
      if (this.config.oss.enabled && this.ossClient) {
        const fileName = fileUrl.split('/').pop();
        const result = await this.ossClient.head(fileName);
        return {
          size: result.res.headers['content-length'],
          type: result.res.headers['content-type'],
          lastModified: result.res.headers['last-modified'],
        };
      } else {
        const filePath = path.join(process.cwd(), fileUrl);
        const stats = await fs.stat(filePath);
        return {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
        };
      }
    } catch (error) {
      console.error('获取文件信息失败:', error);
      return null;
    }
  }
}

// ============================================
// 导出
// ============================================
const uploadService = new UploadService();

module.exports = {
  UploadService,
  uploadService,
  upload,
};

// ============================================
// Express路由示例
// ============================================
/*
const express = require('express');
const router = express.Router();
const { uploadService } = require('./uploadService');

// 单文件上传
router.post('/upload/single', 
  uploadService.uploadSingle('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '请选择文件' });
      }
      
      const result = await uploadService.processImage(req.file);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// 多文件上传
router.post('/upload/multiple',
  uploadService.uploadMultiple('images', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: '请选择文件' });
      }
      
      const result = await uploadService.processBatch(req.files);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// 删除文件
router.delete('/upload/:fileName', async (req, res) => {
  try {
    const fileUrl = `/uploads/images/${req.params.fileName}`;
    const success = await uploadService.deleteFile(fileUrl);
    
    if (success) {
      res.json({ message: '文件删除成功' });
    } else {
      res.status(404).json({ error: '文件不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
*/

