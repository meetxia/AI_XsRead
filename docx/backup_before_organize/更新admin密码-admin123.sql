-- ============================================================
-- 更新admin账号密码为 admin123
-- ============================================================

-- 用户名: admin
-- 密码: admin123
-- 生成时间: 2025-10-28

-- 方法1: 如果admin账号已存在，更新密码
UPDATE users 
SET password = '$2a$10$sHAaKc6JzvzvJEVMHuAMFOe9RKex9tcFfVO9BYfhaMagFn33v/oES',
    role = 'admin'
WHERE username = 'admin';

-- ============================================================

-- 方法2: 如果admin账号不存在，创建新账号
INSERT INTO users (username, email, password, role, created_at) 
VALUES ('admin', 'admin@xsread.com', '$2a$10$sHAaKc6JzvzvJEVMHuAMFOe9RKex9tcFfVO9BYfhaMagFn33v/oES', 'admin', NOW())
ON DUPLICATE KEY UPDATE 
  password = '$2a$10$sHAaKc6JzvzvJEVMHuAMFOe9RKex9tcFfVO9BYfhaMagFn33v/oES',
  role = 'admin';

-- ============================================================

-- 验证: 查看admin账号信息
SELECT id, username, email, role, created_at 
FROM users 
WHERE username = 'admin';

-- ============================================================
-- 执行完成后，使用以下信息登录:
-- 用户名: admin
-- 密码: admin123
-- ============================================================

