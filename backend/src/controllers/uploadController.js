/**
 * 上传控制器
 * 处理文件上传和TXT小说导入
 */

const Response = require('../utils/response');
const { pool } = require('../config/database');
const { parseTxtContent, validateTxtFile } = require('../utils/txtParser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadService } = require('../services/uploadService');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/novels');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'novel-' + uniqueSuffix + ext);
  }
});

// 文件过滤器（只允许TXT文件）
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.txt') {
    cb(null, true);
  } else {
    cb(new Error('只支持TXT格式文件'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  }
});

/**
 * 上传并导入TXT小说
 */
const uploadTxtNovel = async (req, res, next) => {
  try {
    // 检查文件
    if (!req.file) {
      return Response.error(res, '请选择要上传的TXT文件', 400);
    }
    
    const userId = req.user.id;
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    
    console.log('📚 开始处理上传的小说:', originalName);
    
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 解析TXT内容
    const novelData = parseTxtContent(content, originalName);
    
    // 验证数据
    const validation = validateTxtFile(novelData);
    if (!validation.valid) {
      // 删除临时文件
      fs.unlinkSync(filePath);
      return Response.error(res, validation.errors.join('; '), 400);
    }
    
    // 检查是否已存在同名小说
    const [existing] = await pool.query(
      'SELECT id FROM novels WHERE title = ?',
      [novelData.title]
    );
    
    if (existing.length > 0) {
      fs.unlinkSync(filePath);
      return Response.error(res, '已存在同名小说，请修改标题后重新上传', 400);
    }
    
    // 开始数据库事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 插入小说记录
      const [novelResult] = await connection.query(
        `INSERT INTO novels 
         (title, author, author_id, category_id, description, 
          word_count, chapter_count, status, views, likes, collections, 
          rating, rating_count, is_recommended, is_hot, 
          last_chapter_title, last_update_time, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          novelData.title,
          novelData.author,
          userId, // 当前登录用户为作者
          novelData.categoryId,
          novelData.description,
          novelData.wordCount,
          1, // 单章节
          1, // 已发布
          novelData.stats.views,
          novelData.stats.likes,
          novelData.stats.collections,
          novelData.stats.rating,
          novelData.stats.ratingCount,
          novelData.stats.isRecommended,
          novelData.stats.isHot,
          '正文'
        ]
      );
      
      const novelId = novelResult.insertId;
      
      // 插入章节内容
      await connection.query(
        `INSERT INTO chapters 
         (novel_id, chapter_number, title, content, word_count, is_free)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          novelId,
          1,
          '正文',
          novelData.content,
          novelData.wordCount,
          1 // 免费
        ]
      );
      
      await connection.commit();
      
      // 删除临时文件
      fs.unlinkSync(filePath);
      
      console.log('✅ 小说导入成功:', novelData.title);
      
      return Response.success(res, {
        novelId,
        title: novelData.title,
        wordCount: novelData.wordCount,
        categoryId: novelData.categoryId
      }, '小说上传成功');
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    // 删除临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('上传失败:', error);
    next(error);
  }
};

/**
 * 批量上传TXT小说
 */
const batchUploadTxtNovels = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return Response.error(res, '请选择要上传的文件', 400);
    }
    
    const userId = req.user.id;
    const results = {
      success: [],
      failed: [],
      exists: []
    };
    
    for (const file of req.files) {
      try {
        // 读取并解析文件
        const content = fs.readFileSync(file.path, 'utf8');
        const novelData = parseTxtContent(content, file.originalname);
        
        // 验证
        const validation = validateTxtFile(novelData);
        if (!validation.valid) {
          fs.unlinkSync(file.path);
          results.failed.push({
            filename: file.originalname,
            reason: validation.errors.join('; ')
          });
          continue;
        }
        
        // 检查重复
        const [existing] = await pool.query(
          'SELECT id FROM novels WHERE title = ?',
          [novelData.title]
        );
        
        if (existing.length > 0) {
          fs.unlinkSync(file.path);
          results.exists.push({
            filename: file.originalname,
            title: novelData.title
          });
          continue;
        }
        
        // 导入数据库
        const connection = await pool.getConnection();
        
        try {
          await connection.beginTransaction();
          
          // 插入小说
          const [novelResult] = await connection.query(
            `INSERT INTO novels 
             (title, author, author_id, category_id, description, 
              word_count, chapter_count, status, views, likes, collections, 
              rating, rating_count, is_recommended, is_hot, 
              last_chapter_title, last_update_time, published_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              novelData.title, novelData.author, userId, novelData.categoryId,
              novelData.description, novelData.wordCount, 1, 1,
              novelData.stats.views, novelData.stats.likes, novelData.stats.collections,
              novelData.stats.rating, novelData.stats.ratingCount,
              novelData.stats.isRecommended, novelData.stats.isHot, '正文'
            ]
          );
          
          const novelId = novelResult.insertId;
          
          // 插入章节
          await connection.query(
            `INSERT INTO chapters 
             (novel_id, chapter_number, title, content, word_count, is_free)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [novelId, 1, '正文', novelData.content, novelData.wordCount, 1]
          );
          
          await connection.commit();
          
          results.success.push({
            filename: file.originalname,
            novelId,
            title: novelData.title,
            wordCount: novelData.wordCount
          });
          
        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          connection.release();
        }
        
        // 删除临时文件
        fs.unlinkSync(file.path);
        
      } catch (error) {
        console.error('处理文件失败:', file.originalname, error);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        results.failed.push({
          filename: file.originalname,
          reason: error.message
        });
      }
    }
    
    return Response.success(res, {
      total: req.files.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      existsCount: results.exists.length,
      details: results
    }, '批量上传完成');
    
  } catch (error) {
    next(error);
  }
};

/**
 * 获取我的小说列表
 */
const getMyNovels = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    
    // 查询总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM novels WHERE author_id = ?',
      [userId]
    );
    const total = countResult[0].total;
    
    // 查询列表
    const [novels] = await pool.query(
      `SELECT 
        n.id, n.title, n.author, n.category_id, n.description,
        n.word_count, n.chapter_count, n.status, n.views, n.likes,
        n.rating, n.created_at, n.updated_at,
        c.name as category_name
       FROM novels n
       LEFT JOIN categories c ON n.category_id = c.id
       WHERE n.author_id = ?
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), offset]
    );
    
    return Response.paginate(res, novels, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / pageSize)
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadTxtNovel,
  batchUploadTxtNovels,
  getMyNovels,
  /**
   * 上传用户头像并更新用户资料
   */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return Response.error(res, '请上传头像文件', 400);
      }

      // 处理图片（压缩+缩略图）
      const result = await uploadService.processImage(req.file, {
        format: 'webp',
        maxWidth: 1200,
        maxHeight: 1200,
        thumbnailWidth: 300,
        thumbnailHeight: 300
      });

      const relUrl = result.data.url; // 如 /uploads/images/xxx.webp
      const relThumb = result.data.thumbnail; // 如 /uploads/thumbnails/thumb_xxx.webp
      // 直接落库相对路径，前端按 origin 解析；这样切换域名/HTTPS 都不会拼错
      const avatarUrl = relUrl;
      const avatarThumb = relThumb || null;

      // 更新用户头像
      const userId = req.user.id;
      await pool.query('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [avatarUrl, userId]);

      return Response.success(res, {
        avatar: avatarUrl,
        thumbnail: avatarThumb
      }, '头像上传成功');
    } catch (error) {
      console.error('上传头像失败:', error);
      next(error);
    }
  }
};

