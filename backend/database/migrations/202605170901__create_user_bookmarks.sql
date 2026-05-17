CREATE TABLE IF NOT EXISTS user_bookmarks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  novel_id INT UNSIGNED NOT NULL,
  chapter_id INT UNSIGNED NULL,
  paragraph_index INT NULL,
  paragraph_hash CHAR(16) NULL,
  char_offset INT NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_novel (user_id, novel_id),
  INDEX idx_chapter_anchor (chapter_id, paragraph_index),
  UNIQUE KEY uk_user_anchor (user_id, novel_id, chapter_id, paragraph_index, paragraph_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
