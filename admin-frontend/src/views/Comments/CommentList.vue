<template>
  <div class="comment-list-container">
    <div class="page-header">
      <h2>评论管理</h2>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="未审核" name="pending">
        <el-badge :value="pendingCount" class="item">
        </el-badge>
      </el-tab-pane>
      <el-tab-pane label="已通过" name="approved"></el-tab-pane>
      <el-tab-pane label="已屏蔽" name="rejected"></el-tab-pane>
    </el-tabs>

    <el-table
      v-loading="loading"
      :data="commentList"
      border
      stripe
    >
      <el-table-column label="用户" width="150">
        <template #default="{ row }">
          <div>{{ row.username }}</div>
        </template>
      </el-table-column>

      <el-table-column label="评论内容" min-width="300">
        <template #default="{ row }">
          <div>{{ row.content }}</div>
        </template>
      </el-table-column>

      <el-table-column label="所属作品" width="200">
        <template #default="{ row }">
          <el-tag size="small">{{ row.novelTitle }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="activeTab === 'pending'"
            type="success"
            size="small"
            link
            @click="handleApprove(row.id)"
          >
            通过
          </el-button>
          <el-button
            type="danger"
            size="small"
            link
            @click="handleReject(row.id)"
          >
            屏蔽
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDate } from '@/utils/format'

const loading = ref(false)
const activeTab = ref('pending')
const pendingCount = ref(15)

const commentList = ref([
  {
    id: 1,
    username: 'reader001',
    content: '非常好看的小说！文笔细腻，情感真挚。',
    novelTitle: '长安月下归人未归',
    createdAt: '2025-10-27 09:30:00'
  }
])

const handleTabChange = (tab) => {
  console.log('切换到:', tab)
}

const handleApprove = (id) => {
  ElMessage.success('审核通过')
}

const handleReject = (id) => {
  ElMessage.warning('已屏蔽')
}

onMounted(() => {
  // loadComments()
})
</script>

<style scoped lang="scss">
.comment-list-container {
  .page-header {
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
      margin: 0;
    }
  }
}
</style>

