/**
 * ============================================
 * MOMO小说 - 任务队列服务
 * 开发者: 开发者C
 * 创建日期: 2025-10-27
 * 版本: v1.0
 * ============================================
 * 
 * 功能:
 * - 异步任务队列
 * - 任务重试机制
 * - 任务优先级
 * - 任务监控
 * - 失败处理
 */

const Bull = require('bull');
const Redis = require('ioredis');

// ============================================
// 配置
// ============================================
const CONFIG = {
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
  },
  
  queues: {
    email: {
      name: 'email',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    },
    statistics: {
      name: 'statistics',
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    },
    sync: {
      name: 'sync',
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    },
    notification: {
      name: 'notification',
      defaultJobOptions: {
        attempts: 3,
        priority: 1,
      },
    },
  },
};

// ============================================
// 任务队列服务类
// ============================================
class QueueService {
  constructor(config = CONFIG) {
    this.config = config;
    this.queues = {};
    this.processors = {};
    
    this.initialize();
  }

  /**
   * 初始化队列
   */
  initialize() {
    try {
      // 创建所有队列
      Object.keys(this.config.queues).forEach(queueName => {
        const queueConfig = this.config.queues[queueName];
        this.queues[queueName] = new Bull(queueConfig.name, {
          redis: this.config.redis,
          defaultJobOptions: queueConfig.defaultJobOptions,
        });
        
        // 设置事件监听
        this.setupQueueEvents(this.queues[queueName], queueName);
      });
      
      console.log('✅ 任务队列服务初始化成功');
    } catch (error) {
      console.error('❌ 任务队列服务初始化失败:', error);
    }
  }

  /**
   * 设置队列事件监听
   */
  setupQueueEvents(queue, queueName) {
    // 任务完成
    queue.on('completed', (job, result) => {
      console.log(`✅ [${queueName}] 任务 ${job.id} 完成`, result);
    });
    
    // 任务失败
    queue.on('failed', (job, err) => {
      console.error(`❌ [${queueName}] 任务 ${job.id} 失败:`, err.message);
      
      // 可以在这里发送告警
      if (job.attemptsMade >= job.opts.attempts) {
        console.error(`⚠️ [${queueName}] 任务 ${job.id} 已达到最大重试次数`);
      }
    });
    
    // 任务延迟
    queue.on('stalled', (job) => {
      console.warn(`⚠️ [${queueName}] 任务 ${job.id} 停滞`);
    });
    
    // 任务进度
    queue.on('progress', (job, progress) => {
      console.log(`📊 [${queueName}] 任务 ${job.id} 进度: ${progress}%`);
    });
  }

  /**
   * 添加任务到队列
   */
  async addJob(queueName, jobName, data, options = {}) {
    try {
      const queue = this.queues[queueName];
      
      if (!queue) {
        throw new Error(`队列不存在: ${queueName}`);
      }
      
      const job = await queue.add(jobName, data, options);
      
      console.log(`➕ [${queueName}] 添加任务: ${jobName} (ID: ${job.id})`);
      
      return {
        success: true,
        jobId: job.id,
        queueName,
        jobName,
      };
    } catch (error) {
      console.error(`添加任务失败:`, error);
      throw error;
    }
  }

  /**
   * 注册任务处理器
   */
  registerProcessor(queueName, jobName, processor) {
    try {
      const queue = this.queues[queueName];
      
      if (!queue) {
        throw new Error(`队列不存在: ${queueName}`);
      }
      
      // 保存处理器引用
      if (!this.processors[queueName]) {
        this.processors[queueName] = {};
      }
      this.processors[queueName][jobName] = processor;
      
      // 注册处理器
      queue.process(jobName, async (job) => {
        console.log(`⚙️ [${queueName}] 处理任务: ${jobName} (ID: ${job.id})`);
        
        try {
          const result = await processor(job);
          
          // 更新进度到100%
          await job.progress(100);
          
          return result;
        } catch (error) {
          console.error(`处理任务失败:`, error);
          throw error;
        }
      });
      
      console.log(`📝 注册处理器: ${queueName}/${jobName}`);
    } catch (error) {
      console.error(`注册处理器失败:`, error);
      throw error;
    }
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus(queueName) {
    try {
      const queue = this.queues[queueName];
      
      if (!queue) {
        throw new Error(`队列不存在: ${queueName}`);
      }
      
      const [
        waiting,
        active,
        completed,
        failed,
        delayed,
      ] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);
      
      return {
        queueName,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      };
    } catch (error) {
      console.error(`获取队列状态失败:`, error);
      throw error;
    }
  }

  /**
   * 获取所有队列状态
   */
  async getAllQueuesStatus() {
    try {
      const statuses = {};
      
      for (const queueName of Object.keys(this.queues)) {
        statuses[queueName] = await this.getQueueStatus(queueName);
      }
      
      return statuses;
    } catch (error) {
      console.error(`获取所有队列状态失败:`, error);
      throw error;
    }
  }

  /**
   * 获取任务详情
   */
  async getJob(queueName, jobId) {
    try {
      const queue = this.queues[queueName];
      
      if (!queue) {
        throw new Error(`队列不存在: ${queueName}`);
      }
      
      const job = await queue.getJob(jobId);
      
      if (!job) {
        return null;
      }
      
      return {
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress(),
        attemptsMade: job.attemptsMade,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        returnvalue: job.returnvalue,
        stacktrace: job.stacktrace,
        failedReason: job.failedReason,
      };
    } catch (error) {
      console.error(`获取任务详情失败:`, error);
      throw error;
    }
  }

  /**
   * 重试失败的任务
   */
  async retryFailedJobs(queueName) {
    try {
      const queue = this.queues[queueName];
      
      if (!queue) {
        throw new Error(`队列不存在: ${queueName}`);
      }
      
      const failedJobs = await queue.getFailed();
      let retriedCount = 0;
      
      for (const job of failedJobs) {
        await job.retry();
        retriedCount++;
      }
      
      console.log(`🔄 [${queueName}] 重试了 ${retriedCount} 个失败任务`);
      
      return {
        success: true,
        retriedCount,
      };
    } catch (error) {
      console.error(`重试失败任务失败:`, error);
      throw error;
    }
  }

  /**
   * 清理已完成的任务
   */
  async cleanCompleted(queueName, grace = 0) {
    try {
      const queue = this.queues[queueName];
      
      if (!queue) {
        throw new Error(`队列不存在: ${queueName}`);
      }
      
      await queue.clean(grace, 'completed');
      
      console.log(`🧹 [${queueName}] 清理已完成任务`);
      
      return {
        success: true,
      };
    } catch (error) {
      console.error(`清理任务失败:`, error);
      throw error;
    }
  }

  /**
   * 清理失败的任务
   */
  async cleanFailed(queueName, grace = 0) {
    try {
      const queue = this.queues[queueName];
      
      if (!queue) {
        throw new Error(`队列不存在: ${queueName}`);
      }
      
      await queue.clean(grace, 'failed');
      
      console.log(`🧹 [${queueName}] 清理失败任务`);
      
      return {
        success: true,
      };
    } catch (error) {
      console.error(`清理失败任务失败:`, error);
      throw error;
    }
  }

  /**
   * 暂停队列
   */
  async pauseQueue(queueName) {
    try {
      const queue = this.queues[queueName];
      
      if (!queue) {
        throw new Error(`队列不存在: ${queueName}`);
      }
      
      await queue.pause();
      
      console.log(`⏸️ [${queueName}] 队列已暂停`);
      
      return {
        success: true,
      };
    } catch (error) {
      console.error(`暂停队列失败:`, error);
      throw error;
    }
  }

  /**
   * 恢复队列
   */
  async resumeQueue(queueName) {
    try {
      const queue = this.queues[queueName];
      
      if (!queue) {
        throw new Error(`队列不存在: ${queueName}`);
      }
      
      await queue.resume();
      
      console.log(`▶️ [${queueName}] 队列已恢复`);
      
      return {
        success: true,
      };
    } catch (error) {
      console.error(`恢复队列失败:`, error);
      throw error;
    }
  }

  /**
   * 关闭所有队列
   */
  async closeAll() {
    try {
      const promises = Object.values(this.queues).map(queue => queue.close());
      await Promise.all(promises);
      
      console.log('✅ 所有队列已关闭');
    } catch (error) {
      console.error('关闭队列失败:', error);
    }
  }
}

// ============================================
// 导出
// ============================================
const queueService = new QueueService();

module.exports = {
  QueueService,
  queueService,
};

// ============================================
// 使用示例
// ============================================
/*
const { queueService } = require('./queueService');

// 1. 注册邮件发送处理器
queueService.registerProcessor('email', 'send-email', async (job) => {
  const { to, subject, content } = job.data;
  
  console.log(`发送邮件给 ${to}`);
  
  // 模拟发送邮件
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 更新进度
  await job.progress(50);
  
  // 模拟更多处理
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    success: true,
    messageId: 'msg-' + Date.now(),
  };
});

// 2. 添加邮件任务
await queueService.addJob('email', 'send-email', {
  to: 'user@example.com',
  subject: '欢迎注册',
  content: '感谢您注册 MOMO小说！',
}, {
  priority: 1,
  delay: 0,
});

// 3. 注册统计处理器
queueService.registerProcessor('statistics', 'update-stats', async (job) => {
  const { novelId } = job.data;
  
  console.log(`更新小说 ${novelId} 的统计数据`);
  
  // 执行统计更新
  // ...
  
  return {
    success: true,
    updated: true,
  };
});

// 4. 批量添加统计任务
const novels = [1, 2, 3, 4, 5];
for (const novelId of novels) {
  await queueService.addJob('statistics', 'update-stats', { novelId });
}

// 5. 查看队列状态
const status = await queueService.getQueueStatus('email');
console.log('邮件队列状态:', status);

// 6. 查看所有队列状态
const allStatus = await queueService.getAllQueuesStatus();
console.log('所有队列状态:', allStatus);

// 7. 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭队列...');
  await queueService.closeAll();
  process.exit(0);
});
*/

