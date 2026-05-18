-- MOMO小说 - 小说初始统计数据（评分/阅读量/收藏/点赞）
-- 最后更新日期：2026-05-18
-- 说明：为 data/ 目录的 34 部小说设置合理的起始数据，模拟线上真实运营状态。

-- ============================================
-- 批量更新评分、阅读量、点赞、收藏等数据
-- ============================================

-- 1. 不会说话的你，被政界新贵指定联姻（都市言情·热门）
UPDATE `novels` SET
  `views` = 58200, `likes` = 4320, `collections` = 1860,
  `rating` = 4.8, `rating_count` = 512,
  `is_recommended` = 1, `is_hot` = 1
WHERE `title` = '不会说话的你，被政界新贵指定联姻';

-- 2. 大师劝复合，我闺蜜差点信了爱情（都市言情）
UPDATE `novels` SET
  `views` = 32100, `likes` = 2450, `collections` = 980,
  `rating` = 4.5, `rating_count` = 287,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '大师劝复合，我闺蜜差点信了爱情';

-- 3. 大师说这烂桃花必须斩，然后转身给他当了月老（都市言情）
UPDATE `novels` SET
  `views` = 27800, `likes` = 2100, `collections` = 870,
  `rating` = 4.4, `rating_count` = 231,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '大师说这烂桃花必须斩，然后转身给他当了月老';

-- 4. 当了三年替身，我辞职那天他疯了（都市言情·热门）
UPDATE `novels` SET
  `views` = 72300, `likes` = 5680, `collections` = 2340,
  `rating` = 4.9, `rating_count` = 689,
  `is_recommended` = 1, `is_hot` = 1
WHERE `title` = '当了三年替身，我辞职那天他疯了';

-- 5. 废材小师妹被顶级大师兄偷偷藏了十年（古风穿越·推荐）
UPDATE `novels` SET
  `views` = 45600, `likes` = 3780, `collections` = 1520,
  `rating` = 4.7, `rating_count` = 423,
  `is_recommended` = 1, `is_hot` = 0
WHERE `title` = '废材小师妹被顶级大师兄偷偷藏了十年';

-- 6. 分手后加入闺蜜群，发现群里三个男的都在暗恋我（都市言情）
UPDATE `novels` SET
  `views` = 38900, `likes` = 3120, `collections` = 1280,
  `rating` = 4.6, `rating_count` = 356,
  `is_recommended` = 0, `is_hot` = 1
WHERE `title` = '分手后加入闺蜜群，发现群里三个男的都在暗恋我';

-- 7. 哥哥说，小时候不是很喜欢当马吗（都市言情）
UPDATE `novels` SET
  `views` = 21500, `likes` = 1680, `collections` = 720,
  `rating` = 4.3, `rating_count` = 198,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '哥哥说，小时候不是很喜欢当马吗';

-- 8. 闺蜜出国后，她那个从不说话的弟弟开始接近我（都市言情·推荐）
UPDATE `novels` SET
  `views` = 41200, `likes` = 3450, `collections` = 1390,
  `rating` = 4.7, `rating_count` = 398,
  `is_recommended` = 1, `is_hot` = 0
WHERE `title` = '闺蜜出国后，她那个从不说话的弟弟开始接近我';

-- 9. 和暗恋对象共享痛感是什么体验（都市言情·热门）
UPDATE `novels` SET
  `views` = 63500, `likes` = 4890, `collections` = 2010,
  `rating` = 4.8, `rating_count` = 567,
  `is_recommended` = 1, `is_hot` = 1
WHERE `title` = '和暗恋对象共享痛感是什么体验';

-- 10. 和已故学长恋爱后，监控里出现了另一个他（悬疑推理·热门）
UPDATE `novels` SET
  `views` = 55800, `likes` = 4210, `collections` = 1780,
  `rating` = 4.9, `rating_count` = 498,
  `is_recommended` = 1, `is_hot` = 1
WHERE `title` = '和已故学长恋爱后，监控里出现了另一个他';

-- 11. 酒吧买醉遇到的野男人，竟然是未婚夫的父亲（都市言情）
UPDATE `novels` SET
  `views` = 34600, `likes` = 2780, `collections` = 1150,
  `rating` = 4.5, `rating_count` = 312,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '酒吧买醉遇到的野男人，竟然是未婚夫的父亲';

-- 12. 连麦后社死！竟发现三个金主爸爸住一起（都市言情）
UPDATE `novels` SET
  `views` = 29300, `likes` = 2230, `collections` = 920,
  `rating` = 4.4, `rating_count` = 256,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '连麦后社死！竟发现三个金主爸爸住一起';

-- 13. 女杀手的隐退计划，被病娇丈夫搅黄了（悬疑推理·推荐）
UPDATE `novels` SET
  `views` = 47200, `likes` = 3890, `collections` = 1620,
  `rating` = 4.7, `rating_count` = 445,
  `is_recommended` = 1, `is_hot` = 0
WHERE `title` = '女杀手的隐退计划，被病娇丈夫搅黄了';

-- 14. 闪婚死对头？前任当场脸绿了！（都市言情·热门）
UPDATE `novels` SET
  `views` = 68100, `likes` = 5230, `collections` = 2180,
  `rating` = 4.8, `rating_count` = 623,
  `is_recommended` = 1, `is_hot` = 1
WHERE `title` = '闪婚死对头？前任当场脸绿了！';

-- 15. 社死！邻居问我同时交了几个男朋友身（都市言情）
UPDATE `novels` SET
  `views` = 25600, `likes` = 1950, `collections` = 810,
  `rating` = 4.3, `rating_count` = 215,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '社死！邻居问我同时交了几个男朋友身';

-- 16. 社死！前任被赶出宿舍三个室友疯狂追求我（都市言情）
UPDATE `novels` SET
  `views` = 31200, `likes` = 2380, `collections` = 960,
  `rating` = 4.4, `rating_count` = 267,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '社死！前任被赶出宿舍三个室友疯狂追求我';

-- 17. 失忆大佬把我宠成废人后恢复记忆了（都市言情·推荐）
UPDATE `novels` SET
  `views` = 52300, `likes` = 4120, `collections` = 1720,
  `rating` = 4.8, `rating_count` = 478,
  `is_recommended` = 1, `is_hot` = 1
WHERE `title` = '失忆大佬把我宠成废人后恢复记忆了';

-- 18. 撕掉恶婆婆剧本，我的人生开挂了（都市言情）
UPDATE `novels` SET
  `views` = 36800, `likes` = 2890, `collections` = 1180,
  `rating` = 4.6, `rating_count` = 334,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '撕掉恶婆婆剧本，我的人生开挂了';

-- 19. 死对头家主他想用尾巴缠住我（玄幻修仙·推荐）
UPDATE `novels` SET
  `views` = 43500, `likes` = 3560, `collections` = 1450,
  `rating` = 4.7, `rating_count` = 412,
  `is_recommended` = 1, `is_hot` = 0
WHERE `title` = '死对头家主他想用尾巴缠住我';

-- 20. 死对头律师在我离婚案上偷偷帮我（都市言情）
UPDATE `novels` SET
  `views` = 39700, `likes` = 3210, `collections` = 1310,
  `rating` = 4.6, `rating_count` = 367,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '死对头律师在我离婚案上偷偷帮我';

-- 21. 算命先生说我们八字不合，但他非要娶我（古风穿越）
UPDATE `novels` SET
  `views` = 28900, `likes` = 2180, `collections` = 890,
  `rating` = 4.5, `rating_count` = 245,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '算命先生说我们八字不合，但他非要娶我';

-- 22. 他们说，只能选一个（都市言情·推荐）
UPDATE `novels` SET
  `views` = 49800, `likes` = 3980, `collections` = 1650,
  `rating` = 4.7, `rating_count` = 456,
  `is_recommended` = 1, `is_hot` = 1
WHERE `title` = '他们说，只能选一个';

-- 23. 他去世后，那个陌生的双胞胎哥哥开始觊觎我（悬疑推理）
UPDATE `novels` SET
  `views` = 37400, `likes` = 2960, `collections` = 1220,
  `rating` = 4.6, `rating_count` = 342,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '他去世后，那个陌生的双胞胎哥哥开始觊觎我';

-- 24. 他说，你只需要适应我一个人就够了（都市言情）
UPDATE `novels` SET
  `views` = 33500, `likes` = 2650, `collections` = 1080,
  `rating` = 4.5, `rating_count` = 298,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '他说，你只需要适应我一个人就够了';

-- 25. 网恋翻车了！三个暧昧对象竟是三胞胎（都市言情）
UPDATE `novels` SET
  `views` = 26700, `likes` = 2050, `collections` = 840,
  `rating` = 4.4, `rating_count` = 223,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '网恋翻车了！三个暧昧对象竟是三胞胎';

-- 26. 为了气前任我找了个牛郎，结果他是京圈太子爷（都市言情·热门）
UPDATE `novels` SET
  `views` = 61200, `likes` = 4750, `collections` = 1950,
  `rating` = 4.8, `rating_count` = 534,
  `is_recommended` = 1, `is_hot` = 1
WHERE `title` = '为了气前任我找了个牛郎，结果他是京圈太子爷';

-- 27. 我妈再婚后，那个陌生的继兄每晚站在我门口（悬疑推理）
UPDATE `novels` SET
  `views` = 42100, `likes` = 3380, `collections` = 1380,
  `rating` = 4.6, `rating_count` = 389,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '我妈再婚后，那个陌生的继兄每晚站在我门口';

-- 28. 我在测试恋爱游戏，三个男人都是真心的（都市言情）
UPDATE `novels` SET
  `views` = 35200, `likes` = 2760, `collections` = 1130,
  `rating` = 4.5, `rating_count` = 318,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '我在测试恋爱游戏，三个男人都是真心的';

-- 29. 我在恋爱游戏里的三个老公，在现实中找上门了（都市言情·推荐）
UPDATE `novels` SET
  `views` = 46800, `likes` = 3720, `collections` = 1540,
  `rating` = 4.7, `rating_count` = 432,
  `is_recommended` = 1, `is_hot` = 0
WHERE `title` = '我在恋爱游戏里的三个老公，在现实中找上门了';

-- 30. 我招了三个室友，他们说要一起养我（都市言情）
UPDATE `novels` SET
  `views` = 30800, `likes` = 2350, `collections` = 950,
  `rating` = 4.4, `rating_count` = 261,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '我招了三个室友，他们说要一起养我';

-- 31. 渣男劈腿后，他那三个暗恋我的室友开始行动了（都市言情）
UPDATE `novels` SET
  `views` = 44300, `likes` = 3620, `collections` = 1480,
  `rating` = 4.6, `rating_count` = 401,
  `is_recommended` = 0, `is_hot` = 1
WHERE `title` = '渣男劈腿后，他那三个暗恋我的室友开始行动了';

-- 32. 战友说是遗愿，可这照顾方式太过暧昧（都市言情）
UPDATE `novels` SET
  `views` = 28100, `likes` = 2120, `collections` = 860,
  `rating` = 4.4, `rating_count` = 237,
  `is_recommended` = 0, `is_hot` = 0
WHERE `title` = '战友说是遗愿，可这照顾方式太过暧昧';

-- 33. 重生后我在朋友圈屏蔽了前夫，他开始全网找我（都市言情·热门）
UPDATE `novels` SET
  `views` = 67500, `likes` = 5180, `collections` = 2150,
  `rating` = 4.9, `rating_count` = 612,
  `is_recommended` = 1, `is_hot` = 1
WHERE `title` = '重生后我在朋友圈屏蔽了前夫，他开始全网找我';

-- 34. 醉酒误睡未婚夫叔叔，这下玩大了！（都市言情·热门）
UPDATE `novels` SET
  `views` = 59800, `likes` = 4560, `collections` = 1920,
  `rating` = 4.8, `rating_count` = 523,
  `is_recommended` = 1, `is_hot` = 1
WHERE `title` = '醉酒误睡未婚夫叔叔，这下玩大了！';

-- ============================================
-- 验证结果
-- ============================================
SELECT '统计数据更新完成' AS Status,
       COUNT(*) AS 更新小说数,
       ROUND(AVG(rating), 2) AS 平均评分,
       ROUND(AVG(views)) AS 平均阅读量,
       SUM(is_hot) AS 热门数,
       SUM(is_recommended) AS 推荐数
FROM novels
WHERE title IN (
  '不会说话的你，被政界新贵指定联姻',
  '当了三年替身，我辞职那天他疯了',
  '重生后我在朋友圈屏蔽了前夫，他开始全网找我',
  '醉酒误睡未婚夫叔叔，这下玩大了！'
);
