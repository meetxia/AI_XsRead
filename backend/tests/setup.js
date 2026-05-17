/**
 * Jest 测试环境设置
 */

// 设置环境变量
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_USER = process.env.TEST_DB_USER || 'root';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'test-password';
process.env.DB_DATABASE = process.env.TEST_DB_DATABASE || 'ai_xsread_test';
process.env.JWT_SECRET = 'test-secret-key-with-at-least-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-with-at-least-32-chars';
process.env.JWT_EXPIRES_IN = '24h';

// 全局测试超时
jest.setTimeout(10000);

// 全局测试钩子
beforeAll(async () => {
  // 可以在这里初始化测试数据库连接
  console.log('🧪 测试环境初始化...');
});

afterAll(async () => {
  // 清理测试资源
  console.log('🧹 清理测试环境...');
});

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

