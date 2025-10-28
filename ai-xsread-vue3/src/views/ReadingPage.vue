<template>
  <div class="reading-page" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部工具栏 -->
    <div class="reading-header" :class="{ 'show': showHeader }">
      <button class="back-btn" @click="goBack">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="header-info flex-1">
        <h1 class="novel-title">{{ novelTitle }}</h1>
        <p class="chapter-title">{{ headerSubTitle }}</p>
      </div>
      <button class="menu-btn" @click="showSettings = !showSettings">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/>
        </svg>
      </button>
    </div>

    <!-- 阅读内容区 -->
    <div 
      ref="contentArea"
      class="reading-content" 
      :class="{ 'dark-content': isContentDark }"
      :style="contentStyle"
      @click="toggleToolbar"
      @scroll="handleScroll"
    >
      <div class="chapter-container" v-if="!loading && chapterContent">
        <!-- 标题：只在多章节时显示章节标题 -->
        <h2 v-if="totalChapters > 1" class="chapter-heading">{{ chapterContent.title }}</h2>
        <h2 v-else class="novel-heading">{{ novelTitle }}</h2>
        
        <!-- 元信息（分页或章节模式通用） -->
        <div class="chapter-meta" v-if="displayWordCount || displayUpdatedAt">
          <span v-if="displayWordCount">字数：{{ displayWordCount }}</span>
          <span v-if="displayUpdatedAt">更新时间：{{ displayUpdatedAt }}</span>
        </div>
        
        <!-- 正文内容 -->
        <div class="chapter-text" v-html="formattedContent"></div>
        
        <!-- 章节导航：仅在确有章节时显示 -->
        <div v-if="chapterList.length > 1" class="chapter-nav">
          <button 
            class="nav-btn prev-btn"
            @click.stop="loadPrevChapter"
            :disabled="!hasPrevChapter"
          >
            上一章
          </button>
          <button 
            class="nav-btn catalog-btn"
            @click.stop="showCatalog = true"
          >
            目录
          </button>
          <button 
            class="nav-btn next-btn"
            @click.stop="loadNextChapter"
            :disabled="!hasNextChapter"
          >
            下一章
          </button>
        </div>
        
        <!-- 单章节/短篇：显示三按钮（上一页/下一页/返回首页） -->
        <div v-if="chapterList.length <= 1" class="single-chapter-nav">
          <button class="nav-btn prev-btn" @click.stop="prevPage" :disabled="!hasPrevPage">
            上一页
          </button>
          <button class="nav-btn next-btn" @click.stop="nextPage" :disabled="!hasNextPage">
            下一页
          </button>
          <button class="nav-btn back-to-detail" @click.stop="goHome">
            返回首页
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="retryLoad" class="retry-btn">重试</button>
      </div>
      
      <!-- 评论区：正文末尾展示 -->
      <div v-if="!loading" class="comments-wrapper">
        <CommentSection :novel-id="novelId" />
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="reading-footer" :class="{ 'show': showFooter }">
      <!-- 进度条：章节模式 -->
      <div v-if="totalChapters > 1" class="progress-bar">
        <input 
          type="range" 
          min="1" 
          :max="totalChapters" 
          v-model="currentChapterNumber"
          @change="onChapterChange"
          class="progress-slider"
        >
        <span class="progress-text">{{ currentChapterNumber }} / {{ totalChapters }}</span>
      </div>

      <!-- 进度条：无章节分页模式 -->
      <div v-else-if="totalPages > 1" class="progress-bar">
        <input
          type="range"
          min="1"
          :max="totalPages"
          v-model="currentPage"
          @change="onPageChange"
          class="progress-slider"
        >
        <span class="progress-text">{{ currentPage }} / {{ totalPages }}</span>
      </div>
      
      <div class="toolbar-actions" :class="{ 'single-row': totalChapters <= 1 && totalPages <= 1 }">
        <button v-if="chapterList.length > 1" @click.stop="showCatalog = true" class="action-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
          </svg>
          <span>目录</span>
        </button>
        <button @click.stop="toggleDarkMode" class="action-btn">
          <svg v-if="!isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          <span>{{ isDarkMode ? '日间' : '夜间' }}</span>
        </button>
        <button @click.stop="showSettings = true" class="action-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span>设置</span>
        </button>
        <button @click.stop="addToBookshelf" class="action-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
          </svg>
          <span>书架</span>
        </button>
      </div>
    </div>

    <!-- 目录抽屉：只在多章节时显示 -->
    <Teleport to="body">
      <div v-if="showCatalog && totalChapters > 1" class="catalog-drawer" @click.self="showCatalog = false">
        <div class="catalog-content">
          <div class="catalog-header">
            <h3>目录 (共{{ totalChapters }}章)</h3>
            <button @click="showCatalog = false" class="close-btn">×</button>
          </div>
          <div class="catalog-list">
            <div 
              v-for="chapter in chapterList" 
              :key="chapter.id"
              class="catalog-item"
              :class="{ 'active': chapter.id === currentChapterId }"
              @click="selectChapter(chapter.id)"
            >
              <span class="chapter-num">{{ chapter.chapter_number }}</span>
              <span class="chapter-name">{{ chapter.title }}</span>
              <span v-if="!chapter.is_free" class="vip-badge">VIP</span>
            </div>
            <div v-if="loadingChapters" class="loading-more">加载中...</div>
            <div v-if="chapterList.length === 0 && !loadingChapters" class="empty-catalog">
              <p>暂无章节</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 设置面板 -->
    <Teleport to="body">
      <div v-if="showSettings" :class="['settings-drawer', { 'dark-mode': isDarkMode }]" @click.self="showSettings = false">
        <div class="settings-content">
          <div class="settings-header">
            <h3>阅读设置</h3>
            <button @click="showSettings = false" class="close-btn">×</button>
          </div>
          <div class="settings-body">
            <!-- 字体大小 -->
            <div class="setting-item">
              <label>字体大小</label>
              <div class="size-control">
                <button @click="decreaseFontSize">A-</button>
                <span>{{ fontSize }}px</span>
                <button @click="increaseFontSize">A+</button>
              </div>
            </div>
            <!-- 行间距 -->
            <div class="setting-item">
              <label>行间距</label>
              <div class="size-control">
                <button @click="decreaseLineHeight">-</button>
                <span>{{ lineHeight }}</span>
                <button @click="increaseLineHeight">+</button>
              </div>
            </div>
            <!-- 背景色 -->
            <div class="setting-item">
              <label>背景色</label>
              <div class="color-palette">
                <button 
                  v-for="color in bgColors" 
                  :key="color.value"
                  class="color-btn"
                  :style="{ backgroundColor: color.value }"
                  :class="{ 'active': bgColor === color.value }"
                  @click="bgColor = color.value"
                ></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- 首次引导：提示点击中间可显示/隐藏工具栏 -->
    <Teleport to="body">
      <div v-if="showGuide" class="guide-overlay" @click="dismissGuide">
        <div class="guide-content">
          <div class="guide-pulse"></div>
          <p class="guide-text">轻触屏幕中间，可显示/隐藏顶部与底部工具栏</p>
          <button class="guide-btn" @click.stop="dismissGuide">我知道了</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNovelDetail, getChapterList, getChapterContent, getNovelPages } from '@/api/novel'
import CommentSection from '@/components/novel/CommentSection.vue'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const router = useRouter()

// 小说信息
const novelId = ref(route.params.id)
const novelTitle = ref('')
const chapterList = ref([])
const totalChapters = ref(0)

// 章节信息
const currentChapterId = ref(null)
const currentChapterNumber = ref(1)
const currentChapterTitle = ref('')
const chapterContent = ref(null)
// 无章节分页（3000字）
const pageSize = ref(3000)
const currentPage = ref(1)
const totalPages = ref(1)

// UI 状态
const loading = ref(false)
const loadingChapters = ref(false)
const error = ref(null)
const showHeader = ref(true)
const showFooter = ref(true)
const showCatalog = ref(false)
const showSettings = ref(false)
const contentArea = ref(null)

// 首次引导
const showGuide = ref(false)
function dismissGuide() {
  showGuide.value = false
  try { localStorage.setItem('reading_guide_seen', '1') } catch (e) {}
}

// 阅读设置（与全局主题同步）
const { currentMode, toggleMode } = useTheme()
const isDarkMode = computed(() => currentMode.value === 'dark')
const fontSize = ref(18)
const lineHeight = ref(1.8)
const bgColor = ref('')

const bgColors = [
  { name: '米白', value: '#f5f5f5' },
  { name: '护眼绿', value: '#e8f5e9' },
  { name: '淡黄', value: '#fffde7' },
  { name: '浅蓝', value: '#e3f2fd' },
  { name: '暗色', value: '#2d2d2d' }
]

// 计算属性
function isHexDark(hex) {
  if (!hex || typeof hex !== 'string') return false
  const c = hex.replace('#', '')
  if (c.length !== 6 && c.length !== 3) return false
  const parse = (h) => parseInt(h.length === 1 ? h + h : h, 16)
  const r = parse(c.substring(0, c.length === 3 ? 1 : 2))
  const g = parse(c.substring(c.length === 3 ? 1 : 2, c.length === 3 ? 2 : 4))
  const b = parse(c.substring(c.length === 3 ? 2 : 4))
  // 相对亮度 (WCAG)
  const [R, G, B] = [r, g, b].map(v => {
    const srgb = v / 255
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4)
  })
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B
  return luminance < 0.35
}

const isContentDark = computed(() => {
  return isDarkMode.value || (!!bgColor.value && isHexDark(bgColor.value))
})

const contentStyle = computed(() => {
  const textColor = isContentDark.value ? '#e6e6e6' : 'var(--color-text-primary)'
  return {
    fontSize: `${fontSize.value}px`,
    lineHeight: lineHeight.value,
    backgroundColor: bgColor.value || 'var(--color-bg-elevated)',
    color: textColor
  }
})

const formattedContent = computed(() => {
  const raw = chapterContent.value?.content || ''
  return raw
    .split('\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('')
})

// 顶部副标题（章节标题或分页信息）
const headerSubTitle = computed(() => {
  if (chapterList.value.length > 1 && currentChapterTitle.value) return currentChapterTitle.value
  return `第 ${currentPage.value} / ${totalPages.value} 页`
})

// 展示的字数/更新时间（分页模式优先）
const displayWordCount = computed(() => {
  const raw = chapterContent.value?.content || ''
  if (!raw) return 0
  return raw.length
})

const displayUpdatedAt = computed(() => {
  // 分页内容没有更新时间，显示小说更新时间（已从详情中获取）
  if (!chapterContent.value?.updated_at) return ''
  return formatDate(chapterContent.value.updated_at)
})

const hasPrevChapter = computed(() => currentChapterNumber.value > 1)
const hasNextChapter = computed(() => currentChapterNumber.value < totalChapters.value)

// 分页：是否有上一页/下一页
const hasPrevPage = computed(() => currentPage.value > 1)
const hasNextPage = computed(() => currentPage.value < totalPages.value)

function prevPage() {
  if (!hasPrevPage.value) return
  const target = Math.max(1, Number(currentPage.value) - 1)
  loadPagedContent(target)
}

function nextPage() {
  if (!hasNextPage.value) return
  const target = Math.min(totalPages.value, Number(currentPage.value) + 1)
  loadPagedContent(target)
}

// 加载小说信息
async function loadNovelInfo() {
  try {
    const res = await getNovelDetail(novelId.value)
    if (res.code === 200) {
      novelTitle.value = res.data.title
      totalChapters.value = res.data.chapter_count || 0
    }
  } catch (err) {
    console.error('加载小说信息失败:', err)
  }
}

// 加载章节列表
async function loadChapterList() {
  try {
    loadingChapters.value = true
    const res = await getChapterList(novelId.value, { pageSize: 999 })
    if (res.code === 200) {
      chapterList.value = res.data || []
      totalChapters.value = chapterList.value.length
      
      // 如果没有章节，提示用户
      if (chapterList.value.length === 0) {
        console.warn('该小说没有章节，可能是短篇或数据缺失')
      }
    }
  } catch (err) {
    console.error('加载章节列表失败:', err)
    // 即使加载失败，也继续尝试加载内容
    chapterList.value = []
    totalChapters.value = 0
  } finally {
    loadingChapters.value = false
  }
}

// 加载章节内容（章节模式）
async function loadChapter(chapterId) {
  try {
    loading.value = true
    error.value = null
    
    const targetChapterId = chapterId || currentChapterId.value
    console.log('🔄 正在加载章节内容，章节ID:', targetChapterId)
    
    const res = await getChapterContent(targetChapterId)
    console.log('📖 章节数据响应:', res)
    
    if (res && res.code === 200 && res.data) {
      chapterContent.value = res.data
      currentChapterId.value = res.data.id
      currentChapterTitle.value = res.data.title
      currentChapterNumber.value = res.data.chapter_number || 1
      
      console.log('✓ 章节内容加载成功:', {
        title: currentChapterTitle.value,
        chapterNumber: currentChapterNumber.value,
        contentLength: res.data.content?.length || 0
      })
      
      // 滚动到顶部
      if (contentArea.value) {
        contentArea.value.scrollTop = 0
      }
      
      // 保存阅读进度
      saveReadingProgress()
    } else {
      throw new Error(res?.message || '章节数据格式错误')
    }
  } catch (err) {
    console.error('✗ 加载章节失败:', err)
    console.error('错误详情:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    })
    
    // 根据错误类型显示不同的错误信息
    if (err.response?.status === 404) {
      error.value = '章节不存在，请返回重试'
    } else if (err.response?.status === 403) {
      error.value = '该章节需要VIP权限才能阅读'
    } else {
      error.value = err.message || '章节加载失败，请重试'
    }
  } finally {
    loading.value = false
  }
}

// 加载分页内容（无章节模式，每页3000字）
async function loadPagedContent(page = 1) {
  try {
    loading.value = true
    error.value = null
    const res = await getNovelPages(novelId.value, { page, pageSize: pageSize.value })
    if (res && res.code === 200 && res.data) {
      chapterContent.value = { content: res.data.content }
      currentPage.value = res.data.page
      totalPages.value = res.data.totalPages
      currentChapterTitle.value = ''
      if (contentArea.value) contentArea.value.scrollTop = 0
      saveReadingProgress()
    } else {
      throw new Error(res?.message || '分页数据格式错误')
    }
  } catch (err) {
    console.error('✗ 加载分页失败:', err)
    error.value = err.message || '分页加载失败，请重试'
  } finally {
    loading.value = false
  }
}

// 选择章节
function selectChapter(chapterId) {
  currentChapterId.value = chapterId
  loadChapter(chapterId)
  showCatalog.value = false
}

// 上一章
function loadPrevChapter() {
  if (!hasPrevChapter.value) return
  const prevChapter = chapterList.value.find(ch => ch.chapter_number === currentChapterNumber.value - 1)
  if (prevChapter) {
    selectChapter(prevChapter.id)
  }
}

// 下一章
function loadNextChapter() {
  if (!hasNextChapter.value) return
  const nextChapter = chapterList.value.find(ch => ch.chapter_number === currentChapterNumber.value + 1)
  if (nextChapter) {
    selectChapter(nextChapter.id)
  }
}

// 章节切换（章节模式）
function onChapterChange() {
  const chapter = chapterList.value.find(ch => ch.chapter_number === parseInt(currentChapterNumber.value))
  if (chapter) {
    selectChapter(chapter.id)
  }
}

// 切换工具栏
function toggleToolbar(event) {
  // 只在点击内容区域时切换，不响应按钮点击
  if (event && event.target.tagName === 'BUTTON') {
    return
  }
  if (showGuide.value) {
    dismissGuide()
    return
  }
  showHeader.value = !showHeader.value
  showFooter.value = !showFooter.value
}

// 滚动处理
let scrollTimer = null
let isScrolling = false

function handleScroll() {
  // 滚动时隐藏工具栏
  if (!isScrolling) {
    showHeader.value = false
    showFooter.value = false
    isScrolling = true
  }
  
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    showHeader.value = true
    showFooter.value = true
    isScrolling = false
  }, 1500)
}

// 切换夜间模式
function toggleDarkMode() {
  toggleMode()
}

// 字体设置
function increaseFontSize() {
  if (fontSize.value < 30) fontSize.value += 2
}

function decreaseFontSize() {
  if (fontSize.value > 12) fontSize.value -= 2
}

function increaseLineHeight() {
  if (lineHeight.value < 3) lineHeight.value += 0.2
}

function decreaseLineHeight() {
  if (lineHeight.value > 1) lineHeight.value -= 0.2
}

// 保存阅读进度
function saveReadingProgress() {
  const progress = {
    novelId: novelId.value,
    chapterId: currentChapterId.value,
    chapterNumber: currentChapterNumber.value,
    page: currentPage.value,
    totalPages: totalPages.value,
    timestamp: Date.now()
  }
  localStorage.setItem(`reading_progress_${novelId.value}`, JSON.stringify(progress))
}

// 加入书架
function addToBookshelf() {
  // TODO: 实现书架功能
  alert('已加入书架')
}

// 返回
function goBack() {
  // 优先返回到小说详情页或首页
  if (window.history.length > 1) {
    router.back()
  } else {
    // 如果没有历史记录，返回到小说详情页
    router.push(`/novel/${novelId.value}`)
  }
}

// 返回首页
function goHome() {
  router.push('/')
}

// 分页切换（无章节模式）
function onPageChange() {
  const page = parseInt(currentPage.value)
  if (Number.isFinite(page)) {
    loadPagedContent(page)
  }
}

// 错误重试：根据当前模式重新加载
function retryLoad() {
  if (chapterList.value.length > 0 && currentChapterId.value) {
    loadChapter(currentChapterId.value)
  } else {
    loadPagedContent(currentPage.value || 1)
  }
}

// 格式化日期
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 初始化
onMounted(async () => {
  console.log('📖 ReadingPage 初始化，小说ID:', novelId.value)
  console.log('📖 路由信息:', { 
    path: route.path, 
    query: route.query, 
    params: route.params 
  })
  
  try {
    loading.value = true
    error.value = null
    
    // 加载小说信息
    await loadNovelInfo()
    console.log('✓ 小说信息加载完成:', novelTitle.value, '总章节数:', totalChapters.value)
    
    // 强制使用无章节分页模式
    const pageFromQuery = parseInt(route.query.page || route.params.chapter || 1)
    await loadPagedContent(pageFromQuery || 1)
    return

    // 从URL或本地存储获取要阅读的章节（已弃用：章节模式）
    // 支持两种URL格式：
    // 1. /reading/:id?chapter=1 (查询参数)
    // 2. /read/:id/:chapter (路径参数)
    const chapterFromQuery = route.query.chapter
    const chapterFromParams = route.params.chapter
    const chapterParam = chapterFromQuery || chapterFromParams
    
    console.log('📖 章节参数:', chapterParam)
    
    // 如果有章节列表
    if (chapterList.value.length > 0) {
      let targetChapterId = null
      
      if (chapterParam) {
        // 如果URL中有章节参数，根据章节号找到章节ID
        const chapterNum = parseInt(chapterParam)
        const chapter = chapterList.value.find(ch => ch.chapter_number === chapterNum)
        if (chapter) {
          targetChapterId = chapter.id
          console.log('✓ 找到指定章节:', chapter.title, 'ID:', chapter.id)
        } else {
          // 如果没找到，尝试作为章节ID使用
          targetChapterId = chapterNum
          console.log('⚠ 未找到章节号，尝试使用章节ID:', chapterNum)
        }
      } else {
        // 尝试从本地存储恢复进度
        const savedProgress = localStorage.getItem(`reading_progress_${novelId.value}`)
        if (savedProgress) {
          try {
            const progress = JSON.parse(savedProgress)
            // 若之前为分页模式
            if (!progress.chapterId && progress.page) {
              await loadPagedContent(progress.page)
              return
            }
            targetChapterId = progress.chapterId
            console.log('✓ 恢复阅读进度，章节ID:', targetChapterId)
          } catch (e) {
            console.warn('⚠ 解析阅读进度失败:', e)
          }
        }
        
        // 如果没有进度，默认加载第一章
        if (!targetChapterId) {
          targetChapterId = chapterList.value[0].id
          console.log('✓ 加载第一章，ID:', targetChapterId)
        }
      }
      
      if (targetChapterId) {
        currentChapterId.value = targetChapterId
        await loadChapter(targetChapterId)
        console.log('✓ 章节内容加载成功')
      } else {
        throw new Error('无法确定要加载的章节')
      }
    } else {
      // 没有章节列表，可能是短篇小说，尝试直接加载内容
      console.warn('⚠ 该小说没有章节列表，可能是短篇小说')
      
      // 尝试使用小说ID作为章节ID加载
      try {
        console.log('🔄 尝试直接加载小说内容，使用小说ID:', novelId.value)
        currentChapterId.value = parseInt(novelId.value)
        await loadChapter(currentChapterId.value)
        console.log('✓ 直接加载成功（短篇小说）')
      } catch (loadErr) {
        console.error('✗ 直接加载失败:', loadErr)
        error.value = '该小说暂无章节内容，可能还在创作中或数据格式不正确'
        loading.value = false
      }
    }
  } catch (err) {
    console.error('✗ ReadingPage 初始化失败:', err)
    error.value = err.message || '页面加载失败，请刷新重试'
    loading.value = false
  }
  
  // 加载保存的阅读设置
  try {
    const savedSettings = localStorage.getItem('reading_settings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      fontSize.value = settings.fontSize || 18
      lineHeight.value = settings.lineHeight || 1.8
      bgColor.value = settings.bgColor || ''
      // 确保isDarkMode与全局主题同步
      if (settings.isDarkMode !== undefined) {
        toggleMode(settings.isDarkMode ? 'dark' : 'light')
      }
      console.log('✓ 阅读设置加载成功')
    }
  } catch (err) {
    console.error('⚠ 加载阅读设置失败:', err)
  }
  // 首次引导（仅展示一次）
  try {
    const seen = localStorage.getItem('reading_guide_seen')
    if (!seen) {
      showGuide.value = true
    }
  } catch (e) {}
})

// 保存阅读设置
watch([fontSize, lineHeight, bgColor, isDarkMode], () => {
  const settings = {
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    bgColor: bgColor.value,
    isDarkMode: isDarkMode.value
  }
  localStorage.setItem('reading_settings', JSON.stringify(settings))
}, { deep: true })
</script>

<style scoped>
.reading-page {
  min-height: 100vh;
  position: relative;
  transition: all 0.3s ease;
}

.reading-page.dark-mode {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

/* 顶部工具栏 */
.reading-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(255,255,255,0.95));
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.reading-header.show {
  transform: translateY(0);
}

.dark-mode .reading-header {
  background: linear-gradient(to bottom, rgba(26,26,26,0.98), rgba(26,26,26,0.95));
}

.back-btn, .menu-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #333;
  transition: all 0.3s ease;
}

.dark-mode .back-btn,
.dark-mode .menu-btn {
  color: #e0e0e0;
}

.back-btn:hover, .menu-btn:hover {
  background: rgba(0,0,0,0.05);
  border-radius: 8px;
}

.header-info { text-align: center; padding: 0 0.5rem; }

.novel-title { font-size: 0.9rem; font-weight: 600; color: #333; margin-bottom: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chapter-title { font-size: 0.8rem; font-weight: 500; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.dark-mode .novel-title {
  color: #999;
}

.dark-mode .chapter-title {
  color: #e0e0e0;
}

/* 阅读内容区 */
.reading-content {
  min-height: 100vh;
  padding: 72px 1rem 6rem; /* 顶部留白避免遮挡 */
  overflow-y: auto;
  overflow-x: hidden;
  transition: all 0.3s ease;
}

@media (min-width: 768px) {
  .reading-content { padding: 80px 2rem 6rem; }
}

.chapter-container {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.chapter-heading {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 1rem;
  text-align: center;
  line-height: 1.6;
}

.novel-heading {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
  text-align: center;
  line-height: 1.6;
  color: #1a1a1a;
}

.dark-mode .novel-heading {
  color: #e0e0e0;
}

@media (max-width: 640px) {
  .chapter-heading {
    font-size: 1.25rem;
    margin-top: 0.5rem;
  }
  
  .novel-heading {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
}

.chapter-meta {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.dark-mode .chapter-meta {
  color: #999;
  border-bottom-color: rgba(255,255,255,0.1);
}

.chapter-text :deep(p) {
  margin-bottom: 1em;
  text-indent: 2em;
  text-align: justify;
}

/* 当仅内容背景为深色而未切换全局暗色主题时，提升文字对比度 */
.dark-content { color: #e6e6e6; }
.dark-content .novel-heading,
.dark-content .chapter-heading { color: #e6e6e6; }
.dark-content .chapter-meta { color: #c9c9c9; border-top-color: rgba(255,255,255,0.1); border-bottom-color: rgba(255,255,255,0.1); }
.dark-content .chapter-text :deep(p) { color: #e6e6e6; }

.chapter-nav {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0,0,0,0.1);
}

.dark-mode .chapter-nav {
  border-top-color: rgba(255,255,255,0.1);
}

.nav-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-btn:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.nav-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
}

.catalog-btn {
  background: #6366f1;
}

/* 单章节导航 */
.single-chapter-nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  justify-content: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0,0,0,0.1);
}

.dark-mode .single-chapter-nav {
  border-top-color: rgba(255,255,255,0.1);
}

.back-to-detail {
  background: #10b981;
}

.back-to-detail:hover {
  background: #059669;
}

/* 移动端：底部三按钮紧凑样式 */
@media (max-width: 640px) {
  .single-chapter-nav {
    margin-top: 2rem;
    padding-top: 1.25rem;
  }
  .single-chapter-nav .nav-btn {
    padding: 0.45rem 0.6rem;
    font-size: 0.84rem;
  }
}

/* 按钮禁用态更柔和 */
.nav-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
}

/* 工具栏单行布局 */
.toolbar-actions.single-row {
  justify-content: center;
  gap: 2rem;
}

@media (max-width: 640px) {
  .toolbar-actions.single-row {
    gap: 1rem;
  }
}

/* 底部工具栏 */
.reading-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(255,255,255,0.98), rgba(255,255,255,0.95));
  backdrop-filter: blur(10px);
  padding: 1rem;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
}

.reading-footer.show {
  transform: translateY(0);
}

.dark-mode .reading-footer {
  background: linear-gradient(to top, rgba(26,26,26,0.98), rgba(26,26,26,0.95));
}

.progress-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 2px;
  outline: none;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #4f46e5;
  border-radius: 50%;
  cursor: pointer;
}

.progress-text {
  font-size: 0.875rem;
  color: #666;
  white-space: nowrap;
}

.dark-mode .progress-text {
  color: #999;
}

.toolbar-actions {
  display: flex;
  justify-content: space-around;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #666;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.action-btn:hover {
  background: rgba(0,0,0,0.05);
  color: #4f46e5;
}

.dark-mode .action-btn {
  color: #999;
}

.dark-mode .action-btn:hover {
  background: rgba(255,255,255,0.05);
  color: #6366f1;
}

/* 目录抽屉 */
.catalog-drawer, .settings-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
  overscroll-behavior: contain; /* 防止抽屉内滚动引发外层横向滚动 */
}

@media (min-width: 768px) {
  .catalog-drawer, .settings-drawer {
    align-items: center;
  }
}

.catalog-content, .settings-content {
  background: white;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@media (min-width: 768px) {
  .catalog-content, .settings-content {
    border-radius: 16px;
  }
}

.dark-mode .catalog-content,
.dark-mode .settings-content {
  background: #2d2d2d;
}

.catalog-header, .settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.dark-mode .catalog-header,
.dark-mode .settings-header {
  border-bottom-color: rgba(255,255,255,0.1);
}

.catalog-header h3, .settings-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
}

.close-btn {
  font-size: 2rem;
  line-height: 1;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: #333;
}

.dark-mode .close-btn {
  color: #999;
}

.dark-mode .close-btn:hover {
  color: #e0e0e0;
}

.catalog-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.catalog-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.catalog-item:hover {
  background: #f3f4f6;
}

.catalog-item.active {
  background: #eef2ff;
  color: #4f46e5;
}

.dark-mode .catalog-item:hover {
  background: rgba(255,255,255,0.05);
}

.dark-mode .catalog-item.active {
  background: rgba(99, 102, 241, 0.2);
}

.chapter-num {
  font-size: 0.875rem;
  color: #999;
  min-width: 60px;
}

.chapter-name {
  flex: 1;
  font-size: 0.9375rem;
}

.vip-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #666;
  border-radius: 4px;
  font-weight: 600;
}

/* 设置面板 */
.settings-body {
  padding: 1.5rem;
  background: var(--color-bg-elevated);
}

.setting-item {
  margin-bottom: 2rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem;
}

.setting-item label {
  display: block;
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}

.dark-mode .settings-drawer .settings-content {
  background: #2a2a2a;
}
.dark-mode .settings-drawer .settings-header {
  border-bottom-color: rgba(255,255,255,0.08);
}
.dark-mode .settings-drawer .settings-body {
  background: #1f1f1f;
}
.dark-mode .setting-item {
  background: #2a2a2a;
  border-color: rgba(255,255,255,0.08);
}
.dark-mode .setting-item label {
  color: #e6e6e6;
}

.size-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.size-control button {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.size-control button:hover {
  border-color: #4f46e5;
  color: #4f46e5;
  background: #f0f0ff;
}

.size-control button:active {
  transform: scale(0.95);
}

.dark-mode .size-control button {
  background: #3d3d3d;
  border-color: #666;
  color: #e0e0e0;
}

.dark-mode .size-control button:hover {
  background: #4a4a4a;
  border-color: #6366f1;
}

.size-control span {
  min-width: 60px;
  text-align: center;
  font-weight: 500;
}

.color-palette {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.color-btn {
  width: 48px;
  height: 48px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.color-btn.active {
  border-color: #4f46e5;
  transform: scale(1.1);
}

/* 深色下颜色块边框更明显 */
.dark-mode .color-btn {
  border-color: rgba(255,255,255,0.12);
}
.dark-mode .color-btn.active {
  border-color: #8b93ff;
}

/* 加载和错误状态 */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.retry-btn {
  padding: 0.75rem 2rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.retry-btn:hover {
  background: #4338ca;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-more {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-size: 0.875rem;
}

.empty-catalog {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-catalog p {
  font-size: 0.9375rem;
}

/* 引导蒙层 */
.guide-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.guide-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  color: #fff;
  padding: 1rem;
}

.guide-text {
  max-width: 18rem;
  line-height: 1.6;
  font-size: 0.95rem;
}

.guide-btn {
  padding: 0.5rem 1rem;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 999px;
  font-weight: 600;
}

.guide-pulse {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  position: relative;
}

.guide-pulse::after {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: #fff;
  animation: pulse 1.6s ease-out infinite;
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

/* 评论区与按钮区的间距 */
.comments-wrapper {
  margin-top: 1.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.dark-mode .comments-wrapper {
  border-top-color: rgba(255,255,255,0.08);
}

</style>
