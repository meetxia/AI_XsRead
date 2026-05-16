const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixReadingHistoryTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  });

  try {
    console.log('开始修复 reading_history 表...\n');

    // 1. 修改 chapter_id 字段允许 NULL
    console.log('1. 修改 chapter_id 字段允许 NULL...');
    await connection.query(`
      ALTER TABLE reading_history 
      MODIFY COLUMN chapter_id int(10) unsigned NULL 
      COMMENT '章节ID，无章节模式时为NULL'
    `);
    console.log('✅ chapter_id 字段已修改为允许 NULL\n');

    // 2. 验证修改
    console.log('2. 验证字段修改...');
    const [fields] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        IS_NULLABLE,
        COLUMN_TYPE,
        COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'reading_history' 
      AND COLUMN_NAME IN ('chapter_id', 'read_time')
    `);
    
    console.log('字段信息:');
    fields.forEach(field => {
      console.log(`  - ${field.COLUMN_NAME}: ${field.COLUMN_TYPE}, NULL=${field.IS_NULLABLE}, ${field.COLUMN_COMMENT}`);
    });
    
    console.log('\n✅ reading_history 表修复完成！');
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

fixReadingHistoryTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
