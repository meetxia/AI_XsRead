#!/bin/bash

echo "================================"
echo "创建数据库并导入数据"
echo "================================"

# 数据库配置
DB_HOST="127.0.0.1"
DB_USER="toefl_user"
DB_PASS="mojz168168"
DB_NAME="ai_xsread"

# SQL脚本目录
SQL_DIR="/www/wwwroot/xs.momofx.cn/docx/06-数据库脚本"

echo "提示：需要MySQL root权限来创建数据库"
echo "请输入MySQL root密码："
read -s MYSQL_ROOT_PASS

echo ""
echo "步骤1: 创建数据库..."
mysql -u root -p"$MYSQL_ROOT_PASS" << MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS $DB_NAME DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

if [ $? -eq 0 ]; then
    echo "✓ 数据库创建成功"
else
    echo "✗ 数据库创建失败"
    exit 1
fi

echo ""
echo "步骤2: 导入数据库结构..."
mysql -u root -p"$MYSQL_ROOT_PASS" $DB_NAME < "$SQL_DIR/database_init.sql"
echo "✓ 数据库结构导入完成"

echo ""
echo "步骤3: 导入后台管理表..."
mysql -u root -p"$MYSQL_ROOT_PASS" $DB_NAME < "$SQL_DIR/admin_tables.sql"
echo "✓ 后台管理表导入完成"

echo ""
echo "步骤4: 导入测试数据..."
mysql -u root -p"$MYSQL_ROOT_PASS" $DB_NAME < "$SQL_DIR/seed_data_complete.sql"
echo "✓ 测试数据导入完成"

echo ""
echo "步骤5: 创建管理员账号..."
mysql -u root -p"$MYSQL_ROOT_PASS" $DB_NAME < "$SQL_DIR/创建管理员账号.sql"
echo "✓ 管理员账号创建完成"

echo ""
echo "================================"
echo "数据库设置完成！"
echo "================================"
echo "数据库名: $DB_NAME"
echo "管理员账号: admin"
echo "管理员密码: admin123"
echo "================================"
