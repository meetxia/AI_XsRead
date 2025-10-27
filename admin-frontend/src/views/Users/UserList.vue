<template>
  <div class="user-list-container">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="用户状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="用户名/邮箱/ID"
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

    <!-- 用户列表 -->
    <el-table
      v-loading="loading"
      :data="userList"
      border
      stripe
      class="user-table"
    >
      <el-table-column label="ID" prop="id" width="80" align="center" />

      <el-table-column label="用户信息" min-width="200">
        <template #default="{ row }">
          <div class="user-info">
            <el-avatar :size="40" :src="row.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="info-text">
              <div class="username">{{ row.username }}</div>
              <div class="email">{{ row.email }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="阅读统计" width="200" align="center">
        <template #default="{ row }">
          <div class="stats">
            <div>{{ row.totalBooks }}本 / {{ row.readingTime }}小时</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="注册时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatDate(row.createdAt, 'YYYY-MM-DD') }}
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="handleView(row.id)">
            详情
          </el-button>
          <el-button
            :type="row.status === 1 ? 'danger' : 'success'"
            size="small"
            link
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 1 ? '禁用' : '启用' }}
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getUserList, updateUserStatus } from '@/api/user'
import { formatDate } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const filters = reactive({
  status: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const userList = ref([
  {
    id: 1001,
    username: 'reader001',
    email: 'reader001@example.com',
    avatar: '',
    totalBooks: 47,
    readingTime: 128,
    status: 1,
    createdAt: '2024-01-15'
  }
])

const loadUserList = async () => {
  loading.value = true
  try {
    // TODO: 调用API
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUserList()
}

const handleReset = () => {
  filters.status = ''
  filters.keyword = ''
  pagination.page = 1
  loadUserList()
}

const handleView = (id) => {
  router.push(`/users/${id}`)
}

const handleToggleStatus = async (user) => {
  const newStatus = user.status === 1 ? 0 : 1
  const action = newStatus === 0 ? '禁用' : '启用'

  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await updateUserStatus(user.id, newStatus)
    ElMessage.success(`${action}成功`)
    loadUserList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadUserList()
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadUserList()
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped lang="scss">
.user-list-container {
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

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .info-text {
    flex: 1;
    text-align: left;

    .username {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;

      .dark & {
        color: #f9fafb;
      }
    }

    .email {
      font-size: 12px;
      color: #909399;
    }
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

