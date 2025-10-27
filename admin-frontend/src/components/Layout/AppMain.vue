<template>
  <main class="app-main">
    <el-scrollbar>
      <div class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive>
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </el-scrollbar>
  </main>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped lang="scss">
.app-main {
  flex: 1;
  overflow: hidden;
  
  .main-content {
    padding: 20px;
    min-height: calc(100vh - 80px);
  }
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

