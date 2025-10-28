<template>
  <nav class="breadcrumb" aria-label="面包屑导航">
    <ol class="breadcrumb-list">
      <!-- 首页 -->
      <li class="breadcrumb-item">
        <router-link to="/" class="breadcrumb-link">
          <svg class="icon-home" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
          </svg>
          <span>首页</span>
        </router-link>
      </li>
      
      <!-- 动态面包屑 -->
      <li
        v-for="(item, index) in breadcrumbs"
        :key="index"
        class="breadcrumb-item"
      >
        <span class="breadcrumb-separator" aria-hidden="true">/</span>
        
        <router-link
          v-if="index < breadcrumbs.length - 1"
          :to="item.path"
          class="breadcrumb-link"
        >
          {{ item.title }}
        </router-link>
        
        <span
          v-else
          class="breadcrumb-current"
          aria-current="page"
        >
          {{ item.title }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 根据路由自动生成面包屑
const breadcrumbs = computed(() => {
  const items = []
  
  // 根据当前路由生成面包屑
  if (route.path === '/') {
    return []
  }
  
  // 小说详情
  if (route.name === 'novel-detail') {
    items.push(
      { title: '小说', path: '/' },
      { title: route.meta.title || '详情', path: route.path }
    )
  }
  
  // 阅读页
  if (route.name === 'reading') {
    items.push(
      { title: '小说', path: '/' },
      { title: '阅读', path: route.path }
    )
  }
  
  // 书架
  if (route.name === 'bookshelf') {
    items.push(
      { title: '书架', path: route.path }
    )
  }
  
  // 搜索
  if (route.name === 'search') {
    items.push(
      { title: '搜索', path: route.path }
    )
  }
  
  // 个人中心
  if (route.name === 'profile') {
    items.push(
      { title: '我的', path: route.path }
    )
  }
  
  // 推荐
  if (route.name === 'recommend') {
    items.push(
      { title: '推荐', path: route.path }
    )
  }
  
  return items
})
</script>

<style scoped>
.breadcrumb {
  padding: 1rem;
  background: var(--color-bg-elevated, #ffffff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 1280px;
  margin: 0 auto;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: var(--color-primary);
}

.icon-home {
  width: 16px;
  height: 16px;
}

.breadcrumb-separator {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  user-select: none;
}

.breadcrumb-current {
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .breadcrumb {
    padding: 0.75rem 1rem;
  }
  
  .breadcrumb-link,
  .breadcrumb-current,
  .breadcrumb-separator {
    font-size: 0.8125rem;
  }
  
  .icon-home {
    width: 14px;
    height: 14px;
  }
}
</style>

