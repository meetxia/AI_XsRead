/**
 * 用户阅读偏好控制器
 *
 * 来源：docs/superpowers/specs/2026-05-18-profile-center-mvp-design.md §3.5 / §4.3
 * Track: Agent A
 *
 * 端点：
 *   GET  /api/user/preferences            -> getMyPreferences
 *   PUT  /api/user/preferences            -> updateMyPreferences
 *
 * 数据策略：
 *   - 服务端 user_preferences 是 truth，本地 readingSettings 是缓存
 *   - 行不存在时自动 INSERT 默认值后返回（INSERT ... ON DUPLICATE KEY UPDATE）
 *
 * 校验规则：
 *   - fontSize       整数 12-24
 *   - lineHeight     数值 1.4-2.2（保留 1 位小数）
 *   - theme          {'cream','night','eye'}
 *   - pageMode       {'scroll','page'}
 *   - eyeProtection  布尔（接受 0/1）
 */
const { pool } = require('../config/database');
const Response = require('../utils/response');

const ALLOWED_THEMES = ['cream', 'night', 'eye'];
const ALLOWED_PAGE_MODES = ['scroll', 'page'];

const DEFAULTS = {
  font_size: 16,
  line_height: 1.8,
  theme: 'cream',
  page_mode: 'scroll',
  eye_protection: 0
};

/**
 * 行 -> 接口对象（驼峰）
 */
function rowToDto(row) {
  return {
    fontSize: Number(row.font_size),
    lineHeight: Number(row.line_height),
    theme: String(row.theme),
    pageMode: String(row.page_mode),
    eyeProtection: Number(row.eye_protection) === 1
  };
}

/**
 * 校验并归一化 PUT 请求 body
 * @returns {{ ok:boolean, error?:string, patch?:object }}
 */
function validateAndNormalize(body = {}) {
  const patch = {};

  if (body.fontSize !== undefined) {
    const n = Number.parseInt(body.fontSize, 10);
    if (!Number.isInteger(n) || n < 12 || n > 24) {
      return { ok: false, error: 'fontSize 必须为 12-24 之间的整数' };
    }
    patch.font_size = n;
  }

  if (body.lineHeight !== undefined) {
    const n = Number(body.lineHeight);
    if (!Number.isFinite(n) || n < 1.4 || n > 2.2) {
      return { ok: false, error: 'lineHeight 必须为 1.4-2.2 之间的数值' };
    }
    // 保留一位小数（DECIMAL(3,1)）
    patch.line_height = Math.round(n * 10) / 10;
  }

  if (body.theme !== undefined) {
    if (!ALLOWED_THEMES.includes(body.theme)) {
      return { ok: false, error: `theme 必须是 ${ALLOWED_THEMES.join('/')} 之一` };
    }
    patch.theme = body.theme;
  }

  if (body.pageMode !== undefined) {
    if (!ALLOWED_PAGE_MODES.includes(body.pageMode)) {
      return { ok: false, error: `pageMode 必须是 ${ALLOWED_PAGE_MODES.join('/')} 之一` };
    }
    patch.page_mode = body.pageMode;
  }

  if (body.eyeProtection !== undefined) {
    const v = body.eyeProtection;
    let bool;
    if (v === true || v === 1 || v === '1' || v === 'true') {
      bool = 1;
    } else if (v === false || v === 0 || v === '0' || v === 'false') {
      bool = 0;
    } else {
      return { ok: false, error: 'eyeProtection 必须为布尔值或 0/1' };
    }
    patch.eye_protection = bool;
  }

  return { ok: true, patch };
}

/**
 * GET /api/user/preferences
 *
 * 行为：
 *   1. SELECT 查询当前用户偏好
 *   2. 不存在时通过 INSERT ... ON DUPLICATE KEY UPDATE 写入默认值后再读
 *   3. 返回完整偏好对象
 */
async function getMyPreferences(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      'SELECT user_id, font_size, line_height, theme, page_mode, eye_protection, updated_at FROM user_preferences WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (rows.length > 0) {
      return Response.success(res, rowToDto(rows[0]));
    }

    // 无记录 → 写入默认值
    await pool.query(
      `INSERT INTO user_preferences
         (user_id, font_size, line_height, theme, page_mode, eye_protection)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [
        userId,
        DEFAULTS.font_size,
        DEFAULTS.line_height,
        DEFAULTS.theme,
        DEFAULTS.page_mode,
        DEFAULTS.eye_protection
      ]
    );

    return Response.success(res, rowToDto({
      font_size: DEFAULTS.font_size,
      line_height: DEFAULTS.line_height,
      theme: DEFAULTS.theme,
      page_mode: DEFAULTS.page_mode,
      eye_protection: DEFAULTS.eye_protection
    }));
  } catch (error) {
    console.error('Get user preferences error:', error);
    return Response.error(res, '获取阅读偏好失败', 500);
  }
}

/**
 * PUT /api/user/preferences
 *
 * 行为：
 *   1. 校验 body 子集
 *   2. INSERT ... ON DUPLICATE KEY UPDATE 写入或合并
 *   3. 返回合并后完整偏好
 */
async function updateMyPreferences(req, res) {
  try {
    const userId = req.user.id;
    const validation = validateAndNormalize(req.body || {});
    if (!validation.ok) {
      return Response.error(res, validation.error, 400);
    }

    const patch = validation.patch;
    const merged = {
      font_size: patch.font_size !== undefined ? patch.font_size : DEFAULTS.font_size,
      line_height: patch.line_height !== undefined ? patch.line_height : DEFAULTS.line_height,
      theme: patch.theme !== undefined ? patch.theme : DEFAULTS.theme,
      page_mode: patch.page_mode !== undefined ? patch.page_mode : DEFAULTS.page_mode,
      eye_protection: patch.eye_protection !== undefined ? patch.eye_protection : DEFAULTS.eye_protection
    };

    // 仅当传入字段才参与 UPDATE 子句，其余字段保留原值
    const updateFragments = [];
    const updateParams = [];
    if (patch.font_size !== undefined) {
      updateFragments.push('font_size = ?');
      updateParams.push(patch.font_size);
    }
    if (patch.line_height !== undefined) {
      updateFragments.push('line_height = ?');
      updateParams.push(patch.line_height);
    }
    if (patch.theme !== undefined) {
      updateFragments.push('theme = ?');
      updateParams.push(patch.theme);
    }
    if (patch.page_mode !== undefined) {
      updateFragments.push('page_mode = ?');
      updateParams.push(patch.page_mode);
    }
    if (patch.eye_protection !== undefined) {
      updateFragments.push('eye_protection = ?');
      updateParams.push(patch.eye_protection);
    }
    // 至少有一行可改时附带 updated_at（CURRENT_TIMESTAMP ON UPDATE 也会自动刷新）
    if (updateFragments.length === 0) {
      // 客户端给了空对象 → 直接当作"读"
      const [rows] = await pool.query(
        'SELECT font_size, line_height, theme, page_mode, eye_protection FROM user_preferences WHERE user_id = ? LIMIT 1',
        [userId]
      );
      if (rows.length > 0) {
        return Response.success(res, rowToDto(rows[0]), '更新成功');
      }
      // 无记录则写入默认行
      await pool.query(
        `INSERT INTO user_preferences
           (user_id, font_size, line_height, theme, page_mode, eye_protection)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE user_id = user_id`,
        [
          userId,
          DEFAULTS.font_size,
          DEFAULTS.line_height,
          DEFAULTS.theme,
          DEFAULTS.page_mode,
          DEFAULTS.eye_protection
        ]
      );
      return Response.success(res, rowToDto(merged), '更新成功');
    }

    await pool.query(
      `INSERT INTO user_preferences
         (user_id, font_size, line_height, theme, page_mode, eye_protection)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE ${updateFragments.join(', ')}`,
      [
        userId,
        merged.font_size,
        merged.line_height,
        merged.theme,
        merged.page_mode,
        merged.eye_protection,
        ...updateParams
      ]
    );

    // 读最新行返回，避免在并发场景下与客户端不同步
    const [rows] = await pool.query(
      'SELECT font_size, line_height, theme, page_mode, eye_protection FROM user_preferences WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const dto = rows.length > 0 ? rowToDto(rows[0]) : rowToDto(merged);
    return Response.success(res, dto, '更新成功');
  } catch (error) {
    console.error('Update user preferences error:', error);
    return Response.error(res, '更新阅读偏好失败', 500);
  }
}

module.exports = {
  getMyPreferences,
  updateMyPreferences,
  // 暴露给单测
  __test__: {
    validateAndNormalize,
    rowToDto,
    DEFAULTS,
    ALLOWED_THEMES,
    ALLOWED_PAGE_MODES
  }
};
