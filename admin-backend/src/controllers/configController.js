/**
 * 系统配置（system_config）管理控制器
 *
 * 端点：
 *   GET    /api/admin/system/configs        读取全部
 *   GET    /api/admin/system/configs/:key   读取单条
 *   PUT    /api/admin/system/configs/:key   upsert 单条
 *   PUT    /api/admin/system/configs        事务批量 upsert
 *
 * 说明：
 *   - 复用用户后端数据库的 system_config 表（init_step1.sql 中已创建）
 *   - `key` 是 SQL 保留字，全部用反引号包裹
 *   - 写操作会落入 code_admin_logs，方便审计
 */

const db = require('../config/database');
const Response = require('../utils/response');

const ALLOWED_TYPES = new Set(['string', 'number', 'boolean', 'json']);

/**
 * 写管理员操作日志（容错）
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
 * 把数据库返回的 row 整形成 API 响应统一格式
 */
function shapeRow(row) {
  if (!row) return null;
  return {
    key: row.key,
    value: row.value == null ? '' : row.value,
    description: row.description || '',
    type: row.type || 'string',
    updated_at: row.updated_at || null
  };
}

/**
 * 校验单条配置 payload
 */
function validateConfigItem(item) {
  if (!item || typeof item !== 'object') {
    return '配置项格式错误';
  }
  const key = (item.key || '').toString().trim();
  if (!key) return '配置 key 不能为空';
  if (key.length > 100) return `配置 key 长度超过 100：${key}`;
  if (!/^[A-Za-z0-9_.-]+$/.test(key)) {
    return `配置 key 只允许字母数字和 _.-：${key}`;
  }
  if (item.type !== undefined && !ALLOWED_TYPES.has(item.type)) {
    return `不支持的 type：${item.type}`;
  }
  return null;
}

class ConfigController {
  /**
   * GET /api/admin/system/configs
   * 返回 { list: [...], map: { key: value } }，方便前端任选
   */
  static async getAllConfigs(req, res, next) {
    try {
      const [rows] = await db.query(
        'SELECT `key`, `value`, `description`, `type`, `updated_at` FROM `system_config` ORDER BY `key` ASC'
      );
      const list = rows.map(shapeRow);
      const map = {};
      list.forEach((it) => {
        map[it.key] = it.value;
      });
      return Response.success(res, { list, map });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/system/configs/:key
   */
  static async getConfigByKey(req, res, next) {
    try {
      const { key } = req.params;
      if (!key) {
        return Response.error(res, '缺少 key', 400);
      }
      const [rows] = await db.query(
        'SELECT `key`, `value`, `description`, `type`, `updated_at` FROM `system_config` WHERE `key` = ? LIMIT 1',
        [key]
      );
      if (!rows.length) {
        return Response.error(res, `配置项不存在：${key}`, 404);
      }
      return Response.success(res, shapeRow(rows[0]));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/system/configs/:key
   * Body: { value, description?, type? }
   */
  static async updateConfig(req, res, next) {
    try {
      const { key } = req.params;
      const payload = { ...(req.body || {}), key };
      const err = validateConfigItem(payload);
      if (err) {
        return Response.error(res, err, 400);
      }

      const value = payload.value == null ? '' : String(payload.value);
      const description = payload.description == null ? null : String(payload.description);
      const type = payload.type || 'string';

      const conn = await db.getConnection();
      try {
        await conn.query(
          `INSERT INTO \`system_config\` (\`key\`, \`value\`, \`description\`, \`type\`)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             \`value\` = VALUES(\`value\`),
             \`description\` = COALESCE(VALUES(\`description\`), \`description\`),
             \`type\` = VALUES(\`type\`),
             \`updated_at\` = CURRENT_TIMESTAMP`,
          [key, value, description, type]
        );

        await writeAdminLog(conn, {
          adminId: req.user && req.user.id,
          action: 'update_config',
          target: 'system_config',
          detail: { key, type },
          ip: req.ip
        });
      } finally {
        conn.release();
      }

      const [rows] = await db.query(
        'SELECT `key`, `value`, `description`, `type`, `updated_at` FROM `system_config` WHERE `key` = ? LIMIT 1',
        [key]
      );
      return Response.success(res, shapeRow(rows[0]), '配置已更新');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/system/configs
   * Body: { configs: [{ key, value, description?, type? }, ...] }
   * 事务批量 upsert
   */
  static async batchUpdateConfigs(req, res, next) {
    try {
      const configs = Array.isArray(req.body && req.body.configs) ? req.body.configs : null;
      if (!configs || !configs.length) {
        return Response.error(res, '请提供 configs 数组且不能为空', 400);
      }
      if (configs.length > 100) {
        return Response.error(res, '单次最多 100 项', 400);
      }
      // 预校验
      for (const item of configs) {
        const err = validateConfigItem(item);
        if (err) {
          return Response.error(res, err, 400);
        }
      }

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        for (const item of configs) {
          const value = item.value == null ? '' : String(item.value);
          const description = item.description == null ? null : String(item.description);
          const type = item.type || 'string';
          await conn.query(
            `INSERT INTO \`system_config\` (\`key\`, \`value\`, \`description\`, \`type\`)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               \`value\` = VALUES(\`value\`),
               \`description\` = COALESCE(VALUES(\`description\`), \`description\`),
               \`type\` = VALUES(\`type\`),
               \`updated_at\` = CURRENT_TIMESTAMP`,
            [item.key, value, description, type]
          );
        }

        await writeAdminLog(conn, {
          adminId: req.user && req.user.id,
          action: 'batch_update_config',
          target: 'system_config',
          detail: { keys: configs.map((c) => c.key) },
          ip: req.ip
        });

        await conn.commit();
      } catch (txErr) {
        try { await conn.rollback(); } catch (_) { /* noop */ }
        throw txErr;
      } finally {
        conn.release();
      }

      const keys = configs.map((c) => c.key);
      const placeholders = keys.map(() => '?').join(',');
      const [rows] = await db.query(
        `SELECT \`key\`, \`value\`, \`description\`, \`type\`, \`updated_at\`
         FROM \`system_config\`
         WHERE \`key\` IN (${placeholders})
         ORDER BY \`key\` ASC`,
        keys
      );
      return Response.success(
        res,
        { list: rows.map(shapeRow), updated: keys.length },
        `已更新 ${keys.length} 项配置`
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ConfigController;
