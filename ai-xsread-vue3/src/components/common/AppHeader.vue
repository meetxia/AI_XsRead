<template>
  <div>
    <!-- 桌面端顶部导航 -->
    <nav class="hidden md:block fixed top-0 left-0 right-0 nav-header z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center space-x-2">
            <svg class="w-8 h-8" style="color: var(--color-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <span class="text-xl font-semibold text-themed-primary">文字之境</span>
          </div>
          
          <!-- 导航菜单 -->
          <div class="flex items-center space-x-6">
            <router-link 
              to="/" 
              class="font-medium pb-1"
              :class="isActive('/') ? 'active-link' : 'inactive-link'"
            >
              发现
            </router-link>
            <router-link 
              to="/recommend" 
              class="font-medium pb-1"
              :class="isActive('/recommend') ? 'active-link' : 'inactive-link'"
            >
              推荐
            </router-link>
            <router-link 
              to="/bookshelf" 
              class="font-medium pb-1"
              :class="isActive('/bookshelf') ? 'active-link' : 'inactive-link'"
            >
              书架
            </router-link>
            
            <!-- 搜索按钮 -->
            <router-link 
              to="/search" 
              class="p-2 rounded-lg hover:opacity-80 transition"
              :class="isActive('/search') ? 'text-primary' : ''"
              aria-label="搜索"
            >
              <svg class="w-6 h-6 text-themed-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </router-link>
            
            <!-- 主题选择器 -->
            <ThemeSelector />
            
            <!-- 暗色模式切换 -->
            <button 
              @click="toggleMode" 
              class="p-2 rounded-lg hover:opacity-80 transition"
              aria-label="切换暗色模式"
            >
              <svg class="w-6 h-6 text-themed-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="currentMode === 'light'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </button>

            <!-- 用户菜单 -->
            <div v-if="userStore.isLogin" class="relative">
              <button 
                @click="toggleUserMenu" 
                class="flex items-center space-x-2 p-2 rounded-lg hover:opacity-80 transition"
              >
                <img 
                  :src="userStore.userInfo?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" 
                  alt="头像" 
                  class="w-8 h-8 rounded-full"
                />
              </button>
              
              <!-- 下拉菜单 -->
              <div 
                v-if="showUserMenu"
                class="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-2 z-50"
                style="background-color: var(--color-bg-card); border: 1px solid var(--color-border)"
              >
                <div class="px-4 py-2 border-b" style="border-color: var(--color-border)">
                  <p class="font-medium text-sm" style="color: var(--color-text-primary)">
                    {{ userStore.userInfo?.nickname || userStore.userInfo?.username }}
                  </p>
                </div>
                
                <!-- 个人中心 -->
                <router-link
                  to="/profile"
                  @click="showUserMenu = false"
                  class="flex items-center px-4 py-2 text-sm hover:opacity-80 transition"
                  style="color: var(--color-text-primary)"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  个人中心
                </router-link>
                
                <!-- 我的书架 -->
                <router-link
                  to="/bookshelf"
                  @click="showUserMenu = false"
                  class="flex items-center px-4 py-2 text-sm hover:opacity-80 transition"
                  style="color: var(--color-text-primary)"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  我的书架
                </router-link>
                
                <!-- 上传小说 -->
                <router-link
                  to="/upload"
                  @click="showUserMenu = false"
                  class="flex items-center px-4 py-2 text-sm hover:opacity-80 transition upload-link"
                  style="color: var(--color-text-primary)"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  上传小说
                </router-link>
                
                <!-- 管理员后台入口 -->
                <a 
                  v-if="isAdmin"
                  href="http://localhost:5174"
                  target="_blank"
                  class="flex items-center px-4 py-2 text-sm hover:opacity-80 transition border-t"
                  style="color: var(--color-text-primary); border-color: var(--color-border)"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  管理后台
                </a>
                
                <button 
                  @click="handleLogout"
                  class="w-full flex items-center px-4 py-2 text-sm hover:opacity-80 transition border-t"
                  style="color: #ef4444; border-color: var(--color-border)"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  退出登录
                </button>
              </div>
            </div>

            <!-- 登录/注册按钮 -->
            <div v-else class="flex items-center space-x-3">
              <router-link 
                to="/login" 
                class="px-4 py-2 rounded-lg font-medium text-sm transition hover:opacity-80"
                style="color: var(--color-text-primary)"
              >
                登录
              </router-link>
              <router-link 
                to="/register" 
                class="px-4 py-2 rounded-lg font-medium text-sm text-white transition hover:opacity-80"
                style="background-color: var(--color-primary)"
              >
                注册
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- 移动端顶部栏 -->
    <div class="md:hidden fixed top-0 left-0 right-0 nav-header z-50">
      <div class="flex justify-between items-center h-14 px-4">
        <!-- Logo -->
        <div class="flex items-center space-x-2">
          <svg class="w-6 h-6" style="color: var(--color-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
          <span class="font-semibold text-themed-primary">文字之境</span>
        </div>
        
        <div class="flex items-center space-x-2">
          <!-- 移动端主题选择 -->
          <ThemeSelector :mobile="true" />
          
          <!-- 移动端暗色模式切换 -->
          <button 
            @click="toggleMode" 
            class="p-2 rounded-lg active:scale-95 transition"
            aria-label="切换暗色模式"
          >
            <svg class="w-5 h-5 text-themed-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="currentMode === 'light'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </button>
          
          <!-- 移动端用户菜单 -->
          <div v-if="userStore.isLogin" class="relative">
            <button 
              @click.stop="toggleUserMenu" 
              class="p-1 rounded-lg active:scale-95 transition"
            >
              <img 
                :src="userStore.userInfo?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" 
                alt="头像" 
                class="w-7 h-7 rounded-full"
              />
            </button>
            
            <!-- 移动端下拉菜单 -->
            <div 
              v-if="showUserMenu"
              class="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-2 z-50"
              style="background-color: var(--color-bg-card); border: 1px solid var(--color-border)"
            >
              <div class="px-4 py-2 border-b" style="border-color: var(--color-border)">
                <p class="font-medium text-sm" style="color: var(--color-text-primary)">
                  {{ userStore.userInfo?.nickname || userStore.userInfo?.username }}
                </p>
              </div>
              
              <!-- 个人中心 -->
              <router-link
                to="/profile"
                @click="showUserMenu = false"
                class="flex items-center px-4 py-2 text-sm hover:opacity-80 transition"
                style="color: var(--color-text-primary)"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                个人中心
              </router-link>
              
              <!-- 我的书架 -->
              <router-link
                to="/bookshelf"
                @click="showUserMenu = false"
                class="flex items-center px-4 py-2 text-sm hover:opacity-80 transition"
                style="color: var(--color-text-primary)"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                我的书架
              </router-link>
              
              <!-- 上传小说 -->
              <router-link
                to="/upload"
                @click="showUserMenu = false"
                class="flex items-center px-4 py-2 text-sm hover:opacity-80 transition upload-link"
                style="color: var(--color-text-primary)"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                上传小说
              </router-link>
              
              <!-- 管理员后台入口（移动端） -->
              <a 
                v-if="isAdmin"
                href="http://localhost:5174"
                target="_blank"
                class="flex items-center px-4 py-2 text-sm hover:opacity-80 transition border-t"
                style="color: var(--color-text-primary); border-color: var(--color-border)"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                管理后台
              </a>
              
              <button 
                @click="handleLogout"
                class="w-full flex items-center px-4 py-2 text-sm hover:opacity-80 transition border-t"
                style="color: #ef4444; border-color: var(--color-border)"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                退出登录
              </button>
            </div>
          </div>
          
          <!-- 移动端登录按钮 -->
          <router-link 
            v-else
            to="/login" 
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition active:scale-95"
            style="background-color: var(--color-primary)"
          >
            登录
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useTheme from '@/composables/useTheme'
import ThemeSelector from './ThemeSelector.vue'
import { useUserStore } from '@/stores/user'

// 路由
const route = useRoute()
const router = useRouter()

// 用户状态
const userStore = useUserStore()

// 主题状态 - 使用 useTheme composable
const { currentMode, toggleMode } = useTheme()

// 搜索功能
const showSearch = ref(true)
const searchQuery = ref('')
const searchSuggestions = ref([])

// 用户菜单
const showUserMenu = ref(false)

// 判断是否为管理员
const isAdmin = computed(() => {
  // 这里可以根据实际情况判断，比如用户角色
  // 暂时使用用户名判断（实际应该使用 role 字段）
  return userStore.userInfo?.username === 'admin' || 
         userStore.userInfo?.role === 'admin'
})

// 判断是否为当前激活路由
const isActive = (path) => {
  return route.path === path
}

// 搜索防抖处理
let searchTimeout = null
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim()) {
      // TODO: 调用搜索API
      // 这里暂时模拟数据
      searchSuggestions.value = []
    } else {
      searchSuggestions.value = []
    }
  }, 300)
}

// 选择搜索建议
const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion.title
  searchSuggestions.value = []
  // TODO: 跳转到小说详情页或阅读页
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
  const userMenuEl = event.target.closest('.relative')
  if (!userMenuEl || !userMenuEl.querySelector('img[alt="头像"]')) {
    showUserMenu.value = false
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
.nav-header {
  background-color: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.active-link {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
}

.inactive-link {
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
}

.inactive-link:hover {
  opacity: 0.8;
  transition: opacity 0.2s;
}

/* 上传链接高亮 */
.upload-link {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  margin: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}

.upload-link:hover {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
}

.upload-link svg {
  color: #667eea;
}

.text-themed-primary {
  color: var(--color-text-primary);
}

.text-themed-secondary {
  color: var(--color-text-secondary);
}

.focus\:ring-primary:focus {
  --tw-ring-color: var(--color-primary);
}
</style>

