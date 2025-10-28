<template>
  <div class="security-page">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <div class="main-content">
      <!-- 页面标题 -->
      <div class="page-header fade-in">
        <button class="back-btn" @click="goBack">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 class="page-title">账号安全</h1>
      </div>

      <!-- 安全设置内容 -->
      <div class="security-content fade-in" style="animation-delay: 0.1s">
        <SecuritySettings />
      </div>
    </div>
    
    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import BottomNav from '@/components/common/BottomNav.vue'
import SecuritySettings from '@/components/profile/SecuritySettings.vue'

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<style scoped>
.security-page {
  min-height: 100vh;
  padding-top: 4rem;
  padding-bottom: 5rem;
  background: var(--color-bg-primary);
}

@media (min-width: 768px) {
  .security-page {
    padding-bottom: 2rem;
  }
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 1.5rem;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--color-text-primary);
}

.back-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  transform: scale(1.05);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.security-content {
  margin-top: 1.5rem;
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

/* 工具类 */
.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}
</style>

