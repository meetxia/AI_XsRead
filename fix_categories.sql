SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
INSERT INTO `categories` (`id`, `name`, `icon`, `description`, `novel_count`, `sort_order`) VALUES
(101, '都市言情', '🏙️', '现代都市背景的浪漫爱情故事', 0, 1),
(102, '古风穿越', '🏯', '穿越时空的古代言情故事', 0, 2),
(103, '玄幻修仙', '⚔️', '修仙练功、斗智斗勇的奇幻世界', 0, 3),
(104, '悬疑推理', '🔍', '扣人心弦的悬疑推理故事', 0, 4),
(105, '科幻未来', '🚀', '科技与未来世界的想象', 0, 5),
(106, '青春校园', '📚', '校园生活与青春成长故事', 0, 6)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);
UPDATE `categories` cat SET cat.novel_count = (SELECT COUNT(*) FROM novels n WHERE n.category_id = cat.id);
