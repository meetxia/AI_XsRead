<template>
  <div class="code-list-container">
    <div class="page-header">
      <h2>激活码批次</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">生成新批次</el-button>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="类型">
          <el-select v-model="filters.code_type" placeholder="全部类型" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="月卡" value="monthly" />
            <el-option label="年卡" value="yearly" />
            <el-option label="永久" value="permanent" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="批次号 / 名称"
            clearable
            style="width: 220px"
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

    <!-- 批次列表 -->
    <el-table
      v-loading="loading"
      :data="batchList"
      border
      stripe
      class="batch-table"
    >
      <el-table-column label="批次号" prop="batch_no" min-width="160">
        <template #default="{ row }">
          <span class="batch-no">{{ row.batch_no }}</span>
        </template>
      </el-table-column>
      <el-table-column label="名称" prop="name" min-width="160">
        <template #default="{ row }">
          {{ row.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="codeTypeTagType(row.code_type)">{{ codeTypeLabel(row.code_type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="数量统计" width="280" align="center">
        <template #default="{ row }">
          <div class="counts">
            <span>共 {{ row.total_count }}</span>
            <el-divider direction="vertical" />
            <span class="text-muted">未用 {{ remaining(row) }}</span>
            <el-divider direction="vertical" />
            <span class="text-success">已用 {{ row.used_count }}</span>
            <el-divider direction="vertical" />
            <span class="text-danger">作废 {{ row.void_count }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="使用率" width="160" align="center">
        <template #default="{ row }">
          <el-progress
            :percentage="usageRate(row)"
            :stroke-width="10"
            :status="usageRate(row) >= 80 ? 'success' : ''"
          />
        </template>
      </el-table-column>
      <el-table-column label="生成人 / 时间" width="200">
        <template #default="{ row }">
          <div class="meta">
            <div>{{ row.created_by_name || '-' }}</div>
            <div class="text-muted">{{ formatDate(row.created_at, 'YYYY-MM-DD HH:mm') }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="goDetail(row.id)">详情</el-button>
          <el-button type="success" size="small" link @click="downloadTxt(row, 'unused')">
            下载 TXT
          </el-button>
          <el-button type="info" size="small" link @click="downloadCsv(row)">下载 CSV</el-button>
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

    <!-- 创建批次对话框 -->
    <el-dialog
      v-model="createDialog.visible"
      title="生成新批次"
      width="520px"
      :close-on-click-modal="false"
      @closed="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="会员类型" prop="code_type">
          <el-radio-group v-model="createForm.code_type">
            <el-radio-button value="monthly">月卡（30 天）</el-radio-button>
            <el-radio-button value="yearly">年卡（365 天）</el-radio-button>
            <el-radio-button value="permanent">永久</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生成数量" prop="count">
          <el-input-number
            v-model="createForm.count"
            :min="1"
            :max="1000"
            :step="10"
            controls-position="right"
            style="width: 200px"
          />
          <span class="form-tip">单次最多 1000 张</span>
        </el-form-item>
        <el-form-item label="批次名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="可选，例如：小红书618活动 / 客户答谢码"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="createDialog.loading" @click="submitCreate">
          立即生成
        </el-button>
      </template>
    </el-dialog>

    <!-- 生成结果对话框（明文码一次性展示） -->
    <el-dialog
      v-model="resultDialog.visible"
      :title="`批次 ${resultDialog.batch?.batch_no || ''} 生成成功`"
      width="640px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="出于安全考虑，明文激活码只在本次创建后展示一次。请立即下载或复制保存，关闭后只能下载。"
      />
      <div class="result-summary">
        <el-tag>{{ codeTypeLabel(resultDialog.batch?.code_type) }}</el-tag>
        <span>共生成 <b>{{ resultDialog.codes.length }}</b> 张</span>
        <span class="text-muted">{{ resultDialog.batch?.batch_no }}</span>
      </div>
      <el-input
        type="textarea"
        :rows="12"
        :model-value="resultDialog.codes.join('\n')"
        readonly
        class="result-codes"
      />
      <template #footer>
        <el-button @click="copyCodes">一键复制全部</el-button>
        <el-button type="primary" @click="downloadResultTxt">下载 TXT 文件</el-button>
        <el-button type="info" @click="closeResultDialog">我已保存好</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import {
  getCodeBatches,
  createCodeBatch,
  downloadBatchTxt,
  downloadBatchCsv
} from '@/api/code'
import { formatDate } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const batchList = ref([])

const filters = reactive({
  code_type: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const createFormRef = ref(null)
const createDialog = reactive({
  visible: false,
  loading: false
})
const createForm = reactive({
  code_type: 'monthly',
  count: 100,
  name: ''
})
const createRules = {
  code_type: [{ required: true, message: '请选择会员类型', trigger: 'change' }],
  count: [{ required: true, message: '请输入生成数量', trigger: 'blur' }]
}

const resultDialog = reactive({
  visible: false,
  batch: null,
  codes: []
})

const codeTypeLabel = (t) => ({ monthly: '月卡', yearly: '年卡', permanent: '永久' }[t] || t || '-')
const codeTypeTagType = (t) => ({ monthly: 'info', yearly: 'success', permanent: 'warning' }[t] || '')

const remaining = (row) => Math.max(0, (row.total_count || 0) - (row.used_count || 0) - (row.void_count || 0))
const usageRate = (row) => {
  const total = Number(row.total_count || 0)
  if (total === 0) return 0
  return Math.round(((Number(row.used_count || 0)) / total) * 100)
}

const loadBatches = async () => {
  loading.value = true
  try {
    const res = await getCodeBatches({
      page: pagination.page,
      pageSize: pagination.pageSize,
      code_type: filters.code_type || undefined,
      keyword: filters.keyword || undefined
    })
    if (res.code === 200) {
      batchList.value = res.data?.list || []
      pagination.total = res.data?.total || 0
    }
  } catch (error) {
    console.error('加载批次列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadBatches()
}
const handleReset = () => {
  filters.code_type = ''
  filters.keyword = ''
  pagination.page = 1
  loadBatches()
}
const handlePageChange = (p) => {
  pagination.page = p
  loadBatches()
}
const handlePageSizeChange = (s) => {
  pagination.pageSize = s
  pagination.page = 1
  loadBatches()
}

const goDetail = (id) => router.push(`/codes/${id}`)

const openCreateDialog = () => {
  createDialog.visible = true
}
const resetCreateForm = () => {
  createForm.code_type = 'monthly'
  createForm.count = 100
  createForm.name = ''
}

const submitCreate = async () => {
  if (!createFormRef.value) return
  try {
    await createFormRef.value.validate()
  } catch (_) {
    return
  }
  if (createForm.count > 500) {
    try {
      await ElMessageBox.confirm(
        `本次将一次性生成 ${createForm.count} 张激活码，确认继续？`,
        '请确认',
        { type: 'warning' }
      )
    } catch (_) {
      return
    }
  }
  createDialog.loading = true
  try {
    const res = await createCodeBatch({
      code_type: createForm.code_type,
      count: Number(createForm.count),
      name: createForm.name?.trim() || undefined
    })
    if (res.code === 200) {
      ElMessage.success('生成成功')
      resultDialog.batch = res.data?.batch || null
      resultDialog.codes = res.data?.codes || []
      resultDialog.visible = true
      createDialog.visible = false
      loadBatches()
    }
  } catch (error) {
    console.error('生成批次失败:', error)
  } finally {
    createDialog.loading = false
  }
}

const closeResultDialog = async () => {
  try {
    await ElMessageBox.confirm(
      '关闭后将无法再看到完整的明文码，仅能通过 TXT 下载（仍是完整明文）。确定关闭吗？',
      '请确认',
      { type: 'warning', confirmButtonText: '关闭', cancelButtonText: '继续保存' }
    )
    resultDialog.visible = false
    resultDialog.batch = null
    resultDialog.codes = []
  } catch (_) {
    // 取消，继续保存
  }
}

const copyCodes = async () => {
  const text = resultDialog.codes.join('\n')
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`已复制 ${resultDialog.codes.length} 个激活码到剪贴板`)
  } catch (e) {
    // 兜底：旧浏览器或非 https 环境
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      ElMessage.success('已复制到剪贴板')
    } catch (_) {
      ElMessage.error('复制失败，请手动选择文本复制')
    } finally {
      document.body.removeChild(ta)
    }
  }
}

const downloadResultTxt = async () => {
  const id = resultDialog.batch?.id
  if (!id) return
  try {
    await downloadBatchTxt(id, { status: 'unused', format: 'dashed' })
    ElMessage.success('下载已开始')
  } catch (error) {
    ElMessage.error(error?.message || '下载失败')
  }
}

const downloadTxt = async (row, status) => {
  try {
    await downloadBatchTxt(row.id, { status, format: 'dashed' })
    ElMessage.success('下载已开始')
  } catch (error) {
    ElMessage.error(error?.message || '下载失败')
  }
}

const downloadCsv = async (row) => {
  try {
    await downloadBatchCsv(row.id)
    ElMessage.success('下载已开始')
  } catch (error) {
    ElMessage.error(error?.message || '下载失败')
  }
}

onMounted(() => {
  loadBatches()
})
</script>

<style scoped lang="scss">
.code-list-container {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
      margin: 0;
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

.batch-no {
  font-family: 'Menlo', 'Consolas', monospace;
  font-weight: 600;
}

.counts {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.text-muted { color: #909399; }
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }

.meta {
  font-size: 13px;
  line-height: 1.6;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.result-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0 8px;
  font-size: 14px;
}

.result-codes {
  :deep(textarea) {
    font-family: 'Menlo', 'Consolas', monospace;
    font-size: 13px;
    letter-spacing: 0.5px;
  }
}
</style>
