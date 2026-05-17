ALTER TABLE reading_progress
  ADD COLUMN paragraph_index INT NULL COMMENT '段落索引';

ALTER TABLE reading_progress
  ADD COLUMN char_offset INT NULL COMMENT '段内字符偏移';

ALTER TABLE reading_progress
  ADD COLUMN paragraph_hash CHAR(16) NULL COMMENT '段落hash';

UPDATE reading_history SET duration = 0 WHERE duration IS NULL;

ALTER TABLE reading_history
  MODIFY COLUMN duration INT NOT NULL DEFAULT 0 COMMENT '阅读时长(秒)';
