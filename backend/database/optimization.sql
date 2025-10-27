-- ============================================
-- 文字之境 - 数据库性能优化脚本
-- 开发者: 开发者C
-- 创建日期: 2025-10-27
-- 版本: v1.0
-- ============================================

USE `ai_xsread`;

-- ============================================
-- 1. 索引优化分析
-- ============================================

-- 1.1 复合索引优化 (提升查询性能)
-- 小说表 - 按分类+状态+更新时间查询
CREATE INDEX IF NOT EXISTS `idx_novel_category_status_update` 
ON `novels`(`category_id`, `status`, `last_update_time`);

-- 小说表 - 按浏览量+推荐+热门排序
CREATE INDEX IF NOT EXISTS `idx_novel_views_recommend_hot` 
ON `novels`(`views` DESC, `is_recommended`, `is_hot`);

-- 小说表 - 按收藏数排序
CREATE INDEX IF NOT EXISTS `idx_novel_collections` 
ON `novels`(`collections` DESC);

-- 章节表 - 按小说ID+章节号查询
CREATE INDEX IF NOT EXISTS `idx_chapter_novel_number` 
ON `chapters`(`novel_id`, `chapter_number`);

-- 书架表 - 按用户ID+类型+最后阅读时间
CREATE INDEX IF NOT EXISTS `idx_bookshelf_user_type_time` 
ON `bookshelf`(`user_id`, `type`, `last_read_time` DESC);

-- 阅读历史 - 按用户ID+阅读时间
CREATE INDEX IF NOT EXISTS `idx_reading_history_user_time` 
ON `reading_history`(`user_id`, `read_time` DESC);

-- 评论表 - 按小说ID+创建时间
CREATE INDEX IF NOT EXISTS `idx_comments_novel_time` 
ON `comments`(`novel_id`, `created_at` DESC);

-- ============================================
-- 2. 全文索引优化 (中文搜索)
-- ============================================

-- 删除原有全文索引
ALTER TABLE `novels` DROP INDEX IF EXISTS `idx_fulltext_search`;

-- 创建优化的全文索引 (使用ngram解析器支持中文)
ALTER TABLE `novels` 
ADD FULLTEXT INDEX `idx_fulltext_all` (`title`, `author`, `description`) 
WITH PARSER ngram;

-- 创建单独的标题全文索引 (提升标题搜索速度)
ALTER TABLE `novels` 
ADD FULLTEXT INDEX `idx_fulltext_title` (`title`) 
WITH PARSER ngram;

-- ============================================
-- 3. 分区表设计 (大数据量优化)
-- ============================================

-- 3.1 阅读历史表按时间分区 (提升查询性能)
ALTER TABLE `reading_history`
PARTITION BY RANGE (YEAR(`read_time`)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p_max VALUES LESS THAN MAXVALUE
);

-- ============================================
-- 4. 查询语句优化建议
-- ============================================

-- 4.1 查看索引使用情况
-- SHOW INDEX FROM `novels`;
-- EXPLAIN SELECT * FROM `novels` WHERE category_id = 101 ORDER BY views DESC LIMIT 20;

-- 4.2 查看慢查询
-- SHOW VARIABLES LIKE 'slow_query_log%';
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 1;

-- ============================================
-- 5. 表结构优化
-- ============================================

-- 5.1 优化小说表字段
-- 调整varchar长度,节省存储空间
ALTER TABLE `novels` MODIFY COLUMN `title` VARCHAR(100) NOT NULL COMMENT '小说标题';
ALTER TABLE `novels` MODIFY COLUMN `author` VARCHAR(50) NOT NULL COMMENT '作者名称';
ALTER TABLE `novels` MODIFY COLUMN `last_chapter_title` VARCHAR(100) DEFAULT NULL COMMENT '最新章节标题';

-- 5.2 添加缓存字段 (减少联表查询)
ALTER TABLE `novels` 
ADD COLUMN `hot_score` INT UNSIGNED DEFAULT 0 COMMENT '热度分数' AFTER `rating_count`,
ADD INDEX `idx_hot_score` (`hot_score` DESC);

-- ============================================
-- 6. 查询缓存优化
-- ============================================

-- 6.1 配置查询缓存 (需要在my.cnf中配置)
-- query_cache_type = 1
-- query_cache_size = 256M
-- query_cache_limit = 2M

-- ============================================
-- 7. 存储引擎优化
-- ============================================

-- 7.1 确保所有表都使用InnoDB引擎
ALTER TABLE `users` ENGINE=InnoDB;
ALTER TABLE `categories` ENGINE=InnoDB;
ALTER TABLE `novels` ENGINE=InnoDB;
ALTER TABLE `chapters` ENGINE=InnoDB;
ALTER TABLE `bookshelf` ENGINE=InnoDB;

-- 7.2 优化InnoDB缓冲池 (需要在my.cnf中配置)
-- innodb_buffer_pool_size = 2G
-- innodb_log_file_size = 512M
-- innodb_flush_log_at_trx_commit = 2

-- ============================================
-- 8. 删除冗余索引
-- ============================================

-- 分析并删除未使用的索引
-- SELECT * FROM sys.schema_unused_indexes WHERE object_schema = 'ai_xsread';

-- ============================================
-- 9. 性能监控视图
-- ============================================

-- 9.1 创建慢查询监控视图
CREATE OR REPLACE VIEW `v_slow_queries` AS
SELECT 
    query_time,
    lock_time,
    rows_examined,
    sql_text
FROM mysql.slow_log
ORDER BY query_time DESC
LIMIT 100;

-- 9.2 创建表大小监控视图
CREATE OR REPLACE VIEW `v_table_sizes` AS
SELECT 
    table_name AS '表名',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS '大小(MB)',
    table_rows AS '行数'
FROM information_schema.tables
WHERE table_schema = 'ai_xsread'
ORDER BY (data_length + index_length) DESC;

-- 9.3 创建索引使用情况视图
CREATE OR REPLACE VIEW `v_index_usage` AS
SELECT 
    t.table_name AS '表名',
    i.index_name AS '索引名',
    i.column_name AS '列名',
    i.cardinality AS '基数',
    CASE 
        WHEN i.cardinality IS NULL THEN '未使用'
        WHEN i.cardinality < 10 THEN '低选择性'
        ELSE '正常'
    END AS '状态'
FROM information_schema.statistics i
JOIN information_schema.tables t 
    ON i.table_schema = t.table_schema 
    AND i.table_name = t.table_name
WHERE i.table_schema = 'ai_xsread'
ORDER BY i.table_name, i.seq_in_index;

-- ============================================
-- 10. 性能测试查询
-- ============================================

-- 10.1 测试小说列表查询性能
EXPLAIN SELECT * FROM `novels` 
WHERE `category_id` = 101 
AND `status` = 1 
ORDER BY `views` DESC 
LIMIT 20;

-- 10.2 测试全文搜索性能
EXPLAIN SELECT * FROM `novels` 
WHERE MATCH(`title`, `author`) AGAINST('霸道总裁' IN BOOLEAN MODE)
LIMIT 20;

-- 10.3 测试书架查询性能
EXPLAIN SELECT n.* FROM `bookshelf` b
JOIN `novels` n ON b.novel_id = n.id
WHERE b.user_id = 1 
AND b.type = 'reading'
ORDER BY b.last_read_time DESC
LIMIT 20;

-- ============================================
-- 11. 数据库配置优化建议
-- ============================================

/*
MySQL配置优化 (my.cnf / my.ini):

[mysqld]
# 基础配置
max_connections = 500
max_connect_errors = 10000

# InnoDB优化
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
innodb_file_per_table = 1

# 查询缓存
query_cache_type = 1
query_cache_size = 256M
query_cache_limit = 2M

# 慢查询日志
slow_query_log = ON
long_query_time = 1
slow_query_log_file = /var/log/mysql/slow.log

# 临时表
tmp_table_size = 128M
max_heap_table_size = 128M

# 排序优化
sort_buffer_size = 4M
read_buffer_size = 4M
read_rnd_buffer_size = 8M

# 连接优化
thread_cache_size = 50
table_open_cache = 2000

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
*/

-- ============================================
-- 12. 性能优化完成检查
-- ============================================

-- 检查表结构
SHOW CREATE TABLE `novels`;
SHOW CREATE TABLE `chapters`;

-- 检查索引
SHOW INDEX FROM `novels`;
SHOW INDEX FROM `chapters`;
SHOW INDEX FROM `bookshelf`;

-- 查看表大小
SELECT * FROM `v_table_sizes`;

-- 性能统计
SELECT 
    '数据库优化完成!' AS message,
    NOW() AS completion_time,
    '索引优化、分区表、查询优化、监控视图已完成' AS details;

-- ============================================
-- 优化完成!
-- ============================================

