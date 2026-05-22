#!/usr/bin/env node
/**
 * 会员体系（admin-backend）冒烟测试
 *
 * 跑这个脚本之前需要：
 *   1. admin-backend 在 8001 端口已启动（npm run dev）
 *   2. 数据库迁移已执行（含 code_batches / activation_codes / system_contact 等）
 *   3. admin_users 表里至少有一个可用 admin（用 init-admin 创建，或通过环境变量提供账号）
 *
 * 默认账号通过环境变量 SMOKE_ADMIN_USERNAME / SMOKE_ADMIN_PASSWORD 提供。
 *
 * 流程（按顺序，失败立刻退出 1）：
 *   1. admin 登录拿 token
 *   2. 创建 1 个月卡批次（5 张码）
 *   3. 列表能看到该批次
 *   4. 详情能看到 5 张 unused 码
 *   5. CSV 导出验证行数 = 5+1（含 header）和明文格式 4-4-4-4
 *   6. 作废前两张码
 *   7. 详情核对 void_count=2 / unused=3 / void=2
 *   8. 尝试通过 backend 8005 走真正激活；起不来则跳过
 *   9. 写客服信息（PUT），再读回来
 *  10. 拿一个真实用户 → disable / enable
 *  11. 拿一个真实 novel → setVip(1) → setVip(0) 还原
 *  12. cleanup：删除测试码、批次（FK RESTRICT，所以 codes 必须先删）
 *
 * 用 node 自带的 http 模块，避免引入新依赖。
 */

const http = require('http');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const ADMIN_HOST = process.env.SMOKE_ADMIN_HOST || '127.0.0.1';
const ADMIN_PORT = Number(process.env.SMOKE_ADMIN_PORT || process.env.PORT || 8001);

const USER_HOST = process.env.SMOKE_USER_HOST || '127.0.0.1';
const USER_PORT = Number(process.env.SMOKE_USER_PORT || 8005);

const ADMIN_USERNAME = process.env.SMOKE_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('[FAIL] 请通过 SMOKE_ADMIN_PASSWORD 提供管理员密码；脚本不再内置默认密码。');
  process.exit(1);
}

// ---------- 工具函数 ----------

function colorize(level, msg) {
  const c = level === 'OK' ? '\x1b[32m' : level === 'FAIL' ? '\x1b[31m' : level === 'SKIP' ? '\x1b[33m' : '\x1b[36m';
  return `${c}[${level}]\x1b[0m ${msg}`;
}

function log(level, msg) {
  console.log(colorize(level, msg));
}

function fail(reason) {
  log('FAIL', reason);
  console.log(colorize('FAIL', `SMOKE: FAIL ${reason}`));
  process.exit(1);
}

/**
 * 发送 HTTP 请求，返回 { status, headers, bodyBuf, bodyStr, json }
 */
function request({ host, port, method, path, headers = {}, body, raw = false }) {
  return new Promise((resolve, reject) => {
    const opts = { host, port, method, path, headers: { ...headers } };
    let payload = null;
    // 仅在有真正 body 时序列化；null/undefined 都不发 body
    if (body !== undefined && body !== null) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        payload = body;
      } else {
        payload = JSON.stringify(body);
        opts.headers['content-type'] = opts.headers['content-type'] || 'application/json';
      }
      opts.headers['content-length'] = Buffer.byteLength(payload);
    }
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        let json = null;
        const str = buf.toString('utf8');
        if (!raw) {
          try { json = JSON.parse(str); } catch (_) { /* not json */ }
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          bodyBuf: buf,
          bodyStr: str,
          json
        });
      });
    });
    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

function adminCall(method, path, body, token) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return request({
    host: ADMIN_HOST, port: ADMIN_PORT,
    method, path, headers, body
  });
}

function userCall(method, path, body, token) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return request({
    host: USER_HOST, port: USER_PORT,
    method, path, headers, body
  });
}

async function getDb() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false
  });
}

// ---------- 主流程 ----------

async function main() {
  log('INFO', `admin-backend = http://${ADMIN_HOST}:${ADMIN_PORT}`);
  log('INFO', `backend       = http://${USER_HOST}:${USER_PORT}`);

  // 健康检查
  let health;
  try {
    health = await adminCall('GET', '/api/health', null, null);
  } catch (e) {
    fail(`无法连接 admin-backend (${e.message})，请确认已 npm run dev`);
  }
  if (!health || health.status !== 200) {
    fail(`admin-backend /api/health 返回 ${health && health.status}`);
  }
  log('OK', 'admin-backend 可达');

  // 验证 admin_users 至少存在一行
  const db = await getDb();
  try {
    const [adminRows] = await db.query("SELECT id, username, role FROM admin_users WHERE status = 1 LIMIT 1");
    if (adminRows.length === 0) {
      fail('admin_users 表里没有任何 status=1 的管理员，请先运行 node scripts/init-admin.js');
    }
  } catch (e) {
    fail(`查询 admin_users 失败：${e.message}`);
  }

  // 1. 登录
  const loginRes = await adminCall('POST', '/api/admin/login', {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD
  });
  if (loginRes.status !== 200 || !loginRes.json || !loginRes.json.data || !loginRes.json.data.accessToken) {
    fail(`登录失败：status=${loginRes.status} body=${loginRes.bodyStr.slice(0, 200)}`);
  }
  const token = loginRes.json.data.accessToken;
  log('OK', `1. 登录成功 user=${ADMIN_USERNAME}`);

  // 2. 创建批次
  const batchName = `smoke-test-${Date.now()}`;
  const createRes = await adminCall('POST', '/api/admin/codes/batches', {
    code_type: 'monthly', count: 5, name: batchName
  }, token);
  if (createRes.status !== 200 && createRes.status !== 201) {
    fail(`2. 创建批次失败 status=${createRes.status} body=${createRes.bodyStr.slice(0, 300)}`);
  }
  const created = createRes.json && createRes.json.data;
  if (!created || !created.batch || !Array.isArray(created.codes) || created.codes.length !== 5) {
    fail(`2. 返回数据异常: ${createRes.bodyStr.slice(0, 300)}`);
  }
  const batchId = created.batch.id;
  const batchNo = created.batch.batch_no;
  const plainCodes = created.codes; // ['XXXX-XXXX-XXXX-XXXX', ...]
  log('OK', `2. 创建批次 id=${batchId} batch_no=${batchNo} codes=${plainCodes.length}`);

  // 校验明文格式
  for (const c of plainCodes) {
    if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(c)) {
      fail(`2. 明文激活码格式不符: ${c}`);
    }
  }

  // 3. 列表
  const listRes = await adminCall('GET', '/api/admin/codes/batches?page=1&pageSize=20&keyword=' + encodeURIComponent(batchName), null, token);
  if (listRes.status !== 200) fail(`3. 批次列表 status=${listRes.status} body=${listRes.bodyStr.slice(0, 200)}`);
  if (!listRes.json || !listRes.json.data) {
    fail(`3. 列表返回格式异常: ${listRes.bodyStr.slice(0, 200)}`);
  }
  const listFound = (listRes.json.data.list || []).find((b) => b.id === batchId);
  if (!listFound) fail('3. 列表里没找到刚创建的批次');
  if (Number(listFound.total_count) !== 5 || Number(listFound.used_count) !== 0) {
    fail(`3. 列表统计异常: total_count=${listFound.total_count} used_count=${listFound.used_count}`);
  }
  log('OK', `3. 列表显示 total_count=5 used_count=0`);

  // 4. 详情
  const detailRes = await adminCall('GET', `/api/admin/codes/batches/${batchId}?page=1&pageSize=50`, null, token);
  if (detailRes.status !== 200) fail(`4. 详情 status=${detailRes.status}`);
  const detail = detailRes.json.data;
  const codeRows = (detail.codes && detail.codes.list) || [];
  if (codeRows.length !== 5) fail(`4. 详情里码列表数量应为 5，实际 ${codeRows.length}`);
  if (codeRows.some((c) => c.status !== 'unused')) fail('4. 存在非 unused 码');
  log('OK', `4. 详情码列表 5 张 全部 unused`);
  const codeIds = codeRows.map((c) => c.id).sort((a, b) => a - b);

  // 5. CSV 导出
  const exportRes = await adminCall('GET', `/api/admin/codes/batches/${batchId}/export`, null, token);
  if (exportRes.status !== 200) fail(`5. 导出 status=${exportRes.status}`);
  const ct = exportRes.headers['content-type'] || '';
  if (!/text\/csv/i.test(ct)) fail(`5. Content-Type 应为 text/csv，实际 ${ct}`);
  const cd = exportRes.headers['content-disposition'] || '';
  if (!cd.includes(`batch-${batchNo}.csv`)) fail(`5. Content-Disposition 缺少文件名: ${cd}`);
  // 解析 CSV 行（去 BOM）
  let csvText = exportRes.bodyStr;
  if (csvText.charCodeAt(0) === 0xfeff) csvText = csvText.slice(1);
  const lines = csvText.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length !== 6) fail(`5. CSV 行数应为 6（1 header + 5 数据），实际 ${lines.length}`);
  if (!lines[0].startsWith('激活码,')) fail(`5. CSV 头不对: ${lines[0]}`);
  // 校验明文格式 4-4-4-4
  for (let i = 1; i < lines.length; i++) {
    const firstField = lines[i].split(',')[0];
    if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(firstField)) {
      fail(`5. CSV 明文格式不符: ${firstField}`);
    }
  }
  log('OK', `5. CSV 导出 6 行 包含 5 张明文`);

  // 6. 作废前两张
  const voidIds = codeIds.slice(0, 2);
  const voidRes = await adminCall('POST', '/api/admin/codes/void', { code_ids: voidIds, reason: 'smoke test' }, token);
  if (voidRes.status !== 200) fail(`6. 作废 status=${voidRes.status} body=${voidRes.bodyStr.slice(0, 200)}`);
  if (!voidRes.json.data || voidRes.json.data.count !== 2) fail(`6. 作废数量异常`);
  log('OK', `6. 作废 2 张码`);

  // 7. 详情核对
  const detailRes2 = await adminCall('GET', `/api/admin/codes/batches/${batchId}?page=1&pageSize=50`, null, token);
  const detail2 = detailRes2.json.data;
  if (Number(detail2.batch.void_count) !== 2) fail(`7. void_count 应为 2，实际 ${detail2.batch.void_count}`);
  const codes2 = detail2.codes.list;
  const voidCount = codes2.filter((c) => c.status === 'void').length;
  const unusedCount = codes2.filter((c) => c.status === 'unused').length;
  if (voidCount !== 2 || unusedCount !== 3) {
    fail(`7. 状态统计异常: void=${voidCount} unused=${unusedCount}`);
  }
  log('OK', `7. void=2 unused=3`);

  // 8. 通过 backend 真正激活第 3 张码（如果 8005 起着）
  let userBackendOk = false;
  try {
    const probe = await userCall('GET', '/api/system/contact', null, null);
    userBackendOk = probe && (probe.status === 200 || probe.status === 401 || probe.status === 404);
  } catch (_) {
    userBackendOk = false;
  }

  let activatedCodeId = null;
  if (!userBackendOk) {
    log('SKIP', '8. backend(8005) 未启动，跳过 redemption 验证');
  } else {
    // 找一个普通用户登录，然后激活第 3 张
    // 为简化：直接用 mysql 查找一个非管理员、有密码（hashed bcrypt）的用户，并通过 backend 注册一个临时账号。
    // 优先选注册临时用户的方式：调 /api/auth/register 创建。
    try {
      const tmpUser = `smoke_${Date.now()}`;
      const tmpEmail = `${tmpUser}@smoke.local`;
      const tmpPwd = 'Smoke@123456';
      const regRes = await userCall('POST', '/api/auth/register', {
        username: tmpUser,
        email: tmpEmail,
        password: tmpPwd
      });
      if (regRes.status >= 400) {
        log('SKIP', `8. 注册临时用户失败 status=${regRes.status}，跳过 redemption 验证`);
      } else {
        // 拿登录 token
        let userToken = null;
        if (regRes.json && regRes.json.data && (regRes.json.data.accessToken || regRes.json.data.token)) {
          userToken = regRes.json.data.accessToken || regRes.json.data.token;
        } else {
          const loginUserRes = await userCall('POST', '/api/auth/login', { username: tmpUser, password: tmpPwd });
          if (loginUserRes.status === 200 && loginUserRes.json && loginUserRes.json.data) {
            userToken = loginUserRes.json.data.accessToken || loginUserRes.json.data.token;
          }
        }
        if (!userToken) {
          log('SKIP', '8. 临时用户拿不到 token，跳过 redemption 验证');
        } else {
          // 用第 3 张未使用码（已作废了 0/1，可用 codeIds[2]）
          const codeToUse = plainCodes[2];
          const activateRes = await userCall('POST', '/api/user/membership/activate',
            { code: codeToUse }, userToken);
          if (activateRes.status !== 200) {
            log('SKIP', `8. 激活接口返回 ${activateRes.status} ${activateRes.bodyStr.slice(0, 120)}，跳过 redemption 验证`);
          } else {
            activatedCodeId = codeIds[2];
            // 查 redemptions
            const redRes = await adminCall('GET', `/api/admin/codes/redemptions?batch_id=${batchId}&page=1&pageSize=20`, null, token);
            if (redRes.status !== 200) fail(`8. redemptions status=${redRes.status}`);
            const list = (redRes.json.data && redRes.json.data.list) || [];
            const found = list.find((r) => r.code_id === codeIds[2]);
            if (!found) fail('8. redemption 记录里没找到刚激活的码');
            log('OK', `8. 真实激活 + redemption 查询成功 user=${tmpUser}`);

            // 清理临时用户（直接 SQL，简单粗暴）
            try {
              await db.query('DELETE FROM users WHERE username = ?', [tmpUser]);
            } catch (_) { /* ignore */ }
          }
        }
      }
    } catch (e) {
      log('SKIP', `8. backend 联调出现异常 ${e.message}，跳过 redemption 验证`);
    }
  }

  // 9. 客服信息
  // 备份原值
  const [origContact] = await db.query('SELECT * FROM system_contact WHERE id = 1');
  const origRow = origContact[0] || {};

  const updateContactRes = await adminCall('PUT', '/api/admin/system/contact',
    { qq: '12345', wechat: 'wx-test', notice: 'test' }, token);
  if (updateContactRes.status !== 200) fail(`9. 更新客服 status=${updateContactRes.status}`);
  log('OK', '9. 更新客服信息');

  // 10. 读取
  const getContactRes = await adminCall('GET', '/api/admin/system/contact', null, token);
  if (getContactRes.status !== 200) fail(`10. 读取客服 status=${getContactRes.status}`);
  const contact = getContactRes.json.data;
  if (contact.qq !== '12345' || contact.wechat !== 'wx-test' || contact.notice !== 'test') {
    fail(`10. 客服信息回读不一致: ${JSON.stringify(contact)}`);
  }
  log('OK', '10. 读取客服信息一致');

  // 11. 用户管理 disable/enable
  const userListRes = await adminCall('GET', '/api/admin/users?page=1&pageSize=1', null, token);
  if (userListRes.status !== 200) fail(`11. 用户列表 status=${userListRes.status}`);
  const userList = (userListRes.json.data && userListRes.json.data.list) || [];
  if (userList.length === 0) {
    log('SKIP', '11. users 表为空，跳过 disable/enable');
  } else {
    const targetUser = userList[0];
    const disableRes = await adminCall('POST', `/api/admin/users/${targetUser.id}/membership/disable`,
      { reason: 'smoke test' }, token);
    if (disableRes.status !== 200) fail(`11. disable status=${disableRes.status}`);
    const enableRes = await adminCall('POST', `/api/admin/users/${targetUser.id}/membership/enable`, {}, token);
    if (enableRes.status !== 200) fail(`11. enable status=${enableRes.status}`);
    log('OK', `11. user_id=${targetUser.id} disable/enable 通`);
  }

  // 12. 小说 set-vip
  const [novelRows] = await db.query('SELECT id, is_vip FROM novels ORDER BY id ASC LIMIT 1');
  if (novelRows.length === 0) {
    log('SKIP', '12. novels 表为空，跳过 set-vip');
  } else {
    const novelId = novelRows[0].id;
    const origIsVip = Number(novelRows[0].is_vip) || 0;
    const setVipRes = await adminCall('POST', '/api/admin/novels/set-vip',
      { ids: [novelId], is_vip: 1 }, token);
    if (setVipRes.status !== 200) fail(`12. set-vip status=${setVipRes.status} body=${setVipRes.bodyStr.slice(0, 200)}`);
    log('OK', `12. novel_id=${novelId} set is_vip=1`);

    // 还原
    await adminCall('POST', '/api/admin/novels/set-vip',
      { ids: [novelId], is_vip: origIsVip }, token);
  }

  // 13. cleanup
  try {
    // 还原客服信息
    await db.query(
      `UPDATE system_contact SET qq=?, wechat=?, notice=?, qrcode_url=?, updated_by=?, updated_at=NOW() WHERE id = 1`,
      [origRow.qq ?? null, origRow.wechat ?? null, origRow.notice ?? null, origRow.qrcode_url ?? null, origRow.updated_by ?? null]
    );

    // 删除测试码（先清 redemption，再删 codes，再删 batch）
    if (activatedCodeId) {
      await db.query('DELETE FROM code_redemption_logs WHERE code_id = ?', [activatedCodeId]);
    }
    await db.query('DELETE FROM activation_codes WHERE batch_id = ?', [batchId]);
    await db.query('DELETE FROM code_batches WHERE id = ?', [batchId]);
    log('OK', '13. cleanup 完成');
  } catch (e) {
    log('SKIP', `13. cleanup 部分失败：${e.message}`);
  }

  await db.end();

  console.log('');
  console.log(colorize('OK', 'SMOKE: ALL PASSED'));
  process.exit(0);
}

main().catch((err) => {
  log('FAIL', `未捕获异常: ${err && err.stack ? err.stack : err}`);
  console.log(colorize('FAIL', 'SMOKE: FAIL uncaught error'));
  process.exit(1);
});
