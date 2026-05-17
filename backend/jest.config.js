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
  //
  // 当前阈值是一条"现状底线"——故意设得略低于
  // 在没有真实 MySQL 时单测 + 单元测试能够稳定达到的水位，
  // 用以防止后续提交出现明显的覆盖率倒退。
  //
  // TODO: 把集成测试迁移到容器化的 MySQL（docker-compose / testcontainers）
  // 并在 CI 中始终启用之后，再逐步把 statements/lines 拉回 ≥70、
  // branches ≥60、functions ≥60。
  coverageThreshold: {
    global: {
      statements: 30,
      branches: 15,
      functions: 22,
      lines: 30
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
