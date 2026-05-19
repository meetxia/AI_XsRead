/**
 * preferenceController 单元测试
 *
 * Track: Agent A (个人中心后端 API + 迁移)
 * 来源：docs/superpowers/specs/2026-05-18-profile-center-mvp-design.md
 *
 * 覆盖：
 *   1. validateAndNormalize 校验规则（fontSize/lineHeight/theme/pageMode/eyeProtection）
 *   2. getMyPreferences：行存在 → 返回 dto；行不存在 → 写默认值后返回
 *   3. updateMyPreferences：合法 patch、空 body、参数非法、鉴权失败模拟
 *   4. 模块加载与导出 handler
 *
 * 通过 jest.mock 拦截 ../../src/config/database 的 pool，无需真实 MySQL。
 */

jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

const { pool } = require('../../src/config/database');
const preferenceController = require('../../src/controllers/preferenceController');
const {
  validateAndNormalize,
  rowToDto,
  DEFAULTS
} = preferenceController.__test__;

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('preferenceController', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  // ---------------------------------------------------------------
  // 模块加载 / handler 导出
  // ---------------------------------------------------------------
  describe('module exports', () => {
    test('导出 getMyPreferences / updateMyPreferences', () => {
      expect(typeof preferenceController.getMyPreferences).toBe('function');
      expect(typeof preferenceController.updateMyPreferences).toBe('function');
    });
  });

  // ---------------------------------------------------------------
  // 校验单元
  // ---------------------------------------------------------------
  describe('validateAndNormalize', () => {
    test('空 body → ok 且 patch 为空对象', () => {
      const r = validateAndNormalize({});
      expect(r.ok).toBe(true);
      expect(r.patch).toEqual({});
    });

    test('合法 fontSize/lineHeight/theme/pageMode/eyeProtection', () => {
      const r = validateAndNormalize({
        fontSize: 18,
        lineHeight: 1.6,
        theme: 'night',
        pageMode: 'page',
        eyeProtection: true
      });
      expect(r.ok).toBe(true);
      expect(r.patch).toEqual({
        font_size: 18,
        line_height: 1.6,
        theme: 'night',
        page_mode: 'page',
        eye_protection: 1
      });
    });

    test('eyeProtection 接受 0/1 / "true"/"false"', () => {
      expect(validateAndNormalize({ eyeProtection: 1 }).patch.eye_protection).toBe(1);
      expect(validateAndNormalize({ eyeProtection: 0 }).patch.eye_protection).toBe(0);
      expect(validateAndNormalize({ eyeProtection: '1' }).patch.eye_protection).toBe(1);
      expect(validateAndNormalize({ eyeProtection: 'false' }).patch.eye_protection).toBe(0);
    });

    test('lineHeight 自动归一到一位小数', () => {
      expect(validateAndNormalize({ lineHeight: 1.83 }).patch.line_height).toBe(1.8);
      expect(validateAndNormalize({ lineHeight: 1.85 }).patch.line_height).toBe(1.9);
    });

    test('fontSize 越界拒绝', () => {
      expect(validateAndNormalize({ fontSize: 11 }).ok).toBe(false);
      expect(validateAndNormalize({ fontSize: 25 }).ok).toBe(false);
      expect(validateAndNormalize({ fontSize: 16.5 }).ok).toBe(false);
      expect(validateAndNormalize({ fontSize: 'abc' }).ok).toBe(false);
    });

    test('lineHeight 越界拒绝', () => {
      expect(validateAndNormalize({ lineHeight: 1.3 }).ok).toBe(false);
      expect(validateAndNormalize({ lineHeight: 2.3 }).ok).toBe(false);
      expect(validateAndNormalize({ lineHeight: 'NaN' }).ok).toBe(false);
    });

    test('theme 不在白名单 → 拒绝', () => {
      expect(validateAndNormalize({ theme: 'dark' }).ok).toBe(false);
      expect(validateAndNormalize({ theme: '' }).ok).toBe(false);
    });

    test('pageMode 不在白名单 → 拒绝', () => {
      expect(validateAndNormalize({ pageMode: 'flip' }).ok).toBe(false);
    });

    test('eyeProtection 非布尔/0/1 → 拒绝', () => {
      expect(validateAndNormalize({ eyeProtection: 'yes' }).ok).toBe(false);
      expect(validateAndNormalize({ eyeProtection: 2 }).ok).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // rowToDto
  // ---------------------------------------------------------------
  describe('rowToDto', () => {
    test('行 → DTO 字段映射正确', () => {
      const dto = rowToDto({
        font_size: 16,
        line_height: '1.8', // mysql2 返回 DECIMAL 是字符串
        theme: 'cream',
        page_mode: 'scroll',
        eye_protection: 1
      });
      expect(dto).toEqual({
        fontSize: 16,
        lineHeight: 1.8,
        theme: 'cream',
        pageMode: 'scroll',
        eyeProtection: true
      });
    });
  });

  // ---------------------------------------------------------------
  // getMyPreferences
  // ---------------------------------------------------------------
  describe('getMyPreferences', () => {
    test('已有偏好 → 返回 DTO', async () => {
      pool.query.mockResolvedValueOnce([[{
        user_id: 1,
        font_size: 18,
        line_height: '1.6',
        theme: 'night',
        page_mode: 'page',
        eye_protection: 0,
        updated_at: new Date()
      }]]);

      const req = { user: { id: 1 } };
      const res = makeRes();
      await preferenceController.getMyPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.code).toBe(200);
      expect(payload.data).toEqual({
        fontSize: 18,
        lineHeight: 1.6,
        theme: 'night',
        pageMode: 'page',
        eyeProtection: false
      });
    });

    test('行不存在 → INSERT 默认值后返回默认 DTO', async () => {
      pool.query
        .mockResolvedValueOnce([[]]) // SELECT 空
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // INSERT 默认值

      const req = { user: { id: 42 } };
      const res = makeRes();
      await preferenceController.getMyPreferences(req, res);

      expect(pool.query).toHaveBeenCalledTimes(2);
      const insertSql = pool.query.mock.calls[1][0];
      expect(insertSql).toMatch(/INSERT INTO user_preferences/);
      expect(insertSql).toMatch(/ON DUPLICATE KEY UPDATE/);

      const payload = res.json.mock.calls[0][0];
      expect(payload.data).toEqual({
        fontSize: DEFAULTS.font_size,
        lineHeight: DEFAULTS.line_height,
        theme: DEFAULTS.theme,
        pageMode: DEFAULTS.page_mode,
        eyeProtection: false
      });
    });

    test('DB 异常 → 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('boom'));
      const req = { user: { id: 1 } };
      const res = makeRes();
      await preferenceController.getMyPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json.mock.calls[0][0].code).toBe(500);
    });
  });

  // ---------------------------------------------------------------
  // updateMyPreferences
  // ---------------------------------------------------------------
  describe('updateMyPreferences', () => {
    test('合法 patch → 写库并返回最新 DTO', async () => {
      pool.query
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // INSERT ... ON DUPLICATE KEY UPDATE
        .mockResolvedValueOnce([[{
          font_size: 20,
          line_height: '2.0',
          theme: 'eye',
          page_mode: 'scroll',
          eye_protection: 1
        }]]);

      const req = {
        user: { id: 1 },
        body: { fontSize: 20, lineHeight: 2.0, theme: 'eye', eyeProtection: true }
      };
      const res = makeRes();
      await preferenceController.updateMyPreferences(req, res);

      expect(pool.query).toHaveBeenCalledTimes(2);
      const sql = pool.query.mock.calls[0][0];
      expect(sql).toMatch(/INSERT INTO user_preferences/);
      expect(sql).toMatch(/ON DUPLICATE KEY UPDATE/);
      expect(sql).toMatch(/font_size = \?/);
      expect(sql).toMatch(/theme = \?/);
      expect(sql).toMatch(/eye_protection = \?/);

      const payload = res.json.mock.calls[0][0];
      expect(payload.code).toBe(200);
      expect(payload.data.theme).toBe('eye');
      expect(payload.data.eyeProtection).toBe(true);
    });

    test('校验失败（fontSize 越界） → 400 且不查 DB', async () => {
      const req = { user: { id: 1 }, body: { fontSize: 50 } };
      const res = makeRes();
      await preferenceController.updateMyPreferences(req, res);

      expect(pool.query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      const payload = res.json.mock.calls[0][0];
      expect(payload.code).toBe(400);
      expect(payload.message).toMatch(/fontSize/);
    });

    test('空 body 已存在记录 → 直接读返回不写库', async () => {
      pool.query.mockResolvedValueOnce([[{
        font_size: 16,
        line_height: '1.8',
        theme: 'cream',
        page_mode: 'scroll',
        eye_protection: 0
      }]]);

      const req = { user: { id: 1 }, body: {} };
      const res = makeRes();
      await preferenceController.updateMyPreferences(req, res);

      expect(pool.query).toHaveBeenCalledTimes(1);
      const sql = pool.query.mock.calls[0][0];
      expect(sql).toMatch(/SELECT/);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.theme).toBe('cream');
    });
  });
});
