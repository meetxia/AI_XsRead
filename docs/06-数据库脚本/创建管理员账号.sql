-- ============================================================
-- 创建管理员账号 SQL 脚本
-- ============================================================

-- 方法1: 创建新的admin账号
-- 用户名: admin
-- 密码: 123456
-- 邮箱: admin@xsread.com
-- 角色: admin

INSERT INTO users (username, email, password, role, created_at) 
VALUES ('admin', 'admin@xsread.com', '$2a$10$AZI.zCl5.MQjKHhtNYveAu9KR2OrmuTVl1ZtOpLoUf1jQzx1evq9C', 'admin', NOW())
ON DUPLICATE KEY UPDATE 
  password = '$2a$10$AZI.zCl5.MQjKHhtNYveAu9KR2OrmuTVl1ZtOpLoUf1jQzx1evq9C',
  role = 'admin';

-- ============================================================

-- 方法2: 如果admin已存在，只更新密码
UPDATE users 
SET password = '$2a$10$AZI.zCl5.MQjKHhtNYveAu9KR2OrmuTVl1ZtOpLoUf1jQzx1evq9C',
    role = 'admin'
WHERE username = 'admin';

-- ============================================================

-- 创建其他测试账号（可选）
-- 所有账号密码都是: 123456

INSERT INTO users (username, email, password, role, created_at) VALUES
('testuser', 'test@xsread.com', '$2a$10$AZI.zCl5.MQjKHhtNYveAu9KR2OrmuTVl1ZtOpLoUf1jQzx1evq9C', 'user', NOW()),
('reader1', 'reader1@xsread.com', '$2a$10$AZI.zCl5.MQjKHhtNYveAu9KR2OrmuTVl1ZtOpLoUf1jQzx1evq9C', 'user', NOW()),
('reader2', 'reader2@xsread.com', '$2a$10$AZI.zCl5.MQjKHhtNYveAu9KR2OrmuTVl1ZtOpLoUf1jQzx1evq9C', 'user', NOW())
ON DUPLICATE KEY UPDATE 
  password = '$2a$10$AZI.zCl5.MQjKHhtNYveAu9KR2OrmuTVl1ZtOpLoUf1jQzx1evq9C';

-- ============================================================

-- 查看所有用户（验证）
SELECT id, username, email, role, created_at 
FROM users 
ORDER BY id;

-- ============================================================
-- 使用说明:
-- 1. 打开 phpMyAdmin 或其他MySQL客户端
-- 2. 选择数据库 (ai_xsread 或 xsread)
-- 3. 执行上面的SQL语句
-- 4. 使用以下账号登录:
--    用户名: admin
--    密码: 123456
-- ============================================================

