# 数据导入工具使用说明

## 功能介绍

数据导入工具支持批量导入小说、章节、分类等数据到数据库。

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 1. 导入小说数据

```bash
python data_import.py --type novels --file novels.xlsx
```

**Excel文件格式要求:**

| title | author | category_id | cover | description | status | is_recommended | is_hot | published_at |
|-------|--------|-------------|-------|-------------|--------|----------------|--------|--------------|
| 小说标题 | 作者名 | 分类ID | 封面URL | 简介 | 0/1 | 0/1 | 0/1 | 2025-01-01 |

**必填字段:** title, author, category_id

### 2. 导入章节数据

```bash
python data_import.py --type chapters --file chapters.xlsx
```

**Excel文件格式要求:**

| novel_id | chapter_number | title | content | is_free | price | status | publish_time |
|----------|----------------|-------|---------|---------|-------|--------|--------------|
| 小说ID | 章节号 | 章节标题 | 章节内容 | 0/1 | 0.00 | 0/1 | 2025-01-01 |

**必填字段:** novel_id, chapter_number, title, content

### 3. 导入分类数据

```bash
python data_import.py --type categories --file categories.xlsx
```

**Excel文件格式要求:**

| name | icon | description | sort_order |
|------|------|-------------|------------|
| 分类名 | 图标 | 描述 | 排序 |

**必填字段:** name

## 参数说明

- `--type`: 导入数据类型 (novels/chapters/categories)
- `--file`: 数据文件路径 (支持 .xlsx, .xls, .csv)
- `--skip-duplicates`: 跳过重复数据 (默认: True)

## 示例

```bash
# 导入小说数据
python data_import.py --type novels --file data/novels.xlsx

# 导入章节数据
python data_import.py --type chapters --file data/chapters.csv

# 导入分类数据
python data_import.py --type categories --file data/categories.xlsx
```

## 注意事项

1. 确保数据库连接配置正确
2. Excel文件必须包含必填字段
3. 导入前会自动验证数据格式
4. 支持事务回滚,失败时不会影响现有数据
5. 导入过程中的错误会记录到日志文件

## 日志文件

- `data_import.log`: 导入日志
- `import_errors_*.json`: 错误详情 (如果有错误)

## 数据库配置

修改 `data_import.py` 中的 `DB_CONFIG`:

```python
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'your_password',
    'database': 'ai_xsread',
    'charset': 'utf8mb4'
}
```

