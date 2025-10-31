/**
 * 测试真实的API接口
 */

const axios = require('axios');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testRealAPI() {
  try {
    console.log('=== 测试管理后台API接口 ===\n');

    // 首先，确保有管理员账号并获取token
    console.log('1. 准备登录...');
    
    const loginResponse = await axios.post('http://localhost:8001/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    }).catch(err => {
      console.error('登录失败:', err.response?.data || err.message);
      return null;
    });

    if (!loginResponse) {
      console.log('\n❌ 无法登录管理后台');
      console.log('请确保:');
      console.log('  1. admin-backend 正在运行在 8001 端口');
      console.log('  2. 已运行: node scripts/init-admin.js');
      return;
    }

    console.log('✅ 登录成功');
    const token = loginResponse.data.data.accessToken;
    console.log('Token:', token.substring(0, 30) + '...\n');

    // 测试用户列表API
    console.log('2. 测试用户列表API: GET /api/admin/users');
    const usersResponse = await axios.get('http://localhost:8001/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        pageSize: 20
      }
    }).catch(err => {
      console.error('获取用户列表失败:', err.response?.data || err.message);
      return null;
    });

    if (usersResponse) {
      console.log('✅ 用户列表API响应:');
      console.log(`  - 状态码: ${usersResponse.status}`);
      console.log(`  - 总数: ${usersResponse.data.data.total}`);
      console.log(`  - 当前页数据数量: ${usersResponse.data.data.list.length}`);
      console.log(`  - 前3个用户:`);
      usersResponse.data.data.list.slice(0, 3).forEach(user => {
        console.log(`    * ID:${user.id} - ${user.username} (${user.email})`);
      });
    }
    console.log('');

    // 测试小说列表API
    console.log('3. 测试小说列表API: GET /api/admin/novels');
    const novelsResponse = await axios.get('http://localhost:8001/api/admin/novels', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        pageSize: 20
      }
    }).catch(err => {
      console.error('获取小说列表失败:', err.response?.data || err.message);
      return null;
    });

    if (novelsResponse) {
      console.log('✅ 小说列表API响应:');
      console.log(`  - 状态码: ${novelsResponse.status}`);
      console.log(`  - 总数: ${novelsResponse.data.data.total}`);
      console.log(`  - 当前页数据数量: ${novelsResponse.data.data.list.length}`);
      console.log(`  - 前3本小说:`);
      novelsResponse.data.data.list.slice(0, 3).forEach(novel => {
        console.log(`    * ID:${novel.id} - ${novel.title} - ${novel.author}`);
      });
    }
    console.log('');

    console.log('=== 测试完成 ===');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testRealAPI();

