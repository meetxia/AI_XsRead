/**
 * 批量优化封面图片脚本
 *
 * 功能：
 * 1. 将 uploads/images/covers/ 下的 JPG/PNG 封面压缩为 WebP 格式
 * 2. 同时保留一份压缩后的 JPG 作为兼容回退
 * 3. 生成缩略图到 uploads/thumbnails/covers/
 * 4. 输出优化报告（原始大小 vs 压缩后大小）
 *
 * 用法：
 *   node scripts/optimize-covers.js [--quality 80] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const COVERS_DIR = path.join(__dirname, '..', 'uploads', 'images', 'covers');
const THUMBS_DIR = path.join(__dirname, '..', 'uploads', 'thumbnails', 'covers');
const OPTIMIZED_DIR = path.join(__dirname, '..', 'uploads', 'images', 'covers-optimized');

// 封面图尺寸标准
const COVER_MAX_WIDTH = 600;
const COVER_MAX_HEIGHT = 800;
const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 280;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function optimizeSingleCover(filePath, options = {}) {
  const { quality = 80, dryRun = false } = options;
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();

  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    return null;
  }

  const originalSize = fs.statSync(filePath).size;
  const baseName = path.basename(filename, ext);

  if (dryRun) {
    return { filename, originalSize, skipped: true };
  }

  // 1. 压缩为 WebP（主格式，体积最小）
  const webpName = `${baseName}.webp`;
  const webpPath = path.join(OPTIMIZED_DIR, webpName);
  await sharp(filePath)
    .resize(COVER_MAX_WIDTH, COVER_MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 5 })
    .toFile(webpPath);

  const webpSize = fs.statSync(webpPath).size;

  // 2. 压缩为 JPG（兼容回退）
  const jpgName = `${baseName}.jpg`;
  const jpgPath = path.join(OPTIMIZED_DIR, jpgName);
  await sharp(filePath)
    .resize(COVER_MAX_WIDTH, COVER_MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toFile(jpgPath);

  const jpgSize = fs.statSync(jpgPath).size;

  // 3. 生成缩略图（WebP）
  const thumbName = `thumb_${baseName}.webp`;
  const thumbPath = path.join(THUMBS_DIR, thumbName);
  await sharp(filePath)
    .resize(THUMB_WIDTH, THUMB_HEIGHT, {
      fit: 'cover',
      position: 'top',
    })
    .webp({ quality: 70, effort: 5 })
    .toFile(thumbPath);

  const thumbSize = fs.statSync(thumbPath).size;

  return {
    filename,
    originalSize,
    webpSize,
    jpgSize,
    thumbSize,
    webpSavings: Math.round((1 - webpSize / originalSize) * 100),
    jpgSavings: Math.round((1 - jpgSize / originalSize) * 100),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const qualityIdx = args.indexOf('--quality');
  const quality = qualityIdx >= 0 ? parseInt(args[qualityIdx + 1], 10) : 80;

  console.log('📸 封面图片批量优化工具');
  console.log(`   质量: ${quality}  干跑模式: ${dryRun}`);
  console.log(`   源目录: ${COVERS_DIR}`);
  console.log(`   输出目录: ${OPTIMIZED_DIR}`);
  console.log(`   缩略图目录: ${THUMBS_DIR}`);
  console.log('');

  if (!fs.existsSync(COVERS_DIR)) {
    console.error('❌ 封面目录不存在:', COVERS_DIR);
    process.exit(1);
  }

  ensureDir(OPTIMIZED_DIR);
  ensureDir(THUMBS_DIR);

  const files = fs.readdirSync(COVERS_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map(f => path.join(COVERS_DIR, f));

  if (files.length === 0) {
    console.log('⚠️  没有找到需要优化的图片');
    return;
  }

  console.log(`找到 ${files.length} 张封面图片，开始优化...\n`);

  let totalOriginal = 0;
  let totalWebp = 0;
  let totalJpg = 0;
  let totalThumb = 0;
  const results = [];

  for (const filePath of files) {
    try {
      const result = await optimizeSingleCover(filePath, { quality, dryRun });
      if (result && !result.skipped) {
        results.push(result);
        totalOriginal += result.originalSize;
        totalWebp += result.webpSize;
        totalJpg += result.jpgSize;
        totalThumb += result.thumbSize;
        console.log(
          `  ✅ ${result.filename}: ` +
          `${(result.originalSize / 1024).toFixed(0)}KB → ` +
          `WebP ${(result.webpSize / 1024).toFixed(0)}KB (-${result.webpSavings}%) | ` +
          `JPG ${(result.jpgSize / 1024).toFixed(0)}KB (-${result.jpgSavings}%)`
        );
      }
    } catch (err) {
      console.error(`  ❌ ${path.basename(filePath)}: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 优化报告');
  console.log('='.repeat(60));
  console.log(`  处理图片数: ${results.length}`);
  console.log(`  原始总大小: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  WebP 总大小: ${(totalWebp / 1024 / 1024).toFixed(2)} MB (节省 ${Math.round((1 - totalWebp / totalOriginal) * 100)}%)`);
  console.log(`  JPG 总大小: ${(totalJpg / 1024 / 1024).toFixed(2)} MB (节省 ${Math.round((1 - totalJpg / totalOriginal) * 100)}%)`);
  console.log(`  缩略图总大小: ${(totalThumb / 1024 / 1024).toFixed(2)} MB`);
  console.log('');

  if (!dryRun) {
    // 用优化后的 JPG 替换原始 JPG 文件（保持向后兼容）
    console.log('🔄 用优化后的 JPG 替换原始封面...');
    for (const result of results) {
      const ext = path.extname(result.filename).toLowerCase();
      // 只替换 JPG/JPEG/PNG 原始文件，不动 WebP 文件
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

      const baseName = path.basename(result.filename, ext);
      const optimizedJpg = path.join(OPTIMIZED_DIR, `${baseName}.jpg`);
      const originalPath = path.join(COVERS_DIR, result.filename);
      if (fs.existsSync(optimizedJpg)) {
        try {
          if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
        } catch (_) { /* ignore */ }
        try {
          fs.copyFileSync(optimizedJpg, originalPath);
        } catch (e) {
          console.warn(`  ⚠️  替换失败: ${result.filename} - ${e.message}`);
        }
      }
    }
    console.log('✅ 替换完成');

    // 把 WebP 版本也复制到 covers 目录（仅处理原始 JPG/PNG 对应的 WebP）
    console.log('🔄 复制 WebP 版本到封面目录...');
    for (const result of results) {
      const ext = path.extname(result.filename).toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

      const baseName = path.basename(result.filename, ext);
      const webpSrc = path.join(OPTIMIZED_DIR, `${baseName}.webp`);
      const webpDest = path.join(COVERS_DIR, `${baseName}.webp`);
      if (fs.existsSync(webpSrc)) {
        try {
          if (fs.existsSync(webpDest)) fs.unlinkSync(webpDest);
        } catch (_) { /* ignore */ }
        try {
          fs.copyFileSync(webpSrc, webpDest);
        } catch (e) {
          console.warn(`  ⚠️  WebP 复制失败: ${baseName}.webp - ${e.message}`);
        }
      }
    }
    console.log('✅ WebP 版本已就位');
  }

  console.log('\n🎉 优化完成！');
}

main().catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});
