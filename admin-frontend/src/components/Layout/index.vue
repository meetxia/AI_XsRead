<template>
  <div class="admin-layout">
    <AppSidebar />
    <div class="main-container" :class="{ 'sidebar-closed': !appStore.sidebarOpened }">
      <AppHeader />
      <AppMain />
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '@/store/modules/app'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import AppMain from './AppMain.vue'

const appStore = useAppStore()
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  
  &.dark {
    background-color: #111827;
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 200px;
  transition: margin-left 0.3s;
  
  &.sidebar-closed {
    margin-left: 64px;
  }
}
</style>

