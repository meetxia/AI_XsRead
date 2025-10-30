#!/usr/bin/env node

/**
 * ============================================
 * 环境配置快速设置脚本
 * ============================================
 * 
 * 用途: 帮助开发者快速创建和配置 .env 文件
 * 
 * 使用方法:
 *   node setup-env.js
 * 
 * 功能:
 * - 检查 .env 文件是否存在
 * - 从 .env.example 复制模板
 * - 生成强随机JWT密钥
 * - 交互式配置数据库信息
 * - 验证配置完整性
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`),
};

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提问函数
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// 生成强随机密钥
const generateSecret = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// 检查文件是否存在
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
};

// 读取文件内容
const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    log.error(`读取文件失败: ${filePath}`);
    return null;
  }
};

// 写入文件
const writeFile = (filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (err) {
    log.error(`写入文件失败: ${filePath}`);
    return false;
  }
};

// 配置单个项目
async function setupProject(projectName, projectPath) {
  log.title(`配置 ${projectName}`);
  
  const envExamplePath = path.join(projectPath, '.env.example');
  const envPath = path.join(projectPath, '.env');
  
  // 检查 .env.example 是否存在
  if (!fileExists(envExamplePath)) {
    log.error(`.env.example 文件不存在: ${envExamplePath}`);
    return false;
  }
  
  // 检查 .env 是否已存在
  if (fileExists(envPath)) {
    log.warning(`.env 文件已存在: ${envPath}`);
    const overwrite = await question('是否覆盖? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('跳过配置');
      return true;
    }
  }
  
  // 读取模板
  let envContent = readFile(envExamplePath);
  if (!envContent) return false;
  
  log.info('正在配置环境变量...\n');
  
  // 数据库配置
  log.info('数据库配置:');
  const dbHost = await question('  DB_HOST [127.0.0.1]: ') || '127.0.0.1';
  const dbPort = await question('  DB_PORT [3306]: ') || '3306';
  const dbUser = await question('  DB_USER [root]: ') || 'root';
  const dbPassword = await question('  DB_PASSWORD (必填): ');
  
  if (!dbPassword) {
    log.error('数据库密码不能为空!');
    return false;
  }
  
  const dbName = projectName === 'backend' 
    ? (await question('  DB_DATABASE [ai_xsread]: ') || 'ai_xsread')
    : (await question('  DB_NAME [ai_xsread]: ') || 'ai_xsread');
  
  // 生成JWT密钥
  log.info('\n正在生成JWT密钥...');
  const jwtSecret = generateSecret(32);
  const jwtRefreshSecret = projectName === 'backend' ? generateSecret(32) : null;
  
  log.success(`JWT_SECRET: ${jwtSecret.substring(0, 16)}...`);
  if (jwtRefreshSecret) {
    log.success(`JWT_REFRESH_SECRET: ${jwtRefreshSecret.substring(0, 16)}...`);
  }
  
  // 替换配置
  envContent = envContent
    .replace(/DB_HOST=.*/, `DB_HOST=${dbHost}`)
    .replace(/DB_PORT=.*/, `DB_PORT=${dbPort}`)
    .replace(/DB_USER=.*/, `DB_USER=${dbUser}`)
    .replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${dbPassword}`)
    .replace(/DB_(DATABASE|NAME)=.*/g, `DB_${projectName === 'backend' ? 'DATABASE' : 'NAME'}=${dbName}`)
    .replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`);
  
  if (jwtRefreshSecret) {
    envContent = envContent.replace(/JWT_REFRESH_SECRET=.*/, `JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
  }
  
  // 写入文件
  if (writeFile(envPath, envContent)) {
    log.success(`.env 文件创建成功: ${envPath}\n`);
    return true;
  }
  
  return false;
}

// 验证配置
function validateEnv(projectPath) {
  const envPath = path.join(projectPath, '.env');
  const content = readFile(envPath);
  
  if (!content) return false;
  
  const requiredVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET'
  ];
  
  const missing = [];
  
  for (const varName of requiredVars) {
    const regex = new RegExp(`${varName}=(.+)`);
    const match = content.match(regex);
    
    if (!match || !match[1] || match[1].includes('your_') || match[1].includes('change_')) {
      missing.push(varName);
    }
  }
  
  // 检查JWT密钥长度
  const jwtSecretMatch = content.match(/JWT_SECRET=(.+)/);
  if (jwtSecretMatch && jwtSecretMatch[1].length < 32) {
    log.warning('JWT_SECRET 长度不足32个字符');
  }
  
  if (missing.length > 0) {
    log.warning('以下环境变量未正确配置:');
    missing.forEach(v => log.warning(`  - ${v}`));
    return false;
  }
  
  return true;
}

// 主函数
async function main() {
  console.clear();
  log.title('🚀 AI-XsRead 环境配置向导');
  
  log.info('此脚本将帮助您快速配置项目环境变量\n');
  
  const projects = [
    { name: 'backend', path: path.join(__dirname, 'backend') },
    { name: 'admin-backend', path: path.join(__dirname, 'admin-backend') }
  ];
  
  // 配置每个项目
  for (const project of projects) {
    const success = await setupProject(project.name, project.path);
    if (!success) {
      log.error(`${project.name} 配置失败`);
      rl.close();
      process.exit(1);
    }
  }
  
  // 验证配置
  log.title('验证配置');
  
  let allValid = true;
  for (const project of projects) {
    log.info(`验证 ${project.name}...`);
    if (validateEnv(project.path)) {
      log.success(`${project.name} 配置有效`);
    } else {
      log.error(`${project.name} 配置无效`);
      allValid = false;
    }
  }
  
  // 完成
  log.title('配置完成');
  
  if (allValid) {
    log.success('所有项目配置成功! 🎉\n');
    log.info('下一步:');
    log.info('  1. 检查 .env 文件确保配置正确');
    log.info('  2. 启动数据库服务');
    log.info('  3. 运行 npm install 安装依赖');
    log.info('  4. 运行 npm start 启动应用\n');
  } else {
    log.warning('部分配置可能不完整,请手动检查 .env 文件\n');
  }
  
  log.info('重要提示:');
  log.warning('  - 永远不要将 .env 文件提交到版本控制');
  log.warning('  - 生产环境请使用更强的密码和密钥');
  log.warning('  - 定期更换密码和密钥\n');
  
  rl.close();
}

// 运行
main().catch(err => {
  log.error(`发生错误: ${err.message}`);
  rl.close();
  process.exit(1);
});

