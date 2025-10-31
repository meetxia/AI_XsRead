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
const pendingCount = ref(0)

const commentList = ref([])

// 加载评论列表
const loadComments = async () => {
  loading.value = true
  try {
    // 根据tab确定status参数
    let status
    if (activeTab.value === 'pending') status = 0
    else if (activeTab.value === 'approved') status = 1
    else if (activeTab.value === 'rejected') status = 2
    
    const params = { status }
    
    // 需要先导入API
    const { getCommentList } = await import('@/api/comment')
    const res = await getCommentList(params)
    
    if (res.code === 200) {
      commentList.value = res.data.list.map(comment => ({
        id: comment.id,
        username: comment.username,
        content: comment.content,
        novelTitle: comment.novel_title || '未知小说',
        createdAt: comment.created_at
      }))
      
      // 更新待审核数量
      if (activeTab.value === 'pending') {
        pendingCount.value = res.data.total
      }
    }
  } catch (error) {
    console.error('加载评论列表失败:', error)
    ElMessage.error('加载评论列表失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tab) => {
  loadComments()
}

const handleApprove = async (id) => {
  try {
    const { approveComment } = await import('@/api/comment')
    await approveComment(id)
    ElMessage.success('审核通过')
    loadComments()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleReject = async (id) => {
  try {
    const { rejectComment } = await import('@/api/comment')
    await rejectComment(id)
    ElMessage.warning('已屏蔽')
    loadComments()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadComments()
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

