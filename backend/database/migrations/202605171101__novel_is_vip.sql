-- 小说表加 VIP 标记
-- is_vip: 0 免费（默认） / 1 整本 VIP（仅会员可读全文，非会员试读前 1500 字符）
-- 后期升级到章节级 VIP 时再加 chapter.is_vip / vip_chapter_threshold 等字段

ALTER TABLE novels
  ADD COLUMN is_vip TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 免费 1 整本 VIP';

ALTER TABLE novels
  ADD INDEX idx_novels_is_vip (is_vip);
