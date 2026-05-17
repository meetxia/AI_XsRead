CREATE TABLE IF NOT EXISTS comments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  novel_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  rating TINYINT UNSIGNED DEFAULT 5,
  images JSON NULL,
  parent_id INT UNSIGNED NULL,
  reply_to_user_id INT UNSIGNED NULL,
  likes INT UNSIGNED DEFAULT 0,
  status TINYINT DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_novel_id (novel_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE comments
  ADD COLUMN images JSON NULL;

ALTER TABLE comments
  ADD COLUMN parent_id INT UNSIGNED NULL;

ALTER TABLE comments
  ADD COLUMN reply_to_user_id INT UNSIGNED NULL;

ALTER TABLE comments
  ADD COLUMN deleted_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS comment_likes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  comment_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_comment (user_id, comment_id),
  INDEX idx_comment_id (comment_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
