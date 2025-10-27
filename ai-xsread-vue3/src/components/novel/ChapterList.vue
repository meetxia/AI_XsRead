<template>
  <div class="chapter-list">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-bold text-gray-900">
        章节目录
        <span class="text-sm text-gray-500 font-normal ml-2">(共{{ totalChapters }}章)</span>
      </h3>
      <div class="flex items-center space-x-3">
        <!-- 搜索章节 -->
        <div v-if="showSearch" class="relative">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索章节..."
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-64"
          />
          <button 
            @click="showSearch = false; searchKeyword = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button 
          v-else
          @click="showSearch = true"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="搜索章节"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        
        <!-- 排序切换 -->
        <button 
          @click="toggleOrder"
          class="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
        >
          <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="isAscending ? 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12' : 'M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4'" />
          </svg>
          {{ isAscending ? '正序' : '倒序' }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 10" :key="i" class="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
    </div>

    <!-- 章节列表 -->
    <div v-else-if="filteredChapters.length > 0" class="chapter-content">
      <!-- 分组显示 -->
      <div v-for="group in groupedChapters" :key="group.groupIndex" class="mb-6">
        <div 
          @click="toggleGroup(group.groupIndex)"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-2"
        >
          <h4 class="font-semibold text-gray-700">
            第{{ group.start }}-{{ group.end }}章
            <span class="text-sm text-gray-500 ml-2">({{ group.chapters.length }}章)</span>
          </h4>
          <svg 
            class="w-5 h-5 text-gray-500 transition-transform"
            :class="{ 'rotate-180': expandedGroups.includes(group.groupIndex) }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <div 
          v-show="expandedGroups.includes(group.groupIndex)"
          class="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          <div
            v-for="chapter in group.chapters"
            :key="chapter.id"
            @click="selectChapter(chapter)"
            class="chapter-item p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group"
            :class="{
              'bg-blue-50 border-blue-400': chapter.isRead,
              'border-red-400 bg-red-50': chapter.isLatest
            }"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium text-gray-500">第{{ chapter.chapterNumber }}章</span>
                  <span 
                    v-if="chapter.isVip" 
                    class="px-1.5 py-0.5 bg-yellow-100 text-yellow-600 text-xs rounded"
                  >
                    VIP
                  </span>
                  <span 
                    v-if="chapter.isLatest" 
                    class="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded"
                  >
                    最新
                  </span>
                  <svg 
                    v-if="chapter.isRead"
                    class="w-4 h-4 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <h5 
                  class="text-gray-800 group-hover:text-blue-600 transition-colors truncate mt-1"
                  :class="{ 'font-semibold': chapter.isLatest }"
                  v-html="highlightKeyword(chapter.title)"
                >
                </h5>
              </div>
              <div class="flex-shrink-0 text-right ml-4">
                <div class="text-xs text-gray-400">{{ formatWordCount(chapter.wordCount) }}</div>
                <div class="text-xs text-gray-400">{{ formatDate(chapter.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="py-20 text-center">
      <div class="text-gray-400 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="text-gray-500">{{ searchKeyword ? '未找到匹配的章节' : '暂无章节' }}</p>
    </div>

    <!-- 底部分页 -->
    <div v-if="totalChapters > 50 && !searchKeyword" class="flex justify-center mt-6">
      <button
        @click="loadMore"
        v-if="hasMore"
        class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        加载更多
      </button>
      <div v-else class="text-gray-400 text-sm">
        已显示全部章节
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getChapterList } from '@/api/novel'

const props = defineProps({
  novelId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['select-chapter'])

const chapters = ref([])
const loading = ref(true)
const isAscending = ref(true)
const showSearch = ref(false)
const searchKeyword = ref('')
const expandedGroups = ref([0]) // 默认展开第一组
const page = ref(1)
const pageSize = ref(100)
const totalChapters = ref(0)

// 过滤后的章节
const filteredChapters = computed(() => {
  let result = [...chapters.value]
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(chapter => 
      chapter.title.toLowerCase().includes(keyword) ||
      chapter.chapterNumber.toString().includes(keyword)
    )
  }
  
  // 排序
  result.sort((a, b) => {
    return isAscending.value 
      ? a.chapterNumber - b.chapterNumber 
      : b.chapterNumber - a.chapterNumber
  })
  
  return result
})

// 分组章节（每50章一组）
const groupedChapters = computed(() => {
  const groups = []
  const groupSize = 50
  
  for (let i = 0; i < filteredChapters.value.length; i += groupSize) {
    const groupChapters = filteredChapters.value.slice(i, i + groupSize)
    if (groupChapters.length > 0) {
      groups.push({
        groupIndex: Math.floor(i / groupSize),
        start: groupChapters[0].chapterNumber,
        end: groupChapters[groupChapters.length - 1].chapterNumber,
        chapters: groupChapters
      })
    }
  }
  
  return groups
})

// 是否还有更多
const hasMore = computed(() => {
  return chapters.value.length < totalChapters.value
})

// 加载章节列表
async function loadChapterList() {
  try {
    loading.value = true
    const res = await getChapterList(props.novelId, {
      page: page.value,
      pageSize: pageSize.value
    })
    
    if (page.value === 1) {
      chapters.value = res.data.list || res.data
    } else {
      chapters.value = [...chapters.value, ...(res.data.list || res.data)]
    }
    
    totalChapters.value = res.data.total || chapters.value.length
    
    // 标记已读章节
    markReadChapters()
    
    // 标记最新章节
    if (chapters.value.length > 0) {
      const latestChapter = chapters.value.reduce((latest, current) => 
        current.chapterNumber > latest.chapterNumber ? current : latest
      )
      latestChapter.isLatest = true
    }
  } catch (err) {
    console.error('加载章节列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 标记已读章节
function markReadChapters() {
  const readChapters = JSON.parse(localStorage.getItem(`read_chapters_${props.novelId}`) || '[]')
  chapters.value.forEach(chapter => {
    chapter.isRead = readChapters.includes(chapter.id)
  })
}

// 切换排序
function toggleOrder() {
  isAscending.value = !isAscending.value
}

// 切换分组展开/收起
function toggleGroup(groupIndex) {
  const index = expandedGroups.value.indexOf(groupIndex)
  if (index > -1) {
    expandedGroups.value.splice(index, 1)
  } else {
    expandedGroups.value.push(groupIndex)
  }
}

// 选择章节
function selectChapter(chapter) {
  emit('select-chapter', chapter.id)
  
  // 记录已读
  const readChapters = JSON.parse(localStorage.getItem(`read_chapters_${props.novelId}`) || '[]')
  if (!readChapters.includes(chapter.id)) {
    readChapters.push(chapter.id)
    localStorage.setItem(`read_chapters_${props.novelId}`, JSON.stringify(readChapters))
  }
}

// 加载更多
function loadMore() {
  page.value++
  loadChapterList()
}

// 高亮关键词
function highlightKeyword(text) {
  if (!searchKeyword.value) return text
  const regex = new RegExp(`(${searchKeyword.value})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}

// 格式化字数
function formatWordCount(count) {
  if (!count) return ''
  if (count > 10000) {
    return `${(count / 10000).toFixed(1)}万字`
  }
  return `${count}字`
}

// 格式化日期
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${d.getMonth() + 1}-${d.getDate()}`
}

// 监听搜索关键词
watch(searchKeyword, (newVal) => {
  if (newVal) {
    // 展开所有分组以便搜索
    expandedGroups.value = groupedChapters.value.map(g => g.groupIndex)
  }
})

onMounted(() => {
  loadChapterList()
})
</script>

<style scoped>
.chapter-item {
  transition: all 0.2s ease;
}

.chapter-item:hover {
  transform: translateX(4px);
}

mark {
  padding: 0 2px;
  border-radius: 2px;
}
</style>

