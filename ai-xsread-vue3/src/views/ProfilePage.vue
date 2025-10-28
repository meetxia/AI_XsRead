<template>
  <div class="profile-page">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <div class="main-content">
      <!-- 用户信息卡片 -->
      <section class="user-info-section fade-in">
        <div class="user-card">
          <!-- 背景装饰 -->
          <div class="card-background"></div>
          
          <div class="user-content">
            <!-- 头像 -->
            <div class="avatar-container">
              <img 
                :src="userInfo?.avatar || defaultAvatar" 
                :alt="userInfo?.nickname || '用户'"
                class="user-avatar"
                @error="handleAvatarError"
              />
              <button class="avatar-edit-btn" @click="handleEditAvatar">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </button>
            </div>

            <!-- 用户名和签名 -->
            <div class="user-info">
              <h2 class="user-name">{{ userInfo?.nickname || userInfo?.username || '未登录' }}</h2>
              <p class="user-bio">{{ userInfo?.bio || '这个人很懒，还没有签名~' }}</p>
              <div class="user-meta">
                <span class="meta-item">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                  </svg>
                  UID: {{ userInfo?.id || '---' }}
                </span>
                <span class="meta-item">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                  </svg>
                  {{ formatDate(userInfo?.createdAt) }}
                </span>
              </div>
            </div>

            <!-- 编辑资料按钮 -->
            <button class="edit-profile-btn" @click="handleEditProfile">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              编辑资料
            </button>
          </div>
        </div>
      </section>

      <!-- 阅读统计 -->
      <section class="stats-section fade-in mt-xl" style="animation-delay: 0.1s">
        <h3 class="section-title">阅读统计</h3>
        <ReadingStatsChart />
      </section>

      <!-- 成就系统 -->
      <section class="achievement-section fade-in" style="animation-delay: 0.15s">
        <h3 class="section-title">我的成就</h3>
        <AchievementSystem />
      </section>

      <!-- 我的书架快捷入口 -->
      <section class="bookshelf-section fade-in" style="animation-delay: 0.2s">
        <div class="section-header">
          <h3 class="section-title">我的书架</h3>
          <button class="more-btn" @click="goToBookshelf">
            查看全部
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
        <div class="bookshelf-preview">
          <div v-for="book in recentBooks" :key="book.id" 
               class="book-item" @click="goToNovel(book.id)">
            <div class="book-cover" :style="{ background: book.coverGradient }">
              <h4 class="book-title">{{ book.title }}</h4>
            </div>
            <p class="book-progress">阅读至 {{ book.progress }}%</p>
          </div>
        </div>
      </section>

      <!-- 功能菜单 -->
      <section class="menu-section fade-in" style="animation-delay: 0.3s">
        <h3 class="section-title">功能菜单</h3>
        <div class="menu-grid">
          <button 
            v-for="item in menuItems" 
            :key="item.key"
            class="menu-item"
            @click="handleMenuClick(item.key)"
          >
            <div class="menu-icon" :style="{ background: item.gradient }">
              <component :is="item.icon" class="w-6 h-6" />
            </div>
            <span class="menu-label">{{ item.label }}</span>
            <svg class="menu-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </section>

      <!-- 账户设置 -->
      <section class="settings-section fade-in" style="animation-delay: 0.4s">
        <h3 class="section-title">账户设置</h3>
        <div class="settings-list">
          <button 
            v-for="item in settingItems" 
            :key="item.key"
            class="setting-item"
            @click="handleSettingClick(item.key)"
          >
            <div class="setting-info">
              <svg class="setting-icon" fill="currentColor" viewBox="0 0 20 20">
                <path :d="item.iconPath"></path>
              </svg>
              <span class="setting-label">{{ item.label }}</span>
            </div>
            <div class="setting-action">
              <span v-if="item.value" class="setting-value">{{ item.value }}</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </button>
        </div>
      </section>

      <!-- 退出登录按钮 -->
      <section class="logout-section fade-in" style="animation-delay: 0.5s">
        <button class="logout-btn" @click="handleLogout">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          退出登录
        </button>
      </section>
    </div>
    
    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useBookshelfStore } from '@/stores/bookshelf'
import AppHeader from '@/components/common/AppHeader.vue'
import BottomNav from '@/components/common/BottomNav.vue'
import ReadingStatsChart from '@/components/profile/ReadingStatsChart.vue'
import AchievementSystem from '@/components/profile/AchievementSystem.vue'

const router = useRouter()
const userStore = useUserStore()
const bookshelfStore = useBookshelfStore()

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 默认头像
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'

// 最近阅读的书籍
const recentBooks = ref([
  {
    id: 1,
    title: '时光里的温柔相遇',
    coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    progress: 35
  },
  {
    id: 2,
    title: '长安月下，归人未归',
    coverGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    progress: 60
  },
  {
    id: 3,
    title: '雨夜迷雾中的真相',
    coverGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    progress: 25
  }
])

// SVG 图标组件
const BookIcon = () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { d: 'M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z' })
])

const HistoryIcon = () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { 'fill-rule': 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z', 'clip-rule': 'evenodd' })
])

const HeartIcon = () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { 'fill-rule': 'evenodd', d: 'M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z', 'clip-rule': 'evenodd' })
])

const DownloadIcon = () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { 'fill-rule': 'evenodd', d: 'M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z', 'clip-rule': 'evenodd' })
])

const CommentIcon = () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { 'fill-rule': 'evenodd', d: 'M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z', 'clip-rule': 'evenodd' })
])

const CouponIcon = () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { 'fill-rule': 'evenodd', d: 'M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z', 'clip-rule': 'evenodd' })
])

// 功能菜单
const menuItems = ref([
  { 
    key: 'bookshelf', 
    label: '我的书架', 
    icon: BookIcon,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    key: 'history', 
    label: '阅读历史', 
    icon: HistoryIcon,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  { 
    key: 'favorites', 
    label: '我的收藏', 
    icon: HeartIcon,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  { 
    key: 'downloads', 
    label: '离线下载', 
    icon: DownloadIcon,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  { 
    key: 'comments', 
    label: '我的评论', 
    icon: CommentIcon,
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  { 
    key: 'coupons', 
    label: '优惠券', 
    icon: CouponIcon,
    gradient: 'linear-gradient(135deg, #fa8bff 0%, #2bd2ff 90%)'
  }
])

// 设置项
const settingItems = ref([
  {
    key: 'account',
    label: '账户信息',
    value: '',
    iconPath: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
  },
  {
    key: 'security',
    label: '账号安全',
    value: '',
    iconPath: 'M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
  },
  {
    key: 'notification',
    label: '消息通知',
    value: '已开启',
    iconPath: 'M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z'
  },
  {
    key: 'privacy',
    label: '隐私设置',
    value: '',
    iconPath: 'M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
  },
  {
    key: 'theme',
    label: '主题设置',
    value: '跟随系统',
    iconPath: 'M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z'
  },
  {
    key: 'about',
    label: '关于我们',
    value: '',
    iconPath: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
  }
])

// 格式化日期
function formatDate(timestamp) {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day} 加入`
}

// 头像加载错误处理
function handleAvatarError(e) {
  e.target.src = defaultAvatar
}

// 编辑头像
function handleEditAvatar() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        await userStore.uploadAvatar(file)
        // 可选：轻提示
        console.log('头像上传成功')
      } catch (error) {
        console.error('头像上传失败:', error)
      }
    }
  }
  input.click()
}

// 编辑资料
function handleEditProfile() {
  // TODO: 跳转到编辑资料页面
  console.log('编辑资料')
}

// 去书架
function goToBookshelf() {
  router.push('/bookshelf')
}

// 去小说详情
function goToNovel(id) {
  router.push(`/novel/${id}`)
}

// 菜单点击
function handleMenuClick(key) {
  switch (key) {
    case 'bookshelf':
      router.push('/bookshelf')
      break
    case 'history':
      console.log('阅读历史')
      break
    case 'favorites':
      console.log('我的收藏')
      break
    case 'downloads':
      console.log('离线下载')
      break
    case 'comments':
      console.log('我的评论')
      break
    case 'coupons':
      console.log('优惠券')
      break
    default:
      console.log('未知菜单:', key)
  }
}

// 设置点击
function handleSettingClick(key) {
  switch (key) {
    case 'account':
      console.log('账户信息')
      break
    case 'security':
      router.push('/security')
      break
    case 'notification':
      console.log('消息通知')
      break
    case 'privacy':
      console.log('隐私设置')
      break
    case 'theme':
      console.log('主题设置')
      break
    case 'about':
      console.log('关于我们')
      break
    default:
      console.log('未知设置:', key)
  }
}

// 退出登录
function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    router.push('/login')
  }
}

// 初始化
onMounted(async () => {
  // 如果未登录，跳转到登录页
  if (!userStore.isLogin) {
    router.push('/login')
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding-top: 4rem;
  padding-bottom: 5rem;
  background: var(--color-bg-primary);
}

@media (min-width: 768px) {
  .profile-page {
    padding-bottom: 2rem;
  }
}

.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}


/* 用户信息卡片 */
.user-info-section {
  margin: 2rem 0;
}

.user-card {
  position: relative;
  background: var(--color-bg-card);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px var(--color-shadow);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  opacity: 0.8;
}

.user-content {
  position: relative;
  padding: 2rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-container {
  position: relative;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid var(--color-bg-card);
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: 2px solid var(--color-bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-edit-btn:hover {
  transform: scale(1.1);
  background: var(--color-primary-dark);
}

.user-info {
  margin-bottom: 1rem;
}

.user-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.user-bio {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.user-meta {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.meta-item svg {
  width: 1rem;
  height: 1rem;
}

.edit-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-profile-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 统计卡片 */
.stats-section,
.bookshelf-section,
.menu-section,
.settings-section,
.logout-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px var(--color-shadow);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px var(--color-shadow);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

/* 书架预览 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.more-btn:hover {
  gap: 0.5rem;
}

.bookshelf-preview {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, 1fr);
}

.book-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.book-item:hover {
  transform: scale(1.05);
}

.book-cover {
  aspect-ratio: 3 / 4;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 4px 8px var(--color-shadow);
}

.book-title {
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
}

.book-progress {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
}

/* 功能菜单 */
.menu-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(1, 1fr);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-card);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  box-shadow: 0 2px 8px var(--color-shadow);
}

.menu-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px var(--color-shadow);
}

.menu-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.menu-label {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.menu-arrow {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* 设置列表 */
.settings-list {
  background: var(--color-bg-card);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--color-shadow);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: var(--color-bg-hover);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.setting-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-text-muted);
}

.setting-label {
  font-size: 0.9375rem;
  color: var(--color-text-primary);
}

.setting-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-value {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* 退出登录 */
.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-bg-card);
  color: #ef4444;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px var(--color-shadow);
}

.logout-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

/* 工具类 */
.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

/* 淡入动画 */
.fade-in {
  animation: fadeIn 0.8s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端优化 */
@media (max-width: 640px) {
  .main-content {
    padding: 0 0.75rem;
  }

  /* 用户信息卡片 */
  .user-info-section {
    margin: 1rem 0;
  }

  .user-card {
    border-radius: 1rem;
  }

  .card-background {
    height: 80px;
  }

  .user-content {
    padding: 1.5rem 1rem 1rem;
  }

  .avatar-container {
    margin-bottom: 0.75rem;
  }

  .user-avatar {
    width: 70px;
    height: 70px;
    border-width: 3px;
  }

  .avatar-edit-btn {
    width: 26px;
    height: 26px;
  }

  .avatar-edit-btn svg {
    width: 0.875rem;
    height: 0.875rem;
  }

  .user-info {
    margin-bottom: 0.75rem;
  }

  .user-name {
    font-size: 1.375rem;
    margin-bottom: 0.375rem;
  }

  .user-bio {
    font-size: 0.8125rem;
    margin-bottom: 0.75rem;
  }

  .user-meta {
    gap: 1rem;
  }

  .meta-item {
    font-size: 0.8125rem;
  }

  .edit-profile-btn {
    padding: 0.5rem 1.25rem;
    font-size: 0.8125rem;
  }

  /* 各区域间距 */
  .stats-section,
  .achievement-section,
  .bookshelf-section,
  .menu-section,
  .settings-section,
  .logout-section {
    margin-bottom: 1.25rem;
  }

  .section-title {
    font-size: 1.0625rem;
    margin-bottom: 0.75rem;
  }

  /* 书架预览 */
  .bookshelf-preview {
    gap: 0.5rem;
    grid-template-columns: repeat(3, 1fr);
  }

  .book-cover {
    padding: 0.5rem;
    margin-bottom: 0.375rem;
    border-radius: 0.375rem;
  }

  .book-title {
    font-size: 0.75rem;
  }

  .book-progress {
    font-size: 0.6875rem;
  }

  /* 功能菜单 - 改为一列4个 */
  .menu-grid {
    gap: 0.5rem;
    grid-template-columns: repeat(4, 1fr);
  }

  .menu-item {
    padding: 0.625rem 0.375rem;
    flex-direction: column;
    gap: 0.375rem;
    border-radius: 0.75rem;
    text-align: center;
  }

  .menu-item:hover {
    transform: translateY(-2px);
  }

  .menu-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .menu-icon svg {
    width: 1.125rem;
    height: 1.125rem;
  }

  .menu-label {
    font-size: 0.6875rem;
    line-height: 1.2;
  }

  .menu-arrow {
    display: none;
  }

  /* 设置列表 */
  .setting-item {
    padding: 0.875rem 1rem;
  }

  .setting-info {
    gap: 0.625rem;
  }

  .setting-icon {
    width: 1.125rem;
    height: 1.125rem;
  }

  .setting-label {
    font-size: 0.875rem;
  }

  .setting-value {
    font-size: 0.8125rem;
  }

  /* 退出登录 */
  .logout-btn {
    padding: 0.875rem;
    font-size: 0.875rem;
    border-radius: 0.75rem;
  }

  /* 触摸反馈 */
  .menu-item:active {
    transform: scale(0.95);
  }

  .setting-item:active {
    background: var(--color-bg-hover);
  }

  .logout-btn:active {
    transform: scale(0.98);
  }

  .book-item:active {
    transform: scale(0.98);
  }
}
</style>

