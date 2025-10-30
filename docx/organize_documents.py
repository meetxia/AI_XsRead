#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文档整理脚本
功能：自动创建文件夹并移动文档到对应分类
作者：项目经理
日期：2025-10-30
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

# 基础路径
BASE_DIR = Path(__file__).parent
BACKUP_DIR = BASE_DIR / "backup_before_organize"

# 文件夹结构定义
FOLDER_STRUCTURE = {
    "01-核心文档": [
        "API接口设计文档.md",
        "数据库设计文档.md",
        "项目技术分析报告.md",
        "BUG检查与优化报告.md",
    ],
    "02-快速启动指南": [
        "Windows本地开发快速启动指南.md",
        "后台管理系统完整启动指南.md",
        "后台管理系统快速启动指南.md",
        "环境配置文件创建指南.md",
        "数据导入指南.md",
        "快速导入数据-phpMyAdmin方式.md",
        "前后端联调配置说明.md",
        "TXT小说上传功能使用手册.md",
        "TXT小说导入使用指南.md",
        "UI组件快速参考.md",
        "界面组件使用指南.md",
        "微交互设计组件使用指南.md",
        "微交互设计-快速上手.md",
        "界面优化-快速开始.md",
        "交互体验提升-使用指南.md",
    ],
    "03-修复报告": [
        "P0严重问题修复报告.md",
        "接口对齐检查报告_2025-10-30.md",
        "头像显示修复完成报告.md",
        "头像上传功能修复完成报告.md",
        "头像上传问题-快速修复指南.md",
        "首页小说卡片跳转修复报告.md",
        "阅读页空白修复报告.md",
        "评论功能修复报告.md",
        "评论功能完整修复报告.md",
        "评论图片上传功能修复报告.md",
        "移动端问题修复报告.md",
        "前端404问题修复报告.md",
        "前端API修复完整报告.md",
        "前端登录注册功能修复报告.md",
        "书架页面数据问题修复报告.md",
        "个人中心API修复完成报告.md",
        "桌面端个人中心修复报告.md",
        "推荐页API修复报告.md",
        "推荐页和阅读页修复报告.md",
        "数据显示问题完整修复报告.md",
    ],
    "04-功能开发报告": [
        "P1优化完成总结报告.md",
        "P1优化完成报告-部署文档.md",
        "SVG图标系统替换完成报告.md",
        "TXT上传功能开发总结.md",
        "Vue3页面UI优化报告.md",
        "阅读页面UI优化报告.md",
        "阅读页面优化完成报告.md",
        "阅读页面优化总结.md",
        "阅读页全面优化报告.md",
        "阅读功能完整优化总结.md",
        "评论功能增强完成报告.md",
        "移动端界面紧凑优化报告.md",
        "移动端书架页面优化报告.md",
        "短篇小说阅读页优化报告.md",
        "界面设计优化完成报告.md",
        "界面设计优化完成README.md",
        "界面设计优化-最终汇总.md",
        "注册流程优化完成报告.md",
        "更新日志-微交互设计优化.md",
        "微交互设计优化-完成报告.md",
        "小说卡片优化报告.md",
        "后端服务创建完成报告.md",
        "后台管理系统开发完成报告.md",
        "后台管理API服务开发完成报告.md",
        "我的页面开发完成报告.md",
        "个人主页编辑功能实现说明.md",
        "个人页面移动端紧凑优化报告.md",
        "个人中心和搜索功能优化完成报告.md",
        "交互体验提升-完成报告.md",
        "项目初始化完成报告.md",
    ],
    "05-项目管理文档": [
        "项目报告.md",
        "后台管理系统需求文档.md",
        "后台管理系统项目总结.md",
        "Vue3项目开发准备清单.md",
    ],
    "06-数据库脚本": [
        "admin_tables.sql",
        "database_init.sql",
        "seed_data_complete.sql",
        "test_data.sql",
        "创建管理员账号.sql",
        "更新admin密码-admin123.sql",
        "mm.md",
    ],
}

# 保持在原位置的文件夹和文件
KEEP_IN_PLACE = [
    "工作安排文档",
    "工作汇报文档",
    "本项目研究报告-项目经理",
    "img",
    "07-资源文件",
]


def create_backup():
    """创建备份"""
    print("=" * 60)
    print("📦 步骤 1: 创建备份")
    print("=" * 60)
    
    if BACKUP_DIR.exists():
        print(f"⚠️  备份目录已存在: {BACKUP_DIR}")
        response = input("是否删除旧备份并创建新备份? (y/n): ")
        if response.lower() != 'y':
            print("❌ 取消操作")
            return False
        shutil.rmtree(BACKUP_DIR)
    
    BACKUP_DIR.mkdir(exist_ok=True)
    
    # 备份所有 .md 和 .sql 文件
    backup_count = 0
    for file in BASE_DIR.glob("*.md"):
        shutil.copy2(file, BACKUP_DIR / file.name)
        backup_count += 1
    
    for file in BASE_DIR.glob("*.sql"):
        shutil.copy2(file, BACKUP_DIR / file.name)
        backup_count += 1
    
    print(f"✅ 已备份 {backup_count} 个文件到: {BACKUP_DIR}")
    print()
    return True


def create_folders():
    """创建文件夹结构"""
    print("=" * 60)
    print("📁 步骤 2: 创建文件夹结构")
    print("=" * 60)
    
    created_folders = []
    for folder_name in FOLDER_STRUCTURE.keys():
        folder_path = BASE_DIR / folder_name
        if not folder_path.exists():
            folder_path.mkdir(exist_ok=True)
            created_folders.append(folder_name)
            print(f"✅ 创建文件夹: {folder_name}")
        else:
            print(f"⏭️  文件夹已存在: {folder_name}")
    
    # 创建资源文件夹
    resource_folder = BASE_DIR / "07-资源文件"
    if not resource_folder.exists():
        resource_folder.mkdir(exist_ok=True)
        created_folders.append("07-资源文件")
        print(f"✅ 创建文件夹: 07-资源文件")
    
    print(f"\n📊 总计创建了 {len(created_folders)} 个新文件夹")
    print()
    return created_folders


def move_files():
    """移动文件到对应文件夹"""
    print("=" * 60)
    print("🚚 步骤 3: 移动文件到对应分类")
    print("=" * 60)
    
    moved_files = []
    not_found_files = []
    
    for folder_name, files in FOLDER_STRUCTURE.items():
        print(f"\n📂 处理文件夹: {folder_name}")
        folder_path = BASE_DIR / folder_name
        
        for file_name in files:
            source_file = BASE_DIR / file_name
            target_file = folder_path / file_name
            
            if source_file.exists() and source_file.is_file():
                try:
                    shutil.move(str(source_file), str(target_file))
                    moved_files.append((file_name, folder_name))
                    print(f"  ✅ {file_name}")
                except Exception as e:
                    print(f"  ❌ 移动失败: {file_name} - {e}")
            else:
                not_found_files.append(file_name)
                print(f"  ⚠️  文件不存在: {file_name}")
    
    print(f"\n📊 移动统计:")
    print(f"  ✅ 成功移动: {len(moved_files)} 个文件")
    print(f"  ⚠️  未找到: {len(not_found_files)} 个文件")
    print()
    
    return moved_files, not_found_files


def move_img_folder():
    """移动 img 文件夹到资源文件夹"""
    print("=" * 60)
    print("🖼️  步骤 4: 移动资源文件夹")
    print("=" * 60)
    
    img_source = BASE_DIR / "img"
    img_target = BASE_DIR / "07-资源文件" / "img"
    
    if img_source.exists() and img_source.is_dir():
        if img_target.exists():
            print(f"⚠️  目标文件夹已存在: {img_target}")
        else:
            try:
                shutil.move(str(img_source), str(img_target))
                print(f"✅ 已移动 img 文件夹到 07-资源文件/")
            except Exception as e:
                print(f"❌ 移动失败: {e}")
    else:
        print(f"⏭️  img 文件夹不存在或已移动")
    
    print()


def generate_report(moved_files, not_found_files, created_folders):
    """生成整理报告"""
    print("=" * 60)
    print("📝 步骤 5: 生成整理报告")
    print("=" * 60)
    
    report_content = f"""# 文档整理报告

**整理日期**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**整理人员**: 项目经理 (AI Assistant)  
**整理范围**: docx 目录下所有文档文件

---

## 📊 整理概览

### 统计数据
- ✅ 创建文件夹: {len(created_folders)} 个
- ✅ 成功移动文件: {len(moved_files)} 个
- ⚠️ 未找到文件: {len(not_found_files)} 个

### 备份信息
- 📦 备份位置: `{BACKUP_DIR.name}/`
- 📦 备份文件数: {len(list(BACKUP_DIR.glob('*')))} 个

---

## 📁 新的文件夹结构

```
docx/
├── 01-核心文档/              ({len(FOLDER_STRUCTURE['01-核心文档'])} 个文件)
├── 02-快速启动指南/          ({len(FOLDER_STRUCTURE['02-快速启动指南'])} 个文件)
├── 03-修复报告/              ({len(FOLDER_STRUCTURE['03-修复报告'])} 个文件)
├── 04-功能开发报告/          ({len(FOLDER_STRUCTURE['04-功能开发报告'])} 个文件)
├── 05-项目管理文档/          ({len(FOLDER_STRUCTURE['05-项目管理文档'])} 个文件)
├── 06-数据库脚本/            ({len(FOLDER_STRUCTURE['06-数据库脚本'])} 个文件)
├── 07-资源文件/
│   └── img/                  (截图和图片资源)
├── 工作安排文档/             (保持原位置)
├── 工作汇报文档/             (保持原位置)
├── 本项目研究报告-项目经理/  (保持原位置)
└── backup_before_organize/   (整理前的备份)
```

---

## 📋 详细移动清单

"""
    
    # 按文件夹分组显示移动的文件
    for folder_name in FOLDER_STRUCTURE.keys():
        files_in_folder = [f for f, folder in moved_files if folder == folder_name]
        report_content += f"\n### {folder_name} ({len(files_in_folder)} 个文件)\n\n"
        for file_name in files_in_folder:
            report_content += f"- ✅ {file_name}\n"
    
    # 未找到的文件
    if not_found_files:
        report_content += f"\n---\n\n## ⚠️ 未找到的文件 ({len(not_found_files)} 个)\n\n"
        for file_name in not_found_files:
            report_content += f"- ⚠️ {file_name}\n"
    
    # 保持原位置的文件夹
    report_content += f"\n---\n\n## 📌 保持原位置的文件夹\n\n"
    for item in KEEP_IN_PLACE:
        item_path = BASE_DIR / item
        if item_path.exists():
            report_content += f"- 📁 {item}/\n"
    
    # 写入报告文件
    report_file = BASE_DIR / "文档整理报告.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    print(f"✅ 整理报告已生成: {report_file.name}")
    print()
    
    return report_file


def main():
    """主函数"""
    print("\n" + "=" * 60)
    print("📚 文档整理脚本 - 文字之境项目")
    print("=" * 60)
    print()
    
    # 步骤 1: 创建备份
    if not create_backup():
        return
    
    # 步骤 2: 创建文件夹
    created_folders = create_folders()
    
    # 步骤 3: 移动文件
    moved_files, not_found_files = move_files()
    
    # 步骤 4: 移动 img 文件夹
    move_img_folder()
    
    # 步骤 5: 生成报告
    report_file = generate_report(moved_files, not_found_files, created_folders)
    
    # 完成
    print("=" * 60)
    print("🎉 文档整理完成！")
    print("=" * 60)
    print(f"\n📝 查看详细报告: {report_file.name}")
    print(f"📦 如需恢复，备份文件在: {BACKUP_DIR.name}/")
    print()


if __name__ == "__main__":
    main()

