<template>
  <div class="user-detail-container">
    <el-page-header @back="router.back()" title="返回">
      <template #content>
        <span class="page-title">用户详情</span>
      </template>
    </el-page-header>

    <div class="detail-content">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>基本信息</span>
            </template>
            <div class="user-basic">
              <el-avatar :size="80" :src="userInfo.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-data">
                <h3>{{ userInfo.username }}</h3>
                <p>ID: {{ userInfo.id }}</p>
                <p>邮箱: {{ userInfo.email }}</p>
                <el-tag :type="userInfo.status === 1 ? 'success' : 'danger'">
                  {{ userInfo.status === 1 ? '正常' : '禁用' }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserDetail } from '@/api/user'

const router = useRouter()
const route = useRoute()

const userInfo = ref({
  id: '',
  username: '',
  email: '',
  avatar: '',
  status: 1
})

const loadUserDetail = async () => {
  try {
    const res = await getUserDetail(route.params.id)
    if (res.code === 200) {
      userInfo.value = {
        id: res.data.id,
        username: res.data.username,
        email: res.data.email,
        avatar: res.data.avatar,
        status: res.data.status
      }
    }
  } catch (error) {
    console.error('加载用户详情失败:', error)
    ElMessage.error('加载用户详情失败')
    router.back()
  }
}

onMounted(() => {
  if (route.params.id) {
    loadUserDetail()
  } else {
    ElMessage.error('缺少用户ID')
    router.back()
  }
})
</script>

<style scoped lang="scss">
.user-detail-container {
  .detail-content {
    margin-top: 20px;
  }

  .user-basic {
    display: flex;
    align-items: center;
    gap: 20px;

    .user-data {
      h3 {
        margin: 0 0 10px;
      }

      p {
        margin: 5px 0;
        color: #909399;
      }
    }
  }
}
</style>

