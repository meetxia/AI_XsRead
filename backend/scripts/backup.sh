#!/bin/bash
# ============================================
# 文字之境 - 数据库备份脚本 (Linux版本)
# 开发者: 开发者C
# 创建日期: 2025-10-27
# 版本: v1.0
# ============================================

# ============================================
# 配置参数
# ============================================
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD="root123"
DB_NAME="ai_xsread"
BACKUP_DIR="/data/backup/mysql"
MYSQL_BIN="mysql"
MYSQLDUMP_BIN="mysqldump"

# 时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_STR=$(date +%Y-%m-%d\ %H:%M:%S)

# 文件路径
LOG_DIR="${BACKUP_DIR}/logs"
FULL_DIR="${BACKUP_DIR}/full"
INCR_DIR="${BACKUP_DIR}/incremental"
LOG_FILE="${LOG_DIR}/backup_${TIMESTAMP}.log"
BACKUP_FILE="${FULL_DIR}/full_${TIMESTAMP}.sql"

# ============================================
# 创建备份目录
# ============================================
mkdir -p "${BACKUP_DIR}"
mkdir -p "${FULL_DIR}"
mkdir -p "${INCR_DIR}"
mkdir -p "${LOG_DIR}"

# ============================================
# 日志函数
# ============================================
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# ============================================
# 开始备份
# ============================================
log "============================================"
log "数据库备份开始"
log "============================================"

# ============================================
# 全量备份
# ============================================
log "开始全量备份..."
echo "正在备份数据库 ${DB_NAME}..."

${MYSQLDUMP_BIN} -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASSWORD} \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --master-data=2 \
    ${DB_NAME} > "${BACKUP_FILE}" 2>> "${LOG_FILE}"

if [ $? -eq 0 ]; then
    log "全量备份成功"
    echo "备份成功！"
else
    log "全量备份失败"
    echo "备份失败！请检查日志: ${LOG_FILE}"
    exit 1
fi

# ============================================
# 压缩备份文件
# ============================================
log "开始压缩备份文件..."
echo "正在压缩备份文件..."

gzip -f "${BACKUP_FILE}" 2>> "${LOG_FILE}"

if [ $? -eq 0 ]; then
    log "压缩成功"
    echo "压缩完成！"
    BACKUP_FILE="${BACKUP_FILE}.gz"
else
    log "压缩失败"
    echo "压缩失败，保留原文件"
fi

# ============================================
# 获取备份文件大小
# ============================================
FILE_SIZE=$(stat -f%z "${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_FILE}" 2>/dev/null)
FILE_SIZE_MB=$((FILE_SIZE / 1024 / 1024))
log "备份文件大小: ${FILE_SIZE_MB} MB"

# ============================================
# 备份到云存储 (可选)
# ============================================
# 如果安装了ossutil (阿里云OSS)
if command -v ossutil &> /dev/null; then
    log "开始上传到云存储..."
    echo "正在上传到云存储..."
    
    ossutil cp "${BACKUP_FILE}" "oss://your-bucket/backup/" \
        --config-file ~/.ossutilconfig 2>> "${LOG_FILE}"
    
    if [ $? -eq 0 ]; then
        log "云存储上传成功"
        echo "上传成功！"
    else
        log "云存储上传失败"
        echo "上传失败，备份文件保留在本地"
    fi
fi

# ============================================
# 清理旧备份 (保留7天)
# ============================================
log "开始清理旧备份..."
echo "正在清理7天前的备份..."

find "${FULL_DIR}" -name "full_*.sql.gz" -mtime +7 -delete 2>> "${LOG_FILE}"
OLD_COUNT=$(find "${FULL_DIR}" -name "full_*.sql.gz" -mtime +7 | wc -l)

if [ $? -eq 0 ]; then
    log "旧备份清理完成，删除 ${OLD_COUNT} 个文件"
    echo "清理完成！"
else
    log "旧备份清理失败"
fi

# ============================================
# 备份验证
# ============================================
log "开始验证备份文件..."
echo "正在验证备份..."

if [ -f "${BACKUP_FILE}" ]; then
    # 检查文件大小
    if [ ${FILE_SIZE} -gt 1024 ]; then
        log "备份验证通过"
        echo "验证通过！"
        
        # 测试解压 (不实际解压)
        gunzip -t "${BACKUP_FILE}" 2>> "${LOG_FILE}"
        if [ $? -eq 0 ]; then
            log "压缩文件完整性验证通过"
        else
            log "警告: 压缩文件可能损坏"
            echo "警告: 压缩文件可能损坏！"
        fi
    else
        log "警告: 备份文件过小"
        echo "警告: 备份文件过小！"
    fi
else
    log "错误: 备份文件不存在"
    echo "错误: 备份文件不存在！"
    exit 1
fi

# ============================================
# 增量备份 (binlog)
# ============================================
log "开始备份binlog..."
echo "正在备份binlog..."

BINLOG_DIR="/var/lib/mysql"
BINLOG_BACKUP_DIR="${INCR_DIR}/binlog_${TIMESTAMP}"
mkdir -p "${BINLOG_BACKUP_DIR}"

# 获取当前binlog位置
BINLOG_INFO=$(${MYSQL_BIN} -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASSWORD} \
    -e "SHOW MASTER STATUS\G" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "${BINLOG_INFO}" > "${BINLOG_BACKUP_DIR}/binlog_position.txt"
    log "binlog位置信息已保存"
    
    # 复制binlog文件 (可选)
    # cp ${BINLOG_DIR}/mysql-bin.* ${BINLOG_BACKUP_DIR}/ 2>> "${LOG_FILE}"
else
    log "获取binlog信息失败"
fi

# ============================================
# 生成备份报告
# ============================================
log "============================================"
log "备份完成报告"
log "============================================"
log "数据库: ${DB_NAME}"
log "备份文件: ${BACKUP_FILE}"
log "文件大小: ${FILE_SIZE_MB} MB"
log "完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
log "============================================"

echo ""
echo "============================================"
echo "备份完成!"
echo "============================================"
echo "备份文件: ${BACKUP_FILE}"
echo "文件大小: ${FILE_SIZE_MB} MB"
echo "日志文件: ${LOG_FILE}"
echo "============================================"

# ============================================
# 发送通知 (可选)
# ============================================
# 钉钉通知
# if command -v curl &> /dev/null; then
#     WEBHOOK_URL="https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN"
#     curl -X POST "${WEBHOOK_URL}" \
#         -H 'Content-Type: application/json' \
#         -d "{
#             \"msgtype\": \"text\",
#             \"text\": {
#                 \"content\": \"数据库备份完成\\n数据库: ${DB_NAME}\\n大小: ${FILE_SIZE_MB} MB\"
#             }
#         }" 2>> "${LOG_FILE}"
# fi

exit 0

