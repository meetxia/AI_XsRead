#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
小说内容清理脚本
功能: 清理章节内容中"全文完"后的无关数据(如金句集锦、创作说明等)
作者: AI Assistant
日期: 2025-10-31
"""

import mysql.connector
import re
import os
from datetime import datetime
from typing import List, Tuple

# =============== 配置区域 ===============

# 数据库配置 (从环境变量读取,如果没有则使用默认值)
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'user': os.getenv('DB_USER', 'toefl_user'),
    'password': os.getenv('DB_PASSWORD', 'mojz168168-'),
    'database': os.getenv('DB_DATABASE', 'ai_xsread'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

# 需要检测的结束标志列表 (优先级从高到低)
END_MARKERS = [
    '全文完',
    '全书完',
    '正文完',
    '（全文完）',
    '(全文完)',
    '【全文完】',
    '[全文完]',
    '——全文完——',
    '---全文完---',
    '全剧终',
    '大结局',
    '完结',
]

# 需要删除的内容标记 (这些内容即使在"全文完"之前也要删除)
UNWANTED_MARKERS = [
    r'【金句集锦】',
    r'【创作说明[：:】]',
    r'【作者说明[：:】]',
    r'【推荐场景[：:】]',
    r'【适合人群[：:】]',
    r'【预期效果[：:】]',
    r'【爆款类型[：:】]',
    r'【结局类型[：:】]',
    r'【全文完】',
    r'创作说明[：:]',
    r'作者的话[：:]',
    r'作者有话说[：:]',
]

# =============== 工具函数 ===============

def connect_db():
    """连接数据库"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print(f"✅ 成功连接到数据库: {DB_CONFIG['database']}")
        return conn
    except mysql.connector.Error as err:
        print(f"❌ 数据库连接失败: {err}")
        return None


def find_end_position(content: str) -> Tuple[int, str]:
    """
    查找"全文完"等结束标志的位置
    返回: (位置, 匹配到的标志文本), 如果没找到返回 (-1, None)
    """
    min_pos = len(content)
    found_marker = None
    
    for marker in END_MARKERS:
        pos = content.find(marker)
        if pos != -1 and pos < min_pos:
            min_pos = pos
            found_marker = marker
    
    if found_marker:
        # 返回标志文本之后的位置
        return min_pos + len(found_marker), found_marker
    
    return -1, None


def clean_content(content: str) -> Tuple[str, bool, str]:
    """
    清理章节内容
    返回: (清理后的内容, 是否修改, 清理说明)
    """
    if not content or len(content.strip()) == 0:
        return content, False, "内容为空"
    
    original_content = content
    cleaned_content = content
    clean_info = []
    
    # 1. 查找"全文完"位置
    end_pos, end_marker = find_end_position(cleaned_content)
    
    if end_pos != -1:
        # 截取到"全文完"之后
        after_end = cleaned_content[end_pos:]
        cleaned_content = cleaned_content[:end_pos].rstrip()
        
        # 统计删除的内容
        removed_length = len(after_end.strip())
        if removed_length > 0:
            clean_info.append(f"删除'{end_marker}'后的内容({removed_length}字)")
    
    # 2. 删除不需要的标记内容
    for marker_pattern in UNWANTED_MARKERS:
        # 查找标记
        pattern = re.compile(marker_pattern, re.IGNORECASE)
        match = pattern.search(cleaned_content)
        
        if match:
            # 找到标记的位置
            marker_pos = match.start()
            
            # 从标记位置开始,删除到段落结束或下一个标记
            before_marker = cleaned_content[:marker_pos]
            
            # 尝试找到这个标记的内容结束位置
            # 通常是到下一个【】标记,或者到文本末尾
            remaining = cleaned_content[marker_pos:]
            
            # 查找下一个可能的标记或段落结束
            next_section = re.search(r'\n\n|\n(?=第.*?章)', remaining)
            if next_section:
                # 如果找到下一个段落,则删除到下一个段落之前
                cleaned_content = before_marker + remaining[next_section.start():]
            else:
                # 否则删除到文本末尾
                cleaned_content = before_marker
            
            clean_info.append(f"删除标记: {marker_pattern}")
    
    # 3. 清理多余的空行
    cleaned_content = re.sub(r'\n{3,}', '\n\n', cleaned_content)
    cleaned_content = cleaned_content.strip()
    
    # 判断是否有修改
    is_modified = cleaned_content != original_content
    
    if is_modified:
        original_len = len(original_content)
        cleaned_len = len(cleaned_content)
        removed_chars = original_len - cleaned_len
        clean_info.append(f"原长度: {original_len}字, 清理后: {cleaned_len}字, 删除: {removed_chars}字")
    
    return cleaned_content, is_modified, " | ".join(clean_info) if clean_info else "无需清理"


def get_chapters_to_clean(conn, limit: int = None) -> List[Tuple]:
    """
    获取需要清理的章节列表
    返回: [(chapter_id, novel_id, chapter_number, title, content_preview), ...]
    """
    cursor = conn.cursor()
    
    # 查询所有章节
    query = """
        SELECT c.id, c.novel_id, c.chapter_number, c.title, c.content, n.title as novel_title
        FROM chapters c
        LEFT JOIN novels n ON c.novel_id = n.id
        WHERE c.content IS NOT NULL AND c.content != ''
        ORDER BY c.novel_id, c.chapter_number
    """
    
    if limit:
        query += f" LIMIT {limit}"
    
    cursor.execute(query)
    chapters = cursor.fetchall()
    cursor.close()
    
    print(f"📚 共查询到 {len(chapters)} 个章节")
    
    # 筛选出需要清理的章节
    chapters_to_clean = []
    
    for chapter in chapters:
        chapter_id, novel_id, chapter_number, title, content, novel_title = chapter
        
        # 检查是否包含结束标志或不需要的标记
        has_end_marker = any(marker in content for marker in END_MARKERS)
        has_unwanted = any(re.search(pattern, content, re.IGNORECASE) for pattern in UNWANTED_MARKERS)
        
        if has_end_marker or has_unwanted:
            content_preview = content[:100] + "..." if len(content) > 100 else content
            chapters_to_clean.append((chapter_id, novel_id, chapter_number, title, content, novel_title, content_preview))
    
    print(f"🔍 发现 {len(chapters_to_clean)} 个需要清理的章节")
    
    return chapters_to_clean


def clean_chapters(conn, dry_run: bool = True):
    """
    清理章节内容
    dry_run: True=仅模拟不实际修改, False=实际修改数据库
    """
    print("\n" + "="*80)
    print(f"{'🔍 预览模式 (不会修改数据库)' if dry_run else '✍️  执行模式 (将修改数据库)'}")
    print("="*80 + "\n")
    
    # 获取需要清理的章节
    chapters_to_clean = get_chapters_to_clean(conn)
    
    if not chapters_to_clean:
        print("✨ 没有发现需要清理的章节!")
        return
    
    # 统计信息
    stats = {
        'total': len(chapters_to_clean),
        'modified': 0,
        'skipped': 0,
        'total_removed_chars': 0,
    }
    
    cursor = conn.cursor()
    
    # 逐个处理章节
    for idx, (chapter_id, novel_id, chapter_number, title, content, novel_title, content_preview) in enumerate(chapters_to_clean, 1):
        print(f"\n[{idx}/{stats['total']}] 处理章节: 《{novel_title}》 - 第{chapter_number}章 {title}")
        print(f"    章节ID: {chapter_id}")
        
        # 清理内容
        cleaned_content, is_modified, clean_info = clean_content(content)
        
        if is_modified:
            stats['modified'] += 1
            stats['total_removed_chars'] += len(content) - len(cleaned_content)
            
            print(f"    📝 {clean_info}")
            
            # 显示清理前后对比
            if len(content) > 200:
                print(f"    原始内容末尾: ...{content[-200:]}")
            else:
                print(f"    原始内容: {content}")
            
            print(f"    清理后内容末尾: ...{cleaned_content[-200:] if len(cleaned_content) > 200 else cleaned_content}")
            
            # 如果不是dry_run模式,则更新数据库
            if not dry_run:
                try:
                    update_query = """
                        UPDATE chapters
                        SET content = %s,
                            word_count = %s,
                            updated_at = %s
                        WHERE id = %s
                    """
                    new_word_count = len(cleaned_content)
                    update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    
                    cursor.execute(update_query, (cleaned_content, new_word_count, update_time, chapter_id))
                    print(f"    ✅ 已更新到数据库")
                except mysql.connector.Error as err:
                    print(f"    ❌ 更新失败: {err}")
                    stats['skipped'] += 1
                    continue
        else:
            stats['skipped'] += 1
            print(f"    ⏭️  {clean_info}")
    
    cursor.close()
    
    # 如果不是dry_run模式,提交更改
    if not dry_run:
        try:
            conn.commit()
            print(f"\n✅ 已提交所有更改到数据库")
        except mysql.connector.Error as err:
            print(f"\n❌ 提交失败: {err}")
            conn.rollback()
            print(f"⚠️  已回滚所有更改")
    
    # 打印统计信息
    print("\n" + "="*80)
    print("📊 清理统计")
    print("="*80)
    print(f"总章节数: {stats['total']}")
    print(f"已修改: {stats['modified']}")
    print(f"跳过: {stats['skipped']}")
    print(f"删除总字符数: {stats['total_removed_chars']}")
    print("="*80 + "\n")


def show_sample_chapters(conn, limit: int = 5):
    """显示示例章节内容"""
    print("\n" + "="*80)
    print(f"📖 显示 {limit} 个包含需清理内容的章节示例")
    print("="*80 + "\n")
    
    chapters_to_clean = get_chapters_to_clean(conn, limit=limit)
    
    if not chapters_to_clean:
        print("✨ 没有发现需要清理的章节!")
        return
    
    for idx, (chapter_id, novel_id, chapter_number, title, content, novel_title, content_preview) in enumerate(chapters_to_clean, 1):
        print(f"\n{'='*80}")
        print(f"示例 {idx}: 《{novel_title}》 - 第{chapter_number}章 {title}")
        print(f"章节ID: {chapter_id}, 内容长度: {len(content)}字")
        print(f"{'='*80}")
        
        # 查找结束标志
        end_pos, end_marker = find_end_position(content)
        
        if end_pos != -1:
            # 显示"全文完"附近的内容
            start = max(0, end_pos - 200)
            end = min(len(content), end_pos + 500)
            
            print(f"\n发现结束标志: '{end_marker}' (位置: {end_pos})")
            print(f"\n{'~'*80}")
            print("附近内容:")
            print(f"{'~'*80}")
            print(content[start:end])
            print(f"{'~'*80}")
            
            after_end = content[end_pos:].strip()
            if after_end:
                print(f"\n⚠️  '{end_marker}'后还有 {len(after_end)} 字符的内容:")
                print(f"{'~'*80}")
                print(after_end[:500] + ("..." if len(after_end) > 500 else ""))
                print(f"{'~'*80}")
        else:
            # 显示包含不需要标记的内容
            for pattern in UNWANTED_MARKERS:
                match = re.search(pattern, content, re.IGNORECASE)
                if match:
                    start = max(0, match.start() - 100)
                    end = min(len(content), match.start() + 400)
                    
                    print(f"\n发现标记: {pattern} (位置: {match.start()})")
                    print(f"\n{'~'*80}")
                    print("附近内容:")
                    print(f"{'~'*80}")
                    print(content[start:end])
                    print(f"{'~'*80}")
                    break


# =============== 主程序 ===============

def main():
    """主函数"""
    import sys
    
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║          小说内容清理脚本 v1.0                              ║
    ║  功能: 清理"全文完"后的无关内容                             ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    # 连接数据库
    conn = connect_db()
    if not conn:
        print("❌ 无法连接到数据库,程序退出")
        sys.exit(1)
    
    try:
        # 显示菜单
        while True:
            print("\n请选择操作:")
            print("1. 🔍 预览需要清理的章节 (前5个)")
            print("2. 🔍 预览模式 - 检查所有章节但不修改数据库")
            print("3. ✍️  执行模式 - 实际清理并更新数据库")
            print("4. 🚪 退出")
            
            choice = input("\n请输入选项 (1-4): ").strip()
            
            if choice == '1':
                show_sample_chapters(conn, limit=5)
            
            elif choice == '2':
                print("\n⚠️  即将进行预览扫描...")
                confirm = input("继续? (y/n): ").strip().lower()
                if confirm == 'y':
                    clean_chapters(conn, dry_run=True)
            
            elif choice == '3':
                print("\n⚠️  警告: 即将修改数据库!")
                print("⚠️  建议先进行数据库备份!")
                confirm = input("确认要执行清理操作? (yes/no): ").strip().lower()
                if confirm == 'yes':
                    clean_chapters(conn, dry_run=False)
                else:
                    print("❌ 已取消操作")
            
            elif choice == '4':
                print("\n👋 感谢使用,再见!")
                break
            
            else:
                print("❌ 无效选项,请重新选择")
    
    except KeyboardInterrupt:
        print("\n\n⚠️  用户中断程序")
    
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # 关闭数据库连接
        if conn:
            conn.close()
            print("\n✅ 已关闭数据库连接")


if __name__ == "__main__":
    main()

