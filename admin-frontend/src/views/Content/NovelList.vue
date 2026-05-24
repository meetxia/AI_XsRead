<template>
  <div class="novel-list-container">
    <div class="page-header">
      <h2>小说管理</h2>
      <div class="header-actions">
        <el-button @click="batchUploadVisible = true">
          <el-icon><Upload /></el-icon>
          批量上传TXT
        </el-button>
        <el-button type="primary" @click="router.push('/novels/create')">
          <el-icon><Plus /></el-icon>
          创建小说
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="分类">
          <el-select v-model="filters.category" placeholder="全部分类" clearable>
            <el-option label="全部" value="" />
            <el-option
              v-for="cat in categoryOptions"
              :key="cat.id"
              :label="cat.name"
              :value="String(cat.id)"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="连载中" :value="1" />
            <el-option label="已完结" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="请输入小说名称"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 小说列表 -->
    <el-table
      v-loading="loading"
      :data="novelList"
      border
      stripe
      class="novel-table"
    >
      <el-table-column label="封面" width="100" align="center">
        <template #default="{ row }">
          <el-image
            :src="row.cover"
            fit="cover"
            style="width: 60px; height: 80px; border-radius: 4px;"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>

      <el-table-column label="小说信息" min-width="250">
        <template #default="{ row }">
          <div class="novel-info">
            <div class="novel-title">{{ row.title }}</div>
            <div class="novel-meta">
              <el-tag size="small">{{ row.category }}</el-tag>
              <span>{{ row.chapterCount }}章</span>
              <span>{{ row.wordCount }}字</span>
            </div>
            <div class="novel-update">
              <span>最新: {{ row.lastChapterTitle }}</span>
              <span class="time">{{ formatDate(row.lastUpdateTime, 'MM-DD HH:mm') }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="数据统计" width="180" align="center">
        <template #default="{ row }">
          <div class="stats">
            <div class="stat-item">
              <span class="label">浏览:</span>
              <span class="value">{{ formatNumber(row.views) }}</span>
            </div>
            <div class="stat-item">
              <span class="label">收藏:</span>
              <span class="value">{{ formatNumber(row.collections) }}</span>
            </div>
            <div class="stat-item">
              <span class="label">评分:</span>
              <el-rate
                v-model="row.rating"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
              />
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '连载中' : '已完结' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="handleEdit(row.id)">
            编辑
          </el-button>
          <el-button type="success" size="small" link @click="handleChapters(row.id)">
            章节
          </el-button>
          <el-button type="info" size="small" link @click="handleStats(row.id)">
            数据
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
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog
      v-model="batchUploadVisible"
      title="批量上传TXT小说"
      width="680px"
      :close-on-click-modal="!batchUploading"
    >
      <el-upload
        ref="batchUploadRef"
        drag
        multiple
        accept=".txt,text/plain"
        :auto-upload="false"
        :limit="50"
        :file-list="batchFileList"
        :on-change="handleBatchFileChange"
        :on-remove="handleBatchFileRemove"
        :on-exceed="handleBatchFileExceed"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">拖拽 TXT 文件到这里，或点击选择</div>
        <template #tip>
          <div class="upload-tip">最多 50 个文件，单个不超过 10MB；文件名会作为小说标题。</div>
        </template>
      </el-upload>

      <div v-if="batchUploadResult" class="upload-result">
        <el-alert
          :title="`上传完成：成功 ${batchUploadResult.successCount}，已存在 ${batchUploadResult.existsCount}，失败 ${batchUploadResult.failedCount}`"
          type="success"
          show-icon
          :closable="false"
        />
        <el-table
          :data="uploadResultRows"
          size="small"
          border
          max-height="280"
          class="upload-result-table"
        >
          <el-table-column prop="filename" label="文件" min-width="220" show-overflow-tooltip />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="statusText" label="结果" width="90">
            <template #default="{ row }">
              <el-tag :type="row.tagType">{{ row.statusText }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="说明" min-width="180" show-overflow-tooltip />
        </el-table>
      </div>

      <template #footer>
        <el-button :disabled="batchUploading" @click="closeBatchUploadDialog">关闭</el-button>
        <el-button
          type="primary"
          :loading="batchUploading"
          :disabled="batchFileList.length === 0"
          @click="submitBatchUpload"
        >
          开始上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Picture, Upload, UploadFilled } from '@element-plus/icons-vue'
import { getNovelList, deleteNovel, getCategories, batchUploadTxtNovels } from '@/api/novel'
import { formatNumber, formatDate } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const filters = reactive({
  category: '',
  status: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const novelList = ref([])
const batchUploadVisible = ref(false)
const batchUploading = ref(false)
const batchUploadRef = ref(null)
const batchFileList = ref([])
const batchUploadResult = ref(null)

const uploadResultRows = computed(() => {
  const details = batchUploadResult.value?.details || {}
  const success = (details.success || []).map(item => ({
    ...item,
    statusText: '成功',
    tagType: 'success',
    message: item.novelId
      ? `ID ${item.novelId}，${item.wordCount || 0}字，阅读 ${formatNumber(item.views || 0)}，收藏 ${formatNumber(item.collections || 0)}，评分 ${Number(item.rating || 0).toFixed(2)}`
      : ''
  }))
  const exists = (details.exists || []).map(item => ({
    ...item,
    statusText: '已存在',
    tagType: 'warning',
    message: item.novelId ? `已有 ID ${item.novelId}` : '同名小说已存在'
  }))
  const failed = (details.failed || []).map(item => ({
    ...item,
    statusText: '失败',
    tagType: 'danger',
    message: item.reason || '导入失败'
  }))
  return [...success, ...exists, ...failed]
})

const categoryOptions = ref([
  // 默认兜底（与 init_step1.sql 中的 categories 表 + patch_v2 升级到 6 个保持一致）
  { id: 101, name: '都市言情' },
  { id: 102, name: '古风穿越' },
  { id: 103, name: '玄幻修仙' },
  { id: 104, name: '悬疑推理' },
  { id: 105, name: '科幻未来' },
  { id: 106, name: '青春校园' }
])

async function loadCategories() {
  try {
    const res = await getCategories()
    if (Array.isArray(res?.data) && res.data.length > 0) {
      categoryOptions.value = res.data
    }
  } catch (e) {
    // 接口不存在或失败时保留兜底，不打断页面
    console.warn('[NovelList] 加载分类失败，使用兜底列表', e?.message || e)
  }
}

const loadNovelList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      category: filters.category,
      status: filters.status,
      keyword: filters.keyword
    }
    
    const res = await getNovelList(params)
    
    if (res.code === 200) {
      novelList.value = res.data.list.map(novel => ({
        id: novel.id,
        title: novel.title,
        author: novel.author,
        cover: novel.cover,
        category: novel.category || '未分类',
        chapterCount: novel.chapter_count || 0,
        wordCount: novel.word_count || 0,
        status: novel.status,
        views: novel.views || 0,
        collections: novel.collections || 0,
        rating: novel.rating || 0,
        lastChapterTitle: novel.last_chapter_title || '暂无',
        lastUpdateTime: novel.last_update_time
      }))
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('加载小说列表失败:', error)
    ElMessage.error(error.message || '加载小说列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadNovelList()
}

const handleReset = () => {
  filters.category = ''
  filters.status = ''
  filters.keyword = ''
  pagination.page = 1
  loadNovelList()
}

const handleEdit = (id) => {
  router.push(`/novels/edit/${id}`)
}

const handleChapters = (id) => {
  router.push({ path: '/chapters', query: { novelId: id } })
}

const handleStats = (id) => {
  ElMessage.info('小说数据统计功能开发中...')
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这部小说吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteNovel(id)
    ElMessage.success('删除成功')
    loadNovelList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleBatchFileChange = (file, files) => {
  const invalid = files.find(item => {
    const raw = item.raw
    return raw && !/\.txt$/i.test(raw.name)
  })
  if (invalid) {
    ElMessage.error('只能上传 TXT 文件')
    batchFileList.value = files.filter(item => item.uid !== invalid.uid)
    return
  }
  batchFileList.value = files
  batchUploadResult.value = null
}

const handleBatchFileRemove = (file, files) => {
  batchFileList.value = files
}

const handleBatchFileExceed = () => {
  ElMessage.warning('一次最多上传 50 个 TXT 文件')
}

const submitBatchUpload = async () => {
  const files = batchFileList.value.map(item => item.raw).filter(Boolean)
  if (files.length === 0) {
    ElMessage.warning('请选择要上传的TXT文件')
    return
  }

  batchUploading.value = true
  try {
    const res = await batchUploadTxtNovels(files)
    batchUploadResult.value = res.data
    const { successCount = 0, existsCount = 0, failedCount = 0 } = res.data || {}
    ElMessage.success(`上传完成：成功 ${successCount}，已存在 ${existsCount}，失败 ${failedCount}`)
    if (successCount > 0) {
      pagination.page = 1
      await loadNovelList()
    }
  } catch (error) {
    console.error('批量上传TXT失败:', error)
  } finally {
    batchUploading.value = false
  }
}

const closeBatchUploadDialog = () => {
  batchUploadVisible.value = false
  batchFileList.value = []
  batchUploadResult.value = null
  batchUploadRef.value?.clearFiles()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadNovelList()
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadNovelList()
}

onMounted(() => {
  loadCategories()
  loadNovelList()
})
</script>

<style scoped lang="scss">
.novel-list-container {
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
      align-items: center;
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

.novel-table {
  .novel-info {
    .novel-title {
      font-size: 15px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      
      .dark & {
        color: #f9fafb;
      }
    }
    
    .novel-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      color: #909399;
      margin-bottom: 5px;
    }
    
    .novel-update {
      font-size: 12px;
      color: #909399;
      
      .time {
        margin-left: 10px;
      }
    }
  }
  
  .stats {
    .stat-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 13px;
      
      .label {
        color: #909399;
      }
      
      .value {
        font-weight: 600;
        color: #333;
        
        .dark & {
          color: #f9fafb;
        }
      }
    }
  }
  
  .image-error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #c0c4cc;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.upload-icon {
  font-size: 42px;
  color: #909399;
  margin-bottom: 12px;
}

.upload-text {
  color: #606266;
  font-size: 14px;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.upload-result {
  margin-top: 16px;
}

.upload-result-table {
  margin-top: 12px;
}
</style>

