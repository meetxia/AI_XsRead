-- 修复reading_progress表的chapter_id字段
-- 问题：chapter_id字段不允许NULL，导致无章节模式的小说无法保存进度
-- 解决：将chapter_id修改为允许NULL

-- 修改chapter_id字段允许NULL值
ALTER TABLE reading_progress 
MODIFY COLUMN chapter_id int(10) unsigned NULL 
COMMENT '章节ID，无章节模式时为NULL';

-- 验证修改
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'reading_progress' 
AND COLUMN_NAME = 'chapter_id';

