/**
 * 小说初始统计数据填充脚本
 * 为 34 部小说设置评分、阅读量、点赞、收藏等起始数据
 * 
 * 运行方式: node scripts/seed-novel-stats.js
 */
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const novelStats = [
  { title: '不会说话的你，被政界新贵指定联姻', views: 58200, likes: 4320, collections: 1860, rating: 4.8, rating_count: 512, is_recommended: 1, is_hot: 1 },
  { title: '大师劝复合，我闺蜜差点信了爱情', views: 32100, likes: 2450, collections: 980, rating: 4.5, rating_count: 287, is_recommended: 0, is_hot: 0 },
  { title: '大师说这烂桃花必须斩，然后转身给他当了月老', views: 27800, likes: 2100, collections: 870, rating: 4.4, rating_count: 231, is_recommended: 0, is_hot: 0 },
  { title: '当了三年替身，我辞职那天他疯了', views: 72300, likes: 5680, collections: 2340, rating: 4.9, rating_count: 689, is_recommended: 1, is_hot: 1 },
  { title: '废材小师妹被顶级大师兄偷偷藏了十年', views: 45600, likes: 3780, collections: 1520, rating: 4.7, rating_count: 423, is_recommended: 1, is_hot: 0 },
  { title: '分手后加入闺蜜群，发现群里三个男的都在暗恋我', views: 38900, likes: 3120, collections: 1280, rating: 4.6, rating_count: 356, is_recommended: 0, is_hot: 1 },
  { title: '哥哥说，小时候不是很喜欢当马吗', views: 21500, likes: 1680, collections: 720, rating: 4.3, rating_count: 198, is_recommended: 0, is_hot: 0 },
  { title: '闺蜜出国后，她那个从不说话的弟弟开始接近我', views: 41200, likes: 3450, collections: 1390, rating: 4.7, rating_count: 398, is_recommended: 1, is_hot: 0 },
  { title: '和暗恋对象共享痛感是什么体验', views: 63500, likes: 4890, collections: 2010, rating: 4.8, rating_count: 567, is_recommended: 1, is_hot: 1 },
  { title: '和已故学长恋爱后，监控里出现了另一个他', views: 55800, likes: 4210, collections: 1780, rating: 4.9, rating_count: 498, is_recommended: 1, is_hot: 1 },
  { title: '酒吧买醉遇到的野男人，竟然是未婚夫的父亲', views: 34600, likes: 2780, collections: 1150, rating: 4.5, rating_count: 312, is_recommended: 0, is_hot: 0 },
  { title: '连麦后社死！竟发现三个金主爸爸住一起', views: 29300, likes: 2230, collections: 920, rating: 4.4, rating_count: 256, is_recommended: 0, is_hot: 0 },
  { title: '女杀手的隐退计划，被病娇丈夫搅黄了', views: 47200, likes: 3890, collections: 1620, rating: 4.7, rating_count: 445, is_recommended: 1, is_hot: 0 },
  { title: '闪婚死对头？前任当场脸绿了！', views: 68100, likes: 5230, collections: 2180, rating: 4.8, rating_count: 623, is_recommended: 1, is_hot: 1 },
  { title: '社死！邻居问我同时交了几个男朋友身', views: 25600, likes: 1950, collections: 810, rating: 4.3, rating_count: 215, is_recommended: 0, is_hot: 0 },
  { title: '社死！前任被赶出宿舍三个室友疯狂追求我', views: 31200, likes: 2380, collections: 960, rating: 4.4, rating_count: 267, is_recommended: 0, is_hot: 0 },
  { title: '失忆大佬把我宠成废人后恢复记忆了', views: 52300, likes: 4120, collections: 1720, rating: 4.8, rating_count: 478, is_recommended: 1, is_hot: 1 },
  { title: '撕掉恶婆婆剧本，我的人生开挂了', views: 36800, likes: 2890, collections: 1180, rating: 4.6, rating_count: 334, is_recommended: 0, is_hot: 0 },
  { title: '死对头家主他想用尾巴缠住我', views: 43500, likes: 3560, collections: 1450, rating: 4.7, rating_count: 412, is_recommended: 1, is_hot: 0 },
  { title: '死对头律师在我离婚案上偷偷帮我', views: 39700, likes: 3210, collections: 1310, rating: 4.6, rating_count: 367, is_recommended: 0, is_hot: 0 },
  { title: '算命先生说我们八字不合，但他非要娶我', views: 28900, likes: 2180, collections: 890, rating: 4.5, rating_count: 245, is_recommended: 0, is_hot: 0 },
  { title: '他们说，只能选一个', views: 49800, likes: 3980, collections: 1650, rating: 4.7, rating_count: 456, is_recommended: 1, is_hot: 1 },
  { title: '他去世后，那个陌生的双胞胎哥哥开始觊觎我', views: 37400, likes: 2960, collections: 1220, rating: 4.6, rating_count: 342, is_recommended: 0, is_hot: 0 },
  { title: '他说，你只需要适应我一个人就够了', views: 33500, likes: 2650, collections: 1080, rating: 4.5, rating_count: 298, is_recommended: 0, is_hot: 0 },
  { title: '网恋翻车了！三个暧昧对象竟是三胞胎', views: 26700, likes: 2050, collections: 840, rating: 4.4, rating_count: 223, is_recommended: 0, is_hot: 0 },
  { title: '为了气前任我找了个牛郎，结果他是京圈太子爷', views: 61200, likes: 4750, collections: 1950, rating: 4.8, rating_count: 534, is_recommended: 1, is_hot: 1 },
  { title: '我妈再婚后，那个陌生的继兄每晚站在我门口', views: 42100, likes: 3380, collections: 1380, rating: 4.6, rating_count: 389, is_recommended: 0, is_hot: 0 },
  { title: '我在测试恋爱游戏，三个男人都是真心的', views: 35200, likes: 2760, collections: 1130, rating: 4.5, rating_count: 318, is_recommended: 0, is_hot: 0 },
  { title: '我在恋爱游戏里的三个老公，在现实中找上门了', views: 46800, likes: 3720, collections: 1540, rating: 4.7, rating_count: 432, is_recommended: 1, is_hot: 0 },
  { title: '我招了三个室友，他们说要一起养我', views: 30800, likes: 2350, collections: 950, rating: 4.4, rating_count: 261, is_recommended: 0, is_hot: 0 },
  { title: '渣男劈腿后，他那三个暗恋我的室友开始行动了', views: 44300, likes: 3620, collections: 1480, rating: 4.6, rating_count: 401, is_recommended: 0, is_hot: 1 },
  { title: '战友说是遗愿，可这照顾方式太过暧昧', views: 28100, likes: 2120, collections: 860, rating: 4.4, rating_count: 237, is_recommended: 0, is_hot: 0 },
  { title: '重生后我在朋友圈屏蔽了前夫，他开始全网找我', views: 67500, likes: 5180, collections: 2150, rating: 4.9, rating_count: 612, is_recommended: 1, is_hot: 1 },
  { title: '醉酒误睡未婚夫叔叔，这下玩大了！', views: 59800, likes: 4560, collections: 1920, rating: 4.8, rating_count: 523, is_recommended: 1, is_hot: 1 },
];

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_xsread',
    charset: 'utf8mb4',
  });

  console.log('🚀 开始填充小说统计数据...\n');

  let updated = 0;
  let notFound = 0;

  for (const novel of novelStats) {
    try {
      const [result] = await pool.execute(
        `UPDATE novels SET
          views = ?, likes = ?, collections = ?,
          rating = ?, rating_count = ?,
          is_recommended = ?, is_hot = ?
        WHERE title = ?`,
        [novel.views, novel.likes, novel.collections, novel.rating, novel.rating_count, novel.is_recommended, novel.is_hot, novel.title]
      );
      if (result.affectedRows > 0) {
        updated++;
        console.log(`  ✅ ${novel.title} — ⭐${novel.rating} 👁${novel.views} ❤${novel.likes}`);
      } else {
        notFound++;
        console.log(`  ⚠️ 未找到: ${novel.title}`);
      }
    } catch (err) {
      console.error(`  ❌ 失败: ${novel.title} — ${err.message}`);
    }
  }

  console.log(`\n📊 完成! 更新 ${updated} 部, 未找到 ${notFound} 部`);
  await pool.end();
}

main().catch(err => {
  console.error('脚本执行失败:', err.message);
  process.exit(1);
});
