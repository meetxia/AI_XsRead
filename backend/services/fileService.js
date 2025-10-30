/**
 * ============================================
 * 文字之境 - 文件管理服务
 * 开发者: 开发者C
 * 创建日期: 2025-10-27
 * 版本: v1.0
 * ============================================
 * 
 * 功能:
 * - 文件列表查询
 * - 文件删除和重命名
 * - 文件分类管理
 * - 存储空间统计
 * - 定期清理
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// 加载环境变量
require('dotenv').config();

// ============================================
// 配置
// ============================================
const CONFIG = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,  // 必须从环境变量读取
    database: process.env.DB_DATABASE || 'ai_xsread',
    charset: 'utf8mb4',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  },
  
  storage: {
    uploadDir: './uploads',
    maxSize: 100 * 1024 * 1024 * 1024,  // 100GB
    cleanupAge: 30,  // 30天未使用的文件
  },
};

// ============================================
// 文件管理服务类
// ============================================
class FileService {
  constructor(config = CONFIG) {
    this.config = config;
    this.pool = null;
    this.initialize();
  }

  /**
   * 初始化数据库连接
   */
  async initialize() {
    try {
      this.pool = mysql.createPool(this.config.database);
      console.log('✅ 文件服务数据库连接成功');
      
      // 创建文件表 (如果不存在)
      await this.createFileTable();
    } catch (error) {
      console.error('❌ 文件服务初始化失败:', error);
    }
  }

  /**
   * 创建文件表
   */
  async createFileTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        file_type VARCHAR(50),
        mime_type VARCHAR(100),
        category VARCHAR(50) DEFAULT 'other',
        status TINYINT DEFAULT 1 COMMENT '1-正常, 0-已删除',
        access_count INT DEFAULT 0 COMMENT '访问次数',
        last_access_time DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_category (category),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    try {
      await this.pool.query(createTableSQL);
      console.log('✅ 文件表检查/创建成功');
    } catch (error) {
      console.error('❌ 创建文件表失败:', error);
    }
  }

  /**
   * 添加文件记录
   */
  async addFile(fileData) {
    try {
      const sql = `
        INSERT INTO files 
        (user_id, file_name, file_path, file_size, file_type, mime_type, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        fileData.userId,
        fileData.fileName,
        fileData.filePath,
        fileData.fileSize,
        fileData.fileType || null,
        fileData.mimeType || null,
        fileData.category || 'other',
      ];
      
      const [result] = await this.pool.query(sql, values);
      
      return {
        success: true,
        fileId: result.insertId,
      };
    } catch (error) {
      console.error('添加文件记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件列表
   */
  async getFileList(options = {}) {
    try {
      const {
        userId,
        category,
        page = 1,
        pageSize = 20,
        sortBy = 'created_at',
        sortOrder = 'DESC',
      } = options;
      
      let sql = 'SELECT * FROM files WHERE status = 1';
      const params = [];
      
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }
      
      if (category) {
        sql += ' AND category = ?';
        params.push(category);
      }
      
      // 排序
      sql += ` ORDER BY ${sortBy} ${sortOrder}`;
      
      // 分页
      const offset = (page - 1) * pageSize;
      sql += ' LIMIT ? OFFSET ?';
      params.push(pageSize, offset);
      
      const [files] = await this.pool.query(sql, params);
      
      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM files WHERE status = 1';
      const countParams = [];
      
      if (userId) {
        countSql += ' AND user_id = ?';
        countParams.push(userId);
      }
      
      if (category) {
        countSql += ' AND category = ?';
        countParams.push(category);
      }
      
      const [[{ total }]] = await this.pool.query(countSql, countParams);
      
      return {
        success: true,
        data: files,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件详情
   */
  async getFile(fileId) {
    try {
      const [files] = await this.pool.query(
        'SELECT * FROM files WHERE id = ? AND status = 1',
        [fileId]
      );
      
      if (files.length === 0) {
        return {
          success: false,
          message: '文件不存在',
        };
      }
      
      // 更新访问记录
      await this.pool.query(
        'UPDATE files SET access_count = access_count + 1, last_access_time = NOW() WHERE id = ?',
        [fileId]
      );
      
      return {
        success: true,
        data: files[0],
      };
    } catch (error) {
      console.error('获取文件详情失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId, userId = null) {
    try {
      // 获取文件信息
      let sql = 'SELECT * FROM files WHERE id = ? AND status = 1';
      const params = [fileId];
      
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }
      
      const [files] = await this.pool.query(sql, params);
      
      if (files.length === 0) {
        return {
          success: false,
          message: '文件不存在或无权限',
        };
      }
      
      const file = files[0];
      
      // 标记为已删除
      await this.pool.query(
        'UPDATE files SET status = 0 WHERE id = ?',
        [fileId]
      );
      
      // 删除物理文件
      try {
        const filePath = path.join(process.cwd(), file.file_path);
        await fs.unlink(filePath);
      } catch (error) {
        console.error('删除物理文件失败:', error);
      }
      
      return {
        success: true,
        message: '文件删除成功',
      };
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  /**
   * 重命名文件
   */
  async renameFile(fileId, newFileName, userId = null) {
    try {
      let sql = 'SELECT * FROM files WHERE id = ? AND status = 1';
      const params = [fileId];
      
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }
      
      const [files] = await this.pool.query(sql, params);
      
      if (files.length === 0) {
        return {
          success: false,
          message: '文件不存在或无权限',
        };
      }
      
      // 更新文件名
      await this.pool.query(
        'UPDATE files SET file_name = ? WHERE id = ?',
        [newFileName, fileId]
      );
      
      return {
        success: true,
        message: '文件重命名成功',
      };
    } catch (error) {
      console.error('重命名文件失败:', error);
      throw error;
    }
  }

  /**
   * 更新文件分类
   */
  async updateCategory(fileId, category, userId = null) {
    try {
      let sql = 'SELECT * FROM files WHERE id = ? AND status = 1';
      const params = [fileId];
      
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }
      
      const [files] = await this.pool.query(sql, params);
      
      if (files.length === 0) {
        return {
          success: false,
          message: '文件不存在或无权限',
        };
      }
      
      await this.pool.query(
        'UPDATE files SET category = ? WHERE id = ?',
        [category, fileId]
      );
      
      return {
        success: true,
        message: '分类更新成功',
      };
    } catch (error) {
      console.error('更新分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取存储统计
   */
  async getStorageStats(userId = null) {
    try {
      let sql = `
        SELECT 
          COUNT(*) as total_files,
          SUM(file_size) as total_size,
          category,
          COUNT(*) as category_count,
          SUM(file_size) as category_size
        FROM files
        WHERE status = 1
      `;
      const params = [];
      
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }
      
      sql += ' GROUP BY category';
      
      const [stats] = await this.pool.query(sql, params);
      
      // 计算总计
      const total = stats.reduce((acc, item) => ({
        files: acc.files + item.category_count,
        size: acc.size + parseInt(item.category_size || 0),
      }), { files: 0, size: 0 });
      
      return {
        success: true,
        data: {
          total: {
            files: total.files,
            size: total.size,
            sizeFormatted: this.formatFileSize(total.size),
          },
          byCategory: stats.map(item => ({
            category: item.category,
            files: item.category_count,
            size: parseInt(item.category_size || 0),
            sizeFormatted: this.formatFileSize(parseInt(item.category_size || 0)),
          })),
        },
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期文件
   */
  async cleanupOldFiles() {
    try {
      const daysAgo = this.config.storage.cleanupAge;
      
      // 查找过期文件
      const [files] = await this.pool.query(`
        SELECT * FROM files 
        WHERE status = 1 
        AND (
          last_access_time < DATE_SUB(NOW(), INTERVAL ? DAY)
          OR (last_access_time IS NULL AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY))
        )
      `, [daysAgo, daysAgo]);
      
      console.log(`找到 ${files.length} 个过期文件`);
      
      let deletedCount = 0;
      let errors = [];
      
      for (const file of files) {
        try {
          // 删除物理文件
          const filePath = path.join(process.cwd(), file.file_path);
          await fs.unlink(filePath);
          
          // 标记为已删除
          await this.pool.query(
            'UPDATE files SET status = 0 WHERE id = ?',
            [file.id]
          );
          
          deletedCount++;
        } catch (error) {
          errors.push({
            fileId: file.id,
            error: error.message,
          });
        }
      }
      
      return {
        success: true,
        message: `清理完成，删除 ${deletedCount} 个文件`,
        total: files.length,
        deleted: deletedCount,
        errors: errors,
      };
    } catch (error) {
      console.error('清理文件失败:', error);
      throw error;
    }
  }

  /**
   * 清理临时文件
   */
  async cleanupTempFiles() {
    try {
      const tempDir = path.join(this.config.storage.uploadDir, 'temp');
      const files = await fs.readdir(tempDir);
      
      let deletedCount = 0;
      
      for (const file of files) {
        try {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);
          
          // 删除24小时前的临时文件
          const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
          
          if (ageHours > 24) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        } catch (error) {
          console.error(`删除临时文件失败: ${file}`, error);
        }
      }
      
      return {
        success: true,
        message: `清理了 ${deletedCount} 个临时文件`,
        deleted: deletedCount,
      };
    } catch (error) {
      console.error('清理临时文件失败:', error);
      throw error;
    }
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  }

  /**
   * 获取分类列表
   */
  async getCategories(userId = null) {
    try {
      let sql = `
        SELECT 
          category,
          COUNT(*) as count,
          SUM(file_size) as total_size
        FROM files
        WHERE status = 1
      `;
      const params = [];
      
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }
      
      sql += ' GROUP BY category ORDER BY count DESC';
      
      const [categories] = await this.pool.query(sql, params);
      
      return {
        success: true,
        data: categories.map(cat => ({
          category: cat.category,
          count: cat.count,
          totalSize: parseInt(cat.total_size || 0),
          sizeFormatted: this.formatFileSize(parseInt(cat.total_size || 0)),
        })),
      };
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw error;
    }
  }
}

// ============================================
// 导出
// ============================================
const fileService = new FileService();

module.exports = {
  FileService,
  fileService,
};

// ============================================
// Express路由示例
// ============================================
/*
const express = require('express');
const router = express.Router();
const { fileService } = require('./fileService');

// 获取文件列表
router.get('/files', async (req, res) => {
  try {
    const { userId, category, page, pageSize } = req.query;
    const result = await fileService.getFileList({
      userId: userId ? parseInt(userId) : null,
      category,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取文件详情
router.get('/files/:id', async (req, res) => {
  try {
    const result = await fileService.getFile(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除文件
router.delete('/files/:id', async (req, res) => {
  try {
    const result = await fileService.deleteFile(
      parseInt(req.params.id),
      req.user?.id
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 重命名文件
router.put('/files/:id/rename', async (req, res) => {
  try {
    const { newName } = req.body;
    const result = await fileService.renameFile(
      parseInt(req.params.id),
      newName,
      req.user?.id
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取存储统计
router.get('/files/stats', async (req, res) => {
  try {
    const result = await fileService.getStorageStats(req.user?.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
*/

