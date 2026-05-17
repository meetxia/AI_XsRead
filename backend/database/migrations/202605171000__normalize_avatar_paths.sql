-- 把 users.avatar 中以 http(s):// 开头并带 /uploads/ 的绝对地址改成相对路径
-- 原因：早期注册逻辑把 req.protocol://host 拼进了 avatar，跨域名/切 HTTPS 时会失效
-- 幂等：再次执行不会出问题（替换后再次匹配 http(s) 前缀的记录数为 0）

UPDATE users
SET avatar = SUBSTRING(avatar, LOCATE('/uploads/', avatar))
WHERE avatar IS NOT NULL
  AND avatar REGEXP '^https?://[^/]+/uploads/';
