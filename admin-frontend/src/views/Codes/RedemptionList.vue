<template>
  <div class="redemption-list-container">
    <div class="page-header">
      <h2>激活记录</h2>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="用户 ID">
          <el-input
            v-model="filters.user_id"
            placeholder="精确匹配"
            clearable
            style="width: 140px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="批次 ID">
          <el-input
            v-model="filters.batch_id"
            placeholder="精确匹配"
            clearable
            style="width: 140px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="filters.channel" placeholder="全部渠道" clearable style="width: 160px">
            <el-option label="全部" value="" />
            <el-option label="注册时激活" value="register" />
            <el-option label="个人中心" value="profile" />
            <el-option label="阅读墙" value="reading_wall" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="ID" prop="id" width="80" align="center" />
      <el-table-column label="码（脱敏）" min-width="160">
        <template #default="{ row }">
          <span class="code-preview">{{ formatPreview(row.code_preview) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="codeTypeTagType(row.code_type)" size="small">
            {{ codeTypeLabel(row.code_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户" min-width="160">
        <template #default="{ row }">
          <span v-if="row.username">{{ row.username }}</span>
          <span v-else class="text-muted">-</span>
          <span class="text-muted user-id">#{{ row.user_id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="渠道" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="channelTagType(row.channel)" size="small">
            {{ channelLabel(row.channel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="等级变化" width="160" align="center">
        <template #default="{ row }">
          <span class="text-muted">{{ levelLabel(row.vip_level_before) }}</span>
          <span class="arrow">→</span>
          <span class="text-success">{{ levelLabel(row.vip_level_after) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="到期日变化" min-width="240">
        <template #default="{ row }">
          <div class="expires-change">
            <span class="text-muted">
              {{ row.expires_before ? formatDate(row.expires_before, 'YYYY-MM-DD') : '无' }}
            </span>
            <span class="arrow">→</span>
            <span>
              {{ row.expires_after ? formatDate(row.expires_after, 'YYYY-MM-DD') : '无' }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="IP" prop="ip" width="140">
        <template #default="{ row }">
          <span v-if="row.ip">{{ row.ip }}</span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="激活时间" width="170">
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
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getRedemptions } from '@/api/code'
import { formatDate } from '@/utils/format'

const loading = ref(false)
const list = ref([])
const dateRange = ref(null)

const filters = reactive({
  user_id: '',
  batch_id: '',
  channel: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const codeTypeLabel = (t) => ({ monthly: '月卡', yearly: '年卡', permanent: '永久' }[t] || t || '-')
const codeTypeTagType = (t) => ({ monthly: 'info', yearly: 'success', permanent: 'warning' }[t] || '')

const channelLabel = (c) => ({ register: '注册时激活', profile: '个人中心', reading_wall: '阅读墙' }[c] || c || '-')
const channelTagType = (c) => ({ register: 'success', profile: '', reading_wall: 'warning' }[c] || '')

const levelLabel = (l) => ({ 0: '普通', 1: '月卡', 2: '年卡', 3: '永久' }[Number(l) || 0])

const formatPreview = (preview) => {
  if (!preview || preview.length < 8) return preview || '-'
  return `${preview.slice(0, 4)}-****-****-${preview.slice(-4)}`
}

const loadList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      user_id: filters.user_id ? Number(filters.user_id) : undefined,
      batch_id: filters.batch_id ? Number(filters.batch_id) : undefined,
      channel: filters.channel || undefined,
      start_date: dateRange.value?.[0] || undefined,
      end_date: dateRange.value?.[1] ? `${dateRange.value[1]} 23:59:59` : undefined
    }
    const res = await getRedemptions(params)
    if (res.code === 200) {
      list.value = res.data?.list || []
      pagination.total = res.data?.total || 0
    }
  } catch (error) {
    console.error('加载激活记录失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadList()
}
const handleReset = () => {
  filters.user_id = ''
  filters.batch_id = ''
  filters.channel = ''
  dateRange.value = null
  pagination.page = 1
  loadList()
}
const handlePageChange = (p) => {
  pagination.page = p
  loadList()
}
const handlePageSizeChange = (s) => {
  pagination.pageSize = s
  pagination.page = 1
  loadList()
}

onMounted(() => {
  loadList()
})
</script>

<style scoped lang="scss">
.redemption-list-container {
  .page-header {
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

.code-preview {
  font-family: 'Menlo', 'Consolas', monospace;
  letter-spacing: 1px;
}

.user-id {
  margin-left: 6px;
  font-size: 12px;
}

.expires-change {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.arrow {
  margin: 0 4px;
  color: #909399;
}

.text-muted { color: #909399; }
.text-success { color: #67c23a; }

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
