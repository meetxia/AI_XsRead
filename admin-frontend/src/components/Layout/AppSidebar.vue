<template>
  <aside class="app-sidebar" :class="{ collapsed: !appStore.sidebarOpened }">
    <div class="logo">
      <img src="@/assets/vue.svg" alt="Logo" />
      <span v-show="appStore.sidebarOpened" class="logo-title">文字之境</span>
    </div>
    
    <el-scrollbar class="sidebar-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :collapse="!appStore.sidebarOpened"
        :collapse-transition="false"
        router
        unique-opened
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item
            v-if="!route.meta?.hidden"
            :index="route.path"
            @click="handleMenuClick(route)"
          >
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <template #title>
              <span>{{ route.meta?.title }}</span>
            </template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/modules/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 从路由中获取菜单
const menuRoutes = computed(() => {
  const routes = router.options.routes.find(r => r.path === '/')
  return routes?.children || []
})

const activeMenu = computed(() => {
  const { path } = route
  // 处理编辑页面等，高亮对应的列表页面
  if (path.includes('/edit') || path.includes('/create')) {
    return '/' + path.split('/')[1]
  }
  return path
})

const handleMenuClick = (route) => {
  // 菜单点击处理
}
</script>

<style scoped lang="scss">
.app-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 200px;
  background-color: #fff;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
  transition: width 0.3s;
  z-index: 1000;
  
  .dark & {
    background-color: #1F2937;
    box-shadow: 2px 0 6px rgba(0, 0, 0, 0.3);
  }
  
  &.collapsed {
    width: 64px;
    
    .logo-title {
      display: none;
    }
  }
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  padding: 0 20px;
  border-bottom: 1px solid #f0f0f0;
  
  .dark & {
    border-bottom-color: #374151;
  }
  
  img {
    width: 32px;
    height: 32px;
  }
  
  .logo-title {
    margin-left: 10px;
    font-size: 18px;
    font-weight: bold;
    color: #3B82F6;
    white-space: nowrap;
  }
}

.sidebar-scrollbar {
  height: calc(100% - 60px);
  
  :deep(.el-menu) {
    border-right: none;
  }
}
</style>

