/**
 * 生成 bcrypt 密码哈希
 * 用于创建测试账号的加密密码
 */

const bcrypt = require('bcryptjs');

const password = '123456'; // 测试密码

async function generateHash() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('='.repeat(60));
    console.log('📝 密码哈希生成成功');
    console.log('='.repeat(60));
    console.log('原始密码:', password);
    console.log('加密后的哈希:', hash);
    console.log('='.repeat(60));
    console.log('\n💡 使用说明:');
    console.log('将上面的哈希值替换到 SQL 文件中的 password 字段');
    console.log('所有测试账号的密码都是: 123456');
    console.log('='.repeat(60));
    
    // 验证密码
    const isValid = await bcrypt.compare(password, hash);
    console.log('\n✅ 密码验证:', isValid ? '成功' : '失败');
    
    return hash;
  } catch (error) {
    console.error('❌ 生成失败:', error);
  }
}

generateHash();

