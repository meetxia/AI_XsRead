<template>
  <!-- 移动端底部导航 -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bottom-nav z-50">
    <div class="flex justify-around items-center h-16 px-4">
      <!-- 发现 -->
      <router-link 
        to="/" 
        class="bottom-nav-item flex flex-col items-center space-y-1"
        :class="{ 'active': isActive('/') }"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-xs">发现</span>
      </router-link>
      
      <!-- 推荐 -->
      <router-link 
        to="/recommend" 
        class="bottom-nav-item flex flex-col items-center space-y-1"
        :class="{ 'active': isActive('/recommend') }"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
        </svg>
        <span class="text-xs">推荐</span>
      </router-link>
      
      <!-- 我的 -->
      <router-link 
        to="/profile" 
        class="bottom-nav-item flex flex-col items-center space-y-1"
        :class="{ 'active': isActive('/profile') }"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <span class="text-xs">我的</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// 路由
const route = useRoute()

// 判断是否为当前激活路由
const isActive = (path) => {
  return route.path === path
}
</script>

<style scoped>
.bottom-nav {
  backdrop-filter: blur(10px);
  background-color: var(--color-bg-card);
  border-top: 1px solid var(--color-border);
  /* 安全区域适配 */
  padding-bottom: env(safe-area-inset-bottom);
  transition: all 0.3s ease;
}

.bottom-nav-item {
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav-item.active {
  color: var(--color-primary);
}

.bottom-nav-item:active {
  transform: scale(0.95);
}

/* 触摸反馈动画 */
@keyframes tap {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

.bottom-nav-item:active {
  animation: tap 0.2s ease;
}
</style>

