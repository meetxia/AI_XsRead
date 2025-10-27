-- ============================================
-- 文字之境 - 触发器脚本
-- 开发者: 开发者C
-- 创建日期: 2025-10-27
-- 版本: v1.0
-- ============================================

USE `ai_xsread`;

DELIMITER $$

-- ============================================
-- 1. 章节插入触发器 - 自动更新小说信息
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_chapter_insert`$$
CREATE TRIGGER `trg_after_chapter_insert`
AFTER INSERT ON `chapters`
FOR EACH ROW
BEGIN
    -- 更新小说的章节数、字数、最新章节
    UPDATE `novels` SET
        chapter_count = chapter_count + 1,
        word_count = word_count + NEW.word_count,
        last_chapter_title = NEW.title,
        last_update_time = NOW(),
        updated_at = NOW()
    WHERE id = NEW.novel_id;
    
    -- 更新分类的小说数量
    UPDATE `categories` SET
        novel_count = (SELECT COUNT(*) FROM `novels` WHERE category_id = categories.id),
        updated_at = NOW()
    WHERE id = (SELECT category_id FROM `novels` WHERE id = NEW.novel_id);
END$$

-- ============================================
-- 2. 章节更新触发器 - 更新小说字数
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_chapter_update`$$
CREATE TRIGGER `trg_after_chapter_update`
AFTER UPDATE ON `chapters`
FOR EACH ROW
BEGIN
    DECLARE word_diff INT;
    
    -- 计算字数差异
    SET word_diff = NEW.word_count - OLD.word_count;
    
    -- 更新小说总字数和更新时间
    UPDATE `novels` SET
        word_count = word_count + word_diff,
        last_update_time = NOW(),
        updated_at = NOW()
    WHERE id = NEW.novel_id;
END$$

-- ============================================
-- 3. 章节删除触发器 - 更新小说统计
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_chapter_delete`$$
CREATE TRIGGER `trg_after_chapter_delete`
AFTER DELETE ON `chapters`
FOR EACH ROW
BEGIN
    -- 更新小说的章节数和字数
    UPDATE `novels` SET
        chapter_count = chapter_count - 1,
        word_count = word_count - OLD.word_count,
        updated_at = NOW()
    WHERE id = OLD.novel_id;
END$$

-- ============================================
-- 4. 评论插入触发器 - 更新小说统计
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_comment_insert`$$
CREATE TRIGGER `trg_after_comment_insert`
AFTER INSERT ON `comments`
FOR EACH ROW
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE rating_count INT;
    
    -- 计算平均评分
    SELECT ROUND(AVG(rating), 2), COUNT(*) 
    INTO avg_rating, rating_count
    FROM `comments` 
    WHERE novel_id = NEW.novel_id AND rating > 0 AND status = 1;
    
    -- 更新小说评论数和评分
    UPDATE `novels` SET
        comments = comments + 1,
        rating = avg_rating,
        rating_count = rating_count,
        updated_at = NOW()
    WHERE id = NEW.novel_id;
END$$

-- ============================================
-- 5. 评论删除触发器 - 更新小说统计
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_comment_delete`$$
CREATE TRIGGER `trg_after_comment_delete`
AFTER DELETE ON `comments`
FOR EACH ROW
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE rating_count INT;
    
    -- 重新计算平均评分
    SELECT ROUND(AVG(rating), 2), COUNT(*) 
    INTO avg_rating, rating_count
    FROM `comments` 
    WHERE novel_id = OLD.novel_id AND rating > 0 AND status = 1;
    
    -- 更新小说评论数和评分
    UPDATE `novels` SET
        comments = comments - 1,
        rating = IFNULL(avg_rating, 0),
        rating_count = rating_count,
        updated_at = NOW()
    WHERE id = OLD.novel_id;
END$$

-- ============================================
-- 6. 点赞插入触发器 - 更新小说点赞数
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_like_insert`$$
CREATE TRIGGER `trg_after_like_insert`
AFTER INSERT ON `user_likes`
FOR EACH ROW
BEGIN
    -- 增加小说点赞数
    UPDATE `novels` SET
        likes = likes + 1,
        updated_at = NOW()
    WHERE id = NEW.novel_id;
END$$

-- ============================================
-- 7. 取消点赞触发器 - 更新小说点赞数
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_like_delete`$$
CREATE TRIGGER `trg_after_like_delete`
AFTER DELETE ON `user_likes`
FOR EACH ROW
BEGIN
    -- 减少小说点赞数
    UPDATE `novels` SET
        likes = GREATEST(0, likes - 1),
        updated_at = NOW()
    WHERE id = OLD.novel_id;
END$$

-- ============================================
-- 8. 书架插入触发器 - 更新小说收藏数
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_bookshelf_insert`$$
CREATE TRIGGER `trg_after_bookshelf_insert`
AFTER INSERT ON `bookshelf`
FOR EACH ROW
BEGIN
    -- 增加小说收藏数
    UPDATE `novels` SET
        collections = collections + 1,
        updated_at = NOW()
    WHERE id = NEW.novel_id;
END$$

-- ============================================
-- 9. 书架删除触发器 - 更新小说收藏数
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_bookshelf_delete`$$
CREATE TRIGGER `trg_after_bookshelf_delete`
AFTER DELETE ON `bookshelf`
FOR EACH ROW
BEGIN
    -- 减少小说收藏数
    UPDATE `novels` SET
        collections = GREATEST(0, collections - 1),
        updated_at = NOW()
    WHERE id = OLD.novel_id;
END$$

-- ============================================
-- 10. 用户删除前触发器 - 清理关联数据
-- ============================================
DROP TRIGGER IF EXISTS `trg_before_user_delete`$$
CREATE TRIGGER `trg_before_user_delete`
BEFORE DELETE ON `users`
FOR EACH ROW
BEGIN
    -- 注意：由于外键约束设置了CASCADE，关联数据会自动删除
    -- 这里可以添加额外的清理逻辑或日志记录
    
    -- 记录删除日志 (需要有日志表)
    -- INSERT INTO `delete_logs` (table_name, record_id, deleted_at)
    -- VALUES ('users', OLD.id, NOW());
    
    -- 这里保持简单，让外键CASCADE自动处理
    -- bookshelf, reading_history, user_likes, comments 都会自动删除
END$$

-- ============================================
-- 11. 阅读进度更新触发器 - 同步书架
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_reading_progress_update`$$
CREATE TRIGGER `trg_after_reading_progress_update`
AFTER UPDATE ON `reading_progress`
FOR EACH ROW
BEGIN
    -- 更新书架的阅读进度和时间
    UPDATE `bookshelf` SET
        current_chapter_id = NEW.chapter_id,
        progress = NEW.progress,
        last_read_time = NEW.last_read_time,
        reading_time = reading_time + NEW.reading_time,
        updated_at = NOW()
    WHERE user_id = NEW.user_id 
    AND novel_id = NEW.novel_id;
END$$

-- ============================================
-- 12. 小说插入触发器 - 更新分类统计
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_novel_insert`$$
CREATE TRIGGER `trg_after_novel_insert`
AFTER INSERT ON `novels`
FOR EACH ROW
BEGIN
    -- 更新分类的小说数量
    UPDATE `categories` SET
        novel_count = novel_count + 1,
        updated_at = NOW()
    WHERE id = NEW.category_id;
END$$

-- ============================================
-- 13. 小说删除触发器 - 更新分类统计
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_novel_delete`$$
CREATE TRIGGER `trg_after_novel_delete`
AFTER DELETE ON `novels`
FOR EACH ROW
BEGIN
    -- 更新分类的小说数量
    UPDATE `categories` SET
        novel_count = GREATEST(0, novel_count - 1),
        updated_at = NOW()
    WHERE id = OLD.category_id;
END$$

-- ============================================
-- 14. 标签使用触发器 - 更新标签统计
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_novel_tag_insert`$$
CREATE TRIGGER `trg_after_novel_tag_insert`
AFTER INSERT ON `novel_tags`
FOR EACH ROW
BEGIN
    -- 增加标签使用次数
    UPDATE `tags` SET
        usage_count = usage_count + 1
    WHERE id = NEW.tag_id;
END$$

-- ============================================
-- 15. 标签删除触发器 - 更新标签统计
-- ============================================
DROP TRIGGER IF EXISTS `trg_after_novel_tag_delete`$$
CREATE TRIGGER `trg_after_novel_tag_delete`
AFTER DELETE ON `novel_tags`
FOR EACH ROW
BEGIN
    -- 减少标签使用次数
    UPDATE `tags` SET
        usage_count = GREATEST(0, usage_count - 1)
    WHERE id = OLD.tag_id;
END$$

DELIMITER ;

-- ============================================
-- 触发器测试
-- ============================================

-- 查看所有触发器
SHOW TRIGGERS;

-- 查看特定表的触发器
-- SHOW TRIGGERS LIKE 'chapters';
-- SHOW TRIGGERS LIKE 'novels';
-- SHOW TRIGGERS LIKE 'comments';

-- ============================================
-- 触发器说明文档
-- ============================================

/*
触发器列表及功能说明:

1. 章节相关触发器 (3个)
   - trg_after_chapter_insert: 新增章节时自动更新小说统计
   - trg_after_chapter_update: 更新章节时同步字数变化
   - trg_after_chapter_delete: 删除章节时更新小说统计

2. 评论相关触发器 (2个)
   - trg_after_comment_insert: 新增评论时更新小说评论数和评分
   - trg_after_comment_delete: 删除评论时重新计算评分

3. 点赞相关触发器 (2个)
   - trg_after_like_insert: 点赞时增加计数
   - trg_after_like_delete: 取消点赞时减少计数

4. 书架相关触发器 (2个)
   - trg_after_bookshelf_insert: 加入书架时增加收藏数
   - trg_after_bookshelf_delete: 移除书架时减少收藏数

5. 用户相关触发器 (1个)
   - trg_before_user_delete: 删除用户前的清理操作

6. 阅读进度触发器 (1个)
   - trg_after_reading_progress_update: 同步阅读进度到书架

7. 小说相关触发器 (2个)
   - trg_after_novel_insert: 新增小说时更新分类统计
   - trg_after_novel_delete: 删除小说时更新分类统计

8. 标签相关触发器 (2个)
   - trg_after_novel_tag_insert: 使用标签时增加计数
   - trg_after_novel_tag_delete: 删除标签关联时减少计数

总计: 15个触发器

注意事项:
1. 所有触发器都设置为AFTER触发,避免影响主操作
2. 使用GREATEST函数避免计数为负数
3. 统计数据实时更新,保证数据一致性
4. 触发器尽量简单,避免嵌套触发
5. 涉及复杂计算的统计,建议使用定时任务批量更新

性能考虑:
- 触发器会增加写操作的开销
- 高并发场景下可能成为瓶颈
- 可以考虑异步更新统计数据
- 或使用Redis缓存+定时同步的方案
*/

SELECT '触发器创建完成! 总计15个触发器' AS message;

