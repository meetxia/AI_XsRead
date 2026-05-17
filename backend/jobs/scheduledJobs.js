/**
 * ============================================
 * MOMO小说 - 定时任务
 * 开发者: 开发者C
 * 创建日期: 2025-10-27
 * 版本: v1.0
 * ============================================
 * 
 * 功能:
 * - 每小时更新统计数据
 * - 每天凌晨生成报表
 * - 每天凌晨数据库备份
 * - 每周清理过期数据
 * - 每月生成月报
 */

const cron = require('node-cron');
const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 加载环境变量
require('dotenv').config();

// ============================================
// 配置
// ============================================
const CONFIG = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,  // 必须从环境变量读取
    database: process.env.DB_DATABASE || 'ai_xsread',
  },
  
  backup: {
    dir: './backend/backups',
    enabled: true,
  },
  
  cleanup: {
    readingHistoryDays: 90,    // 阅读历史保留90天
    logsDays: 30,              // 日志保留30天
    tempFilesDays: 7,          // 临时文件保留7天
  },
};

// ============================================
// 定时任务管理类
// ============================================
class ScheduledJobs {
  constructor(config = CONFIG) {
    this.config = config;
    this.pool = null;
    this.jobs = [];
    this.isRunning = false;
    
    this.initialize();
  }

  /**
   * 初始化
   */
  async initialize() {
    try {
      // 初始化数据库连接
      this.pool = mysql.createPool(this.config.database);
      console.log('✅ 定时任务服务数据库连接成功');
    } catch (error) {
      console.error('❌ 定时任务服务初始化失败:', error);
    }
  }

  /**
   * 启动所有定时任务
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ 定时任务已在运行');
      return;
    }
    
    this.isRunning = true;
    
    // 每小时更新统计数据
    this.scheduleHourlyStats();
    
    // 每天凌晨2点生成报表
    this.scheduleDailyReport();
    
    // 每天凌晨3点备份数据库
    this.scheduleDatabaseBackup();
    
    // 每天凌晨4点清理临时文件
    this.scheduleCleanupTemp();
    
    // 每周一凌晨5点清理过期数据
    this.scheduleWeeklyCleanup();
    
    // 每月1号凌晨6点生成月报
    this.scheduleMonthlyReport();
    
    // 每10分钟检查系统健康
    this.scheduleHealthCheck();
    
    console.log('✅ 所有定时任务已启动');
    this.printSchedule();
  }

  /**
   * 停止所有定时任务
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    console.log('⏹️ 所有定时任务已停止');
  }

  /**
   * 每小时更新统计数据
   */
  scheduleHourlyStats() {
    const job = cron.schedule('0 * * * *', async () => {
      console.log('⏰ [每小时] 开始更新统计数据...');
      
      try {
        const startTime = Date.now();
        
        // 调用存储过程更新统计
        await this.pool.query('CALL sp_batch_update_views()');
        await this.pool.query('CALL sp_calculate_hot_rank(7)');
        
        const duration = Date.now() - startTime;
        console.log(`✅ [每小时] 统计数据更新完成 (${duration}ms)`);
      } catch (error) {
        console.error('❌ [每小时] 更新统计数据失败:', error);
      }
    });
    
    this.jobs.push(job);
  }

  /**
   * 每天凌晨生成报表
   */
  scheduleDailyReport() {
    const job = cron.schedule('0 2 * * *', async () => {
      console.log('⏰ [每日] 开始生成日报...');
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // 生成统计报表
        const [novelStats] = await this.pool.query(`
          SELECT 
            COUNT(*) as total_novels,
            SUM(views) as total_views,
            SUM(likes) as total_likes,
            SUM(collections) as total_collections,
            SUM(chapter_count) as total_chapters
          FROM novels
          WHERE status = 1
        `);
        
        const [userStats] = await this.pool.query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) as new_users_today
          FROM users
          WHERE status = 1
        `, [today]);
        
        const [readingStats] = await this.pool.query(`
          SELECT 
            COUNT(*) as total_readings,
            COUNT(DISTINCT user_id) as active_users,
            SUM(duration) as total_duration
          FROM reading_history
          WHERE DATE(read_time) = ?
        `, [today]);
        
        const report = {
          date: today,
          novels: novelStats[0],
          users: userStats[0],
          reading: readingStats[0],
        };
        
        // 保存报表
        await this.pool.query(`
          INSERT INTO daily_reports (date, data, created_at)
          VALUES (?, ?, NOW())
          ON DUPLICATE KEY UPDATE data = VALUES(data)
        `, [today, JSON.stringify(report)]);
        
        console.log('✅ [每日] 日报生成完成:', report);
      } catch (error) {
        console.error('❌ [每日] 生成日报失败:', error);
      }
    });
    
    this.jobs.push(job);
  }

  /**
   * 每天凌晨备份数据库
   */
  scheduleDatabaseBackup() {
    const job = cron.schedule('0 3 * * *', async () => {
      console.log('⏰ [每日] 开始备份数据库...');
      
      if (!this.config.backup.enabled) {
        console.log('⚠️ [每日] 数据库备份已禁用');
        return;
      }
      
      try {
        // Windows环境
        if (process.platform === 'win32') {
          const backupScript = '.\\backend\\scripts\\backup.bat';
          const { stdout, stderr } = await execPromise(backupScript);
          
          if (stderr) {
            console.error('⚠️ [每日] 备份警告:', stderr);
          }
          
          console.log('✅ [每日] 数据库备份完成');
        } else {
          // Linux环境
          const backupScript = './backend/scripts/backup.sh';
          const { stdout, stderr } = await execPromise(`bash ${backupScript}`);
          
          if (stderr) {
            console.error('⚠️ [每日] 备份警告:', stderr);
          }
          
          console.log('✅ [每日] 数据库备份完成');
        }
      } catch (error) {
        console.error('❌ [每日] 数据库备份失败:', error);
      }
    });
    
    this.jobs.push(job);
  }

  /**
   * 每天凌晨清理临时文件
   */
  scheduleCleanupTemp() {
    const job = cron.schedule('0 4 * * *', async () => {
      console.log('⏰ [每日] 开始清理临时文件...');
      
      try {
        // 清理上传的临时文件
        const { fileService } = require('../services/fileService');
        const result = await fileService.cleanupTempFiles();
        
        console.log('✅ [每日] 临时文件清理完成:', result);
      } catch (error) {
        console.error('❌ [每日] 清理临时文件失败:', error);
      }
    });
    
    this.jobs.push(job);
  }

  /**
   * 每周一清理过期数据
   */
  scheduleWeeklyCleanup() {
    const job = cron.schedule('0 5 * * 1', async () => {
      console.log('⏰ [每周] 开始清理过期数据...');
      
      try {
        // 清理过期的阅读历史
        const [result1] = await this.pool.query(`
          DELETE FROM reading_history
          WHERE read_time < DATE_SUB(NOW(), INTERVAL ? DAY)
        `, [this.config.cleanup.readingHistoryDays]);
        
        // 清理过期的日志
        const [result2] = await this.pool.query(`
          DELETE FROM logs
          WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        `, [this.config.cleanup.logsDays]);
        
        // 调用存储过程清理过期Token
        await this.pool.query('CALL sp_clean_expired_tokens()');
        
        console.log(`✅ [每周] 数据清理完成`);
        console.log(`   - 阅读历史: ${result1.affectedRows} 条`);
        console.log(`   - 日志记录: ${result2.affectedRows} 条`);
      } catch (error) {
        console.error('❌ [每周] 清理过期数据失败:', error);
      }
    });
    
    this.jobs.push(job);
  }

  /**
   * 每月1号生成月报
   */
  scheduleMonthlyReport() {
    const job = cron.schedule('0 6 1 * *', async () => {
      console.log('⏰ [每月] 开始生成月报...');
      
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-11
        
        // 上个月的起止日期
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        // 统计上个月数据
        const [novelStats] = await this.pool.query(`
          SELECT 
            COUNT(*) as new_novels,
            SUM(chapter_count) as new_chapters
          FROM novels
          WHERE DATE(created_at) BETWEEN ? AND ?
        `, [startDate, endDate]);
        
        const [userStats] = await this.pool.query(`
          SELECT 
            COUNT(*) as new_users
          FROM users
          WHERE DATE(created_at) BETWEEN ? AND ?
        `, [startDate, endDate]);
        
        const [readingStats] = await this.pool.query(`
          SELECT 
            COUNT(DISTINCT user_id) as active_users,
            COUNT(*) as total_readings,
            SUM(duration) as total_duration
          FROM reading_history
          WHERE DATE(read_time) BETWEEN ? AND ?
        `, [startDate, endDate]);
        
        const monthlyReport = {
          year,
          month: month,
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
          },
          novels: novelStats[0],
          users: userStats[0],
          reading: readingStats[0],
        };
        
        // 保存月报
        await this.pool.query(`
          INSERT INTO monthly_reports (year, month, data, created_at)
          VALUES (?, ?, ?, NOW())
        `, [year, month, JSON.stringify(monthlyReport)]);
        
        console.log('✅ [每月] 月报生成完成:', monthlyReport);
      } catch (error) {
        console.error('❌ [每月] 生成月报失败:', error);
      }
    });
    
    this.jobs.push(job);
  }

  /**
   * 每10分钟健康检查
   */
  scheduleHealthCheck() {
    const job = cron.schedule('*/10 * * * *', async () => {
      try {
        // 检查数据库连接
        await this.pool.query('SELECT 1');
        
        // 检查Redis连接 (如果有)
        // ...
        
        // 其他健康检查
        // ...
        
      } catch (error) {
        console.error('⚠️ [健康检查] 系统异常:', error);
        // 发送告警
      }
    });
    
    this.jobs.push(job);
  }

  /**
   * 打印任务调度表
   */
  printSchedule() {
    console.log('\n📅 定时任务调度表:');
    console.log('================================');
    console.log('⏰ 每小时 (0分)      - 更新统计数据');
    console.log('⏰ 每天 02:00      - 生成日报');
    console.log('⏰ 每天 03:00      - 数据库备份');
    console.log('⏰ 每天 04:00      - 清理临时文件');
    console.log('⏰ 每周一 05:00    - 清理过期数据');
    console.log('⏰ 每月1号 06:00   - 生成月报');
    console.log('⏰ 每10分钟        - 健康检查');
    console.log('================================\n');
  }

  /**
   * 手动执行任务
   */
  async manualRun(taskName) {
    console.log(`🔧 手动执行任务: ${taskName}`);
    
    try {
      switch (taskName) {
        case 'hourly-stats':
          await this.scheduleHourlyStats();
          break;
        case 'daily-report':
          await this.scheduleDailyReport();
          break;
        case 'backup':
          await this.scheduleDatabaseBackup();
          break;
        case 'cleanup-temp':
          await this.scheduleCleanupTemp();
          break;
        case 'weekly-cleanup':
          await this.scheduleWeeklyCleanup();
          break;
        case 'monthly-report':
          await this.scheduleMonthlyReport();
          break;
        default:
          console.error(`❌ 未知任务: ${taskName}`);
      }
    } catch (error) {
      console.error(`❌ 手动执行任务失败:`, error);
    }
  }

  /**
   * 获取任务状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.length,
      jobs: this.jobs.map((job, index) => ({
        index,
        running: job.running,
      })),
    };
  }
}

// ============================================
// 导出
// ============================================
const scheduledJobs = new ScheduledJobs();

module.exports = {
  ScheduledJobs,
  scheduledJobs,
};

// ============================================
// 启动服务
// ============================================
if (require.main === module) {
  // 启动定时任务
  scheduledJobs.start();
  
  // 优雅退出
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 正在停止定时任务...');
    scheduledJobs.stop();
    
    if (scheduledJobs.pool) {
      await scheduledJobs.pool.end();
    }
    
    console.log('👋 再见!');
    process.exit(0);
  });
  
  console.log('✅ 定时任务服务运行中...');
  console.log('按 Ctrl+C 停止服务');
}

