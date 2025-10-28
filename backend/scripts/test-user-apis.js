/**
 * 测试用户相关API
 * 运行方式: node backend/scripts/test-user-apis.js
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 8005;  // 后端服务实际运行端口
let TOKEN = '';

// HTTP请求函数
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // 调试信息
    // console.log(`请求: ${method} http://${BASE_URL}:${PORT}${options.path}`);

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${body.substring(0, 100)}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`请求失败: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    if (data) {
      const jsonData = JSON.stringify(data);
      req.write(jsonData);
    }
    req.end();
  });
}

// 测试函数
async function testLogin() {
  console.log('\n🔐 测试登录...');
  try {
    const response = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.code === 200) {
      TOKEN = response.data.accessToken;
      console.log('✅ 登录成功');
      console.log('   Token:', TOKEN.substring(0, 30) + '...');
      console.log('   用户:', response.data.user.username);
      return true;
    } else {
      console.log('❌ 登录失败:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 登录失败:', error.message);
    return false;
  }
}

async function testGetUserProfile() {
  console.log('\n👤 测试获取用户资料...');
  try {
    const response = await makeRequest('GET', '/user/profile', null, TOKEN);
    
    if (response.code === 200) {
      console.log('✅ 获取用户资料成功');
      console.log('   用户名:', response.data.user.username);
      console.log('   邮箱:', response.data.user.email);
      console.log('   头像:', response.data.user.avatar ? '已设置' : '未设置');
      console.log('   书架统计:', response.data.stats.totalBooks, '本');
      console.log('   点赞数:', response.data.stats.totalLikes);
      console.log('   收藏数:', response.data.stats.totalCollections);
      console.log('   评论数:', response.data.stats.totalComments);
      return true;
    } else {
      console.log('❌ 获取用户资料失败:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 获取用户资料失败:', error.message);
    return false;
  }
}

async function testGetUserStatistics() {
  console.log('\n📊 测试获取用户统计...');
  try {
    const response = await makeRequest('GET', '/user/statistics', null, TOKEN);
    
    if (response.code === 200) {
      console.log('✅ 获取用户统计成功');
      console.log('   书架统计:');
      console.log('     - 总数:', response.data.bookshelf.total);
      console.log('     - 正在读:', response.data.bookshelf.reading);
      console.log('     - 已读完:', response.data.bookshelf.finished);
      console.log('     - 收藏:', response.data.bookshelf.collected);
      console.log('   阅读时长:');
      console.log('     - 总时长:', response.data.readTime.total, '分钟');
      console.log('     - 今日:', response.data.readTime.today, '分钟');
      console.log('   阅读统计:');
      console.log('     - 总小说数:', response.data.reading.totalNovels);
      console.log('     - 总章节数:', response.data.reading.totalChapters);
      console.log('     - 连续天数:', response.data.reading.readingStreak);
      console.log('   最喜欢分类:', response.data.favoriteCategory?.name || '暂无');
      console.log('   阅读趋势:', response.data.readingTrend.length, '天数据');
      return true;
    } else {
      console.log('❌ 获取用户统计失败:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 获取用户统计失败:', error.message);
    return false;
  }
}

async function testGetUserAchievements() {
  console.log('\n🏆 测试获取用户成就...');
  try {
    const response = await makeRequest('GET', '/user/achievements', null, TOKEN);
    
    if (response.code === 200) {
      console.log('✅ 获取用户成就成功');
      console.log('   总成就数:', response.data.totalAchievements);
      console.log('   已解锁:', response.data.unlockedAchievements);
      console.log('   完成度:', response.data.summary.percentage + '%');
      console.log('   成就列表:');
      
      // 显示前5个成就
      response.data.achievements.slice(0, 5).forEach(achievement => {
        const status = achievement.unlocked ? '✓' : '✗';
        console.log(`     ${status} ${achievement.icon} ${achievement.name} (${achievement.progress}/${achievement.target})`);
      });
      
      if (response.data.achievements.length > 5) {
        console.log(`     ... 还有 ${response.data.achievements.length - 5} 个成就`);
      }
      
      return true;
    } else {
      console.log('❌ 获取用户成就失败:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 获取用户成就失败:', error.message);
    return false;
  }
}

async function testGetBookshelf() {
  console.log('\n📚 测试获取书架...');
  try {
    const response = await makeRequest('GET', '/user/bookshelf?page=1&pageSize=10', null, TOKEN);
    
    if (response.code === 200) {
      console.log('✅ 获取书架成功');
      console.log('   书架数量:', response.data.length);
      console.log('   总数:', response.pagination?.total || 0);
      console.log('   当前页:', response.pagination?.page || 1);
      
      // 显示前3本书
      response.data.slice(0, 3).forEach(book => {
        console.log(`     - ${book.title} (作者: ${book.author})`);
      });
      
      return true;
    } else {
      console.log('❌ 获取书架失败:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 获取书架失败:', error.message);
    return false;
  }
}

async function testGetReadingHistory() {
  console.log('\n📖 测试获取阅读历史...');
  try {
    const response = await makeRequest('GET', '/user/reading-history?page=1&pageSize=10', null, TOKEN);
    
    if (response.code === 200) {
      console.log('✅ 获取阅读历史成功');
      console.log('   历史记录数量:', response.data.length);
      console.log('   总数:', response.pagination?.total || 0);
      return true;
    } else {
      console.log('❌ 获取阅读历史失败:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 获取阅读历史失败:', error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n🏥 测试健康检查...');
  try {
    const response = await makeRequest('GET', '/health');
    
    if (response.code === 200) {
      console.log('✅ 服务器健康');
      console.log('   状态:', response.data.status);
      console.log('   运行时间:', Math.floor(response.data.uptime), '秒');
      return true;
    } else {
      console.log('❌ 服务器异常');
      return false;
    }
  } catch (error) {
    console.log('❌ 无法连接到服务器:', error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('═══════════════════════════════════════');
  console.log('   个人中心API接口测试');
  console.log('═══════════════════════════════════════');
  console.log(`   服务器: http://${BASE_URL}:${PORT}/api`);
  console.log('═══════════════════════════════════════');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // 0. 测试健康检查
  const healthCheck = await testHealthCheck();
  if (!healthCheck) {
    console.log('\n❌ 服务器未运行，无法继续测试');
    console.log('   请先启动后端服务: npm run dev');
    process.exit(1);
  }
  results.passed++;
  results.tests.push({ name: '健康检查', passed: true });

  // 1. 测试登录
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ 登录失败，无法继续测试');
    console.log('   请检查数据库中是否有admin用户');
    results.failed++;
    results.tests.push({ name: '用户登录', passed: false });
    printSummary(results);
    process.exit(1);
  }
  results.passed++;
  results.tests.push({ name: '用户登录', passed: true });

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 200));

  // 2. 测试获取用户资料
  const profileSuccess = await testGetUserProfile();
  results.tests.push({ name: '获取用户资料', passed: profileSuccess });
  if (profileSuccess) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 200));

  // 3. 测试获取用户统计
  const statsSuccess = await testGetUserStatistics();
  results.tests.push({ name: '获取用户统计', passed: statsSuccess });
  if (statsSuccess) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 200));

  // 4. 测试获取用户成就
  const achievementsSuccess = await testGetUserAchievements();
  results.tests.push({ name: '获取用户成就', passed: achievementsSuccess });
  if (achievementsSuccess) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 200));

  // 5. 测试获取书架
  const bookshelfSuccess = await testGetBookshelf();
  results.tests.push({ name: '获取书架', passed: bookshelfSuccess });
  if (bookshelfSuccess) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 200));

  // 6. 测试获取阅读历史
  const historySuccess = await testGetReadingHistory();
  results.tests.push({ name: '获取阅读历史', passed: historySuccess });
  if (historySuccess) results.passed++;
  else results.failed++;

  // 输出测试结果
  printSummary(results);
}

function printSummary(results) {
  console.log('\n═══════════════════════════════════════');
  console.log('   测试结果总结');
  console.log('═══════════════════════════════════════');
  
  results.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.name}`);
  });
  
  console.log('───────────────────────────────────────');
  console.log(`✅ 通过: ${results.passed}/${results.tests.length}`);
  console.log(`❌ 失败: ${results.failed}/${results.tests.length}`);
  
  const percentage = Math.round((results.passed / results.tests.length) * 100);
  console.log(`📊 成功率: ${percentage}%`);
  console.log('═══════════════════════════════════════\n');
  
  if (results.failed === 0) {
    console.log('🎉 所有测试通过！个人中心API工作正常！\n');
  } else {
    console.log('⚠️ 部分测试失败，请检查错误信息\n');
  }
}

// 运行测试
console.log('\n开始测试...\n');
runTests().catch(error => {
  console.error('\n💥 测试运行出错:', error.message);
  console.error(error.stack);
  process.exit(1);
});
