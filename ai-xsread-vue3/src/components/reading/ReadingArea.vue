<template>
  <div class="reading-area" :style="readingStyles" @click="handleContentClick">
    <!-- 章节标题 -->
    <div class="chapter-header">
      <h1 class="chapter-title">{{ currentChapter?.title || '加载中...' }}</h1>
      <div class="chapter-info">
        <span class="chapter-number">第 {{ currentChapter?.chapterNumber }} 章</span>
        <span class="word-count">{{ formatWordCount(currentChapter?.wordCount) }}</span>
      </div>
    </div>

    <!-- 章节内容 -->
    <div 
      ref="contentRef"
      class="chapter-content"
      :style="contentStyles"
      v-html="formattedContent"
    ></div>

    <!-- 阅读进度指示器 -->
    <div class="reading-progress" :style="{ width: readingProgress + '%' }"></div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <svg class="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>加载中...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useReadingSettings } from '@/composables/useReadingSettings'
import { useReadingProgress } from '@/composables/useReadingProgress'

// Props
const props = defineProps({
  novelId: {
    type: [Number, String],
    required: true
  },
  chapterId: {
    type: [Number, String],
    required: true
  }
})

// Emits
const emit = defineEmits(['content-click', 'progress-update'])

// 阅读设置
const { settings } = useReadingSettings()

// 阅读进度
const { 
  saveProgress, 
  getProgress, 
  calculateProgress 
} = useReadingProgress(props.novelId)

// 状态
const loading = ref(false)
const currentChapter = ref(null)
const contentRef = ref(null)
const readingProgress = ref(0)

// 计算阅读样式
const readingStyles = computed(() => ({
  backgroundColor: settings.value.backgroundColor,
  color: settings.value.textColor
}))

const contentStyles = computed(() => ({
  fontSize: settings.value.fontSize + 'px',
  lineHeight: settings.value.lineHeight,
  fontFamily: settings.value.fontFamily
}))

// 格式化内容（添加段落标签）
const formattedContent = computed(() => {
  if (!currentChapter.value?.content) return ''
  
  const content = currentChapter.value.content
  // 将换行符转换为段落
  return content
    .split('\n')
    .filter(p => p.trim())
    .map(p => `<p class="content-paragraph">${p.trim()}</p>`)
    .join('')
})

/**
 * 格式化字数
 */
const formatWordCount = (count) => {
  if (!count) return '0字'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万字'
  }
  return count + '字'
}

/**
 * 加载章节内容
 */
const loadChapterContent = async () => {
  loading.value = true
  
  try {
    // TODO: 调用API加载章节内容
    // const response = await getChapterContent(props.chapterId)
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    currentChapter.value = {
      id: props.chapterId,
      chapterNumber: 1,
      title: '第一章 修真世界',
      wordCount: 3500,
      content: `天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。

在这个充满灵气的世界里，修真者追求着长生不老的梦想。他们吸收天地灵气，淬炼自身，最终超脱凡尘，飞升成仙。

少年李云站在山巅，遥望远方的云海。他的眼神坚定，心中燃烧着对修真的渴望。从今天开始，他将踏上这条艰难而辉煌的道路。

师父曾说："修真之路，九死一生。但只要心中有道，便能披荆斩棘，勇往直前。"

李云深深记住了这句话。他知道，这条路虽然艰辛，但他绝不会退缩。

山下，宗门的钟声悠扬响起，新一批弟子即将开始他们的修真之旅。李云转身，大步走下山去。

他的故事，才刚刚开始......

（以下是更多章节内容，用于测试滚动效果）

修真界分为九个境界：炼气、筑基、金丹、元婴、化神、炼虚、合体、大乘、渡劫。每一个境界都是一道天堑，无数修真者穷尽一生，也无法突破。

李云的天赋虽然平凡，但他有一颗不屈的心。他相信，只要坚持不懈，总有一天能够达到传说中的境界。

在接下来的日子里，李云刻苦修炼，从未懈怠。他每天都在努力提升自己的修为，渴望有朝一日能够掌握强大的力量。

岁月如梭，转眼十年过去。李云已经从一个懵懂少年，成长为宗门内的佼佼者......`.repeat(3)
    }
    
    // 恢复阅读位置
    nextTick(() => {
      restoreScrollPosition()
    })
    
  } catch (error) {
    console.error('加载章节失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 处理内容点击
 */
const handleContentClick = (event) => {
  emit('content-click', event)
}

/**
 * 处理滚动事件
 */
const handleScroll = () => {
  if (!contentRef.value) return
  
  const element = contentRef.value
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  
  // 计算阅读进度
  const progress = (scrollTop / scrollHeight) * 100
  readingProgress.value = Math.min(progress, 100)
  
  // 保存阅读进度（防抖）
  saveScrollPosition()
}

// 防抖保存滚动位置
let scrollTimeout = null
const saveScrollPosition = () => {
  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const progress = readingProgress.value
    
    saveProgress({
      chapterId: props.chapterId,
      scrollPosition: scrollTop,
      progress: progress
    })
    
    emit('progress-update', progress)
  }, 2000) // 2秒后保存
}

/**
 * 恢复滚动位置
 */
const restoreScrollPosition = () => {
  const savedProgress = getProgress()
  
  if (savedProgress && savedProgress.chapterId === props.chapterId) {
    // 恢复到之前的位置
    window.scrollTo({
      top: savedProgress.scrollPosition || 0,
      behavior: 'smooth'
    })
    readingProgress.value = savedProgress.progress || 0
  } else {
    // 滚动到顶部
    window.scrollTo(0, 0)
    readingProgress.value = 0
  }
}

// 监听章节变化
watch(() => props.chapterId, () => {
  loadChapterContent()
})

// 组件挂载
onMounted(() => {
  loadChapterContent()
  window.addEventListener('scroll', handleScroll)
})

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  // 保存最后的阅读位置
  saveProgress({
    chapterId: props.chapterId,
    scrollPosition: window.pageYOffset || document.documentElement.scrollTop,
    progress: readingProgress.value
  })
})
</script>

<style scoped>
.reading-area {
  min-height: 100vh;
  padding: 2rem 1rem;
  transition: background-color 0.3s ease, color 0.3s ease;
  position: relative;
}

/* 章节头部 */
.chapter-header {
  max-width: 800px;
  margin: 0 auto 3rem;
  text-align: center;
  padding-bottom: 2rem;
  border-bottom: 2px solid var(--color-border);
}

.chapter-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.chapter-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* 章节内容 */
.chapter-content {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 5rem;
  transition: font-size 0.3s ease, line-height 0.3s ease;
}

:deep(.content-paragraph) {
  margin-bottom: 1.5em;
  text-indent: 2em;
  text-align: justify;
  word-break: break-all;
}

:deep(.content-paragraph:first-child) {
  margin-top: 0;
}

/* 阅读进度条 */
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
  z-index: 1000;
  transition: width 0.3s ease;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  text-align: center;
  color: white;
}

.loading-spinner p {
  margin-top: 1rem;
  font-size: 1rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .reading-area {
    padding: 1.5rem 1rem;
  }
  
  .chapter-header {
    margin-bottom: 2rem;
  }
  
  .chapter-title {
    font-size: 1.5rem;
  }
  
  .chapter-info {
    gap: 1rem;
    font-size: 0.75rem;
  }
  
  .chapter-content {
    padding-bottom: 8rem; /* 为底部控制栏留出空间 */
  }
}

/* 夜间模式优化 */
.mode-dark .reading-area {
  /* 减少蓝光 */
  filter: brightness(0.95);
}

.mode-dark :deep(.content-paragraph) {
  /* 提高对比度 */
  color: #e0e0e0;
}
</style>

