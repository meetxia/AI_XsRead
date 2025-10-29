/**
 * 测试头像上传功能
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置
const API_HOST = 'localhost';
const API_PORT = 8005;
const TEST_IMAGE = path.join(__dirname, 'uploads/tx/image_16_1761629456252.jpg');

// HTTP请求辅助函数
function httpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// 上传文件辅助函数
function uploadFile(token, filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileName = path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);
    const stats = fs.statSync(filePath);
    
    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="avatar"; filename="${fileName}"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n`
    );
    
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/upload/avatar',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': header.length + stats.size + footer.length
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    req.write(header);
    fileStream.pipe(req, { end: false });
    fileStream.on('end', () => {
      req.write(footer);
      req.end();
    });
  });
}

async function testAvatarUpload() {
  try {
    console.log('🔧 开始测试头像上传功能...\n');
    
    // 1. 登录获取Token
    console.log('1️⃣  登录获取Token...');
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });
    
    const loginRes = await httpRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData);
    
    if (loginRes.data.code !== 200) {
      console.error('❌ 登录失败:', loginRes.data.message);
      return;
    }
    
    const token = loginRes.data.data.accessToken;
    console.log('✅ 登录成功，Token:', token.substring(0, 30) + '...\n');
    
    // 2. 检查图片文件
    console.log('2️⃣  检查测试图片...');
    if (!fs.existsSync(TEST_IMAGE)) {
      console.error('❌ 测试图片不存在:', TEST_IMAGE);
      return;
    }
    
    const stats = fs.statSync(TEST_IMAGE);
    console.log('✅ 图片文件存在');
    console.log('   路径:', TEST_IMAGE);
    console.log('   大小:', (stats.size / 1024).toFixed(2), 'KB\n');
    
    // 3. 上传头像
    console.log('3️⃣  上传头像...');
    const uploadRes = await uploadFile(token, TEST_IMAGE);
    
    console.log('📊 上传响应:');
    console.log('   状态码:', uploadRes.status);
    console.log('   响应数据:', JSON.stringify(uploadRes.data, null, 2));
    
    if (uploadRes.data.code === 200) {
      console.log('\n✅ 头像上传成功！');
      console.log('   头像URL:', uploadRes.data.data.avatar);
      if (uploadRes.data.data.thumbnail) {
        console.log('   缩略图URL:', uploadRes.data.data.thumbnail);
      }
    } else {
      console.log('\n❌ 头像上传失败:', uploadRes.data.message);
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error('   错误:', error.message);
    console.error('   堆栈:', error.stack);
  }
}

// 运行测试
testAvatarUpload();

