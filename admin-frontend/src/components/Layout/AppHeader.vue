<template>
  <header class="app-header">
    <div class="header-left">
      <el-icon class="menu-icon" @click="toggleSidebar">
        <Fold v-if="appStore.sidebarOpened" />
        <Expand v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentRoute.meta.title">
          {{ currentRoute.meta.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="header-right">
      <!-- 暗色模式切换 -->
      <el-tooltip content="切换主题" placement="bottom">
        <el-icon class="header-icon" @click="toggleDarkMode">
          <Sunny v-if="!appStore.darkMode" />
          <Moon v-else />
        </el-icon>
      </el-tooltip>
      
      <!-- 全屏 -->
      <el-tooltip content="全屏" placement="bottom">
        <el-icon class="header-icon" @click="toggleFullscreen">
          <FullScreen />
        </el-icon>
      </el-tooltip>
      
      <!-- 用户信息 -->
      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userStore.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="username">{{ userStore.username }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              系统设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

const currentRoute = computed(() => route)

const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const toggleDarkMode = () => {
  appStore.toggleDarkMode()
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能开发中...')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await userStore.logout()
        router.push('/login')
        ElMessage.success('已退出登录')
      } catch (error) {
        // 用户取消
      }
      break
  }
}
</script>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  
  .dark & {
    background-color: #1F2937;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  
  .menu-icon {
    font-size: 20px;
    cursor: pointer;
    transition: color 0.3s;
    
    &:hover {
      color: #3B82F6;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  
  .header-icon {
    font-size: 20px;
    cursor: pointer;
    transition: color 0.3s;
    
    &:hover {
      color: #3B82F6;
    }
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 4px;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: #f5f7fa;
      
      .dark & {
        background-color: #374151;
      }
    }
    
    .username {
      font-size: 14px;
      color: #333;
      
      .dark & {
        color: #f9fafb;
      }
    }
  }
}
</style>

