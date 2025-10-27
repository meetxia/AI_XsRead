<template>
  <div class="search-result">
    <!-- 搜索结果头部 -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-gray-800">
          找到 <span class="text-blue-600">{{ total }}</span> 个结果
        </h3>
        
        <div class="flex items-center space-x-4">
          <!-- 视图切换 -->
          <div class="view-toggle flex bg-gray-100 rounded-lg p-1">
            <button
              @click="$emit('view-change', 'grid')"
              :class="[
                'p-2 rounded transition-all',
                view === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              @click="$emit('view-change', 'list')"
              :class="[
                'p-2 rounded transition-all',
                view === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-400'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <!-- 排序 -->
          <select
            :value="sortBy"
            @change="$emit('sort-change', $event.target.value)"
            class="px-4 py-2 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">相关度</option>
            <option value="popular">热门</option>
            <option value="rating">评分</option>
            <option value="newest">最新</option>
          </select>
        </div>
      </div>

      <!-- 筛选器 -->
      <div class="flex flex-wrap gap-2">
        <select
          :value="filters.category"
          @change="$emit('filter-change', 'category', $event.target.value)"
          class="px-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部分类</option>
          <option value="xuanhuan">玄幻</option>
          <option value="xianxia">仙侠</option>
          <option value="dushi">都市</option>
          <option value="kehuan">科幻</option>
          <option value="lishi">历史</option>
          <option value="wuxia">武侠</option>
        </select>

        <select
          :value="filters.status"
          @change="$emit('filter-change', 'status', $event.target.value)"
          class="px-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="ongoing">连载中</option>
          <option value="finished">已完结</option>
        </select>

        <select
          :value="filters.wordCount"
          @change="$emit('filter-change', 'wordCount', $event.target.value)"
          class="px-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">字数不限</option>
          <option value="0-300000">30万字以下</option>
          <option value="300000-1000000">30-100万字</option>
          <option value="1000000-9999999">100万字以上</option>
        </select>

        <!-- 重置筛选 -->
        <button
          v-if="hasFilters"
          @click="$emit('reset-filters')"
          class="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition-colors"
        >
          重置筛选
        </button>
      </div>
    </div>

    <!-- 搜索结果列表 -->
    <div v-if="loading" class="text-center py-20">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p class="text-gray-500 mt-4">搜索中...</p>
    </div>

    <div v-else-if="results.length === 0" class="text-center py-20">
      <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-gray-500 text-lg">未找到相关结果</p>
      <p class="text-gray-400 text-sm mt-2">试试其他关键词吧</p>
    </div>

    <div v-else>
      <!-- 网格视图 -->
      <div v-if="view === 'grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <NovelCard
          v-for="novel in results"
          :key="novel.id"
          :novel="novel"
          @click="$emit('click', novel)"
          @read="$emit('read', novel)"
          @add-shelf="$emit('add-shelf', novel)"
        />
      </div>

      <!-- 列表视图 -->
      <div v-else class="space-y-3">
        <div
          v-for="novel in results"
          :key="novel.id"
          @click="$emit('click', novel)"
          class="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 cursor-pointer flex items-center group"
        >
          <!-- 封面 -->
          <div class="flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden bg-gray-100">
            <img
              v-if="novel.cover"
              :src="novel.cover"
              :alt="novel.title"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
              {{ novel.title.charAt(0) }}
            </div>
          </div>

          <!-- 信息 -->
          <div class="flex-1 ml-4 min-w-0">
            <h4 class="font-semibold text-lg text-gray-800 truncate group-hover:text-blue-600 transition-colors">
              {{ novel.title }}
            </h4>
            <p class="text-sm text-gray-500 mb-2">{{ novel.author }}</p>
            <p class="text-sm text-gray-600 line-clamp-2 mb-2">{{ novel.description }}</p>
            <div class="flex items-center space-x-4 text-xs text-gray-400">
              <span class="flex items-center">
                <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {{ novel.rating }}
              </span>
              <span>{{ formatWordCount(novel.wordCount) }}</span>
              <span>{{ novel.status === 'finished' ? '完结' : '连载中' }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click.stop="$emit('add-shelf', novel)"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              加入书架
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex justify-center items-center space-x-2 mt-8">
        <button
          @click="$emit('page-change', currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一页
        </button>
        
        <div class="flex space-x-2">
          <button
            v-for="page in displayPages"
            :key="page"
            @click="page !== '...' && $emit('page-change', page)"
            :class="[
              'px-4 py-2 rounded-lg transition-all',
              page === currentPage
                ? 'bg-blue-500 text-white shadow-lg'
                : page === '...'
                ? 'bg-white cursor-default'
                : 'bg-white hover:shadow-md'
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="$emit('page-change', currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import NovelCard from '@/components/novel/NovelCard.vue'

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  view: {
    type: String,
    default: 'grid'
  },
  sortBy: {
    type: String,
    default: 'relevance'
  },
  filters: {
    type: Object,
    default: () => ({})
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 20
  }
})

defineEmits(['click', 'read', 'add-shelf', 'view-change', 'sort-change', 'filter-change', 'reset-filters', 'page-change'])

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const hasFilters = computed(() => {
  return props.filters.category || props.filters.status || props.filters.wordCount
})

const displayPages = computed(() => {
  const pages = []
  const maxDisplay = 7
  const current = props.currentPage
  const total = totalPages.value

  if (total <= maxDisplay) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

function formatWordCount(count) {
  if (!count) return '0字'
  if (count > 10000) {
    return `${(count / 10000).toFixed(1)}万字`
  }
  return `${count}字`
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

