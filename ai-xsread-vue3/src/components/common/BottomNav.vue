<template>
  <!-- 移动端底部导航 -->
  <nav class="bottom-navigation">
    <router-link 
      to="/" 
      class="nav-item"
      :class="{ 'active': isActive('/') }"
    >
      <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span class="nav-label">发现</span>
    </router-link>
    
    <router-link 
      to="/recommend" 
      class="nav-item"
      :class="{ 'active': isActive('/recommend') }"
    >
      <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
      </svg>
      <span class="nav-label">推荐</span>
    </router-link>
    
    <router-link 
      to="/bookshelf" 
      class="nav-item"
      :class="{ 'active': isActive('/bookshelf') }"
    >
      <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
      </svg>
      <span class="nav-label">书架</span>
    </router-link>
    
    <router-link 
      to="/profile" 
      class="nav-item"
      :class="{ 'active': isActive('/profile') }"
    >
      <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
      <span class="nav-label">我的</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// 判断是否为当前激活路由
const isActive = (path) => {
  return route.path === path
}
</script>

<style scoped>
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: none;
  background-color: var(--color-bg-card, #ffffff);
  border-top: 1px solid var(--color-border, #e5e7eb);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

/* 只在移动端显示 */
@media (max-width: 767px) {
  .bottom-navigation {
    display: flex !important;
    justify-content: space-around;
    align-items: center;
    padding: 8px 0;
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 8px 12px;
  text-decoration: none;
  color: var(--color-text-secondary, #5a5a5a);
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.nav-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  stroke-width: 2;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

/* 激活状态 */
.nav-item.active {
  color: var(--color-primary, #d95468);
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}

/* 点击效果 */
.nav-item:active {
  transform: scale(0.95);
  opacity: 0.7;
}

/* 暗色模式自动适配 - 通过主题系统的 CSS 变量 */
/* 不需要额外的 @media 查询，主题系统会自动更新 CSS 变量 */
</style>
