<template>
  <div class="chapter-list-container">
    <div class="page-header">
      <h2>章节管理</h2>
      <div class="header-actions">
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建章节
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="所属小说">
          <el-select v-model="filters.novelId" placeholder="选择小说" clearable filterable>
            <el-option
              v-for="novel in novelOptions"
              :key="novel.id"
              :label="novel.title"
              :value="novel.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="已发布" :value="1" />
            <el-option label="草稿" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 章节列表 -->
    <el-table
      v-loading="loading"
      :data="chapterList"
      border
      stripe
      class="chapter-table"
    >
      <el-table-column label="章节号" prop="chapterNumber" width="80" align="center" />

      <el-table-column label="章节标题" min-width="250">
        <template #default="{ row }">
          <div class="chapter-title">{{ row.title }}</div>
        </template>
      </el-table-column>

      <el-table-column label="所属小说" width="200">
        <template #default="{ row }">
          <el-tag type="info" size="small">{{ row.novelTitle }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="字数" prop="wordCount" width="100" align="center">
        <template #default="{ row }">
          {{ formatNumber(row.wordCount) }}
        </template>
      </el-table-column>

      <el-table-column label="浏览量" prop="views" width="100" align="center">
        <template #default="{ row }">
          {{ formatNumber(row.views) }}
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="发布时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatDate(row.publishTime) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="handleEdit(row.id)">
            编辑
          </el-button>
          <el-button type="danger" size="small" link @click="handleDelete(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import { getChapterList, deleteChapter } from '@/api/chapter'
import { formatNumber, formatDate } from '@/utils/format'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const filters = reactive({
  novelId: route.query.novelId || '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const novelOptions = ref([])

const chapterList = ref([])

// 加载小说列表（用于筛选下拉框）
const loadNovelOptions = async () => {
  try {
    const { getNovelList } = await import('@/api/novel')
    const res = await getNovelList({ page: 1, pageSize: 100 })
    if (res.code === 200) {
      novelOptions.value = res.data.list.map(novel => ({
        id: novel.id,
        title: novel.title
      }))
    }
  } catch (error) {
    console.error('加载小说列表失败:', error)
  }
}

const loadChapterList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      novelId: filters.novelId,
      status: filters.status
    }
    
    const res = await getChapterList(params)
    
    if (res.code === 200) {
      chapterList.value = res.data.list.map(chapter => ({
        id: chapter.id,
        novelId: chapter.novel_id,
        novelTitle: chapter.novel_title || '未知小说',
        chapterNumber: chapter.chapter_number,
        title: chapter.title,
        wordCount: chapter.word_count || 0,
        views: chapter.views || 0,
        status: chapter.status,
        publishTime: chapter.publish_time
      }))
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('加载章节列表失败:', error)
    ElMessage.error('加载章节列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadChapterList()
}

const handleReset = () => {
  filters.novelId = ''
  filters.status = ''
  pagination.page = 1
  loadChapterList()
}

const handleCreate = () => {
  router.push('/chapters/create')
}

const handleEdit = (id) => {
  router.push(`/chapters/edit/${id}`)
}

const handleImport = () => {
  ElMessage.info('批量导入功能开发中...')
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个章节吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteChapter(id)
    ElMessage.success('删除成功')
    loadChapterList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadChapterList()
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadChapterList()
}

onMounted(() => {
  loadNovelOptions()
  loadChapterList()
})
</script>

<style scoped lang="scss">
.chapter-list-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .filter-bar {
    margin-bottom: 20px;
    padding: 20px;
    background: #fff;
    border-radius: 8px;

    .dark & {
      background: #1F2937;
    }
  }
}

.chapter-title {
  font-size: 14px;
  color: #333;

  .dark & {
    color: #f9fafb;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

