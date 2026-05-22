/**
 * 激活码管理控制器（admin）
 *
 * 端点：
 *   POST   /api/admin/codes/batches             创建批次（生成 N 张码）
 *   GET    /api/admin/codes/batches             分页列出所有批次
 *   GET    /api/admin/codes/batches/:id         批次详情（含分页码列表）
 *   GET    /api/admin/codes/batches/:id/export  CSV 导出（明文）
 *   POST   /api/admin/codes/void                批量作废未使用码
 *   GET    /api/admin/codes/redemptions         激活记录查询
 */

const db = require('../config/database');
const Response = require('../utils/response');
const codeGenerator = require('../utils/codeGenerator');
const codeCrypto = require('../utils/codeCrypto');
const { CODE_TYPE_TO_DAYS } = require('../services/membershipService');

const CODE_TYPE_LABEL = {
  monthly: '月卡',
  yearly: '年卡',
  permanent: '永久'
};

const STATUS_LABEL = {
  unused: '未使用',
  used: '已使用',
  void: '已作废'
};

/**
 * 写一条 admin 操作日志到 code_admin_logs（与既有 admin_logs 表分开）
 */
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

/**
 * 获取当日下一个序号 → 形如 B20260517-001
 */
async function nextBatchNo(conn) {
  const today = new Date();
  const ymd =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  const prefix = `B${ymd}-`;
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS cnt FROM code_batches WHERE batch_no LIKE ?',
    [`${prefix}%`]
  );
  const seq = Number(rows[0].cnt || 0) + 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

class CodeController {
  /**
   * POST /api/admin/codes/batches
   * 入参：{ code_type: 'monthly'|'yearly'|'permanent', count: 1-1000, name? }
   */
  static async createBatch(req, res, next) {
    try {
      const { code_type: codeType, count, name } = req.body || {};

      // 入参校验
      if (!codeType || !['monthly', 'yearly', 'permanent'].includes(codeType)) {
        return Response.error(res, 'code_type 必须为 monthly / yearly / permanent', 400);
      }
      const total = Number(count);
      if (!Number.isInteger(total) || total < 1 || total > 1000) {
        return Response.error(res, 'count 必须为 1-1000 的整数', 400);
      }
      const durationDays = CODE_TYPE_TO_DAYS[codeType];

      const conn = await db.getConnection();
      let batchId = null;
      let batchNo = null;
      let codes = [];
      try {
        await conn.beginTransaction();

        batchNo = await nextBatchNo(conn);

        const [batchResult] = await conn.query(
          `INSERT INTO code_batches
            (batch_no, name, code_type, duration_days, total_count, used_count, void_count, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, 0, 0, ?, NOW())`,
          [batchNo, name || null, codeType, durationDays, total, req.user.id]
        );
        batchId = batchResult.insertId;

        // 生成 N 张明文码（已保证唯一）
        codes = codeGenerator.generateCodes(total);

        // 批量 multi-row INSERT，一次事务一条 SQL
        const valuesSql = codes.map(() => '(?, ?, ?, ?, ?, ?, ?, NOW())').join(',');
        const valuesParams = [];
        codes.forEach((plain) => {
          valuesParams.push(
            batchId,
            codeCrypto.encrypt(plain),
            codeCrypto.lookupHash(plain),
            codeGenerator.buildPreview(plain),
            codeType,
            durationDays,
            'unused'
          );
        });
        await conn.query(
          `INSERT INTO activation_codes
            (batch_id, code_encrypted, code_lookup_hash, code_preview, code_type, duration_days, status, created_at)
           VALUES ${valuesSql}`,
          valuesParams
        );

        await writeAdminLog(conn, {
          adminId: req.user.id,
          action: 'generate_batch',
          target: `batch:${batchId}`,
          detail: { code_type: codeType, count: total, name: name || null },
          ip: req.ip
        });

        await conn.commit();
      } catch (err) {
        try { await conn.rollback(); } catch (_) { /* ignore */ }
        throw err;
      } finally {
        conn.release();
      }

      // 一次性返回明文码（4-4-4-4 格式）
      return Response.success(
        res,
        {
          batch: {
            id: batchId,
            batch_no: batchNo,
            name: name || null,
            code_type: codeType,
            duration_days: durationDays,
            total_count: total,
            used_count: 0,
            void_count: 0
          },
          codes: codes.map(codeGenerator.formatForDisplay)
        },
        '激活码生成成功'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/codes/batches
   */
  static async getBatches(req, res, next) {
    try {
      const {
        page = 1,
        pageSize = 20,
        code_type: codeType,
        keyword
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const where = ['1=1'];
      const params = [];

      if (codeType && ['monthly', 'yearly', 'permanent'].includes(codeType)) {
        where.push('b.code_type = ?');
        params.push(codeType);
      }
      if (keyword) {
        where.push('(b.batch_no LIKE ? OR b.name LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      const whereSql = where.join(' AND ');

      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM code_batches b WHERE ${whereSql}`,
        params
      );
      const total = Number(countRows[0].total || 0);

      const [rows] = await db.query(
        `SELECT
            b.id, b.batch_no, b.name, b.code_type, b.duration_days,
            b.total_count, b.used_count, b.void_count,
            (b.total_count - b.used_count - b.void_count) AS remaining,
            b.created_by, b.created_at,
            au.username AS created_by_name
         FROM code_batches b
         LEFT JOIN admin_users au ON au.id = b.created_by
         WHERE ${whereSql}
         ORDER BY b.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );

      return Response.page(res, rows, total, parseInt(page), parseInt(pageSize));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/codes/batches/:id
   */
  static async getBatchDetail(req, res, next) {
    try {
      const batchId = Number(req.params.id);
      if (!Number.isInteger(batchId) || batchId < 1) {
        return Response.error(res, '无效的批次 ID', 400);
      }
      const { page = 1, pageSize = 50, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);

      const [batchRows] = await db.query(
        `SELECT
            b.id, b.batch_no, b.name, b.code_type, b.duration_days,
            b.total_count, b.used_count, b.void_count,
            (b.total_count - b.used_count - b.void_count) AS remaining,
            b.created_by, b.created_at,
            au.username AS created_by_name
         FROM code_batches b
         LEFT JOIN admin_users au ON au.id = b.created_by
         WHERE b.id = ?`,
        [batchId]
      );
      if (batchRows.length === 0) {
        return Response.error(res, '批次不存在', 404);
      }

      const codeWhere = ['c.batch_id = ?'];
      const codeParams = [batchId];
      if (status && ['unused', 'used', 'void'].includes(status)) {
        codeWhere.push('c.status = ?');
        codeParams.push(status);
      }
      const codeWhereSql = codeWhere.join(' AND ');

      const [codeCountRows] = await db.query(
        `SELECT COUNT(*) AS total FROM activation_codes c WHERE ${codeWhereSql}`,
        codeParams
      );
      const codeTotal = Number(codeCountRows[0].total || 0);

      const [codeRows] = await db.query(
        `SELECT
            c.id, c.code_preview, c.code_type, c.status,
            c.used_by, u.username AS used_by_username,
            c.used_at, c.void_at, c.created_at
         FROM activation_codes c
         LEFT JOIN users u ON u.id = c.used_by
         WHERE ${codeWhereSql}
         ORDER BY c.id ASC
         LIMIT ? OFFSET ?`,
        [...codeParams, parseInt(pageSize), offset]
      );

      return Response.success(res, {
        batch: batchRows[0],
        codes: {
          list: codeRows,
          total: codeTotal,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(codeTotal / parseInt(pageSize))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/codes/batches/:id/export.txt
   * 流式 TXT，一码一行，UTF-8（无 BOM，避免被发卡平台导入时把 BOM 当成内容）。
   *
   * Query:
   *   - status:    unused | used | void | all（缺省 unused，默认只导未使用，方便发货）
   *   - format:    plain | dashed（缺省 dashed，4-4-4-4；plain = 纯 16 位）
   *
   * 输出：仅码本身，不带任何元信息，便于直接粘到第三方发卡平台。
   */
  static async exportBatchTxt(req, res, next) {
    try {
      const batchId = Number(req.params.id);
      if (!Number.isInteger(batchId) || batchId < 1) {
        return Response.error(res, '无效的批次 ID', 400);
      }
      const requestedStatus = String(req.query.status || 'unused').toLowerCase();
      const status = ['unused', 'used', 'void', 'all'].includes(requestedStatus)
        ? requestedStatus
        : 'unused';
      const format = String(req.query.format || 'dashed').toLowerCase() === 'plain'
        ? 'plain'
        : 'dashed';

      const [batchRows] = await db.query(
        'SELECT id, batch_no FROM code_batches WHERE id = ?',
        [batchId]
      );
      if (batchRows.length === 0) {
        return Response.error(res, '批次不存在', 404);
      }
      const batchNo = batchRows[0].batch_no;

      const where = ['c.batch_id = ?'];
      const params = [batchId];
      if (status !== 'all') {
        where.push('c.status = ?');
        params.push(status);
      }
      const whereSql = where.join(' AND ');

      const [codeRows] = await db.query(
        `SELECT c.code_encrypted
           FROM activation_codes c
          WHERE ${whereSql}
          ORDER BY c.id ASC`,
        params
      );

      const filename = `batch-${batchNo}-${status}.txt`;
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      let exported = 0;
      for (const row of codeRows) {
        let plain;
        try {
          plain = codeCrypto.decrypt(row.code_encrypted);
        } catch (_) {
          // 解密失败的码跳过，不污染发卡平台
          continue;
        }
        const out = format === 'plain' ? plain : codeGenerator.formatForDisplay(plain);
        // 用 \r\n 让 Windows / 第三方平台粘贴更稳
        res.write(out + '\r\n');
        exported += 1;
      }

      res.end();

      setImmediate(async () => {
        try {
          const conn = await db.getConnection();
          try {
            await writeAdminLog(conn, {
              adminId: req.user.id,
              action: 'export_batch_txt',
              target: `batch:${batchId}`,
              detail: { rows: exported, status, format },
              ip: req.ip
            });
          } finally {
            conn.release();
          }
        } catch (_) { /* ignore */ }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/codes/batches/:id/export
   * 流式 CSV，BOM + UTF-8
   */
  static async exportBatch(req, res, next) {
    try {
      const batchId = Number(req.params.id);
      if (!Number.isInteger(batchId) || batchId < 1) {
        return Response.error(res, '无效的批次 ID', 400);
      }

      const [batchRows] = await db.query(
        'SELECT id, batch_no FROM code_batches WHERE id = ?',
        [batchId]
      );
      if (batchRows.length === 0) {
        return Response.error(res, '批次不存在', 404);
      }
      const batchNo = batchRows[0].batch_no;

      const [codeRows] = await db.query(
        `SELECT
            c.code_encrypted, c.code_type, c.status,
            u.username AS used_by_username,
            c.used_at, c.created_at
         FROM activation_codes c
         LEFT JOIN users u ON u.id = c.used_by
         WHERE c.batch_id = ?
         ORDER BY c.id ASC`,
        [batchId]
      );

      const filename = `batch-${batchNo}.csv`;
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.setHeader('Cache-Control', 'no-store');
      res.write('\ufeff'); // BOM
      res.write('激活码,类型,状态,激活用户,激活时间,生成时间\n');

      const csvEscape = (s) => {
        const v = s == null ? '' : String(s);
        return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
      };

      const fmtDate = (d) =>
        d instanceof Date && !Number.isNaN(d.getTime())
          ? d.toISOString().slice(0, 19).replace('T', ' ')
          : (d || '');

      for (const row of codeRows) {
        let plain = '';
        try {
          plain = codeGenerator.formatForDisplay(codeCrypto.decrypt(row.code_encrypted));
        } catch (_) {
          plain = '<decrypt-failed>';
        }
        const line = [
          plain,
          CODE_TYPE_LABEL[row.code_type] || row.code_type,
          STATUS_LABEL[row.status] || row.status,
          row.used_by_username || '',
          fmtDate(row.used_at),
          fmtDate(row.created_at)
        ]
          .map(csvEscape)
          .join(',');
        res.write(line + '\n');
      }

      res.end();

      // 异步写日志（不阻塞响应）
      setImmediate(async () => {
        try {
          const conn = await db.getConnection();
          try {
            await writeAdminLog(conn, {
              adminId: req.user.id,
              action: 'export_batch',
              target: `batch:${batchId}`,
              detail: { rows: codeRows.length },
              ip: req.ip
            });
          } finally {
            conn.release();
          }
        } catch (_) { /* ignore */ }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/codes/void
   * 入参：{ code_ids: [1,2,3], reason? }
   */
  static async voidCodes(req, res, next) {
    try {
      const { code_ids: codeIds, reason } = req.body || {};
      if (!Array.isArray(codeIds) || codeIds.length === 0) {
        return Response.error(res, 'code_ids 必须为非空数组', 400);
      }
      const ids = codeIds
        .map((x) => Number(x))
        .filter((x) => Number.isInteger(x) && x > 0);
      if (ids.length === 0) {
        return Response.error(res, 'code_ids 中没有合法 ID', 400);
      }

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const placeholders = ids.map(() => '?').join(',');
        const [existRows] = await conn.query(
          `SELECT id, batch_id, status FROM activation_codes WHERE id IN (${placeholders})`,
          ids
        );

        if (existRows.length !== ids.length) {
          await conn.rollback();
          conn.release();
          return Response.error(res, '部分码不存在', 400, {
            missing: ids.filter((id) => !existRows.find((r) => r.id === id))
          });
        }

        const notUnused = existRows.filter((r) => r.status !== 'unused');
        if (notUnused.length > 0) {
          await conn.rollback();
          conn.release();
          return Response.error(res, '存在已使用 / 已作废的码，无法整批作废', 400, {
            invalid_ids: notUnused.map((r) => r.id)
          });
        }

        // 真正作废
        await conn.query(
          `UPDATE activation_codes
           SET status = 'void', void_at = NOW(), void_by = ?
           WHERE id IN (${placeholders}) AND status = 'unused'`,
          [req.user.id, ...ids]
        );

        // 按 batch_id 分组累加 void_count
        const byBatch = existRows.reduce((acc, r) => {
          acc[r.batch_id] = (acc[r.batch_id] || 0) + 1;
          return acc;
        }, {});
        for (const [batchId, cnt] of Object.entries(byBatch)) {
          await conn.query(
            'UPDATE code_batches SET void_count = void_count + ? WHERE id = ?',
            [cnt, Number(batchId)]
          );
        }

        await writeAdminLog(conn, {
          adminId: req.user.id,
          action: 'void_codes',
          target: `codes:${ids.join(',')}`,
          detail: { count: ids.length, reason: reason || null },
          ip: req.ip
        });

        await conn.commit();
      } catch (err) {
        try { await conn.rollback(); } catch (_) { /* ignore */ }
        throw err;
      } finally {
        conn.release();
      }

      return Response.success(res, { count: ids.length }, '作废成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/codes/redemptions
   * 分页 + 过滤：user_id, batch_id, channel, start_date, end_date
   */
  static async getRedemptions(req, res, next) {
    try {
      const {
        page = 1,
        pageSize = 20,
        user_id: userId,
        batch_id: batchId,
        channel,
        start_date: startDate,
        end_date: endDate
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const where = ['1=1'];
      const params = [];

      if (userId) {
        where.push('r.user_id = ?');
        params.push(parseInt(userId));
      }
      if (batchId) {
        where.push('c.batch_id = ?');
        params.push(parseInt(batchId));
      }
      if (channel && ['register', 'profile', 'reading_wall'].includes(channel)) {
        where.push('r.channel = ?');
        params.push(channel);
      }
      if (startDate) {
        where.push('r.created_at >= ?');
        params.push(startDate);
      }
      if (endDate) {
        where.push('r.created_at <= ?');
        params.push(endDate);
      }
      const whereSql = where.join(' AND ');

      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total
         FROM code_redemption_logs r
         LEFT JOIN activation_codes c ON c.id = r.code_id
         WHERE ${whereSql}`,
        params
      );
      const total = Number(countRows[0].total || 0);

      const [rows] = await db.query(
        `SELECT
            r.id, r.code_id, c.code_preview, c.code_type,
            r.user_id, u.username,
            r.channel,
            r.vip_level_before, r.vip_level_after,
            r.expires_before, r.expires_after,
            r.ip, r.created_at
         FROM code_redemption_logs r
         LEFT JOIN activation_codes c ON c.id = r.code_id
         LEFT JOIN users u ON u.id = r.user_id
         WHERE ${whereSql}
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );

      return Response.page(res, rows, total, parseInt(page), parseInt(pageSize));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CodeController;
