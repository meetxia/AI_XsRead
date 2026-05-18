-- 创建评论系统相关表

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  novel_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  parent_id INT DEFAULT NULL COMMENT '父评论ID，用于回复',
  reply_to_user_id INT DEFAULT NULL COMMENT '回复的用户ID',
  likes INT DEFAULT 0 COMMENT '点赞数',
  created_at DATETIME NOT NULL,
  deleted_at DATETIME DEFAULT NULL COMMENT '软删除时间',
  INDEX idx_novel_id (novel_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- 评论点赞表
CREATE TABLE IF NOT EXISTS comment_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  comment_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uk_user_comment (user_id, comment_id),
  INDEX idx_comment_id (comment_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论点赞表';

-- 小说点赞表
CREATE TABLE IF NOT EXISTS novel_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  novel_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uk_user_novel (user_id, novel_id),
  INDEX idx_novel_id (novel_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小说点赞表';

-- 小说收藏表（如果不存在）
CREATE TABLE IF NOT EXISTS novel_collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  novel_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uk_user_novel (user_id, novel_id),
  INDEX idx_novel_id (novel_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小说收藏表';

-- 如果novels表没有likes和collections字段，添加它们
ALTER TABLE novels 
ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0 COMMENT '点赞数',
ADD COLUMN IF NOT EXISTS collections INT DEFAULT 0 COMMENT '收藏数';

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_novels_likes ON novels(likes DESC);
CREATE INDEX IF NOT EXISTS idx_novels_collections ON novels(collections DESC);

