const { db } = require('../database/pool');

async function checkReadingProgress() {
  try {
    console.log('=== 检查阅读进度数据 ===\n');

    // 检查reading_progress表
    const progressData = await db.query(`
      SELECT rp.*, n.title, u.username 
      FROM reading_progress rp
      LEFT JOIN novels n ON rp.novel_id = n.id
      LEFT JOIN users u ON rp.user_id = u.id
      ORDER BY rp.updated_at DESC
      LIMIT 10
    `);

    console.log('最近10条阅读进度记录:');
    console.log('----------------------------------------');
    if (!progressData || progressData.length === 0) {
      console.log('❌ 没有阅读进度记录！');
    } else {
      progressData.forEach(record => {
        console.log(`用户: ${record.username || record.user_id}`);
        console.log(`小说: ${record.title || record.novel_id}`);
        console.log(`章节ID: ${record.chapter_id}`);
        console.log(`进度: ${record.progress}%`);
        console.log(`更新时间: ${record.updated_at}`);
        console.log('----------------------------------------');
      });
    }

    // 检查书架数据的进度关联
    console.log('\n=== 检查书架与进度关联 ===\n');
    const bookshelfWithProgress = await db.query(`
      SELECT 
        b.user_id, 
        b.novel_id, 
        n.title,
        rp.chapter_id as current_chapter_id, 
        rp.progress as reading_progress,
        b.updated_at as bookshelf_updated,
        rp.updated_at as progress_updated
      FROM bookshelf b
      INNER JOIN novels n ON b.novel_id = n.id
      LEFT JOIN reading_progress rp ON rp.user_id = b.user_id AND rp.novel_id = b.novel_id
      ORDER BY b.updated_at DESC
      LIMIT 10
    `);

    console.log('书架数据（含进度）:');
    console.log('----------------------------------------');
    if (!bookshelfWithProgress || bookshelfWithProgress.length === 0) {
      console.log('❌ 没有书架数据！');
    } else {
      bookshelfWithProgress.forEach(record => {
        console.log(`用户ID: ${record.user_id}`);
        console.log(`小说: ${record.title}`);
        console.log(`当前章节: ${record.current_chapter_id || '未记录'}`);
        console.log(`阅读进度: ${record.reading_progress || 0}%`);
        console.log(`书架更新: ${record.bookshelf_updated}`);
        console.log(`进度更新: ${record.progress_updated || '无'}`);
        console.log('----------------------------------------');
      });
    }

    // 统计信息
    console.log('\n=== 统计信息 ===');
    const statsResult = await db.query(`
      SELECT 
        COUNT(DISTINCT b.user_id) as total_users,
        COUNT(DISTINCT b.novel_id) as total_novels,
        COUNT(*) as total_bookshelf,
        COUNT(rp.id) as with_progress
      FROM bookshelf b
      LEFT JOIN reading_progress rp ON rp.user_id = b.user_id AND rp.novel_id = b.novel_id
    `);

    const stats = statsResult && statsResult.length > 0 ? statsResult[0] : {};
    console.log(`总用户数: ${stats.total_users || 0}`);
    console.log(`总小说数: ${stats.total_novels || 0}`);
    console.log(`书架记录数: ${stats.total_bookshelf || 0}`);
    console.log(`有进度记录: ${stats.with_progress || 0}`);
    console.log(`无进度记录: ${(stats.total_bookshelf || 0) - (stats.with_progress || 0)}`);

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    process.exit(0);
  }
}

checkReadingProgress();

