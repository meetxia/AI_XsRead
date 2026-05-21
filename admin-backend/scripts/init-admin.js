/**
 * 初始化默认管理员账号
 *
 * 使用：node scripts/init-admin.js
 *
 * 行为：
 *   - admin 不存在时：生成 20 位强随机密码，bcrypt(12) 加密入库，
 *     并把明文凭证写到 admin-backend/.admin-credentials（mode 0600）
 *   - admin 已存在时：不重置已有密码，直接退出（避免误改生产密码）
 *
 * 凭证文件 admin-backend/.admin-credentials 已加入 .gitignore，
 * 运维读取后必须立刻安全销毁，不要留存到 git / 聊天记录 / 邮件 / 外部存储。
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

function generateStrongPassword(length = 20) {
  // 字符集：大小写字母 + 数字 + 安全符号（去掉容易混淆的 0/O/I/l/1）
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@$%&*+-_';
  const bytes = crypto.randomBytes(length);
  let pwd = '';
  for (let i = 0; i < length; i += 1) {
    pwd += chars[bytes[i] % chars.length];
  }
  return pwd;
}

async function initAdmin() {
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  // 兼容 DB_NAME / DB_DATABASE
  const dbName = process.env.DB_NAME || process.env.DB_DATABASE;
  if (!dbName) missingVars.push('DB_NAME (或 DB_DATABASE)');

  if (missingVars.length > 0) {
    console.error('❌ 缺少必需的环境变量:', missingVars.join(', '));
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName
    });

    console.log('✅ 数据库连接成功');

    const [existing] = await connection.query(
      'SELECT id FROM admin_users WHERE username = ?',
      ['admin']
    );

    if (existing.length > 0) {
      console.log('⚠️  admin 账号已存在，本脚本不重置已有密码。');
      console.log('   如需重置，请手工执行 SQL，或新增专用脚本（避免误操作生产密码）。');
      await connection.end();
      process.exit(0);
    }

    const password = generateStrongPassword(20);
    const hashed = await bcrypt.hash(password, 12);

    await connection.query(
      `INSERT INTO admin_users (username, password, email, role)
       VALUES (?, ?, ?, ?)`,
      ['admin', hashed, 'admin@example.com', 'super_admin']
    );

    // 写一次性凭证文件
    const credPath = path.join(__dirname, '..', '.admin-credentials');
    const content = [
      '# MOMO 小说管理后台首次凭证（一次性，请记录后立刻删除此文件）',
      `# 生成时间: ${new Date().toISOString()}`,
      '',
      'username: admin',
      `password: ${password}`,
      '',
      '# 登录管理后台后请立刻在「系统设置 / 修改密码」中修改密码。',
      '# 此文件已加入 .gitignore，但仍属敏感凭证：',
      '# - 不要提交到 git',
      '# - 不要发送到聊天记录 / 邮件 / 外部对象存储',
      '# - 运维读取并妥善保管后，请立刻 `rm .admin-credentials`',
      ''
    ].join('\n');
    fs.writeFileSync(credPath, content, { mode: 0o600 });

    console.log('✅ 默认管理员账号创建成功');
    console.log(`   凭证已写入：${credPath}`);
    console.log('   请运维立刻读取该文件并安全销毁。');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    if (connection) {
      try { await connection.end(); } catch (_) { /* ignore */ }
    }
    process.exit(1);
  }
}

initAdmin();
