/**
 * commentController 单元测试
 *
 * 任务 37.3：物理删除 ensureCommentTables 副作用后的回归保护。
 *
 * 该测试有两条职责：
 *   1. 守住"controller 源码中再不出现 ensureCommentTables 字面量"——
 *      避免后续无意中把运行时建表 helper 又加回来。
 *   2. 守住"controller 模块本身可以被 Node 直接 require 加载、不依赖运行时
 *      CREATE TABLE 副作用"——若有人把 ensureCommentTables 重新引回，导致
 *      模块加载期就 throw，这条断言会立刻红掉。
 *
 * 这两条断言都是纯静态 / 纯模块加载断言，不需要真实 MySQL 连接，
 * 所以可以在任何 CI / 本地环境稳定运行。
 */

const fs = require('fs');
const path = require('path');

const CONTROLLER_PATH = path.resolve(
  __dirname,
  '../../src/controllers/commentController.js'
);

describe('commentController · 37.3 ensureCommentTables 物理删除回归', () => {
  test('controller 源码中不应再出现 `ensureCommentTables` 字面量', () => {
    const source = fs.readFileSync(CONTROLLER_PATH, 'utf8');
    expect(source).not.toMatch(/ensureCommentTables/);
  });

  test('controller 模块可以被 require 加载且不抛错', () => {
    expect(() => {
      // 使用绝对路径 require，避免依赖 jest 解析 mock。
      // eslint-disable-next-line global-require, import/no-dynamic-require
      require(CONTROLLER_PATH);
    }).not.toThrow();
  });

  test('controller 加载后导出预期的请求处理器', () => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const mod = require(CONTROLLER_PATH);

    // 评论列表 / 发表 / 删除 / 点赞 / 取消点赞 / 回复 / 回复列表
    // 这些是 routes/comments.js 引用的公开 handler，本测试只校验存在性。
    [
      'getNovelComments',
      'createComment',
      'deleteComment',
      'likeComment',
      'unlikeComment',
      'getCommentReplies',
      'createReply'
    ].forEach((name) => {
      expect(typeof mod[name]).toBe('function');
    });
  });
});
