<template>
  <!-- 控制栏容器 -->
  <Transition name="slide">
    <div v-if="visible" class="reading-control">
      <!-- 顶部控制栏 -->
      <div class="control-bar control-top">
        <button @click="handleBack" class="control-btn">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span>返回</span>
        </button>
        
        <div class="control-title">
          <h2>{{ novelTitle }}</h2>
          <p>{{ chapterTitle }}</p>
        </div>
        
        <button @click="handleShare" class="control-btn">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
          </svg>
        </button>
      </div>
      
      <!-- 底部控制栏 -->
      <div class="control-bar control-bottom">
        <!-- 章节进度条 -->
        <div class="progress-container">
          <button 
            @click="handlePrevChapter"
            :disabled="!hasPrevChapter"
            class="nav-btn"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          
          <div class="progress-bar-container">
            <input
              type="range"
              :value="progress"
              @input="handleProgressChange"
              min="0"
              max="100"
              class="progress-slider"
            />
            <div class="progress-info">
              <span>{{ progress.toFixed(0) }}%</span>
            </div>
          </div>
          
          <button 
            @click="handleNextChapter"
            :disabled="!hasNextChapter"
            class="nav-btn"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
        
        <!-- 功能按钮 -->
        <div class="action-buttons">
          <button @click="handleCatalog" class="action-btn">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
            <span>目录</span>
          </button>
          
          <button @click="handleBookmark" class="action-btn">
            <svg class="w-6 h-6" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
            <span>{{ isBookmarked ? '已标记' : '书签' }}</span>
          </button>
          
          <button @click="handleSettings" class="action-btn">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span>设置</span>
          </button>
          
          <button @click="handleDayNight" class="action-btn">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="isDarkMode" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <span>{{ isDarkMode ? '日间' : '夜间' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  novelTitle: {
    type: String,
    default: ''
  },
  chapterTitle: {
    type: String,
    default: ''
  },
  hasPrevChapter: {
    type: Boolean,
    default: true
  },
  hasNextChapter: {
    type: Boolean,
    default: true
  },
  isBookmarked: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'prev-chapter',
  'next-chapter',
  'progress-change',
  'catalog',
  'bookmark',
  'settings',
  'back',
  'share'
])

// 路由
const router = useRouter()

// 主题
const themeStore = useThemeStore()
const isDarkMode = computed(() => themeStore.currentMode === 'dark')

/**
 * 返回上一页
 */
const handleBack = () => {
  emit('back')
  router.back()
}

/**
 * 分享
 */
const handleShare = () => {
  emit('share')
}

/**
 * 上一章
 */
const handlePrevChapter = () => {
  if (props.hasPrevChapter) {
    emit('prev-chapter')
  }
}

/**
 * 下一章
 */
const handleNextChapter = () => {
  if (props.hasNextChapter) {
    emit('next-chapter')
  }
}

/**
 * 进度条变化
 */
const handleProgressChange = (event) => {
  const progress = parseFloat(event.target.value)
  emit('progress-change', progress)
}

/**
 * 打开目录
 */
const handleCatalog = () => {
  emit('catalog')
}

/**
 * 切换书签
 */
const handleBookmark = () => {
  emit('bookmark')
}

/**
 * 打开设置
 */
const handleSettings = () => {
  emit('settings')
}

/**
 * 切换日夜模式
 */
const handleDayNight = () => {
  themeStore.toggleMode()
}
</script>

<style scoped>
.reading-control {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 100;
}

.control-bar {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
  padding: 1rem;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
}

/* 顶部控制栏 */
.control-top {
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.control-title {
  flex: 1;
  text-align: center;
  overflow: hidden;
}

.control-title h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.control-title p {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 底部控制栏 */
.control-bottom {
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 进度容器 */
.progress-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
}

.progress-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.progress-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: transform 0.2s;
}

.progress-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.progress-info {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 按钮 */
.control-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: var(--color-text-primary);
  background-color: transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.control-btn:hover {
  background-color: var(--color-accent);
}

.control-btn svg {
  flex-shrink: 0;
}

.nav-btn {
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: var(--color-text-primary);
  background-color: transparent;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background-color: var(--color-accent);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 功能按钮 */
.action-buttons {
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
  border-radius: 0.5rem;
  color: var(--color-text-primary);
  background-color: transparent;
  transition: all 0.2s;
  font-size: 0.75rem;
}

.action-btn:hover {
  background-color: var(--color-accent);
  color: var(--color-primary);
}

.action-btn svg {
  flex-shrink: 0;
}

/* 滑入滑出动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from .control-top,
.slide-leave-to .control-top {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-enter-from .control-bottom,
.slide-leave-to .control-bottom {
  transform: translateY(100%);
  opacity: 0;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .control-bar {
    padding: 0.75rem;
  }
  
  .control-btn span {
    display: none;
  }
  
  .control-title h2 {
    font-size: 0.875rem;
  }
  
  .control-title p {
    font-size: 0.75rem;
  }
  
  .action-buttons {
    gap: 0.25rem;
  }
  
  .action-btn {
    padding: 0.375rem;
    font-size: 0.625rem;
  }
  
  .action-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}

/* 底部导航安全区域 */
.control-bottom {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}
</style>

