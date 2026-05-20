-- ============================================================================
-- MOMO 小说封面路径迁移脚本（中文 hash 命名 → 英文 kebab-case）
-- 创建日期：2026-05-20
-- 说明：
--   旧路径 /uploads/images/covers/cover-{hash}.jpg 对应的实体文件已被移除，
--   新封面位于 backend/uploads/images/covers-jpg/{english}.jpg。
--   本脚本将 novels.cover 字段统一切换到新路径。
--
-- 配套文件：
--   - backend/uploads/images/covers-jpg/cover-name-map.json （命名 SOT）
--   - backend/uploads/images/covers/cover-map.json          （title -> url 映射）
--   - backend/uploads/images/covers/cover-source-map.json   （含 sourceIndex 元数据）
--
-- 替代关系：
--   废止 docs/06-数据库脚本/2026-05-18-update-novel-covers.sql （旧 hash 路径已失效）
--
-- 执行方式：
--   方式一 SQL：mysql -u <user> -p <database> < 2026-05-20-rename-covers-to-english.sql
--   方式二 Node：node backend/scripts/migrate-covers-to-english.js
-- ============================================================================

UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/mute-political-marriage.jpg'  WHERE `title` = '不会说话的你，被政界新贵指定联姻';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/master-rekindle-romance.jpg'  WHERE `title` = '大师劝复合，我闺蜜差点信了爱情';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/master-cut-bad-fate.jpg'      WHERE `title` = '大师说这烂桃花必须斩，然后转身给他当了月老';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/three-years-stand-in.jpg'     WHERE `title` = '当了三年替身，我辞职那天他疯了';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/useless-junior-sister.jpg'    WHERE `title` = '废材小师妹被顶级大师兄偷偷藏了十年';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/breakup-bestie-group.jpg'     WHERE `title` = '分手后加入闺蜜群，发现群里三个男的都在暗恋我';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/brother-said-horse.jpg'       WHERE `title` = '哥哥说，小时候不是很喜欢当马吗';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/bestie-abroad-brother.jpg'    WHERE `title` = '闺蜜出国后，她那个从不说话的弟弟开始接近我';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/crush-shared-pain.jpg'        WHERE `title` = '和暗恋对象共享痛感是什么体验';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/dating-deceased-senior.jpg'   WHERE `title` = '和已故学长恋爱后，监控里出现了另一个他';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/bar-fiance-father.jpg'        WHERE `title` = '酒吧买醉遇到的野男人，竟然是未婚夫的父亲';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/livestream-three-sponsors.jpg' WHERE `title` = '连麦后社死！竟发现三个金主爸爸住一起';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/retired-assassin.jpg'         WHERE `title` = '女杀手的隐退计划，被病娇丈夫搅黄了';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/flash-marriage-rival.jpg'     WHERE `title` = '闪婚死对头？前任当场脸绿了！';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/embarrass-neighbor.jpg'       WHERE `title` = '社死！邻居问我同时交了几个男朋友身';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/embarrass-ex-roommates.jpg'   WHERE `title` = '社死！前任被赶出宿舍三个室友疯狂追求我';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/amnesiac-tycoon.jpg'          WHERE `title` = '失忆大佬把我宠成废人后恢复记忆了';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/tear-mil-script.jpg'          WHERE `title` = '撕掉恶婆婆剧本，我的人生开挂了';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/rival-clan-leader.jpg'        WHERE `title` = '死对头家主他想用尾巴缠住我';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/rival-lawyer.jpg'             WHERE `title` = '死对头律师在我离婚案上偷偷帮我';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/fortune-teller-mismatch.jpg'  WHERE `title` = '算命先生说我们八字不合，但他非要娶我';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/they-said-pick-one.jpg'       WHERE `title` = '他们说，只能选一个';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/after-his-death-twin.jpg'     WHERE `title` = '他去世后，那个陌生的双胞胎哥哥开始觊觎我';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/he-said-only-me.jpg'          WHERE `title` = '他说，你只需要适应我一个人就够了';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/online-dating-triplets.jpg'   WHERE `title` = '网恋翻车了！三个暧昧对象竟是三胞胎';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/spite-ex-found-prince.jpg'    WHERE `title` = '为了气前任我找了个牛郎，结果他是京圈太子爷';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/mom-remarried-stepbrother.jpg' WHERE `title` = '我妈再婚后，那个陌生的继兄每晚站在我门口';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/testing-dating-game.jpg'      WHERE `title` = '我在测试恋爱游戏，三个男人都是真心的';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/dating-game-husbands.jpg'     WHERE `title` = '我在恋爱游戏里的三个老公，在现实中找上门了';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/three-roommates-pamper.jpg'   WHERE `title` = '我招了三个室友，他们说要一起养我';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/cheater-roommates-action.jpg' WHERE `title` = '渣男劈腿后，他那三个暗恋我的室友开始行动了';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/comrade-last-wish.jpg'        WHERE `title` = '战友说是遗愿，可这照顾方式太过暧昧';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/reborn-blocked-ex.jpg'        WHERE `title` = '重生后我在朋友圈屏蔽了前夫，他开始全网找我';
UPDATE `novels` SET `cover` = '/uploads/images/covers-jpg/drunk-fiance-uncle.jpg'       WHERE `title` = '醉酒误睡未婚夫叔叔，这下玩大了！';

-- 校验：迁移完成后应有 34 条记录使用 covers-jpg/ 路径
SELECT '封面路径迁移完成' AS Status, COUNT(*) AS 已迁移数量
FROM novels
WHERE cover LIKE '/uploads/images/covers-jpg/%';

-- 校验：列出仍在使用旧 hash 路径的记录（理想结果为 0 行）
SELECT id, title, cover
FROM novels
WHERE cover LIKE '/uploads/images/covers/cover-%';
