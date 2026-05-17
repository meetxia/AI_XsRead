ALTER TABLE bookshelf
  ADD COLUMN last_seen_chapter_id INT NULL COMMENT '最后已看章节ID';

ALTER TABLE bookshelf
  ADD COLUMN group_name VARCHAR(50) NULL COMMENT '书架分组';

ALTER TABLE bookshelf
  ADD COLUMN is_top TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否置顶';

CREATE INDEX idx_bookshelf_user_type_top ON bookshelf(user_id, type, is_top, updated_at);
