<template>
  <div class="code-detail-container">
    <div class="page-header">
      <div class="left">
        <el-button :icon="ArrowLeft" link @click="goBack">返回列表</el-button>
        <h2>批次详情</h2>
      </div>
      <div class="right">
        <el-button type="success" :icon="Download" @click="downloadTxt('unused')">下载未用 TXT</el-button>
        <el-button :icon="Download" @click="downloadTxt('all')">下载全部 TXT</el-button>
        <el-button type="info" :icon="Download" @click="downloadCsv">下载 CSV</el-button>
      </div>
    </div>

    <!-- 批次信息卡 -->
    <el-card v-loading="batchLoading" class="batch-card" shadow="never">
      <template v-if="batch">
        <div class="batch-meta">
          <div class="batch-meta-item">
            <span class="label">批次号</span>
            <span class="value batch-no">{{ batch.batch_no }}</span>
          </div>
          <div class="batch-meta-item">
            <span class="label">名称</span>
            <span class="value">{{ batch.name || '-' }}</span>
          </div>
          <div class="batch-meta-item">
            <span class="label">类型</span>
            <el-tag :type="codeTypeTagType(batch.code_type)">{{ codeTypeLabel(batch.code_type) }}</el-tag>
          </div>
          <div class="batch-meta-item">
            <span class="label">生成人</span>
            <span class="value">{{ batch.created_by_name || '-' }}</span>
          </div>
          <div class="batch-meta-item">
            <span class="label">生成时间</span>
            <span class="value">{{ formatDate(batch.created_at, 'YYYY-MM-DD HH:mm') }}</span>
          </div>
        </div>

        <el-divider />

        <div class="batch-counts">
          <div class="count-item">
            <div class="count-value">{{ batch.total_count }}</div>
            <div class="count-label">总数</div>
          </div>
          <div class="count-item">
            <div class="count-value text-muted">{{ remaining }}</div>
            <div class="count-label">未使用</div>
          </div>
          <div class="count-item">
            <div class="count-value text-success">{{ batch.used_count }}</div>
            <div class="count-label">已使用</div>
          </div>
          <div class="count-item">
            <div class="count-value text-danger">{{ batch.void_count }}</div>
            <div class="count-label">已作废</div>
          </div>
          <div class="count-item count-progress">
            <el-progress
              type="dashboard"
              :percentage="usageRate"
              :width="80"
              :stroke-width="8"
            />
            <div class="count-label">使用率</div>
          </div>
        </div>
      </template>
    </el-card>

    <!-- 码列表 -->
    <div class="codes-section">
      <div class="codes-toolbar">
        <el-form :inline="true" :model="filters">
          <el-form-item label="状态">
            <el-select v-model="filters.status" style="width: 140px" @change="handleStatusChange">
              <el-option label="全部" value="" />
              <el-option label="未使用" value="unused" />
              <el-option label="已使用" value="used" />
              <el-option label="已作废" value="void" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-button
          type="danger"
          :disabled="selectedRows.length === 0"
          :icon="Delete"
          @click="handleVoid"
        >
          批量作废 ({{ selectedRows.length }})
        </el-button>
      </div>

      <el-table
        v-loading="codesLoading"
        :data="codeList"
        border
        stripe
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="50" :selectable="(row) => row.status === 'unused'" />
        <el-table-column label="码（脱敏）" min-width="160">
          <template #default="{ row }">
            <span class="code-preview">{{ formatPreview(row.code_preview) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="codeTypeTagType(row.code_type)" size="small">
              {{ codeTypeLabel(row.code_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用人" min-width="140">
          <template #default="{ row }">
            <span v-if="row.used_by_username">{{ row.used_by_username }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="使用时间" width="170">
          <template #default="{ row }">
            <span v-if="row.used_at">{{ formatDate(row.used_at, 'YYYY-MM-DD HH:mm') }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="作废时间" width="170">
          <template #default="{ row }">
            <span v-if="row.void_at">{{ formatDate(row.void_at, 'YYYY-MM-DD HH:mm') }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="生成时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.created_at, 'YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
      </el-table>

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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Download, Delete } from '@element-plus/icons-vue'
import {
  getCodeBatchDetail,
  voidCodes,
  downloadBatchTxt,
  downloadBatchCsv
} from '@/api/code'
import { formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const batchId = computed(() => Number(route.params.id))

const batch = ref(null)
const codeList = ref([])
const selectedRows = ref([])
const batchLoading = ref(false)
const codesLoading = ref(false)

const filters = reactive({
  status: 'unused'
})

const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

const codeTypeLabel = (t) => ({ monthly: '月卡', yearly: '年卡', permanent: '永久' }[t] || t || '-')
const codeTypeTagType = (t) => ({ monthly: 'info', yearly: 'success', permanent: 'warning' }[t] || '')
const statusLabel = (s) => ({ unused: '未使用', used: '已使用', void: '已作废' }[s] || s || '-')
const statusTagType = (s) => ({ unused: '', used: 'success', void: 'danger' }[s] || '')

const remaining = computed(() => {
  if (!batch.value) return 0
  return Math.max(0, (batch.value.total_count || 0) - (batch.value.used_count || 0) - (batch.value.void_count || 0))
})
const usageRate = computed(() => {
  const total = Number(batch.value?.total_count || 0)
  if (total === 0) return 0
  return Math.round((Number(batch.value?.used_count || 0) / total) * 100)
})

// code_preview 是 8 位拼接（前 4 + 后 4）。展示成 XXXX****XXXX 让运营更直观。
const formatPreview = (preview) => {
  if (!preview || preview.length < 8) return preview || '-'
  return `${preview.slice(0, 4)}-****-****-${preview.slice(-4)}`
}

const loadDetail = async () => {
  if (!Number.isInteger(batchId.value) || batchId.value < 1) {
    ElMessage.error('无效的批次 ID')
    return
  }
  batchLoading.value = true
  codesLoading.value = true
  try {
    const res = await getCodeBatchDetail(batchId.value, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: filters.status || undefined
    })
    if (res.code === 200) {
      batch.value = res.data?.batch || null
      codeList.value = res.data?.codes?.list || []
      pagination.total = res.data?.codes?.total || 0
    }
  } catch (error) {
    console.error('加载批次详情失败:', error)
  } finally {
    batchLoading.value = false
    codesLoading.value = false
  }
}

const goBack = () => router.push('/codes')

const handleStatusChange = () => {
  pagination.page = 1
  loadDetail()
}
const handlePageChange = (p) => {
  pagination.page = p
  loadDetail()
}
const handlePageSizeChange = (s) => {
  pagination.pageSize = s
  pagination.page = 1
  loadDetail()
}

const onSelectionChange = (rows) => {
  selectedRows.value = rows
}

const handleVoid = async () => {
  const ids = selectedRows.value.map((r) => r.id)
  if (ids.length === 0) return
  let reason = ''
  try {
    const r = await ElMessageBox.prompt(
      `确认作废以下 ${ids.length} 个未使用激活码？此操作不可逆。`,
      '请确认',
      {
        confirmButtonText: '作废',
        cancelButtonText: '取消',
        type: 'warning',
        inputPlaceholder: '可选：作废原因',
        inputValidator: () => true
      }
    )
    reason = r?.value || ''
  } catch (_) {
    return
  }
  try {
    const res = await voidCodes({ code_ids: ids, reason: reason.trim() || undefined })
    if (res.code === 200) {
      ElMessage.success(`已作废 ${res.data?.count || ids.length} 个激活码`)
      selectedRows.value = []
      loadDetail()
    }
  } catch (error) {
    console.error('作废失败:', error)
  }
}

const downloadTxt = async (status) => {
  try {
    await downloadBatchTxt(batchId.value, { status, format: 'dashed' })
    ElMessage.success('下载已开始')
  } catch (error) {
    ElMessage.error(error?.message || '下载失败')
  }
}

const downloadCsv = async () => {
  try {
    await downloadBatchCsv(batchId.value)
    ElMessage.success('下载已开始')
  } catch (error) {
    ElMessage.error(error?.message || '下载失败')
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped lang="scss">
.code-detail-container {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .left {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        font-size: 20px;
        margin: 0;
      }
    }

    .right {
      display: flex;
      gap: 8px;
    }
  }
}

.batch-card {
  margin-bottom: 20px;

  .dark & {
    background: #1F2937;
  }
}

.batch-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;

  .batch-meta-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 12px;
      color: #909399;
    }

    .value {
      font-size: 14px;
      color: #303133;

      .dark & {
        color: #f9fafb;
      }
    }

    .batch-no {
      font-family: 'Menlo', 'Consolas', monospace;
      font-weight: 600;
    }
  }
}

.batch-counts {
  display: flex;
  align-items: center;
  gap: 48px;

  .count-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .count-value {
      font-size: 24px;
      font-weight: 600;
    }

    .count-label {
      font-size: 12px;
      color: #909399;
    }
  }

  .count-progress {
    margin-left: auto;
  }
}

.codes-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;

  .dark & {
    background: #1F2937;
  }
}

.codes-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.code-preview {
  font-family: 'Menlo', 'Consolas', monospace;
  letter-spacing: 1px;
}

.text-muted { color: #909399; }
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
