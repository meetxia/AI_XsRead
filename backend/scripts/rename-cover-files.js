/**
 * 封面文件重命名脚本（中文 → 英文 kebab-case）
 *
 * 读取 backend/uploads/images/covers-jpg/cover-name-map.json，
 * 把同目录下匹配 shortName.jpg 的文件重命名为 englishName.jpg。
 *
 * 用法:
 *   node scripts/rename-cover-files.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const COVERS_DIR = path.join(__dirname, '..', 'uploads', 'images', 'covers-jpg');
const MAP_FILE = path.join(COVERS_DIR, 'cover-name-map.json');

const dryRun = process.argv.includes('--dry-run');

function main() {
  if (!fs.existsSync(MAP_FILE)) {
    console.error('❌ 映射文件不存在:', MAP_FILE);
    process.exit(1);
  }

  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  const novels = map.novels || [];

  const existingFiles = new Set(
    fs
      .readdirSync(COVERS_DIR)
      .filter((f) => f.toLowerCase().endsWith('.jpg'))
  );

  let renamed = 0;
  let skipped = 0;
  let missing = 0;

  console.log(`📁 源目录: ${COVERS_DIR}`);
  console.log(`🔖 模式: ${dryRun ? 'DRY-RUN (不实际修改)' : 'EXECUTE'}\n`);

  for (const novel of novels) {
    const oldName = `${novel.shortName}.jpg`;
    const newName = `${novel.englishName}.jpg`;
    const oldPath = path.join(COVERS_DIR, oldName);
    const newPath = path.join(COVERS_DIR, newName);

    if (existingFiles.has(newName)) {
      console.log(`  ⏭  ${oldName} → ${newName} (目标已存在，跳过)`);
      skipped++;
      continue;
    }

    if (!fs.existsSync(oldPath)) {
      console.log(`  ⚠  缺失源文件: ${oldName}`);
      missing++;
      continue;
    }

    if (dryRun) {
      console.log(`  ✓ ${oldName} → ${newName}`);
      renamed++;
      continue;
    }

    fs.renameSync(oldPath, newPath);
    console.log(`  ✅ ${oldName} → ${newName}`);
    renamed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  重命名: ${renamed}  跳过: ${skipped}  缺失: ${missing}`);
  console.log('='.repeat(60));
}

main();
