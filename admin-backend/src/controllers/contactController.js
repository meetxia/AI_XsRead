/**
 * 客服信息维护控制器（admin）
 *
 * 端点：
 *   GET    /api/admin/system/contact          读取
 *   PUT    /api/admin/system/contact          更新文字字段
 *   POST   /api/admin/system/contact/qrcode   上传二维码（multipart）
 *
 * 二维码上传位置：
 *   生产/开发都把图片直接写到 backend/uploads/contact/
 *   生产 nginx 把 /uploads/* 映射到 backend/uploads，所以前端拿到 /uploads/contact/xxx.png
 *   开发 vite proxy /uploads → backend(8005) 同样能加载
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/database');
const Response = require('../utils/response');

// 写日志
async function writeAdminLog(conn, { adminId, action, target, detail, ip }) {
  try {
    await conn.query(
      `INSERT INTO code_admin_logs (admin_id, action, target, detail, ip, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        adminId,
        action,
        target || null,
        detail ? JSON.stringify(detail) : null,
        ip || null
      ]
    );
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[code_admin_logs] 写日志失败：', err.message);
    }
  }
}

// 二维码目录：admin-backend/.. → AI-XsRead → backend/uploads/contact
const QRCODE_DIR = path.resolve(__dirname, '../../..', 'backend', 'uploads', 'contact');

function ensureQrcodeDir() {
  if (!fs.existsSync(QRCODE_DIR)) {
    fs.mkdirSync(QRCODE_DIR, { recursive: true });
  }
}

// multer 内存存储：先校验再写盘，避免半成品文件
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_SIZE = 2 * 1024 * 1024;

const uploadInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('仅支持 jpg/jpeg/png/webp 格式'));
    }
    cb(null, true);
  }
});

class ContactController {
  /**
   * GET /api/admin/system/contact
   */
  static async getContact(req, res, next) {
    try {
      const [rows] = await db.query(
        'SELECT id, qq, wechat, qrcode_url, notice, updated_at FROM system_contact WHERE id = 1 LIMIT 1'
      );
      const row = rows[0] || {};
      return Response.success(res, {
        qq: row.qq || '',
        wechat: row.wechat || '',
        qrcode_url: row.qrcode_url || '',
        notice: row.notice || '',
        updated_at: row.updated_at || null
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/system/contact
   * Body: { qq?, wechat?, notice?, qrcode_url? }
   * 用 ON DUPLICATE KEY UPDATE 兜底，理论上 system_contact 已经有 id=1 那行
   */
  static async updateContact(req, res, next) {
    try {
      const { qq, wechat, notice, qrcode_url: qrcodeUrl } = req.body || {};

      // 全部 null/undefined → 没东西可更新
      if (
        qq === undefined &&
        wechat === undefined &&
        notice === undefined &&
        qrcodeUrl === undefined
      ) {
        return Response.error(res, '请至少提供一个字段', 400);
      }

      const conn = await db.getConnection();
      try {
        // 简单的逐字段 COALESCE 风格更新
        await conn.query(
          `INSERT INTO system_contact (id, qq, wechat, qrcode_url, notice, updated_by, updated_at)
           VALUES (1, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             qq = COALESCE(VALUES(qq), qq),
             wechat = COALESCE(VALUES(wechat), wechat),
             qrcode_url = COALESCE(VALUES(qrcode_url), qrcode_url),
             notice = COALESCE(VALUES(notice), notice),
             updated_by = VALUES(updated_by),
             updated_at = VALUES(updated_at)`,
          [
            qq === undefined ? null : qq,
            wechat === undefined ? null : wechat,
            qrcodeUrl === undefined ? null : qrcodeUrl,
            notice === undefined ? null : notice,
            req.user.id
          ]
        );

        await writeAdminLog(conn, {
          adminId: req.user.id,
          action: 'update_contact',
          target: 'system_contact',
          detail: {
            fields: Object.keys({ qq, wechat, qrcode_url: qrcodeUrl, notice })
              .filter((k) => req.body[k] !== undefined)
          },
          ip: req.ip
        });
      } finally {
        conn.release();
      }

      // 返回最新内容
      const [rows] = await db.query(
        'SELECT qq, wechat, qrcode_url, notice, updated_at FROM system_contact WHERE id = 1 LIMIT 1'
      );
      return Response.success(res, rows[0] || {}, '已更新客服信息');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/system/contact/qrcode  multipart field: file
   * 写到 backend/uploads/contact/，更新 system_contact.qrcode_url
   */
  static async uploadQrcode(req, res, next) {
    try {
      if (!req.file) {
        return Response.error(res, '请选择二维码图片', 400);
      }
      ensureQrcodeDir();

      const ext = (() => {
        const fromName = path.extname(req.file.originalname || '').toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(fromName)) return fromName;
        switch (req.file.mimetype) {
          case 'image/png': return '.png';
          case 'image/webp': return '.webp';
          default: return '.jpg';
        }
      })();

      const filename = `contact-qr-${Date.now()}${ext}`;
      const fullPath = path.join(QRCODE_DIR, filename);
      fs.writeFileSync(fullPath, req.file.buffer);

      const qrcodeUrl = `/uploads/contact/${filename}`;

      const conn = await db.getConnection();
      try {
        await conn.query(
          `INSERT INTO system_contact (id, qrcode_url, updated_by, updated_at)
           VALUES (1, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             qrcode_url = VALUES(qrcode_url),
             updated_by = VALUES(updated_by),
             updated_at = VALUES(updated_at)`,
          [qrcodeUrl, req.user.id]
        );

        await writeAdminLog(conn, {
          adminId: req.user.id,
          action: 'upload_qrcode',
          target: 'system_contact',
          detail: { filename, size: req.file.size },
          ip: req.ip
        });
      } finally {
        conn.release();
      }

      return Response.success(res, { qrcode_url: qrcodeUrl }, '二维码上传成功');
    } catch (error) {
      next(error);
    }
  }
}

ContactController.uploadInstance = uploadInstance;

module.exports = ContactController;
