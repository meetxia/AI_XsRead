-- =====================================
-- 数据库性能优化SQL
-- 包含索引优化和查询优化
-- =====================================

-- ========== 小说表优化 ==========

-- 优化小说列表查询（按浏览量排序）
CREATE INDEX IF NOT EXISTS idx_novels_status_views ON novels(status, views DESC);

-- 优化小说列表查询（按更新时间排序）
CREATE INDEX IF NOT EXISTS idx_novels_status_updated ON novels(status, updated_at DESC);

-- 优化分类+状态查询
CREATE INDEX IF NOT EXISTS idx_novels_category_status ON novels(category_id, status, updated_at DESC);

-- 优化点赞和收藏排序
CREATE INDEX IF NOT EXISTS idx_novels_likes ON novels(likes DESC);
CREATE INDEX IF NOT EXISTS idx_novels_collections ON novels(collections DESC);

-- 优化全文搜索（如果需要）
-- ALTER TABLE novels ADD FULLTEXT INDEX idx_novels_fulltext (title, author, description);

-- ========== 章节表优化 ==========

-- 优化章节列表查询
CREATE INDEX IF NOT EXISTS idx_chapters_novel_number ON chapters(novel_id, chapter_number);

-- 优化章节更新时间查询
CREATE INDEX IF NOT EXISTS idx_chapters_updated ON chapters(updated_at DESC);

-- ========== 书架表优化 ==========

-- 优化用户书架查询（按最后阅读时间）
CREATE INDEX IF NOT EXISTS idx_bookshelf_user_time ON bookshelf(user_id, last_read_time DESC);

-- 优化书架类型查询
CREATE INDEX IF NOT EXISTS idx_bookshelf_user_type ON bookshelf(user_id, type);

-- 优化书架更新时间查询
CREATE INDEX IF NOT EXISTS idx_bookshelf_updated ON bookshelf(updated_at DESC);

-- ========== 阅读历史表优化 ==========

-- 优化用户阅读历史查询
CREATE INDEX IF NOT EXISTS idx_reading_history_user_time ON reading_history(user_id, read_at DESC);

-- 优化小说阅读历史查询
CREATE INDEX IF NOT EXISTS idx_reading_history_novel ON reading_history(novel_id, read_at DESC);

-- 优化用户+小说查询
CREATE INDEX IF NOT EXISTS idx_reading_history_user_novel ON reading_history(user_id, novel_id, read_at DESC);

-- ========== 阅读进度表优化 ==========

-- 优化阅读进度查询
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_novel ON reading_progress(user_id, novel_id);

-- 优化进度更新时间查询
CREATE INDEX IF NOT EXISTS idx_reading_progress_updated ON reading_progress(updated_at DESC);

-- ========== 评论表优化 ==========

-- 优化小说评论查询（按时间）
CREATE INDEX IF NOT EXISTS idx_comments_novel_created ON comments(novel_id, created_at DESC);

-- 优化小说评论查询（按热度）
CREATE INDEX IF NOT EXISTS idx_comments_novel_likes ON comments(novel_id, likes DESC, created_at DESC);

-- 优化用户评论查询
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id, created_at DESC);

-- 优化父评论查询（回复）
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id, created_at ASC);

-- 优化软删除查询
CREATE INDEX IF NOT EXISTS idx_comments_deleted ON comments(deleted_at);

-- 复合索引：小说+未删除
CREATE INDEX IF NOT EXISTS idx_comments_novel_active ON comments(novel_id, deleted_at, created_at DESC);

-- ========== 评论点赞表优化 ==========

-- 优化用户点赞查询
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id, created_at DESC);

-- 优化评论点赞统计
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

-- ========== 小说点赞表优化 ==========

-- 优化用户点赞查询
CREATE INDEX IF NOT EXISTS idx_novel_likes_user ON novel_likes(user_id, created_at DESC);

-- 优化小说点赞统计
CREATE INDEX IF NOT EXISTS idx_novel_likes_novel ON novel_likes(novel_id);

-- ========== 小说收藏表优化 ==========

-- 优化用户收藏查询
CREATE INDEX IF NOT EXISTS idx_novel_collections_user ON novel_collections(user_id, created_at DESC);

-- 优化小说收藏统计
CREATE INDEX IF NOT EXISTS idx_novel_collections_novel ON novel_collections(novel_id);

-- ========== 用户表优化 ==========

-- 优化邮箱登录查询
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 优化用户名查询
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 优化用户状态查询
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ========== 分类表优化 ==========

-- 优化分类排序查询
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order, id);

-- ========== 查看索引使用情况 ==========
-- 可以使用以下查询检查索引使用情况:
-- SHOW INDEX FROM novels;
-- EXPLAIN SELECT * FROM novels WHERE status = 'published' ORDER BY views DESC LIMIT 20;

-- ========== 清理未使用的索引 ==========
-- 定期检查并清理未使用的索引以节省空间和提高写入性能
-- SELECT * FROM sys.schema_unused_indexes;

-- ========== 表维护建议 ==========
-- 定期执行以下命令优化表:
-- OPTIMIZE TABLE novels;
-- OPTIMIZE TABLE chapters;
-- OPTIMIZE TABLE reading_history;
-- OPTIMIZE TABLE comments;

-- ========== 分析表统计信息 ==========
-- 定期更新表统计信息以优化查询计划:
-- ANALYZE TABLE novels;
-- ANALYZE TABLE chapters;
-- ANALYZE TABLE reading_history;
-- ANALYZE TABLE comments;

-- ========== 配置建议 ==========
/*
在 MySQL 配置文件 (my.cnf/my.ini) 中添加以下优化配置:

[mysqld]
# InnoDB 缓冲池大小（建议设置为物理内存的50-70%）
innodb_buffer_pool_size = 1G

# InnoDB 日志文件大小
innodb_log_file_size = 256M

# 查询缓存（MySQL 8.0已移除）
query_cache_type = 0

# 最大连接数
max_connections = 200

# 临时表大小
tmp_table_size = 64M
max_heap_table_size = 64M

# 排序缓冲区大小
sort_buffer_size = 2M

# 连接缓冲区大小
join_buffer_size = 2M

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# 启用查询缓存结果集
query_cache_size = 0
*/

-- ========== 监控建议 ==========
/*
-- 查看慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 查看连接数
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- 查看缓冲池使用情况
SHOW STATUS LIKE 'Innodb_buffer_pool%';

-- 查看表锁情况
SHOW STATUS LIKE 'Table_locks%';
*/

