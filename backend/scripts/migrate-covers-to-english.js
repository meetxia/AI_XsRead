/**
 * 封面路径迁移脚本：旧 hash 路径 → covers-jpg 英文路径
 *
 * 数据源: backend/uploads/images/covers-jpg/cover-name-map.json
 * 操作: UPDATE novels SET cover = '/uploads/images/covers-jpg/{english}.jpg' WHERE title = ?
 *
 * 用法:
 *   node scripts/migrate-covers-to-english.js [--dry-run] [--verify]
 *
 * 参数:
 *   --dry-run  只打印将要执行的更新，不写库
 *   --verify   迁移后核对：所有 34 条记录都已切到新路径
 */
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const NAME_MAP = path.join(
  __dirname,
  '..',
  'uploads',
  'images',
  'covers-jpg',
  'cover-name-map.json'
);
const NEW_DIR = '/uploads/images/covers-jpg';

const dryRun = process.argv.includes('--dry-run');
const verifyOnly = process.argv.includes('--verify');

function buildPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'ai_xsread',
    charset: 'utf8mb4',
  });
}

function loadMap() {
  if (!fs.existsSync(NAME_MAP)) {
    throw new Error('命名映射文件不存在: ' + NAME_MAP);
  }
  const json = JSON.parse(fs.readFileSync(NAME_MAP, 'utf8'));
  if (!Array.isArray(json.novels) || json.novels.length === 0) {
    throw new Error('cover-name-map.json 中 novels 列表为空');
  }
  return json.novels;
}

async function migrate(pool, novels) {
  let updated = 0;
  let unchanged = 0;
  let notFound = 0;

  for (const n of novels) {
    const newCover = `${NEW_DIR}/${n.englishName}.jpg`;

    if (dryRun) {
      console.log(`  [dry-run] ${n.title}  →  ${newCover}`);
      continue;
    }

    const [result] = await pool.execute(
      'UPDATE novels SET cover = ? WHERE title = ?',
      [newCover, n.title]
    );
    if (result.affectedRows === 0) {
      notFound++;
      console.log(`  ⚠ 未找到: ${n.title}`);
    } else if (result.changedRows === 0) {
      unchanged++;
      console.log(`  • 已是新路径: ${n.title}`);
    } else {
      updated++;
      console.log(`  ✅ ${n.title}  →  ${newCover}`);
    }
  }

  return { updated, unchanged, notFound };
}

async function verify(pool) {
  const [newRows] = await pool.query(
    "SELECT COUNT(*) AS c FROM novels WHERE cover LIKE '/uploads/images/covers-jpg/%'"
  );
  const [legacyRows] = await pool.query(
    "SELECT id, title, cover FROM novels WHERE cover LIKE '/uploads/images/covers/cover-%'"
  );
  console.log('\n📊 核对结果');
  console.log(`  使用 covers-jpg/ 路径: ${newRows[0].c} 条`);
  console.log(`  仍使用旧 hash 路径:    ${legacyRows.length} 条`);
  if (legacyRows.length > 0) {
    console.log('  ⚠ 旧路径明细:');
    for (const row of legacyRows) {
      console.log(`     [${row.id}] ${row.title} :: ${row.cover}`);
    }
  }
}

async function main() {
  console.log('🚚 封面路径迁移：covers/cover-{hash} → covers-jpg/{english}');
  console.log(`   模式: ${dryRun ? 'DRY-RUN' : verifyOnly ? 'VERIFY-ONLY' : 'EXECUTE'}\n`);

  const pool = buildPool();
  try {
    if (!verifyOnly) {
      const novels = loadMap();
      console.log(`   待处理: ${novels.length} 条\n`);
      const stats = await migrate(pool, novels);
      if (!dryRun) {
        console.log('\n' + '='.repeat(60));
        console.log(`  更新: ${stats.updated}  未变化: ${stats.unchanged}  未找到: ${stats.notFound}`);
        console.log('='.repeat(60));
      }
    }
    if (!dryRun) {
      await verify(pool);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ 迁移失败:', err.message);
  if (err.code) console.error('   code:', err.code);
  process.exit(1);
});
