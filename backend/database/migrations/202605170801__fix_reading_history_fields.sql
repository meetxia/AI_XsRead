-- 修复reading_history表的字段问题
-- 问题1：chapter_id字段不允许NULL，导致无章节模式的小说无法保存历史
-- 问题2：代码中使用了read_at字段，但实际字段名是read_time

-- 修改chapter_id字段允许NULL值
ALTER TABLE reading_history 
MODIFY COLUMN chapter_id int(10) unsigned NULL 
COMMENT '章节ID，无章节模式时为NULL';

-- 验证修改
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'reading_history' 
AND COLUMN_NAME IN ('chapter_id', 'read_time');

