/**
 * TXT小说批量导入脚本
 * 功能: 自动扫描data目录下的TXT文件并导入到数据库
 * 作者: AI Assistant
 * 日期: 2025-11-24
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'ai_xsread',
  charset: 'utf8mb4'
};

// 分类映射规则
const CATEGORY_MAP = {
  101: {
    name: '都市言情',
    keywords: ['总裁', '豪门', '婚姻', '恋爱', '暧昧', '前任', '闪婚', '未婚夫', '男朋友', '联姻', '劈腿', '离婚', '出轨', '复合', '暗恋', '室友', '邻居', '继兄', '双胞胎', '三胞胎', '金主']
  },
  102: {
    name: '古风穿越',
    keywords: ['穿越', '重生', '古风', '宫廷', '王爷', '嫡女', '皇上']
  },
  103: {
    name: '悬疑推理',
    keywords: ['悬疑', '推理', '真相', '谜团', '杀手', '死亡', '监控']
  },
  104: {
    name: '治愈系',
    keywords: ['治愈', '温暖', '咖啡', '相遇', '温柔']
  },
  105: {
    name: '奇幻冒险',
    keywords: ['修真', '仙侠', '玄幻', '灵气', '大佬', '师兄', '病娇', '妖']
  },
  106: {
    name: '科幻未来',
    keywords: ['科幻', '星际', '未来', '机甲', '游戏', '恋爱游戏', '测试']
  }
};

// 随机作者名列表
const AUTHORS = [
  '月下清风', '墨染流年', '浅笑嫣然', '半夏时光',
  '梦里寻他', '素笔凉心', '南风知意', '北城以北',
  '倾城时光', '暖风不燥', '柠檬微凉', '星辰如梦'
];

// 解析TXT文件
function parseTxtFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const title = path.basename(filePath, '.txt');
    const wordCount = content.replace(/\s/g, '').length;
    const description = content.substring(0, 200).trim() + '...';
    
    return { title, content, wordCount, description };
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filePath}`, error.message);
    return null;
  }
}

// 根据标题获取分类ID
function getCategoryId(title) {
  for (const [categoryId, info] of Object.entries(CATEGORY_MAP)) {
    if (info.keywords.some(keyword => title.includes(keyword))) {
      return parseInt(categoryId);
    }
  }
  return 101; // 默认分类：都市言情
}

// 随机选择作者
function getRandomAuthor() {
  return AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
}

// 导入单个小说
async function importNovel(connection, novelData) {
  const { title, content, wordCount, description } = novelData;
  
  try {
    // 1. 检查是否已存在
    const [existing] = await connection.query(
      'SELECT id FROM novels WHERE title = ?',
      [title]
    );
    
    if (existing.length > 0) {
      return { success: false, reason: '已存在', title };
    }
    
    // 2. 确定分类
    const categoryId = getCategoryId(title);
    const author = getRandomAuthor();
    
    // 3. 插入小说记录
    const [novelResult] = await connection.query(`
      INSERT INTO novels (
        title, author, category_id, description, word_count, 
        chapter_count, status, views, likes, collections, 
        is_recommended, published_at, last_update_time
      ) VALUES (?, ?, ?, ?, ?, 1, 0, 0, 0, 0, 1, NOW(), NOW())
    `, [title, author, categoryId, description, wordCount]);
    
    const novelId = novelResult.insertId;
    
    // 4. 插入章节内容
    await connection.query(`
      INSERT INTO chapters (
        novel_id, chapter_number, title, content, word_count,
        is_free, status, publish_time
      ) VALUES (?, 1, '正文', ?, ?, 1, 1, NOW())
    `, [novelId, content, wordCount]);
    
    return { 
      success: true, 
      title, 
      novelId, 
      wordCount,
      category: CATEGORY_MAP[categoryId].name
    };
    
  } catch (error) {
    console.error(`❌ 导入失败: ${title}`, error.message);
    return { success: false, reason: error.message, title };
  }
}

// 主函数
async function main() {
  let connection;
  
  try {
    console.log('\n' + '='.repeat(70));
    console.log('📚 TXT小说批量导入工具');
    console.log('='.repeat(70));
    
    // 1. 连接数据库
    console.log('\n🔌 连接数据库...');
    console.log(`   主机: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`   数据库: ${DB_CONFIG.database}`);
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 数据库连接成功\n');
    
    // 2. 扫描data目录
    const dataDir = path.join(__dirname, '../../data');
    console.log(`📂 扫描目录: ${dataDir}`);
    
    if (!fs.existsSync(dataDir)) {
      console.error('❌ data目录不存在');
      process.exit(1);
    }
    
    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.txt'))
      .map(file => path.join(dataDir, file));
    
    console.log(`📋 找到 ${files.length} 个TXT文件\n`);
    
    if (files.length === 0) {
      console.log('⚠️  没有找到TXT文件');
      process.exit(0);
    }
    
    // 3. 开始导入
    console.log('开始导入...\n');
    
    const results = {
      total: files.length,
      success: 0,
      skipped: 0,
      failed: 0,
      details: []
    };
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = path.basename(file);
      
      console.log(`[${i + 1}/${files.length}] ${fileName}`);
      
      // 解析文件
      const novelData = parseTxtFile(file);
      if (!novelData) {
        results.failed++;
        console.log('  ❌ 解析失败\n');
        continue;
      }
      
      // 导入到数据库
      const result = await importNovel(connection, novelData);
      
      if (result.success) {
        results.success++;
        results.details.push(result);
        console.log(`  ✅ 成功导入: ${result.title} (${result.wordCount}字, ${result.category})\n`);
      } else if (result.reason === '已存在') {
        results.skipped++;
        console.log(`  ⏭️  跳过: ${result.title} (已存在)\n`);
      } else {
        results.failed++;
        console.log(`  ❌ 导入失败: ${result.reason}\n`);
      }
    }
    
    // 4. 显示统计信息
    console.log('='.repeat(70));
    console.log('📊 导入统计');
    console.log('='.repeat(70));
    console.log(`总文件数: ${results.total}`);
    console.log(`成功导入: ${results.success} ✅`);
    console.log(`已存在: ${results.skipped} ⏭️`);
    console.log(`导入失败: ${results.failed} ❌`);
    console.log('='.repeat(70));
    
    // 5. 查询数据库统计
    const [novels] = await connection.query('SELECT COUNT(*) as count FROM novels');
    const [chapters] = await connection.query('SELECT COUNT(*) as count FROM chapters');
    
    console.log('\n📚 数据库现有:');
    console.log(`  小说总数: ${novels[0].count}`);
    console.log(`  章节总数: ${chapters[0].count}`);
    
    console.log('\n🎉 导入完成！');
    console.log('💡 现在可以在前端阅读这些小说了');
    console.log('   访问: http://localhost:3008\n');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 提示: 请确保 MySQL 服务已启动');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 提示: 请检查数据库用户名和密码');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行主函数
main();
