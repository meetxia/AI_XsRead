const { db } = require('../database/pool');

async function testSaveProgress() {
  try {
    console.log('=== 测试保存阅读进度 ===\n');

    // 测试数据（使用实际存在的小说ID）
    const testData = {
      userId: 1,
      novelId: 12, // 为了气前任我找了个牛郎，结果他是京圈太子爷
      chapterId: null, // 无章节模式
      progress: 35
    };

    console.log('测试数据:', testData);

    // 检查是否已有记录
    const existing = await db.query(
      'SELECT id FROM reading_progress WHERE user_id = ? AND novel_id = ?',
      [testData.userId, testData.novelId]
    );

    if (existing && existing.length > 0) {
      console.log('\n已存在记录，执行更新...');
      // 更新
      await db.query(
        'UPDATE reading_progress SET chapter_id = ?, progress = ?, updated_at = NOW() WHERE user_id = ? AND novel_id = ?',
        [testData.chapterId, testData.progress, testData.userId, testData.novelId]
      );
      console.log('✅ 更新成功');
    } else {
      console.log('\n不存在记录，执行插入...');
      // 插入
      await db.query(
        'INSERT INTO reading_progress (user_id, novel_id, chapter_id, progress, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [testData.userId, testData.novelId, testData.chapterId, testData.progress]
      );
      console.log('✅ 插入成功');
    }

    // 查询验证
    console.log('\n验证保存结果:');
    const result = await db.query(
      `SELECT rp.*, n.title 
       FROM reading_progress rp
       LEFT JOIN novels n ON rp.novel_id = n.id
       WHERE rp.user_id = ? AND rp.novel_id = ?`,
      [testData.userId, testData.novelId]
    );

    if (result && result.length > 0) {
      console.log('----------------------------------------');
      console.log('用户ID:', result[0].user_id);
      console.log('小说:', result[0].title);
      console.log('章节ID:', result[0].chapter_id || 'NULL (无章节模式)');
      console.log('进度:', result[0].progress + '%');
      console.log('更新时间:', result[0].updated_at);
      console.log('----------------------------------------');
      console.log('\n✅ 测试成功！阅读进度已正确保存');
    } else {
      console.log('❌ 未找到保存的记录');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testSaveProgress();

