<template>
  <div class="reading-page" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部工具栏 -->
    <div class="reading-header" :class="{ 'show': showHeader }">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="header-info flex-1">
          <h1 class="novel-title">{{ novelTitle }}</h1>
          <p class="chapter-title">{{ chapterList.length > 1 ? currentChapterTitle : '' }}</p>
        </div>
        <button class="menu-btn" @click="showSettings = !showSettings">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 阅读内容区 -->
    <div
      ref="contentArea"
      class="reading-content"
      :class="{ 'dark-content': isContentDark, 'page-mode': isPageMode }"
      :style="contentStyle"
      @click="toggleToolbar"
      @scroll="onContentScroll"
    >
      <!-- 滚动模式：传统滚动阅读 -->
      <template v-if="!isPageMode">
        <div class="chapter-container" v-if="!loading && chapterContent">
          <!-- 标题：只在多章节时显示章节标题 -->
          <h2 v-if="totalChapters > 1" class="chapter-heading">{{ chapterContent.title }}</h2>
          <h2 v-else class="novel-heading">{{ novelTitle }}</h2>

          <!-- 元信息（分页或章节模式通用） -->
          <div class="chapter-meta" v-if="displayWordCount || displayUpdatedAt || (chapterList.length <= 1 && totalPages > 1)">
            <span v-if="chapterList.length <= 1 && totalPages > 1">第 {{ currentPage }} 页</span>
            <span v-if="displayWordCount">共 {{ displayWordCount }} 字</span>
            <span v-if="displayUpdatedAt">更新时间：{{ displayUpdatedAt }}</span>
          </div>

          <!-- 正文内容 -->
          <div class="chapter-text" v-html="formattedContent"></div>
        </div>

        <!-- 评论区：正文末尾展示 -->
        <div v-if="!loading" ref="commentsSection" class="comments-wrapper">
          <CommentSection :novel-id="novelId" />
        </div>
      </template>

      <!-- 翻页模式：仿真翻页效果 -->
      <template v-else>
        <div
          class="flip-book-container"
          ref="flipBookContainer"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <!-- 当前页 -->
          <div
            class="flip-page current-page"
            :class="{ 'flipping-forward': isFlippingForward, 'flipping-backward': isFlippingBackward }"
            :style="currentPageStyle"
          >
            <div class="page-content" v-html="currentPageContent"></div>
            <div class="page-number">{{ virtualPageIndex + 1 }} / {{ virtualPages.length }}</div>
          </div>

          <!-- 下一页（翻页动画时显示） -->
          <div
            v-if="isFlippingForward"
            class="flip-page next-page"
            :style="nextPageStyle"
          >
            <div class="page-content" v-html="nextPageContent"></div>
            <div class="page-number">{{ virtualPageIndex + 2 }} / {{ virtualPages.length }}</div>
          </div>

          <!-- 上一页（翻页动画时显示） -->
          <div
            v-if="isFlippingBackward"
            class="flip-page prev-page"
            :style="prevPageStyle"
          >
            <div class="page-content" v-html="prevPageContent"></div>
            <div class="page-number">{{ virtualPageIndex }} / {{ virtualPages.length }}</div>
          </div>
        </div>
      </template>

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
    </div>

    <!-- 悬浮工具栏（小红书风格） -->
    <Transition name="float-toolbar">
      <div v-if="showFloatToolbar" class="float-toolbar">
        <div class="float-toolbar-content">
          <!-- 评论输入框 -->
          <div class="comment-input-wrapper" @click="openCommentEditor">
            <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <span class="input-placeholder">说说你的看法...</span>
          </div>

          <!-- 点赞按钮 -->
          <button class="toolbar-action-btn" @click="toggleLike" :class="{ 'active': isLiked }">
            <svg v-if="!isLiked" class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <svg v-else class="action-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
            </svg>
            <span class="action-count" v-if="likeCount > 0">{{ formatCount(likeCount) }}</span>
          </button>

          <!-- 加入书架按钮 -->
          <button class="toolbar-action-btn" @click="toggleBookshelf" :class="{ 'active': inBookshelf }">
            <svg v-if="!inBookshelf" class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            <svg v-else class="action-icon" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clip-rule="evenodd"/>
            </svg>
            <span class="action-text">{{ inBookshelf ? '已加入' : '书架' }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 底部工具栏 -->
    <div class="reading-footer" :class="{ 'show': showFooter }">
      <div class="footer-content">
        <!-- 翻页按钮区域 -->
        <div class="footer-navigation">
          <!-- 上一页/上一章按钮 -->
          <button
            class="footer-nav-btn prev-btn"
            @click.stop="chapterList.length > 1 ? loadPrevChapter() : prevPage()"
            :disabled="chapterList.length > 1 ? !hasPrevChapter : !hasPrevPage"
          >
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            <span>{{ chapterList.length > 1 ? '上一章' : '上一页' }}</span>
          </button>

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

          <!-- 下一页/下一章按钮 -->
          <button
            class="footer-nav-btn next-btn"
            @click.stop="chapterList.length > 1 ? loadNextChapter() : nextPage()"
            :disabled="chapterList.length > 1 ? !hasNextChapter : !hasNextPage"
          >
            <span>{{ chapterList.length > 1 ? '下一章' : '下一页' }}</span>
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
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
          <!-- 阅读模式快速切换 -->
          <button @click.stop="toggleReadingMode" class="action-btn" :class="{ 'mode-active': isPageMode }">
            <svg v-if="!isPageMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <span>{{ isPageMode ? '翻页' : '滚屏' }}</span>
          </button>
          <button @click.stop="addToBookshelf" class="action-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            <span>书架</span>
          </button>
        </div>
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
            <!-- 阅读模式切换 -->
            <div class="setting-item">
              <label>阅读模式</label>
              <div class="size-control">
                <button :class="{ active: !isPageMode }" @click="setReadingMode('scroll')">滚屏</button>
                <span>{{ isPageMode ? '翻页模式' : '滚屏模式' }}</span>
                <button :class="{ active: isPageMode }" @click="setReadingMode('page')">翻页</button>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNovelDetail, getChapterList, getChapterContent, getNovelPages, likeNovel } from '@/api/novel'
import { addToBookshelf as apiAddToBookshelf, removeFromBookshelf } from '@/api/bookshelf'
import CommentSection from '@/components/novel/CommentSection.vue'
import { useTheme } from '@/composables/useTheme'
import { message } from '@/utils/message'
import { useBookshelfStore } from '@/stores/bookshelf'

const route = useRoute()
const router = useRouter()
const bookshelfStore = useBookshelfStore()

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
const commentsSection = ref(null)
// 阅读模式：scroll(滚屏) | page(翻页)
const READING_MODE_KEY = 'xsread_reading_mode'
const readingMode = ref((() => {
  try { return localStorage.getItem(READING_MODE_KEY) || 'scroll' } catch (e) { return 'scroll' }
})())
const isPageMode = computed(() => readingMode.value === 'page')

// 翻页模式相关状态
const virtualPages = ref([]) // 虚拟分页数组
const virtualPageIndex = ref(0) // 当前虚拟页索引
const isFlippingForward = ref(false) // 是否正在向前翻页
const isFlippingBackward = ref(false) // 是否正在向后翻页
const flipBookContainer = ref(null) // 翻页容器引用

// 滑动手势相关状态
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchStartTime = ref(0)
const isSwiping = ref(false)
const SWIPE_THRESHOLD = 80 // 滑动阈值（像素）
const SWIPE_TIMEOUT = 800 // 滑动超时时间（毫秒）

// 悬浮工具栏状态
const showFloatToolbar = ref(false)
const isLiked = ref(false)
const likeCount = ref(0)
const inBookshelf = ref(false)
const novelDetail = ref(null)

// 首次引导
const showGuide = ref(false)
function dismissGuide() {
  showGuide.value = false
  try { localStorage.setItem('reading_guide_seen', '1') } catch (e) {}
}

// 自动加入书架相关
const readingTimer = ref(null) // 阅读计时器
const readingElapsedTime = ref(0) // 已阅读时长（秒）
const autoAddedToBookshelf = ref(false) // 是否已自动加入书架
const isPageVisible = ref(true) // 页面是否可见

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
    // overflow-y 现在通过 CSS class 控制，不再使用内联样式
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

// 翻页模式：当前页内容
const currentPageContent = computed(() => {
  if (!isPageMode.value || virtualPages.value.length === 0) return ''
  return virtualPages.value[virtualPageIndex.value] || ''
})

// 翻页模式：下一页内容
const nextPageContent = computed(() => {
  if (!isPageMode.value || virtualPageIndex.value >= virtualPages.value.length - 1) return ''
  return virtualPages.value[virtualPageIndex.value + 1] || ''
})

// 翻页模式：上一页内容
const prevPageContent = computed(() => {
  if (!isPageMode.value || virtualPageIndex.value <= 0) return ''
  return virtualPages.value[virtualPageIndex.value - 1] || ''
})

// 翻页动画样式 - 添加背景色
const currentPageStyle = computed(() => ({
  backgroundColor: bgColor.value || 'var(--color-bg-elevated)',
  color: isContentDark.value ? '#e6e6e6' : 'var(--color-text-primary)'
}))

const nextPageStyle = computed(() => ({
  backgroundColor: bgColor.value || 'var(--color-bg-elevated)',
  color: isContentDark.value ? '#e6e6e6' : 'var(--color-text-primary)'
}))

const prevPageStyle = computed(() => ({
  backgroundColor: bgColor.value || 'var(--color-bg-elevated)',
  color: isContentDark.value ? '#e6e6e6' : 'var(--color-text-primary)'
}))



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

// 滚动到顶部的通用函数
function scrollToTop() {
  if (contentArea.value) {
    // 使用多种方式确保滚动生效
    contentArea.value.scrollTop = 0
    contentArea.value.scrollTo({
      top: 0,
      behavior: 'instant'
    })
    // 兼容性处理：同时滚动 window
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    })
    console.log('📍 页面已滚动到顶部')
  }
}

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

// ===== 翻页模式：仿真翻页效果 =====
const FLIP_ANIMATION_DURATION = 400 // 平移动画持续时间（毫秒）

function pageDown() {
  if (!isPageMode.value) return

  // 防止动画进行中重复触发
  if (isFlippingForward.value || isFlippingBackward.value) {
    console.log('翻页动画进行中，请稍候...')
    return
  }

  // 检查是否还有下一页
  if (virtualPageIndex.value >= virtualPages.value.length - 1) {
    console.log('已经是最后一页')
    return
  }

  // 开始翻页动画
  isFlippingForward.value = true

  // 动画结束后更新页码
  setTimeout(() => {
    virtualPageIndex.value++
    isFlippingForward.value = false
    saveVirtualPageProgress()
  }, FLIP_ANIMATION_DURATION)
}

function pageUp() {
  if (!isPageMode.value) return

  // 防止动画进行中重复触发
  if (isFlippingForward.value || isFlippingBackward.value) {
    console.log('翻页动画进行中，请稍候...')
    return
  }

  // 检查是否还有上一页
  if (virtualPageIndex.value <= 0) {
    console.log('已经是第一页')
    return
  }

  // 开始翻页动画
  isFlippingBackward.value = true

  // 动画结束后更新页码
  setTimeout(() => {
    virtualPageIndex.value--
    isFlippingBackward.value = false
    saveVirtualPageProgress()
  }, FLIP_ANIMATION_DURATION)
}

// ===== 滑动手势处理 =====
function handleTouchStart(e) {
  if (!isPageMode.value) return

  // 防止动画进行中触发
  if (isFlippingForward.value || isFlippingBackward.value) return

  const touch = e.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchStartTime.value = Date.now()
  isSwiping.value = true
}

function handleTouchMove(e) {
  if (!isPageMode.value || !isSwiping.value) return

  // 防止页面滚动
  e.preventDefault()
}

function handleTouchEnd(e) {
  if (!isPageMode.value || !isSwiping.value) return

  const touch = e.changedTouches[0]
  const touchEndX = touch.clientX
  const touchEndY = touch.clientY
  const touchEndTime = Date.now()

  const deltaX = touchEndX - touchStartX.value
  const deltaY = touchEndY - touchStartY.value
  const deltaTime = touchEndTime - touchStartTime.value

  isSwiping.value = false

  // 检查是否是有效的水平滑动
  // 1. 水平滑动距离大于阈值
  // 2. 水平滑动距离大于垂直滑动距离的1.5倍（确保是水平滑动）
  // 3. 滑动时间在合理范围内
  const isHorizontalSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD &&
                            Math.abs(deltaX) > Math.abs(deltaY) * 1.5 &&
                            deltaTime < SWIPE_TIMEOUT

  if (isHorizontalSwipe) {
    if (deltaX > 0) {
      // 向右滑动 - 上一页（翻回去）
      console.log('向右滑动 - 上一页')
      pageUp()
    } else {
      // 向左滑动 - 下一页（翻过来）
      console.log('向左滑动 - 下一页')
      pageDown()
    }
  }

  // 重置状态
  touchStartX.value = 0
  touchStartY.value = 0
  touchStartTime.value = 0
}

function getScrollPercent() {
  const el = contentArea.value
  if (!el) return 0
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) return 0
  return el.scrollTop / max
}

function restoreScrollPercent(p) {
  const el = contentArea.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  el.scrollTo({ top: max * Math.min(1, Math.max(0, p)), behavior: 'instant' })
}

// ===== 虚拟分页逻辑 =====
/**
 * 将章节内容分割成虚拟页面
 * 根据容器高度和字体设置动态计算每页可容纳的内容
 * 使用精确的高度计算，确保内容不会溢出
 */
function splitContentIntoPages() {
  if (!isPageMode.value || !chapterContent.value?.content) {
    virtualPages.value = []
    return
  }

  const content = chapterContent.value.content
  const paragraphs = content.split('\n').filter(p => p.trim())

  // 计算实际可用高度（与CSS保持一致）
  const viewportHeight = window.innerHeight
  const topBarHeight = 56 // 顶部工具栏
  const bottomBarHeight = 40 // 底部安全距离（减小以显示更多内容）
  const pagePaddingTop = 10 // 上padding (减小padding)
  const pagePaddingBottom = 6 // 下padding (减小padding)
  const pageNumberHeight = 20 // 页码区域高度（从24px减到20px，与CSS保持一致）
  const safetyMargin = 3 // 额外的安全边距（从5px减到3px，进一步增加内容显示）

  // 可用内容高度
  const availableHeight = viewportHeight - topBarHeight - bottomBarHeight - 
                         pagePaddingTop - pagePaddingBottom - 
                         pageNumberHeight - safetyMargin

  // 计算每行高度
  const lineHeightPx = fontSize.value * lineHeight.value
  
  // 标题高度计算（仅第一页）
  const titleLineHeight = 1.6 * 1.5 * fontSize.value // 标题行高 1.6，字体 1.5倍
  const titleMarginBottom = 16 // 标题下边距减小（从24px→16px），显示更多内容
  const titleTotalHeight = titleLineHeight + titleMarginBottom
  
  // 段落之间的间距（减小以显示更多内容）
  const paragraphMarginBottom = fontSize.value * lineHeight.value * 0.85 // 0.85em (减小段落间距)

  console.log('📄 分页参数:', {
    viewportHeight,
    availableHeight,
    fontSize: fontSize.value,
    lineHeightPx,
    titleTotalHeight,
    paragraphMarginBottom
  })

  const pages = []
  let currentPageContent = ''
  let currentPageHeight = 0
  let isFirstPage = true

  // 添加标题到第一页
  const title = totalChapters.value > 1 ? chapterContent.value.title : novelTitle.value
  let pageAvailableHeight = availableHeight
  
  if (title && isFirstPage) {
    currentPageContent += `<h2 class="chapter-heading">${title}</h2>`
    pageAvailableHeight = availableHeight - titleTotalHeight // 第一页减去标题高度
  }

  for (const para of paragraphs) {
    const paraText = para.trim()
    
    // 计算段落需要的行数
    // 考虑首行缩进2em和容器宽度
    const containerWidth = Math.min(800, window.innerWidth - 24) // 减去左右padding 0.75*2=1.5rem=24px
    const indentWidth = 2 * fontSize.value // 首行缩进2个字符宽度
    const firstLineWidth = containerWidth - indentWidth
    const normalLineWidth = containerWidth
    
    // 简化计算：假设每个字符占用fontSize的宽度
    const charsPerFirstLine = Math.floor(firstLineWidth / fontSize.value)
    const charsPerLine = Math.floor(normalLineWidth / fontSize.value)
    
    // 计算行数
    let linesNeeded = 0
    if (paraText.length <= charsPerFirstLine) {
      linesNeeded = 1
    } else {
      linesNeeded = 1 + Math.ceil((paraText.length - charsPerFirstLine) / charsPerLine)
    }
    
    // 段落总高度 = 行数 * 行高 + 段落间距
    const paraHeight = linesNeeded * lineHeightPx + paragraphMarginBottom

    // 如果加入当前段落会超出页面高度，开始新页
    if (currentPageHeight + paraHeight > pageAvailableHeight && currentPageContent) {
      pages.push(currentPageContent)
      currentPageContent = ''
      currentPageHeight = 0
      isFirstPage = false
      pageAvailableHeight = availableHeight // 后续页面使用完整高度
    }

    currentPageContent += `<p>${paraText}</p>`
    currentPageHeight += paraHeight
  }

  // 添加最后一页
  if (currentPageContent) {
    pages.push(currentPageContent)
  }

  const avgCharsPerPage = Math.floor(content.length / pages.length)
  console.log(`📚 内容已分为 ${pages.length} 页，平均每页 ${avgCharsPerPage} 字`)

  virtualPages.value = pages

  // 恢复之前的阅读进度
  restoreVirtualPageProgress()
}

/**
 * 保存虚拟页进度
 */
function saveVirtualPageProgress() {
  try {
    const progress = {
      novelId: novelId.value,
      virtualPageIndex: virtualPageIndex.value,
      totalVirtualPages: virtualPages.value.length,
      timestamp: Date.now()
    }
    localStorage.setItem(`virtual_page_progress_${novelId.value}`, JSON.stringify(progress))
  } catch (e) {
    console.error('保存虚拟页进度失败:', e)
  }
}

/**
 * 恢复虚拟页进度
 */
function restoreVirtualPageProgress() {
  try {
    const saved = localStorage.getItem(`virtual_page_progress_${novelId.value}`)
    if (saved) {
      const progress = JSON.parse(saved)
      // 确保索引在有效范围内
      if (progress.virtualPageIndex >= 0 && progress.virtualPageIndex < virtualPages.value.length) {
        virtualPageIndex.value = progress.virtualPageIndex
        console.log(`📖 恢复到第 ${progress.virtualPageIndex + 1} 页`)
      }
    }
  } catch (e) {
    console.error('恢复虚拟页进度失败:', e)
  }
}

// 加载小说信息
async function loadNovelInfo() {
  try {
    const res = await getNovelDetail(novelId.value)
    if (res.code === 200) {
      novelDetail.value = res.data
      novelTitle.value = res.data.title
      totalChapters.value = res.data.chapter_count || 0

      // 获取点赞和书架状态
      isLiked.value = res.data.isLiked || false
      likeCount.value = res.data.likes || 0
      inBookshelf.value = res.data.inBookshelf || false
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

      // 等待 DOM 更新后滚动到顶部
      await nextTick()
      scrollToTop()

      // 如果是翻页模式，进行分页
      if (isPageMode.value) {
        await nextTick()
        splitContentIntoPages()
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

    if (isPageMode.value) {
      // 翻页模式：加载所有内容
      // 后端限制单次最大20000字，如果内容超过，需要循环加载所有分页
      console.log('📖 翻页模式：开始加载全文内容...')

      let allContent = ''
      let currentPageNum = 1
      let totalPagesCount = 1

      // 循环加载所有分页
      while (currentPageNum <= totalPagesCount) {
        const res = await getNovelPages(novelId.value, { page: currentPageNum, pageSize: 20000 })

        if (res && res.code === 200 && res.data) {
          allContent += res.data.content
          totalPagesCount = res.data.totalPages

          console.log(`✓ 加载第 ${currentPageNum}/${totalPagesCount} 页，字数: ${res.data.content?.length || 0}`)

          currentPageNum++
        } else {
          throw new Error(res?.message || '加载失败')
        }
      }

      // 设置完整内容
      chapterContent.value = { content: allContent }
      currentPage.value = 1
      totalPages.value = totalPagesCount
      currentChapterTitle.value = ''

      console.log('✓ 全文加载完成:', {
        totalChars: allContent.length,
        totalBackendPages: totalPagesCount
      })

      // 等待 DOM 更新后滚动到顶部
      await nextTick()
      scrollToTop()

      // 进行虚拟分页
      await nextTick()
      splitContentIntoPages()

    } else {
      // 滚动模式：按3000字分页加载
      console.log('📖 滚动模式：加载第', page, '页')

      const res = await getNovelPages(novelId.value, { page, pageSize: pageSize.value })
      if (res && res.code === 200 && res.data) {
        chapterContent.value = { content: res.data.content }
        currentPage.value = res.data.page
        totalPages.value = res.data.totalPages
        currentChapterTitle.value = ''

        console.log('✓ 分页内容加载成功:', {
          page: res.data.page,
          totalPages: res.data.totalPages,
          contentLength: res.data.content?.length || 0
        })

        // 等待 DOM 更新后滚动到顶部
        await nextTick()
        scrollToTop()
      } else {
        throw new Error(res?.message || '分页数据格式错误')
      }
    }

    saveReadingProgress()
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

function onContentScroll(e) {
  if (isPageMode.value) return
  // 滚动时隐藏工具栏
  if (!isScrolling) {
    showHeader.value = false
    showFooter.value = false
    isScrolling = true
  }

  // 检测评论区是否可见
  checkCommentsSectionVisible()

  // 保存滚动百分比（用于模式切换和持久化）
  try {
    const p = getScrollPercent()
    localStorage.setItem(`reading_scroll_percent_${novelId.value}`, String(p))
  } catch (e) {}

  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    showHeader.value = true
    showFooter.value = true
    isScrolling = false
  }, 1500)
}

// 检测评论区是否可见
function checkCommentsSectionVisible() {
  if (!commentsSection.value || !contentArea.value) {
    showFloatToolbar.value = false
    return
  }

  const commentRect = commentsSection.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight

  // 当评论区顶部进入视口时显示悬浮工具栏
  if (commentRect.top < viewportHeight && commentRect.bottom > 0) {
    showFloatToolbar.value = true
  } else {
    showFloatToolbar.value = false
  }
}

// 切换夜间模式
function toggleDarkMode() {
  toggleMode()
}

// 阅读模式切换/持久化
function setReadingMode(mode) {
  if (mode !== 'scroll' && mode !== 'page') return
  if (readingMode.value === mode) return
  // 切换前记录当前位置百分比
  const percent = getScrollPercent()
  readingMode.value = mode
  try { localStorage.setItem(READING_MODE_KEY, mode) } catch (e) {}

  // 提示用户当前模式
  const modeText = mode === 'page' ? '翻页模式：仿真翻页阅读' : '滚屏模式：连续滚动阅读'
  message.success(modeText, 2000)

  if (mode === 'page') {
    // 切换到翻页模式时，重新加载全文内容
    if (totalChapters.value === 0) {
      // 无章节模式：重新加载全文
      loadPagedContent(1)
    } else if (chapterContent.value) {
      // 有章节模式：直接分页当前章节
      nextTick(() => {
        splitContentIntoPages()
      })
    }
  } else {
    // 切换到滚动模式时，重新加载分页内容
    if (totalChapters.value === 0) {
      // 无章节模式：重新加载分页内容
      loadPagedContent(currentPage.value)
    } else {
      // 有章节模式：恢复滚动位置
      nextTick(() => restoreScrollPercent(percent))
    }
  }
}

function toggleReadingMode() {
  setReadingMode(isPageMode.value ? 'scroll' : 'page')
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

// 悬浮工具栏功能
// 打开评论编辑器
function openCommentEditor() {
  // 滚动到评论区并聚焦输入框
  if (commentsSection.value) {
    commentsSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // 等待滚动完成后聚焦输入框
    setTimeout(() => {
      const textarea = commentsSection.value.querySelector('textarea')
      if (textarea) {
        textarea.focus()
      }
    }, 500)
  }
}

// 格式化数字
function formatCount(count) {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count
}

// 切换点赞
async function toggleLike() {
  try {
    if (isLiked.value) {
      // 取消点赞 - 目前API只支持点赞，不支持取消
      message.warning('暂不支持取消点赞')
      return
    }

    await likeNovel(novelId.value)
    isLiked.value = true
    likeCount.value++
    message.success('点赞成功')
  } catch (err) {
    console.error('点赞失败:', err)
    if (err.response?.status === 401) {
      message.warning('请先登录')
      router.push('/login')
    } else {
      message.error(err.response?.data?.message || '点赞失败')
    }
  }
}

// 切换书架
async function toggleBookshelf() {
  try {
    if (inBookshelf.value) {
      // 从书架移除
      await removeFromBookshelf(novelId.value)
      inBookshelf.value = false
      message.success('已从书架移除')
    } else {
      // 加入书架
      await apiAddToBookshelf({ novelId: novelId.value })
      inBookshelf.value = true
      message.success('已加入书架')
    }
  } catch (err) {
    console.error('书架操作失败:', err)
    if (err.response?.status === 401) {
      message.warning('请先登录')
      router.push('/login')
    } else {
      message.error(err.response?.data?.message || '操作失败')
    }
  }
}

// 加入书架（底部工具栏使用）
function addToBookshelf() {
  toggleBookshelf()
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

  // 启动阅读计时器并监听页面可见性
  startReadingTimer()
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 翻页模式事件监听（滚轮/键盘/触摸）
  contentArea.value?.addEventListener('wheel', wheelHandler, { passive: false })
  window.addEventListener('keydown', keyHandler)
  contentArea.value?.addEventListener('touchstart', touchStart, { passive: true })
  contentArea.value?.addEventListener('touchmove', touchMove, { passive: false })
  contentArea.value?.addEventListener('touchend', touchEnd, { passive: true })

  // 初始化恢复滚动百分比
  try {
    const raw = localStorage.getItem(`reading_scroll_percent_${novelId.value}`)
    if (raw) nextTick(() => restoreScrollPercent(Number(raw)))
  } catch (e) {}

  // 在模式变化后也恢复百分比
  watch(isPageMode, async () => {
    const raw = localStorage.getItem(`reading_scroll_percent_${novelId.value}`)
    const p = raw ? Number(raw) : getScrollPercent()
    await nextTick()
    restoreScrollPercent(p)
  })

})

// 事件处理器定义在 setup 作用域，便于统一清理
const wheelHandler = (e) => {
  if (!isPageMode.value) return
  e.preventDefault()
  if (e.deltaY > 0) {
    pageDown()
  } else {
    pageUp()
  }
}

const keyHandler = (e) => {
  if (!isPageMode.value) return
  if ([ 'ArrowDown', 'PageDown', ' ' ].includes(e.key)) { e.preventDefault(); pageDown() }
  if ([ 'ArrowUp', 'PageUp' ].includes(e.key)) { e.preventDefault(); pageUp() }
  if (e.key === 'ArrowRight') { e.preventDefault(); pageDown() }
  if (e.key === 'ArrowLeft') { e.preventDefault(); pageUp() }
}

const touchStart = (e) => { 
  if (!isPageMode.value || !e.touches?.length) return
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  touchStartTime.value = Date.now()
}

const touchMove = (e) => {
  // 翻页模式下禁止原生滚动，避免与整屏翻页冲突
  if (isPageMode.value) {
    e.preventDefault()
  }
}

const touchEnd = (e) => {
  if (!isPageMode.value || !e.changedTouches?.length) return
  
  const touchEndX = e.changedTouches[0].clientX
  const touchEndY = e.changedTouches[0].clientY
  const touchDuration = Date.now() - touchStartTime.value
  
  const dx = touchEndX - touchStartX.value
  const dy = touchEndY - touchStartY.value
  
  // 计算滑动距离和方向
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  
  // 判断是否为有效滑动（距离>30px 且时间<500ms）
  if (Math.max(absDx, absDy) < 30 || touchDuration > 500) return
  
  // 判断主要滑动方向
  if (absDx > absDy) {
    // 水平滑动：左滑下一屏，右滑上一屏
    if (dx < 0) {
      pageDown() // 左滑
    } else {
      pageUp()   // 右滑
    }
  } else {
    // 垂直滑动：下滑上一屏，上滑下一屏
    if (dy < 0) {
      pageDown() // 上滑
    } else {
      pageUp()   // 下滑
    }
  }
}

onUnmounted(() => {
  contentArea.value?.removeEventListener('wheel', wheelHandler)
  window.removeEventListener('keydown', keyHandler)
  contentArea.value?.removeEventListener('touchstart', touchStart)
  contentArea.value?.removeEventListener('touchmove', touchMove)
  contentArea.value?.removeEventListener('touchend', touchEnd)
})

// 组件卸载时清理
onUnmounted(() => {
  stopReadingTimer()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// ===== 自动加入书架：计时与可见性控制 =====
function handleVisibilityChange() {
  isPageVisible.value = document.visibilityState === 'visible'
}

function startReadingTimer() {
  if (readingTimer.value) return
  readingTimer.value = setInterval(async () => {
    if (!isPageVisible.value) return
    // 未登录不计入自动加入逻辑（静默忽略）
    const token = localStorage.getItem('token')
    if (!token) return

    readingElapsedTime.value += 1
    // 达到10秒且尚未加入书架则自动加入
    if (readingElapsedTime.value >= 10 && !autoAddedToBookshelf.value) {
      await autoAddToBookshelf()
    }
  }, 1000)
}

function stopReadingTimer() {
  if (readingTimer.value) {
    clearInterval(readingTimer.value)
    readingTimer.value = null
  }
}

async function autoAddToBookshelf() {
  try {
    // 已在书架则不重复添加
    if (inBookshelf.value || bookshelfStore.isInBookshelf(Number(novelId.value))) {
      autoAddedToBookshelf.value = true
      stopReadingTimer()
      return
    }
    await apiAddToBookshelf({ novelId: Number(novelId.value) })
    inBookshelf.value = true
    autoAddedToBookshelf.value = true
    stopReadingTimer()
    // 轻量提示
    message.info('已自动加入书架', 1500)
  } catch (err) {
    // 失败静默处理，避免打扰阅读
    console.warn('自动加入书架失败:', err?.response?.data || err?.message)
  }
}

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

// 监听字体大小和行高变化，重新分页
watch([fontSize, lineHeight], () => {
  if (isPageMode.value && chapterContent.value) {
    nextTick(() => {
      splitContentIntoPages()
    })
  }
})

// 监听阅读模式变化，控制页面滚动
watch(isPageMode, (newMode) => {
  if (newMode) {
    // 切换到翻页模式：禁用页面滚动
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  } else {
    // 切换到滚动模式：恢复页面滚动
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})

// 组件卸载时恢复滚动
onUnmounted(() => {
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
})
</script>

<style scoped>
.reading-page {
  min-height: 100vh;
  position: relative;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  /* 使用主题背景渐变 */
  background: var(--color-bg-gradient, transparent);
  background-attachment: fixed;
}

.reading-page.dark-mode {
  /* 深色模式下使用主题背景，不再硬编码 */
  background: var(--color-bg-gradient, transparent);
  background-attachment: fixed;
  color: var(--color-text-primary);
}

/* 顶部工具栏 */
.reading-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--color-bg-card);
  backdrop-filter: blur(10px);
  transform: translateY(-100%);
  transition: transform 0.3s ease, background 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  box-shadow: 0 2px 8px var(--color-shadow);
  opacity: 0.98;
}

.header-content {
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

@media (min-width: 768px) {
  .header-content {
    padding: 0 2rem;
  }
}

.reading-header.show {
  transform: translateY(0);
}

.dark-mode .reading-header {
  background: var(--color-bg-card);
  box-shadow: 0 2px 8px var(--color-shadow);
  opacity: 0.98;
}

.back-btn, .menu-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #333;
  transition: all 0.2s ease;
  border-radius: 8px;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover, .menu-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.back-btn:active, .menu-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

.dark-mode .back-btn,
.dark-mode .menu-btn {
  color: #e0e0e0;
}

.dark-mode .back-btn:hover,
.dark-mode .menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dark-mode .back-btn:active,
.dark-mode .menu-btn:active {
  background: rgba(255, 255, 255, 0.15);
}

.header-info {
  text-align: center;
  padding: 0 0.5rem;
  flex: 1;
  min-width: 0;
}

.novel-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.chapter-title {
  font-size: 0.75rem;
  font-weight: 400;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.dark-mode .novel-title {
  color: #e0e0e0;
}

.dark-mode .chapter-title {
  color: #999;
}

/* 阅读内容区 */
.reading-content {
  min-height: 100vh;
  padding: 72px 1rem 6rem; /* 顶部留白避免遮挡 */
  overflow-x: hidden;
  transition: all 0.3s ease;
  overscroll-behavior: contain; /* 防止外层页面橡皮筋 */
}

/* 滚动模式：允许上下滚动 */
.reading-content:not(.page-mode) {
  overflow-y: auto;
}

/* 翻页模式：完全禁用上下滚动 */
.reading-content.page-mode {
  overflow: hidden !important; /* 禁用所有滚动 */
  height: 100vh;
  width: 100vw;
  position: fixed; /* 固定定位，防止滚动 */
  top: 0;
  left: 0;
  touch-action: none; /* 禁用所有触摸手势 */
  overscroll-behavior: none; /* 禁用过度滚动 */
  padding: 0 !important; /* 移除padding避免滚动 */
}

/* ===== 平移滑动翻页效果样式 ===== */
.flip-book-container {
  position: fixed;
  top: 56px; /* 顶部工具栏高度 */
  left: 0;
  right: 0;
  bottom: 40px; /* 减小底部安全距离，显示更多内容 */
  width: calc(100% - 1rem); /* 减少左右边距，增加内容显示宽度 */
  max-width: 800px;
  height: calc(100vh - 96px); /* 视口高度 - 顶部56px - 底部40px */
  margin: 0 auto;
  overflow: hidden;
  touch-action: none; /* 禁用触摸滚动 */
}

.flip-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  will-change: transform;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  background: #fff;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.flip-page .page-content {
  flex: 1;
  overflow: hidden; /* 禁止滚动，内容需精确分页 */
  padding: 10px 0.75rem 6px; /* 进一步减少padding，显示更多内容（与JS保持一致：上10px 下6px） */
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  text-align: justify;
  box-sizing: border-box;
}

.flip-page .page-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem; /* 从1.5rem减小到1rem(16px)，显示更多内容 */
  margin-top: 0;
  text-align: center;
  line-height: 1.6;
}

.flip-page .page-content :deep(p) {
  margin-bottom: 0.85em; /* 从1em减小到0.85em，减少段落间距，显示更多内容 */
  margin-top: 0;
  text-indent: 2em;
  text-align: justify;
  line-height: inherit;
  word-wrap: break-word;
  word-break: break-word;
}

.flip-page .page-number {
  position: absolute;
  bottom: 0.25rem; /* 从0.5rem减小到0.25rem，更靠近底部，显示更多内容 */
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem; /* 从0.75rem减小到0.7rem */
  color: #999;
  opacity: 0.5;
  z-index: 10;
  background: transparent;
  padding: 0.2rem 0.5rem; /* 减小padding */
  pointer-events: none; /* 不阻挡点击事件 */
}

/* 当前页（中心位置） */
.flip-page.current-page {
  z-index: 2;
  animation: none;
  transform: translateX(0);
}

/* 向前翻页动画 - 当前页向左滑出 */
.flip-page.current-page.flipping-forward {
  z-index: 2;
  animation: slideOutLeft 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* 下一页（从右侧滑入） */
.flip-page.next-page {
  z-index: 3;
  animation: slideInFromRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* 向后翻页动画 - 当前页向右滑出 */
.flip-page.current-page.flipping-backward {
  z-index: 2;
  animation: slideOutRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* 上一页（从左侧滑入） */
.flip-page.prev-page {
  z-index: 3;
  opacity: 1;
  animation: slideInFromLeft 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* 平移动画关键帧 - 向左滑出 */
@keyframes slideOutLeft {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-100%);
    opacity: 0.3;
  }
}

/* 平移动画关键帧 - 从右侧滑入 */
@keyframes slideInFromRight {
  0% {
    transform: translateX(100%);
    opacity: 0.3;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 平移动画关键帧 - 向右滑出 */
@keyframes slideOutRight {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0.3;
  }
}

/* 平移动画关键帧 - 从左侧滑入 */
@keyframes slideInFromLeft {
  0% {
    transform: translateX(-100%);
    opacity: 0.3;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 翻页模式左右热区（覆盖于页面两侧，点击整屏翻动） */
.page-zone {
  position: fixed;
  top: 56px; /* 避开顶部工具栏高度 */
  bottom: 64px; /* 避开底部工具栏高度 */
  width: 28%;
  background: transparent;
  border: none;
  z-index: 110;
  cursor: pointer;
}
.page-zone.left { left: 0; }
.page-zone.right { right: 0; }
.page-zone:focus { outline: none; }

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
  width: 100%;
  background: var(--color-bg-card);
  backdrop-filter: blur(10px);
  transform: translateY(100%);
  transition: transform 0.3s ease, background 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  box-shadow: 0 -2px 8px var(--color-shadow);
  box-sizing: border-box;
  opacity: 0.98;
}

.footer-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0.75rem 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .footer-content {
    padding: 1rem 2rem;
  }
}

.reading-footer.show {
  transform: translateY(0);
}

.dark-mode .reading-footer {
  background: var(--color-bg-card);
  box-shadow: 0 -2px 8px var(--color-shadow);
  opacity: 0.98;
}

/* 底部工具栏翻页按钮区域 */
.footer-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.footer-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #d95468 0%, #ed7654 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(217, 84, 104, 0.2);
  min-height: 40px;
  flex-shrink: 0;
  white-space: nowrap;
}

.footer-nav-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c74458 0%, #dc6544 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(217, 84, 104, 0.3);
}

.footer-nav-btn:active:not(:disabled) {
  transform: translateY(0);
}

.footer-nav-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.5;
}

.footer-nav-btn .nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .footer-navigation {
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .footer-nav-btn {
    padding: 0.5rem;
    font-size: 0.8125rem;
    min-height: 36px;
    min-width: 36px;
  }

  .footer-nav-btn span {
    display: none;
  }

  .footer-nav-btn .nav-icon {
    width: 20px;
    height: 20px;
  }
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.progress-slider {
  flex: 1;
  min-width: 0;
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
  background: #d95468;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.progress-slider::-webkit-slider-thumb:hover {
  background: #c74458;
  transform: scale(1.1);
}

.progress-text {
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
  flex-shrink: 0;
}

.dark-mode .progress-text {
  color: #999;
}

.dark-mode .progress-slider::-webkit-slider-thumb {
  background: #ed7654;
}

.dark-mode .progress-slider::-webkit-slider-thumb:hover {
  background: #dc6544;
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

.action-btn.mode-active {
  color: #4f46e5;
  background: rgba(79, 70, 229, 0.1);
  font-weight: 600;
}

.dark-mode .action-btn {
  color: #999;
}

.dark-mode .action-btn:hover {
  background: rgba(255,255,255,0.05);
  color: #6366f1;
}

.dark-mode .action-btn.mode-active {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.15);
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


/* 悬浮工具栏样式（小红书风格） */
.float-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 250, 0.98) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(217, 84, 104, 0.1);
  box-shadow: 0 -4px 16px rgba(217, 84, 104, 0.08);
  z-index: 999;
  padding: 0.75rem 0;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}

.dark-mode .float-toolbar {
  background: linear-gradient(to top, rgba(30, 30, 30, 0.98) 0%, rgba(35, 30, 32, 0.98) 100%);
  border-top-color: rgba(217, 84, 104, 0.2);
}

.float-toolbar-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .float-toolbar-content {
    padding: 0 2rem;
  }
}

/* 评论输入框 */
.comment-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 250, 250, 0.8);
  border: 2px solid rgba(217, 84, 104, 0.15);
  border-radius: 24px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.comment-input-wrapper:hover {
  background: rgba(255, 250, 250, 1);
  border-color: rgba(217, 84, 104, 0.25);
}

.dark-mode .comment-input-wrapper {
  background: rgba(40, 40, 40, 0.8);
  border-color: rgba(217, 84, 104, 0.2);
}

.dark-mode .comment-input-wrapper:hover {
  background: rgba(45, 45, 45, 0.9);
  border-color: rgba(217, 84, 104, 0.3);
}

.input-icon {
  width: 20px;
  height: 20px;
  color: #d95468;
  flex-shrink: 0;
}

.input-placeholder {
  font-size: 0.875rem;
  color: #999;
  user-select: none;
}

.dark-mode .input-placeholder {
  color: #666;
}

/* 工具栏操作按钮 */
.toolbar-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  min-width: 60px;
}

.toolbar-action-btn:hover {
  background: rgba(217, 84, 104, 0.05);
}

.toolbar-action-btn.active {
  background: linear-gradient(135deg, rgba(217, 84, 104, 0.1) 0%, rgba(237, 118, 84, 0.1) 100%);
}

.action-icon {
  width: 24px;
  height: 24px;
  color: #666;
  transition: all 0.3s ease;
}

.toolbar-action-btn.active .action-icon {
  color: #d95468;
}

.dark-mode .action-icon {
  color: #999;
}

.dark-mode .toolbar-action-btn.active .action-icon {
  color: #ed7654;
}

.action-count,
.action-text {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
}

.toolbar-action-btn.active .action-count,
.toolbar-action-btn.active .action-text {
  color: #d95468;
}

.dark-mode .action-count,
.dark-mode .action-text {
  color: #999;
}

.dark-mode .toolbar-action-btn.active .action-count,
.dark-mode .toolbar-action-btn.active .action-text {
  color: #ed7654;
}

/* 悬浮工具栏动画 */
.float-toolbar-enter-active,
.float-toolbar-leave-active {
  transition: all 0.3s ease;
}

.float-toolbar-enter-from,
.float-toolbar-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .float-toolbar {
    padding: 0.5rem 0.75rem;
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
  }

  .float-toolbar-content {
    gap: 0.5rem;
  }

  .comment-input-wrapper {
    padding: 0.4rem 0.75rem;
  }

  .toolbar-action-btn {
    min-width: 50px;
    padding: 0.4rem 0.5rem;
  }

  .action-icon {
    width: 20px;
    height: 20px;
  }

  .input-icon {
    width: 18px;
    height: 18px;
  }

  .input-placeholder {
    font-size: 0.8rem;
  }

  .action-count,
  .action-text {
    font-size: 0.7rem;
  }
}

.dark-mode .comments-wrapper {
  border-top-color: rgba(255,255,255,0.08);
}

</style>

