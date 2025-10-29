<template>
  <div class="search-page">
    <div class="max-w-7xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="page-title"><i class="bi bi-search icon-xl"></i> 搜索</h1>
        <p class="page-subtitle">发现你想要的好书</p>
      </div>

      <!-- 搜索栏 -->
      <div class="mb-8">
        <SearchBar
          v-model="keyword"
          :suggestions="suggestions"
          :loading="suggestLoading"
          @search="handleSearch"
          @suggest="handleSuggest"
        />
      </div>

      <!-- 未搜索状态 -->
      <div v-if="!hasSearched">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- 搜索历史 -->
          <div class="lg:col-span-2">
            <SearchHistory
              :history="searchHistory"
              @select="handleHistorySelect"
              @delete="handleDeleteHistory"
              @clear="handleClearHistory"
            />
          </div>

          <!-- 热门搜索 -->
          <div class="lg:col-span-1">
            <HotSearch
              :hotList="hotSearchList"
              @select="handleHotSelect"
            />
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-else>
        <SearchResult
          :results="searchResults"
          :total="totalResults"
          :loading="searchLoading"
          :view="viewMode"
          :sortBy="sortBy"
          :filters="filters"
          :currentPage="currentPage"
          :pageSize="pageSize"
          @click="handleNovelClick"
          @read="handleRead"
          @add-shelf="handleAddToShelf"
          @view-change="handleViewChange"
          @sort-change="handleSortChange"
          @filter-change="handleFilterChange"
          @reset-filters="handleResetFilters"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBookshelfStore } from '@/stores/bookshelf'
import SearchBar from '@/components/search/SearchBar.vue'
import SearchHistory from '@/components/search/SearchHistory.vue'
import HotSearch from '@/components/search/HotSearch.vue'
import SearchResult from '@/components/search/SearchResult.vue'
import {
  getSearchSuggest,
  searchNovels,
  getHotSearch,
  getSearchHistory,
  saveSearchHistory,
  deleteSearchHistory,
  clearSearchHistory
} from '@/api/search'

const router = useRouter()
const route = useRoute()
const bookshelfStore = useBookshelfStore()

const keyword = ref('')
const suggestions = ref([])
const suggestLoading = ref(false)
const searchHistory = ref([])
const hotSearchList = ref([])
const hasSearched = ref(false)
const searchResults = ref([])
const totalResults = ref(0)
const searchLoading = ref(false)
const viewMode = ref('grid')
const sortBy = ref('relevance')
const filters = ref({
  category: '',
  status: '',
  wordCount: ''
})
const currentPage = ref(1)
const pageSize = ref(20)

// 获取搜索建议
async function handleSuggest(kw) {
  if (!kw || kw.length < 2) {
    suggestions.value = []
    return
  }

  suggestLoading.value = true
  try {
    const res = await getSearchSuggest(kw)
    if (res.code === 200) {
      suggestions.value = res.data
    }
  } catch (err) {
    console.error('获取搜索建议失败:', err)
    // 使用模拟数据
    suggestions.value = getMockSuggestions(kw)
  } finally {
    suggestLoading.value = false
  }
}

// 执行搜索
async function handleSearch(kw) {
  if (!kw || !kw.trim()) return

  keyword.value = kw
  currentPage.value = 1
  hasSearched.value = true
  
  // 保存搜索历史
  searchHistory.value = saveSearchHistory(kw)

  // 执行搜索
  await performSearch()
}

// 执行搜索请求
async function performSearch() {
  searchLoading.value = true
  try {
    const params = {
      keyword: keyword.value,
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      ...filters.value
    }

    const res = await searchNovels(params)
    if (res.code === 200) {
      // 适配后端返回格式：data 直接是数组，pagination 在外层
      searchResults.value = Array.isArray(res.data) ? res.data : (res.data.list || [])
      totalResults.value = res.pagination ? res.pagination.total : (res.data.total || 0)
    }
  } catch (err) {
    console.error('搜索失败:', err)
    // 使用模拟数据
    const mockData = getMockSearchResults()
    searchResults.value = mockData.list
    totalResults.value = mockData.total
  } finally {
    searchLoading.value = false
  }
}

// 选择历史记录
function handleHistorySelect(item) {
  keyword.value = item
  handleSearch(item)
}

// 删除历史记录
function handleDeleteHistory(item) {
  searchHistory.value = deleteSearchHistory(item)
}

// 清空历史记录
function handleClearHistory() {
  searchHistory.value = clearSearchHistory()
}

// 选择热门搜索
function handleHotSelect(item) {
  keyword.value = item
  handleSearch(item)
}

// 点击小说
function handleNovelClick(novel) {
  router.push(`/novel/${novel.id}`)
}

// 阅读
function handleRead(novel) {
  router.push(`/read/${novel.id}/1`)
}

// 加入书架
async function handleAddToShelf(novel) {
  const success = await bookshelfStore.addBook(novel, 'reading')
  if (success) {
    alert('已加入书架')
  } else {
    alert('加入书架失败')
  }
}

// 切换视图
function handleViewChange(mode) {
  viewMode.value = mode
}

// 排序变化
async function handleSortChange(sort) {
  sortBy.value = sort
  currentPage.value = 1
  await performSearch()
}

// 筛选变化
async function handleFilterChange(key, value) {
  filters.value[key] = value
  currentPage.value = 1
  await performSearch()
}

// 重置筛选
async function handleResetFilters() {
  filters.value = {
    category: '',
    status: '',
    wordCount: ''
  }
  currentPage.value = 1
  await performSearch()
}

// 分页变化
async function handlePageChange(page) {
  currentPage.value = page
  await performSearch()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 获取热门搜索
async function fetchHotSearch() {
  try {
    const res = await getHotSearch()
    if (res.code === 200) {
      hotSearchList.value = res.data
    }
  } catch (err) {
    console.error('获取热门搜索失败:', err)
    hotSearchList.value = getMockHotSearch()
  }
}

// 模拟数据
function getMockSuggestions(kw) {
  return [
    `${kw} 小说`,
    `${kw} 全本`,
    `${kw} 最新`,
    `${kw} 完结`,
    `${kw} 热门`
  ]
}

function getMockSearchResults() {
  const list = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `搜索结果 ${i + 1} - ${keyword.value}`,
    author: `作者 ${i + 1}`,
    cover: `https://picsum.photos/300/400?random=${i + 100}`,
    description: `这是关于"${keyword.value}"的搜索结果，这本小说讲述了一个精彩的故事，情节跌宕起伏，引人入胜。`,
    rating: (7 + Math.random() * 2).toFixed(1),
    wordCount: Math.floor(Math.random() * 2000000) + 500000,
    status: i % 3 === 0 ? 'finished' : 'ongoing',
    category: ['玄幻', '仙侠', '都市', '科幻', '历史'][Math.floor(Math.random() * 5)]
  }))

  return {
    list,
    total: 150
  }
}

function getMockHotSearch() {
  return [
    { keyword: '剑来', count: 128000, hot: true, trend: 'up' },
    { keyword: '诡秘之主', count: 95000, hot: true, trend: 'up' },
    { keyword: '雪中悍刀行', count: 87000, hot: false, trend: 'stable' },
    { keyword: '龙族', count: 76000, hot: false, trend: 'down' },
    { keyword: '斗破苍穹', count: 68000, hot: false, trend: 'up' },
    { keyword: '凡人修仙传', count: 54000, isNew: true, trend: 'up' },
    { keyword: '择天记', count: 43000, hot: false, trend: 'stable' },
    { keyword: '庆余年', count: 38000, hot: false, trend: 'down' },
    { keyword: '斗罗大陆', count: 32000, hot: false, trend: 'stable' },
    { keyword: '完美世界', count: 28000, hot: false, trend: 'up' }
  ]
}

// 初始化
onMounted(async () => {
  // 从URL获取搜索关键词
  const queryKeyword = route.query.keyword
  if (queryKeyword) {
    keyword.value = queryKeyword
    await handleSearch(queryKeyword)
  }

  // 加载搜索历史和热门搜索
  searchHistory.value = getSearchHistory()
  await fetchHotSearch()
})
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: var(--color-bg-card);
  padding: 1rem;
}

@media (min-width: 768px) {
  .search-page {
    padding: 2rem;
  }
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: var(--color-text-secondary);
}
</style>

