-- ============================================
-- 文字之境 - 存储过程脚本
-- 开发者: 开发者C
-- 创建日期: 2025-10-27
-- 版本: v1.0
-- ============================================

USE `ai_xsread`;

DELIMITER $$

-- ============================================
-- 1. 更新小说统计数据
-- ============================================
DROP PROCEDURE IF EXISTS `sp_update_novel_stats`$$
CREATE PROCEDURE `sp_update_novel_stats`(IN p_novel_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: 更新小说统计失败' AS error_message;
    END;
    
    START TRANSACTION;
    
    UPDATE `novels` n SET
        -- 更新浏览量
        n.views = (
            SELECT COUNT(*) FROM `reading_history` 
            WHERE novel_id = p_novel_id
        ),
        -- 更新点赞数
        n.likes = (
            SELECT COUNT(*) FROM `user_likes` 
            WHERE novel_id = p_novel_id
        ),
        -- 更新收藏数
        n.collections = (
            SELECT COUNT(*) FROM `bookshelf` 
            WHERE novel_id = p_novel_id
        ),
        -- 更新评论数
        n.comments = (
            SELECT COUNT(*) FROM `comments` 
            WHERE novel_id = p_novel_id
        ),
        -- 更新平均评分
        n.rating = IFNULL((
            SELECT ROUND(AVG(rating), 2) FROM `comments` 
            WHERE novel_id = p_novel_id AND rating > 0
        ), 0),
        -- 更新评分人数
        n.rating_count = (
            SELECT COUNT(*) FROM `comments` 
            WHERE novel_id = p_novel_id AND rating > 0
        ),
        n.updated_at = NOW()
    WHERE n.id = p_novel_id;
    
    COMMIT;
    
    SELECT CONCAT('小说ID ', p_novel_id, ' 统计更新成功') AS message;
END$$

-- ============================================
-- 2. 计算热度排名
-- ============================================
DROP PROCEDURE IF EXISTS `sp_calculate_hot_rank`$$
CREATE PROCEDURE `sp_calculate_hot_rank`(IN p_days INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: 计算热度排名失败' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- 计算热度分数 (浏览*1 + 点赞*5 + 收藏*10 + 评论*3)
    UPDATE `novels` n
    SET n.hot_score = (
        -- 最近N天的浏览量
        IFNULL((
            SELECT COUNT(*) FROM `reading_history` 
            WHERE novel_id = n.id 
            AND read_time >= DATE_SUB(NOW(), INTERVAL p_days DAY)
        ), 0) * 1
        +
        -- 点赞数 * 5
        n.likes * 5
        +
        -- 收藏数 * 10
        n.collections * 10
        +
        -- 评论数 * 3
        n.comments * 3
    );
    
    -- 更新热门标记 (热度分数TOP 100)
    UPDATE `novels` SET is_hot = 0;
    
    UPDATE `novels` n
    SET n.is_hot = 1
    WHERE n.id IN (
        SELECT id FROM (
            SELECT id FROM `novels` 
            ORDER BY hot_score DESC 
            LIMIT 100
        ) AS hot_novels
    );
    
    COMMIT;
    
    SELECT CONCAT('热度排名计算完成，基于最近', p_days, '天数据') AS message;
END$$

-- ============================================
-- 3. 清理过期Token
-- ============================================
DROP PROCEDURE IF EXISTS `sp_clean_expired_tokens`$$
CREATE PROCEDURE `sp_clean_expired_tokens`()
BEGIN
    DECLARE deleted_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: 清理过期Token失败' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- 删除过期的token (假设有token表,这里先预留)
    -- DELETE FROM `user_tokens` WHERE expires_at < NOW();
    -- SET deleted_count = ROW_COUNT();
    
    -- 清理30天前的阅读历史
    DELETE FROM `reading_history` 
    WHERE read_time < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    SET deleted_count = ROW_COUNT();
    
    COMMIT;
    
    SELECT CONCAT('清理完成，删除 ', deleted_count, ' 条过期数据') AS message;
END$$

-- ============================================
-- 4. 同步阅读进度到书架
-- ============================================
DROP PROCEDURE IF EXISTS `sp_sync_reading_progress`$$
CREATE PROCEDURE `sp_sync_reading_progress`(
    IN p_user_id INT,
    IN p_novel_id INT,
    IN p_chapter_id INT
)
BEGIN
    DECLARE chapter_count INT DEFAULT 0;
    DECLARE current_chapter_num INT DEFAULT 0;
    DECLARE progress_percent INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: 同步阅读进度失败' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- 获取小说总章节数
    SELECT chapter_count INTO chapter_count 
    FROM `novels` 
    WHERE id = p_novel_id;
    
    -- 获取当前章节号
    SELECT chapter_number INTO current_chapter_num 
    FROM `chapters` 
    WHERE id = p_chapter_id;
    
    -- 计算进度百分比
    IF chapter_count > 0 THEN
        SET progress_percent = FLOOR((current_chapter_num / chapter_count) * 100);
    END IF;
    
    -- 更新书架信息
    INSERT INTO `bookshelf` (
        user_id, 
        novel_id, 
        type, 
        current_chapter_id, 
        progress, 
        last_read_time,
        added_time
    ) VALUES (
        p_user_id,
        p_novel_id,
        'reading',
        p_chapter_id,
        progress_percent,
        NOW(),
        NOW()
    ) ON DUPLICATE KEY UPDATE
        current_chapter_id = p_chapter_id,
        progress = progress_percent,
        last_read_time = NOW(),
        type = IF(progress_percent >= 100, 'finished', 'reading');
    
    COMMIT;
    
    SELECT CONCAT('阅读进度同步成功，进度：', progress_percent, '%') AS message;
END$$

-- ============================================
-- 5. 批量更新浏览量
-- ============================================
DROP PROCEDURE IF EXISTS `sp_batch_update_views`$$
CREATE PROCEDURE `sp_batch_update_views`()
BEGIN
    DECLARE updated_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: 批量更新浏览量失败' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- 从阅读历史统计浏览量
    UPDATE `novels` n
    SET n.views = (
        SELECT COUNT(DISTINCT user_id) 
        FROM `reading_history` 
        WHERE novel_id = n.id
    );
    
    SET updated_count = ROW_COUNT();
    
    COMMIT;
    
    SELECT CONCAT('浏览量更新完成，共更新 ', updated_count, ' 本小说') AS message;
END$$

-- ============================================
-- 6. 更新用户阅读统计
-- ============================================
DROP PROCEDURE IF EXISTS `sp_update_user_reading_stats`$$
CREATE PROCEDURE `sp_update_user_reading_stats`(IN p_user_id INT)
BEGIN
    DECLARE total_reading_time INT DEFAULT 0;
    DECLARE total_novels INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: 更新用户阅读统计失败' AS error_message;
    END;
    
    -- 计算总阅读时长
    SELECT SUM(reading_time) INTO total_reading_time
    FROM `bookshelf`
    WHERE user_id = p_user_id;
    
    -- 计算阅读小说数量
    SELECT COUNT(*) INTO total_novels
    FROM `bookshelf`
    WHERE user_id = p_user_id;
    
    SELECT 
        total_reading_time AS '总阅读时长(分钟)',
        total_novels AS '阅读小说数量',
        CONCAT('用户 ', p_user_id, ' 阅读统计更新完成') AS message;
END$$

-- ============================================
-- 7. 批量导入章节
-- ============================================
DROP PROCEDURE IF EXISTS `sp_batch_insert_chapters`$$
CREATE PROCEDURE `sp_batch_insert_chapters`(
    IN p_novel_id INT,
    IN p_start_number INT,
    IN p_end_number INT
)
BEGIN
    DECLARE i INT DEFAULT p_start_number;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: 批量导入章节失败' AS error_message;
    END;
    
    START TRANSACTION;
    
    WHILE i <= p_end_number DO
        INSERT INTO `chapters` (
            novel_id,
            chapter_number,
            title,
            content,
            word_count,
            status,
            publish_time
        ) VALUES (
            p_novel_id,
            i,
            CONCAT('第', i, '章'),
            '章节内容待更新',
            0,
            0,
            NOW()
        );
        SET i = i + 1;
    END WHILE;
    
    -- 更新小说章节数
    UPDATE `novels` 
    SET chapter_count = p_end_number
    WHERE id = p_novel_id;
    
    COMMIT;
    
    SELECT CONCAT('成功创建 ', (p_end_number - p_start_number + 1), ' 个章节') AS message;
END$$

-- ============================================
-- 8. 清理测试数据
-- ============================================
DROP PROCEDURE IF EXISTS `sp_clean_test_data`$$
CREATE PROCEDURE `sp_clean_test_data`()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: 清理测试数据失败' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- 删除测试用户的数据
    DELETE FROM `reading_history` WHERE user_id IN (SELECT id FROM `users` WHERE username LIKE 'test_%');
    DELETE FROM `bookshelf` WHERE user_id IN (SELECT id FROM `users` WHERE username LIKE 'test_%');
    DELETE FROM `user_likes` WHERE user_id IN (SELECT id FROM `users` WHERE username LIKE 'test_%');
    DELETE FROM `comments` WHERE user_id IN (SELECT id FROM `users` WHERE username LIKE 'test_%');
    DELETE FROM `users` WHERE username LIKE 'test_%';
    
    -- 删除测试小说
    DELETE FROM `chapters` WHERE novel_id IN (SELECT id FROM `novels` WHERE title LIKE 'TEST_%');
    DELETE FROM `novels` WHERE title LIKE 'TEST_%';
    
    COMMIT;
    
    SELECT '测试数据清理完成' AS message;
END$$

-- ============================================
-- 9. 生成小说统计报表
-- ============================================
DROP PROCEDURE IF EXISTS `sp_generate_novel_report`$$
CREATE PROCEDURE `sp_generate_novel_report`(IN p_category_id INT)
BEGIN
    SELECT 
        c.name AS '分类',
        COUNT(n.id) AS '小说数量',
        SUM(n.chapter_count) AS '总章节数',
        SUM(n.word_count) AS '总字数',
        SUM(n.views) AS '总浏览量',
        SUM(n.collections) AS '总收藏数',
        ROUND(AVG(n.rating), 2) AS '平均评分'
    FROM `categories` c
    LEFT JOIN `novels` n ON c.id = n.category_id
    WHERE (p_category_id IS NULL OR c.id = p_category_id)
    GROUP BY c.id, c.name
    ORDER BY SUM(n.views) DESC;
END$$

-- ============================================
-- 10. 定时任务 - 每日统计更新
-- ============================================
DROP PROCEDURE IF EXISTS `sp_daily_stats_update`$$
CREATE PROCEDURE `sp_daily_stats_update`()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_novel_id INT;
    
    DECLARE novel_cursor CURSOR FOR 
        SELECT id FROM `novels` WHERE status = 1;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    START TRANSACTION;
    
    -- 打开游标
    OPEN novel_cursor;
    
    read_loop: LOOP
        FETCH novel_cursor INTO v_novel_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 更新每本小说的统计
        CALL sp_update_novel_stats(v_novel_id);
    END LOOP;
    
    CLOSE novel_cursor;
    
    -- 计算热度排名
    CALL sp_calculate_hot_rank(7);
    
    COMMIT;
    
    SELECT '每日统计更新完成' AS message, NOW() AS update_time;
END$$

DELIMITER ;

-- ============================================
-- 测试存储过程
-- ============================================

-- 测试更新小说统计
-- CALL sp_update_novel_stats(1);

-- 测试计算热度排名 (基于最近7天)
-- CALL sp_calculate_hot_rank(7);

-- 测试清理过期数据
-- CALL sp_clean_expired_tokens();

-- 测试同步阅读进度
-- CALL sp_sync_reading_progress(1, 1, 1);

-- 测试批量更新浏览量
-- CALL sp_batch_update_views();

-- 测试生成统计报表
-- CALL sp_generate_novel_report(NULL);

-- 测试每日统计更新
-- CALL sp_daily_stats_update();

SELECT '存储过程创建完成!' AS message;

