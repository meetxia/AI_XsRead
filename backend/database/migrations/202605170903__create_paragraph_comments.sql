CREATE TABLE IF NOT EXISTS paragraph_comments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  novel_id INT UNSIGNED NOT NULL,
  chapter_id INT UNSIGNED NULL,
  paragraph_index INT NULL,
  paragraph_hash CHAR(16) NULL,
  content TEXT NOT NULL,
  likes INT NOT NULL DEFAULT 0,
  parent_id INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_novel_chapter_paragraph (novel_id, chapter_id, paragraph_index),
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_parent_id (parent_id),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
