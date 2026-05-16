/**
 * 测试登录API
 */

const axios = require('axios');

async function testLogin() {
  try {
    console.log('\n🔍 测试登录API\n');
    console.log('请求URL: http://localhost:8005/api/auth/login');
    console.log('用户名: admin');
    console.log('密码: 123456\n');
    
    const response = await axios.post('http://localhost:8005/api/auth/login', {
      username: 'admin',
      password: '123456'
    });
    
    console.log('✅ 登录成功！');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ 登录失败！');
    console.log('状态码:', error.response?.status);
    console.log('错误信息:', error.response?.data);
    console.log('完整错误:', error.message);
  }
}

testLogin();
