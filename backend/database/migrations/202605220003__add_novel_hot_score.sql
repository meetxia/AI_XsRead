-- 定时任务热度排行字段
-- scheduledJobs 每小时会更新 hot_score 并基于它刷新 is_hot。

ALTER TABLE novels
  ADD COLUMN hot_score INT UNSIGNED DEFAULT 0 COMMENT '热度分数' AFTER rating_count;

ALTER TABLE novels
  ADD INDEX idx_hot_score (hot_score DESC);
