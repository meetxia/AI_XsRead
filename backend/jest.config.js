module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // 覆盖率收集
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // 排除入口文件
    '!src/config/**', // 排除配置文件
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70
    }
  },
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // 设置超时时间
  testTimeout: 10000,
  
  // 测试前执行的文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 清除 mock
  clearMocks: true,
  
  // 每个测试文件之间重置 mock
  resetMocks: true,
  
  // 显示详细输出
  verbose: true,
  
  // 转换忽略模式
  transformIgnorePatterns: [
    'node_modules/'
  ]
};

