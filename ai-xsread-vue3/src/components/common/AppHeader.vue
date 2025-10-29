<template>
  <header class="app-header">
    <!-- 桌面端导航 -->
    <nav class="desktop-nav">
      <div class="nav-container">
        <div class="nav-content">
          <!-- Logo -->
          <div class="logo-section">
            <svg class="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <span class="logo-text">文字之境</span>
          </div>
          
          <!-- 导航菜单 -->
          <div class="nav-menu">
            <router-link 
              to="/" 
              class="nav-link"
              :class="{ 'active': isActive('/') }"
            >
              发现
            </router-link>
            <router-link 
              to="/recommend" 
              class="nav-link"
              :class="{ 'active': isActive('/recommend') }"
            >
              推荐
            </router-link>
            <router-link 
              to="/bookshelf" 
              class="nav-link"
              :class="{ 'active': isActive('/bookshelf') }"
            >
              书架
            </router-link>
            
            <!-- 搜索按钮 -->
            <router-link 
              to="/search" 
              class="icon-btn"
              :class="{ 'active': isActive('/search') }"
              aria-label="搜索"
            >
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </router-link>
            
            <!-- 主题选择器 -->
            <ThemeSelector />
            
            <!-- 暗色模式切换 -->
            <button 
              @click="toggleMode" 
              class="icon-btn"
              aria-label="切换暗色模式"
            >
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="currentMode === 'light'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </button>

            <!-- 用户信息 -->
            <div v-if="userStore.isLogin" class="user-menu">
              <button 
                @click="toggleUserMenu" 
                class="user-avatar-btn"
              >
                <img 
                  :src="userStore.userInfo?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" 
                  alt="头像" 
                  class="user-avatar"
                />
              </button>
              
              <!-- 下拉菜单 -->
              <div v-if="showUserMenu" class="dropdown-menu">
                <div class="dropdown-header">
                  <p class="user-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</p>
                </div>
                
                <router-link to="/profile" @click="showUserMenu = false" class="dropdown-item">
                  <svg class="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  个人中心
                </router-link>
                
                <router-link to="/bookshelf" @click="showUserMenu = false" class="dropdown-item">
                  <svg class="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  我的书架
                </router-link>
                
                <router-link to="/upload" @click="showUserMenu = false" class="dropdown-item upload">
                  <svg class="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  上传小说
                </router-link>
                
                <a 
                  v-if="isAdmin"
                  href="http://localhost:5174"
                  target="_blank"
                  class="dropdown-item admin"
                >
                  <svg class="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  管理后台
                </a>
                
                <button @click="handleLogout" class="dropdown-item logout">
                  <svg class="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  退出登录
                </button>
              </div>
            </div>

            <!-- 登录/注册按钮 -->
            <div v-else class="auth-buttons">
              <router-link to="/login" class="btn-login">登录</router-link>
              <router-link to="/register" class="btn-register">注册</router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- 移动端导航 -->
    <nav class="mobile-nav">
      <div class="mobile-nav-content">
        <!-- Logo -->
        <div class="mobile-logo">
          <svg class="logo-icon-mobile" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
          <span class="logo-text-mobile">文字之境</span>
        </div>
        
        <div class="mobile-actions">
          <!-- 搜索按钮 -->
          <router-link to="/search" class="mobile-icon-btn" aria-label="搜索">
            <svg class="mobile-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </router-link>
          
          <!-- 主题选择器 -->
          <ThemeSelector :mobile="true" />
          
          <!-- 暗色模式切换 -->
          <button @click="toggleMode" class="mobile-icon-btn" aria-label="切换暗色模式">
            <svg class="mobile-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="currentMode === 'light'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </button>
          
          <!-- 用户菜单 -->
          <div v-if="userStore.isLogin" class="mobile-user-menu">
            <button @click.stop="toggleUserMenu" class="mobile-avatar-btn">
              <img 
                :src="userStore.userInfo?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" 
                alt="头像" 
                class="mobile-avatar"
              />
            </button>
            
            <div v-if="showUserMenu" class="mobile-dropdown">
              <div class="dropdown-header">
                <p class="user-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</p>
              </div>
              
              <router-link to="/profile" @click="showUserMenu = false" class="dropdown-item">
                <svg class="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                个人中心
              </router-link>
              
              <router-link to="/upload" @click="showUserMenu = false" class="dropdown-item upload">
                <svg class="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                上传小说
              </router-link>
              
              <button @click="handleLogout" class="dropdown-item logout">
                <svg class="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                退出登录
              </button>
            </div>
          </div>
          
          <!-- 登录按钮 -->
          <router-link v-else to="/login" class="mobile-btn-login">登录</router-link>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ThemeSelector from './ThemeSelector.vue'
import useTheme from '@/composables/useTheme'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 主题状态
const { currentMode, toggleMode } = useTheme()
const showUserMenu = ref(false)

// 判断是否为管理员
const isAdmin = computed(() => {
  return userStore.userInfo?.username === 'admin' || userStore.userInfo?.role === 'admin'
})

// 判断是否为当前激活路由
const isActive = (path) => {
  return route.path === path
}

// 切换用户菜单
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  showUserMenu.value = false
  router.push('/')
}

// 点击外部关闭菜单
const handleClickOutside = (event) => {
  if (showUserMenu.value) {
    const userMenuEl = event.target.closest('.user-menu, .mobile-user-menu')
    if (!userMenuEl) {
    showUserMenu.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 头部容器 */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: var(--color-bg-card, #ffffff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* ===== 桌面端导航 ===== */
.desktop-nav {
  display: none;
}

@media (min-width: 768px) {
  .desktop-nav {
    display: block !important;
  }
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

/* Logo */
.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--color-primary, #d95468);
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary, #2d2d2d);
}

/* 导航菜单 */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  position: relative;
  padding: 8px 4px;
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-secondary, #5a5a5a);
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--color-text-primary, #2d2d2d);
}

.nav-link.active {
  color: var(--color-primary, #d95468);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-primary, #d95468);
  border-radius: 2px;
}

/* 图标按钮 */
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--color-text-secondary, #5a5a5a);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background-color: var(--color-bg-hover, #f8f8f8);
  color: var(--color-text-primary, #2d2d2d);
}

.icon-btn.active {
  color: var(--color-primary, #d95468);
}

.icon {
  width: 24px;
  height: 24px;
}

/* 用户菜单 */
.user-menu {
  position: relative;
}

.user-avatar-btn {
  display: flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.user-avatar-btn:hover {
  transform: scale(1.05);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border, #e5e7eb);
}

/* 下拉菜单 */
.dropdown-menu,
.mobile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background-color: var(--color-bg-card, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1001;
}

.dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #2d2d2d);
  margin: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-primary, #2d2d2d);
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: var(--color-bg-hover, #f8f8f8);
}

.dropdown-item.upload {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
}

.dropdown-item.upload:hover {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%);
}

.dropdown-item.admin {
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.dropdown-item.logout {
  color: #ef4444;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* 登录注册按钮 */
.auth-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-login {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary, #2d2d2d);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-login:hover {
  background-color: var(--color-bg-hover, #f8f8f8);
}

.btn-register {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background-color: var(--color-primary, #d95468);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-register:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* ===== 移动端导航 ===== */
.mobile-nav {
  display: block !important;
}

@media (min-width: 768px) {
  .mobile-nav {
    display: none !important;
  }
}

.mobile-nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 16px;
}

/* 移动端 Logo */
.mobile-logo {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo-icon-mobile {
  width: 24px;
  height: 24px;
  color: var(--color-primary, #d95468);
}

.logo-text-mobile {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #2d2d2d);
}

/* 移动端操作区 */
.mobile-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 6px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--color-text-secondary, #5a5a5a);
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-icon-btn:active {
  transform: scale(0.95);
  background-color: var(--color-bg-hover, #f8f8f8);
}

.mobile-icon {
  width: 20px;
  height: 20px;
}

/* 移动端用户菜单 */
.mobile-user-menu {
  position: relative;
}

.mobile-avatar-btn {
  display: flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
}

.mobile-avatar-btn:active {
  transform: scale(0.95);
}

.mobile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border, #e5e7eb);
}

/* 移动端登录按钮 */
.mobile-btn-login {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background-color: var(--color-primary, #d95468);
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-btn-login:active {
  transform: scale(0.95);
  opacity: 0.9;
}

/* 暗色模式自动适配 - 通过主题系统的 CSS 变量 */
/* 不需要额外的 @media 查询，主题系统会自动更新 CSS 变量 */
</style>
