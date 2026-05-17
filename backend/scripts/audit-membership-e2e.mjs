/**
 * 会员体系端到端集成审计
 *
 * 必须先启好：
 *   admin-backend (8001) / backend (8005) / ai-xsread-vue3 (3008)
 *
 * 涵盖：
 *   1. admin 登录
 *   2. admin 创建月卡批次（3 张）
 *   3. admin 把 novel_id=1 设 is_vip=1
 *   4. backend 注册新用户（不带激活码）
 *   5. 新用户 GET /api/user/membership → vip_level=0
 *   6. 用第 1 张码激活 → 200
 *   7. 立即 GET 验证状态一致
 *   8. 重复激活同一张码 → 404
 *   9a. 匿名读 VIP 章节 → truncated
 *   9b. 已激活会员读同一章 → 全文
 *  10. CSV 导出包含我们的码
 *  11. admin 查激活记录能看到
 *  12. Playwright：匿名 → 会员墙；登录 → 全文；会员中心显示等级
 *  13. cleanup
 */

import http from 'http';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
const env = dotenv.parse(fs.readFileSync(envPath));

const ADMIN_BASE = 'http://127.0.0.1:8001';
const USER_API_BASE = 'http://127.0.0.1:8005';
const FRONTEND_BASE = 'http://127.0.0.1:3008';

let totalSteps = 0;
let okSteps = 0;

function ok(msg) { console.log(`\x1b[32m[OK]\x1b[0m ${msg}`); okSteps++; totalSteps++; }
function fail(msg) { console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`); totalSteps++; throw new Error(msg); }
function info(msg) { console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`); }

function rawHttp({ host, port, method, path: p, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const opts = { host, port, method, path: p, headers: { ...headers } };
    let payload = null;
    if (body !== undefined && body !== null) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      opts.headers['content-type'] = opts.headers['content-type'] || 'application/json';
      opts.headers['content-length'] = Buffer.byteLength(payload);
    }
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const str = buf.toString('utf8');
        let json = null;
        try { json = JSON.parse(str); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, str, json });
      });
    });
    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

const adminCall = (method, p, body, token) => {
  const url = new URL(p, ADMIN_BASE);
  return rawHttp({
    host: url.hostname, port: Number(url.port),
    method, path: url.pathname + url.search,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body
  });
};

const userCall = (method, p, body, token) => {
  const url = new URL(p, USER_API_BASE);
  return rawHttp({
    host: url.hostname, port: Number(url.port),
    method, path: url.pathname + url.search,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body
  });
};

async function loadPlaywright() {
  // 动态 import playwright（来自 ai-xsread-vue3 的 node_modules）
  const pwPath = path.resolve(__dirname, '../../ai-xsread-vue3/node_modules/playwright/index.mjs');
  if (!fs.existsSync(pwPath)) {
    // fallback to .js
    const altPath = path.resolve(__dirname, '../../ai-xsread-vue3/node_modules/playwright/index.js');
    if (fs.existsSync(altPath)) {
      return import(pathToFileURL(altPath).href);
    }
    throw new Error(`playwright 不可用：${pwPath}`);
  }
  return import(pathToFileURL(pwPath).href);
}

async function getDb() {
  return mysql.createConnection({
    host: env.DB_HOST, port: env.DB_PORT || 3306,
    user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_DATABASE
  });
}

const cleanup = {
  testUsername: null,
  batchId: null,
  novelId: null,
  origIsVip: null
};

async function main() {
  info(`admin-backend = ${ADMIN_BASE}`);
  info(`backend       = ${USER_API_BASE}`);
  info(`frontend      = ${FRONTEND_BASE}`);

  const db = await getDb();

  try {
    // 1. admin 登录
    const loginRes = await adminCall('POST', '/api/admin/login', {
      username: 'admin', password: 'admin123'
    });
    if (loginRes.status !== 200 || !loginRes.json?.data?.accessToken) {
      fail(`admin 登录失败 ${loginRes.status} ${loginRes.str.slice(0, 200)}`);
    }
    const adminToken = loginRes.json.data.accessToken;
    ok('1. admin 登录');

    // 2. 创建月卡批次（3 张）
    const batchName = `e2e-audit-${Date.now()}`;
    const batchRes = await adminCall('POST', '/api/admin/codes/batches',
      { code_type: 'monthly', count: 3, name: batchName }, adminToken);
    if (batchRes.status !== 200 || !batchRes.json?.data?.codes) {
      fail(`创建批次失败 ${batchRes.status}`);
    }
    cleanup.batchId = batchRes.json.data.batch.id;
    const codes = batchRes.json.data.codes;
    ok(`2. 创建月卡批次 batch_id=${cleanup.batchId} 生成 ${codes.length} 张`);

    // 3. 设置 novel_id=1 为 VIP
    const [novels] = await db.query('SELECT id, is_vip FROM novels ORDER BY id ASC LIMIT 1');
    if (novels.length === 0) fail('没有 novel 可测');
    cleanup.novelId = novels[0].id;
    cleanup.origIsVip = Number(novels[0].is_vip || 0);

    const setVipRes = await adminCall('POST', '/api/admin/novels/set-vip',
      { ids: [cleanup.novelId], is_vip: 1 }, adminToken);
    if (setVipRes.status !== 200) fail(`set-vip 失败 ${setVipRes.status}`);
    ok(`3. novel_id=${cleanup.novelId} → is_vip=1`);

    // 4. 注册新用户
    const tmpUser = `audit_${Date.now()}`;
    const tmpPwd = 'AuditPass@123';
    cleanup.testUsername = tmpUser;
    const regRes = await userCall('POST', '/api/auth/register', {
      username: tmpUser, email: `${tmpUser}@audit.local`, password: tmpPwd
    });
    if (regRes.status >= 400 || !regRes.json?.data) {
      fail(`注册失败 ${regRes.status} ${regRes.str.slice(0, 200)}`);
    }
    const userToken = regRes.json.data.accessToken;
    if (!userToken) fail('注册返回无 token');
    if (regRes.json.data.activation_status !== 'not_provided') {
      fail(`activation_status 应为 not_provided，实际 ${regRes.json.data.activation_status}`);
    }
    ok(`4. 注册 ${tmpUser} → activation_status=not_provided`);

    // 5. GET /api/user/membership → vip_level=0
    const me1 = await userCall('GET', '/api/user/membership', null, userToken);
    if (me1.status !== 200) fail(`GET membership 失败 ${me1.status}`);
    if (me1.json.data.vip_level !== 0 || me1.json.data.is_active !== false) {
      fail(`新用户应 vip_level=0，实际 ${JSON.stringify(me1.json.data)}`);
    }
    ok('5. 新用户 GET membership → vip_level=0, is_active=false');

    // 6. 激活第 1 张码
    const actRes = await userCall('POST', '/api/user/membership/activate',
      { code: codes[0], channel: 'profile' }, userToken);
    if (actRes.status !== 200) fail(`激活失败 ${actRes.status} ${actRes.str.slice(0, 200)}`);
    if (actRes.json.data.vip_level !== 1) fail('激活后等级应为 1');
    if (actRes.json.data.days_added !== 30) fail(`days_added 应为 30，实际 ${actRes.json.data.days_added}`);
    ok(`6. 激活月卡 → vip_level=1, days_added=30`);

    // 7. 立即 GET 验证
    const me2 = await userCall('GET', '/api/user/membership', null, userToken);
    if (me2.status !== 200) fail(`GET membership 失败 ${me2.status}`);
    if (me2.json.data.vip_level !== 1 || !me2.json.data.is_active) {
      fail(`激活后应 level=1/active，实际 ${JSON.stringify(me2.json.data)}`);
    }
    if (me2.json.data.days_remaining < 28 || me2.json.data.days_remaining > 31) {
      fail(`days_remaining 应在 28-31 之间，实际 ${me2.json.data.days_remaining}`);
    }
    ok(`7. GET membership 一致 days_remaining=${me2.json.data.days_remaining}`);

    // 8. 重复激活 → 404
    const reuse = await userCall('POST', '/api/user/membership/activate',
      { code: codes[0] }, userToken);
    if (reuse.status !== 404) fail(`重复激活应 404，实际 ${reuse.status}`);
    ok('8. 重复激活同一张码 → 404');

    // 9. 章节 VIP gating
    const [firstChapter] = await db.query(
      'SELECT id FROM chapters WHERE novel_id = ? ORDER BY chapter_number ASC LIMIT 1',
      [cleanup.novelId]
    );
    if (firstChapter.length === 0) fail(`novel ${cleanup.novelId} 没有章节`);
    const chapterId = firstChapter[0].id;

    // 9a. 匿名 → 截断
    const anonChap = await userCall('GET', `/api/chapters/${chapterId}`, null, null);
    if (anonChap.status !== 200) fail(`匿名 GET chapter 失败 ${anonChap.status}`);
    const anonData = anonChap.json.data;
    if (!anonData.vip_required || !anonData.truncated) {
      fail(`匿名应 vip_required=true/truncated=true，实际 vip_required=${anonData.vip_required} truncated=${anonData.truncated}`);
    }
    if (anonData.content.length > anonData.trial_length) {
      fail(`截断后长度 ${anonData.content.length} 应 ≤ trial_length=${anonData.trial_length}`);
    }
    ok(`9a. 匿名读 VIP → 截断到 ${anonData.content.length} 字`);

    // 9b. 会员 → 全文
    const memberChap = await userCall('GET', `/api/chapters/${chapterId}`, null, userToken);
    if (memberChap.status !== 200) fail(`会员 GET chapter 失败 ${memberChap.status}`);
    const memberData = memberChap.json.data;
    if (memberData.truncated) fail('会员不应被截断');
    if (memberData.content.length <= anonData.content.length) {
      fail(`会员长度 ${memberData.content.length} 应 > 匿名 ${anonData.content.length}`);
    }
    ok(`9b. 会员读 VIP → 全文 ${memberData.content.length} 字`);

    // 10. CSV 导出
    const exportRes = await adminCall('GET', `/api/admin/codes/batches/${cleanup.batchId}/export`, null, adminToken);
    if (exportRes.status !== 200) fail(`CSV 导出失败 ${exportRes.status}`);
    let csv = exportRes.str;
    if (csv.charCodeAt(0) === 0xfeff) csv = csv.slice(1);
    const lines = csv.split(/\r?\n/).filter(Boolean);
    if (lines.length !== 4) fail(`CSV 应 4 行，实际 ${lines.length}`);
    const usedRow = lines.slice(1).find(l => l.split(',')[0] === codes[0]);
    if (!usedRow) fail('CSV 中找不到激活的那张码');
    if (!usedRow.includes('已使用')) fail(`第一张应"已使用"，实际：${usedRow}`);
    ok(`10. CSV 导出 ${lines.length-1} 张，第一张为"已使用"`);

    // 11. admin 查激活记录
    const redRes = await adminCall('GET',
      `/api/admin/codes/redemptions?batch_id=${cleanup.batchId}`,
      null, adminToken);
    if (redRes.status !== 200) fail(`redemptions 失败 ${redRes.status}`);
    const list = redRes.json?.data?.list || [];
    if (list.length !== 1) fail(`应 1 条 redemption，实际 ${list.length}`);
    if (list[0].username !== tmpUser) fail(`redemption 用户名错：${list[0].username}`);
    ok(`11. admin 查激活记录 → 找到 ${tmpUser}`);

    // 12. Playwright
    info('启动 Playwright 验证前端');
    const { chromium } = await loadPlaywright();
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();

    // 12a. 匿名 → 会员墙
    await page.goto(`${FRONTEND_BASE}/reading/${cleanup.novelId}?chapter=${chapterId}`, {
      waitUntil: 'domcontentloaded', timeout: 25000
    });
    await page.waitForTimeout(2500);
    const wallVisible = await page.locator('[data-test="reading-membership-wall"]').count();
    if (wallVisible === 0) fail('匿名访问 VIP 章节，会员墙应可见');
    ok('12a. 匿名 → 会员墙渲染');

    // 12b. 注入 token + userInfo，墙消失
    const userInfoForInject = regRes.json.data.user || { id: 0, username: tmpUser, email: `${tmpUser}@audit.local` };
    await ctx.addInitScript(([tk, info]) => {
      try {
        localStorage.setItem('token', tk);
        localStorage.setItem('userInfo', JSON.stringify(info));
      } catch {}
    }, [userToken, userInfoForInject]);
    await page.goto(`${FRONTEND_BASE}/reading/${cleanup.novelId}?chapter=${chapterId}`, {
      waitUntil: 'domcontentloaded', timeout: 25000
    });
    await page.waitForTimeout(2500);
    const wallVisibleAuth = await page.locator('[data-test="reading-membership-wall"]').count();
    if (wallVisibleAuth !== 0) fail('已激活会员不应看到会员墙');
    ok('12b. 已激活会员 → 会员墙消失');

    // 12c. 会员中心
    await page.goto(`${FRONTEND_BASE}/profile/membership`, {
      waitUntil: 'domcontentloaded', timeout: 15000
    });
    // 等会员中心页面真正渲染并把 store 数据填上
    try {
      await page.waitForSelector('[data-test="membership-level-label"]', { timeout: 8000 });
    } catch {
      // 截图便于排错
      await page.screenshot({ path: 'audit-membership-page.png', fullPage: true }).catch(() => {});
    }
    const levelLabel = await page.locator('[data-test="membership-level-label"]').textContent().catch(() => '');
    if (!levelLabel || !levelLabel.trim().includes('月卡')) {
      fail(`会员中心应显示"月卡"，实际：${levelLabel} （final url: ${page.url()}）`);
    }
    ok(`12c. 会员中心显示 = ${levelLabel.trim()}`);

    await browser.close();

    info('清理测试数据...');
  } finally {
    try {
      if (cleanup.novelId !== null && cleanup.origIsVip !== null) {
        await db.query('UPDATE novels SET is_vip = ? WHERE id = ?', [cleanup.origIsVip, cleanup.novelId]);
      }
      if (cleanup.batchId) {
        await db.query(
          `DELETE FROM code_redemption_logs WHERE code_id IN (SELECT id FROM activation_codes WHERE batch_id = ?)`,
          [cleanup.batchId]
        );
        await db.query('DELETE FROM activation_codes WHERE batch_id = ?', [cleanup.batchId]);
        await db.query('DELETE FROM code_batches WHERE id = ?', [cleanup.batchId]);
      }
      if (cleanup.testUsername) {
        await db.query('DELETE FROM users WHERE username = ?', [cleanup.testUsername]);
      }
      info('cleanup 完成');
    } catch (e) {
      console.warn('cleanup 失败：', e.message);
    }
    await db.end();
  }

  console.log('');
  console.log(`\x1b[32m========== ${okSteps}/${totalSteps} 步通过 ==========\x1b[0m`);
  if (okSteps !== totalSteps) {
    console.log('\x1b[31mAUDIT: FAIL\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[32mAUDIT: ALL PASSED\x1b[0m');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\x1b[31m[FAIL]\x1b[0m', err.stack || err);
  console.log('\x1b[31mAUDIT: FAIL\x1b[0m');
  process.exit(1);
});
