#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
============================================
文字之境 - 数据导入工具
开发者: 开发者C
创建日期: 2025-10-27
版本: v1.0
============================================

功能:
- 批量导入小说数据
- 批量导入章节数据
- Excel/CSV数据导入
- 数据验证
- 错误处理
- 进度显示
- 回滚机制
"""

import sys
import argparse
import pandas as pd
import mysql.connector
from mysql.connector import Error
from tqdm import tqdm
from datetime import datetime
import logging
import json

# ============================================
# 日志配置
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_import.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================
# 数据库配置
# ============================================
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root123',
    'database': 'ai_xsread',
    'charset': 'utf8mb4',
    'autocommit': False
}

# ============================================
# 数据导入器类
# ============================================
class DataImporter:
    """数据导入器"""
    
    def __init__(self, config=None):
        """初始化"""
        self.config = config or DB_CONFIG
        self.conn = None
        self.cursor = None
        self.stats = {
            'success': 0,
            'failed': 0,
            'skipped': 0,
            'errors': []
        }
    
    def connect(self):
        """连接数据库"""
        try:
            self.conn = mysql.connector.connect(**self.config)
            self.cursor = self.conn.cursor(dictionary=True)
            logger.info('数据库连接成功')
            return True
        except Error as e:
            logger.error(f'数据库连接失败: {e}')
            return False
    
    def close(self):
        """关闭连接"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info('数据库连接已关闭')
    
    def validate_novels(self, df):
        """验证小说数据"""
        logger.info('开始验证小说数据...')
        
        # 必需字段
        required_columns = ['title', 'author', 'category_id']
        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f'缺少必需字段: {col}')
        
        # 数据类型检查
        if not pd.api.types.is_integer_dtype(df['category_id']):
            raise ValueError('category_id 必须是整数')
        
        # 空值检查
        null_counts = df[required_columns].isnull().sum()
        if null_counts.any():
            logger.warning(f'发现空值: {null_counts[null_counts > 0].to_dict()}')
        
        logger.info('小说数据验证通过')
        return True
    
    def import_novels(self, file_path, skip_duplicates=True):
        """导入小说数据"""
        logger.info(f'开始导入小说数据: {file_path}')
        
        try:
            # 读取文件
            if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
                df = pd.read_excel(file_path)
            elif file_path.endswith('.csv'):
                df = pd.read_csv(file_path, encoding='utf-8')
            else:
                raise ValueError('不支持的文件格式，请使用 .xlsx, .xls 或 .csv')
            
            logger.info(f'读取到 {len(df)} 条记录')
            
            # 验证数据
            self.validate_novels(df)
            
            # 开始导入
            self.conn.start_transaction()
            
            for index, row in tqdm(df.iterrows(), total=len(df), desc='导入进度'):
                try:
                    # 检查是否存在
                    if skip_duplicates:
                        self.cursor.execute(
                            "SELECT id FROM novels WHERE title = %s AND author = %s",
                            (row['title'], row['author'])
                        )
                        if self.cursor.fetchone():
                            logger.info(f'跳过重复记录: {row["title"]} - {row["author"]}')
                            self.stats['skipped'] += 1
                            continue
                    
                    # 插入数据
                    sql = """
                        INSERT INTO novels 
                        (title, author, category_id, cover, description, status, 
                         is_recommended, is_hot, published_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    values = (
                        row['title'],
                        row['author'],
                        int(row['category_id']),
                        row.get('cover', ''),
                        row.get('description', ''),
                        int(row.get('status', 1)),
                        int(row.get('is_recommended', 0)),
                        int(row.get('is_hot', 0)),
                        row.get('published_at', datetime.now())
                    )
                    
                    self.cursor.execute(sql, values)
                    self.stats['success'] += 1
                    
                except Exception as e:
                    logger.error(f'导入失败 (行{index}): {e}')
                    self.stats['failed'] += 1
                    self.stats['errors'].append({
                        'row': index,
                        'data': row.to_dict(),
                        'error': str(e)
                    })
                    
                    if not skip_duplicates:
                        self.conn.rollback()
                        raise
            
            # 提交事务
            self.conn.commit()
            logger.info('数据导入完成')
            self.print_stats()
            
            return True
            
        except Exception as e:
            logger.error(f'导入失败: {e}')
            if self.conn:
                self.conn.rollback()
            return False
    
    def validate_chapters(self, df):
        """验证章节数据"""
        logger.info('开始验证章节数据...')
        
        # 必需字段
        required_columns = ['novel_id', 'chapter_number', 'title', 'content']
        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f'缺少必需字段: {col}')
        
        logger.info('章节数据验证通过')
        return True
    
    def import_chapters(self, file_path, skip_duplicates=True):
        """导入章节数据"""
        logger.info(f'开始导入章节数据: {file_path}')
        
        try:
            # 读取文件
            if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
                df = pd.read_excel(file_path)
            elif file_path.endswith('.csv'):
                df = pd.read_csv(file_path, encoding='utf-8')
            else:
                raise ValueError('不支持的文件格式')
            
            logger.info(f'读取到 {len(df)} 条记录')
            
            # 验证数据
            self.validate_chapters(df)
            
            # 开始导入
            self.conn.start_transaction()
            
            for index, row in tqdm(df.iterrows(), total=len(df), desc='导入进度'):
                try:
                    # 检查是否存在
                    if skip_duplicates:
                        self.cursor.execute(
                            "SELECT id FROM chapters WHERE novel_id = %s AND chapter_number = %s",
                            (row['novel_id'], row['chapter_number'])
                        )
                        if self.cursor.fetchone():
                            logger.info(f'跳过重复章节: 小说{row["novel_id"]} 第{row["chapter_number"]}章')
                            self.stats['skipped'] += 1
                            continue
                    
                    # 计算字数
                    word_count = len(str(row['content']))
                    
                    # 插入数据
                    sql = """
                        INSERT INTO chapters 
                        (novel_id, chapter_number, title, content, word_count, 
                         is_free, price, status, publish_time)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    values = (
                        int(row['novel_id']),
                        int(row['chapter_number']),
                        row['title'],
                        row['content'],
                        word_count,
                        int(row.get('is_free', 1)),
                        float(row.get('price', 0)),
                        int(row.get('status', 1)),
                        row.get('publish_time', datetime.now())
                    )
                    
                    self.cursor.execute(sql, values)
                    self.stats['success'] += 1
                    
                except Exception as e:
                    logger.error(f'导入失败 (行{index}): {e}')
                    self.stats['failed'] += 1
                    self.stats['errors'].append({
                        'row': index,
                        'error': str(e)
                    })
                    
                    if not skip_duplicates:
                        self.conn.rollback()
                        raise
            
            # 提交事务
            self.conn.commit()
            logger.info('章节导入完成')
            self.print_stats()
            
            return True
            
        except Exception as e:
            logger.error(f'导入失败: {e}')
            if self.conn:
                self.conn.rollback()
            return False
    
    def import_categories(self, file_path):
        """导入分类数据"""
        logger.info(f'开始导入分类数据: {file_path}')
        
        try:
            if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
                df = pd.read_excel(file_path)
            elif file_path.endswith('.csv'):
                df = pd.read_csv(file_path, encoding='utf-8')
            else:
                raise ValueError('不支持的文件格式')
            
            self.conn.start_transaction()
            
            for index, row in tqdm(df.iterrows(), total=len(df), desc='导入进度'):
                try:
                    sql = """
                        INSERT INTO categories (name, icon, description, sort_order)
                        VALUES (%s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                        icon = VALUES(icon),
                        description = VALUES(description),
                        sort_order = VALUES(sort_order)
                    """
                    values = (
                        row['name'],
                        row.get('icon', ''),
                        row.get('description', ''),
                        int(row.get('sort_order', 0))
                    )
                    
                    self.cursor.execute(sql, values)
                    self.stats['success'] += 1
                    
                except Exception as e:
                    logger.error(f'导入失败 (行{index}): {e}')
                    self.stats['failed'] += 1
            
            self.conn.commit()
            logger.info('分类导入完成')
            self.print_stats()
            
            return True
            
        except Exception as e:
            logger.error(f'导入失败: {e}')
            if self.conn:
                self.conn.rollback()
            return False
    
    def print_stats(self):
        """打印统计信息"""
        logger.info('=' * 50)
        logger.info('导入统计')
        logger.info('=' * 50)
        logger.info(f'成功: {self.stats["success"]}')
        logger.info(f'失败: {self.stats["failed"]}')
        logger.info(f'跳过: {self.stats["skipped"]}')
        logger.info('=' * 50)
        
        # 保存错误日志
        if self.stats['errors']:
            error_file = f'import_errors_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            with open(error_file, 'w', encoding='utf-8') as f:
                json.dump(self.stats['errors'], f, ensure_ascii=False, indent=2)
            logger.info(f'错误详情已保存到: {error_file}')

# ============================================
# 主函数
# ============================================
def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='数据导入工具')
    parser.add_argument('--type', required=True, choices=['novels', 'chapters', 'categories'],
                        help='导入数据类型')
    parser.add_argument('--file', required=True, help='数据文件路径')
    parser.add_argument('--skip-duplicates', action='store_true', default=True,
                        help='跳过重复数据 (默认: True)')
    
    args = parser.parse_args()
    
    # 创建导入器
    importer = DataImporter()
    
    try:
        # 连接数据库
        if not importer.connect():
            sys.exit(1)
        
        # 执行导入
        if args.type == 'novels':
            success = importer.import_novels(args.file, args.skip_duplicates)
        elif args.type == 'chapters':
            success = importer.import_chapters(args.file, args.skip_duplicates)
        elif args.type == 'categories':
            success = importer.import_categories(args.file)
        else:
            logger.error(f'不支持的导入类型: {args.type}')
            success = False
        
        # 关闭连接
        importer.close()
        
        # 返回结果
        sys.exit(0 if success else 1)
        
    except Exception as e:
        logger.error(f'程序异常: {e}')
        if importer:
            importer.close()
        sys.exit(1)

if __name__ == '__main__':
    main()

