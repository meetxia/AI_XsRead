<template>
  <div class="enhanced-reading-progress">
    <!-- 顶部进度条 -->
    <div class="progress-bar-top" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: progressPercent + '%' }"
        >
          <div class="progress-glow"></div>
          <div class="progress-marker"></div>
        </div>
      </div>
    </div>

    <!-- 主要进度展示区 -->
    <div class="progress-main">
      <!-- 左侧：章节信息和进度环 -->
      <div class="progress-left">
        <!-- 章节进度 -->
        <div class="chapter-info">
          <div class="chapter-current">
            <span class="chapter-label">当前章节</span>
            <div class="chapter-number">第 {{ currentChapter }} 章</div>
            <div class="chapter-title">{{ currentChapterTitle }}</div>
          </div>
          
          <div class="progress-details">
            <span class="detail-item">
              <span class="detail-label">总章节:</span>
              <span class="detail-value">{{ totalChapters }}</span>
            </span>
            <span class="detail-separator">·</span>
            <span class="detail-item">
              <span class="detail-label">剩余:</span>
              <span class="detail-value">{{ remainingChapters }}章</span>
            </span>
          </div>
        </div>

        <!-- 进度环 -->
        <div class="progress-ring-wrapper">
          <svg class="progress-ring" :width="ringSize" :height="ringSize">
            <!-- 背景圆环 -->
            <circle
              class="ring-bg"
              :r="ringRadius"
              :cx="ringSize / 2"
              :cy="ringSize / 2"
              fill="transparent"
              stroke="currentColor"
              :stroke-width="ringStrokeWidth"
            />
            <!-- 进度圆环 -->
            <circle
              class="ring-progress"
              :r="ringRadius"
              :cx="ringSize / 2"
              :cy="ringSize / 2"
              fill="transparent"
              stroke="url(#gradient)"
              :stroke-width="ringStrokeWidth"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              stroke-linecap="round"
            />
            <!-- 渐变定义 -->
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:var(--color-primary);stop-opacity:1" />
                <stop offset="100%" style="stop-color:var(--color-secondary);stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
          
          <!-- 进度百分比 -->
          <div class="ring-content">
            <div class="progress-percent">{{ progressPercent }}</div>
            <div class="progress-unit">%</div>
          </div>
        </div>
      </div>

      <!-- 右侧：阅读统计 -->
      <div class="progress-right">
        <div class="stats-grid">
          <!-- 本次阅读 -->
          <div class="stat-card session">
            <div class="stat-icon-wrapper">
              <svg class="stat-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">本次阅读</div>
              <div class="stat-value">{{ formatTime(sessionReadTime) }}</div>
              <div class="stat-extra">{{ sessionPages }}页</div>
            </div>
          </div>

          <!-- 今日阅读 -->
          <div class="stat-card today">
            <div class="stat-icon-wrapper">
              <svg class="stat-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">今日阅读</div>
              <div class="stat-value">{{ formatTime(todayReadTime) }}</div>
              <div class="stat-extra">{{ todayChapters }}章</div>
            </div>
          </div>

          <!-- 阅读速度 -->
          <div class="stat-card speed">
            <div class="stat-icon-wrapper">
              <svg class="stat-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">阅读速度</div>
              <div class="stat-value">{{ readingSpeed }}</div>
              <div class="stat-extra">字/分钟</div>
            </div>
          </div>

          <!-- 预计完成 -->
          <div class="stat-card estimate">
            <div class="stat-icon-wrapper">
              <svg class="stat-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">预计完成</div>
              <div class="stat-value">{{ estimatedTime }}</div>
              <div class="stat-extra">按当前速度</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 章节列表快速导航 -->
    <div class="chapter-nav">
      <div class="chapter-nav-header">
        <div class="nav-title">章节导航</div>
        <div class="nav-controls">
          <button
            class="nav-btn"
            @click="prevChapter"
            :disabled="currentChapter <= 1"
            v-feedback
            aria-label="上一章"
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            上一章
          </button>
          <button
            class="nav-btn primary"
            @click="nextChapter"
            :disabled="currentChapter >= totalChapters"
            v-feedback
            aria-label="下一章"
          >
            下一章
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 进度条滑块 -->
      <div class="chapter-slider">
        <input
          type="range"
          min="1"
          :max="totalChapters"
          v-model.number="currentChapterLocal"
          @change="handleChapterChange"
          class="slider"
          :aria-label="`跳转到章节，当前第${currentChapter}章`"
        />
        <div class="slider-markers">
          <span
            v-for="marker in sliderMarkers"
            :key="marker"
            class="slider-marker"
            :style="{ left: getMarkerPosition(marker) }"
          >
            {{ marker }}
          </span>
        </div>
      </div>
    </div>

    <!-- 阅读成就提示 -->
    <transition name="achievement-pop">
      <div v-if="showAchievement" class="achievement-toast">
        <div class="achievement-icon">🎉</div>
        <div class="achievement-content">
          <div class="achievement-title">{{ achievementTitle }}</div>
          <div class="achievement-desc">{{ achievementDesc }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  currentChapter: {
    type: Number,
    default: 1
  },
  currentChapterTitle: {
    type: String,
    default: ''
  },
  totalChapters: {
    type: Number,
    default: 100
  },
  sessionReadTime: {
    type: Number,
    default: 0 // 秒
  },
  todayReadTime: {
    type: Number,
    default: 0 // 秒
  },
  sessionPages: {
    type: Number,
    default: 0
  },
  todayChapters: {
    type: Number,
    default: 0
  },
  readingSpeed: {
    type: Number,
    default: 500 // 字/分钟
  }
})

const emit = defineEmits(['chapter-change', 'prev-chapter', 'next-chapter'])

// 进度环尺寸
const ringSize = 120
const ringStrokeWidth = 8
const ringRadius = (ringSize - ringStrokeWidth) / 2

// 本地章节状态
const currentChapterLocal = ref(props.currentChapter)

// 成就提示
const showAchievement = ref(false)
const achievementTitle = ref('')
const achievementDesc = ref('')

// 进度百分比
const progressPercent = computed(() => {
  if (props.totalChapters === 0) return 0
  return Math.round((props.currentChapter / props.totalChapters) * 100)
})

// 剩余章节
const remainingChapters = computed(() => {
  return Math.max(0, props.totalChapters - props.currentChapter)
})

// 进度环计算
const circumference = computed(() => 2 * Math.PI * ringRadius)
const dashOffset = computed(() => {
  return circumference.value * (1 - progressPercent.value / 100)
})

// 预计完成时间
const estimatedTime = computed(() => {
  if (props.readingSpeed === 0 || remainingChapters.value === 0) {
    return '已完成'
  }
  
  // 假设每章平均3000字
  const avgWordsPerChapter = 3000
  const remainingWords = remainingChapters.value * avgWordsPerChapter
  const remainingMinutes = Math.ceil(remainingWords / props.readingSpeed)
  
  return formatTime(remainingMinutes * 60)
})

// 滑块标记
const sliderMarkers = computed(() => {
  const total = props.totalChapters
  if (total <= 10) {
    return Array.from({ length: total + 1 }, (_, i) => i)
  }
  
  // 显示关键标记点
  return [1, Math.floor(total * 0.25), Math.floor(total * 0.5), Math.floor(total * 0.75), total]
})

// 获取标记位置
function getMarkerPosition(marker) {
  return `${((marker - 1) / (props.totalChapters - 1)) * 100}%`
}

// 格式化时间
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}分钟`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 ? `${hours}小时${minutes}分` : `${hours}小时`
  }
}

// 章节切换处理
function handleChapterChange() {
  emit('chapter-change', currentChapterLocal.value)
  checkAchievements()
}

function prevChapter() {
  if (props.currentChapter > 1) {
    emit('prev-chapter')
  }
}

function nextChapter() {
  if (props.currentChapter < props.totalChapters) {
    emit('next-chapter')
    checkAchievements()
  }
}

// 检查成就
function checkAchievements() {
  // 完成50%
  if (progressPercent.value === 50 && !localStorage.getItem('achievement_halfway')) {
    showAchievementToast('阅读过半！', '坚持就是胜利')
    localStorage.setItem('achievement_halfway', 'true')
  }
  
  // 完成100%
  if (props.currentChapter === props.totalChapters && !localStorage.getItem('achievement_complete')) {
    showAchievementToast('读完全书！', '恭喜你完成阅读')
    localStorage.setItem('achievement_complete', 'true')
  }
}

function showAchievementToast(title, desc) {
  achievementTitle.value = title
  achievementDesc.value = desc
  showAchievement.value = true
  
  setTimeout(() => {
    showAchievement.value = false
  }, 3000)
}

// 监听props变化
watch(() => props.currentChapter, (newVal) => {
  currentChapterLocal.value = newVal
})
</script>

<style scoped>
.enhanced-reading-progress {
  padding: 1.5rem;
  background: var(--color-bg-base);
  border-radius: 16px;
}

/* 顶部进度条 */
.progress-bar-top {
  margin-bottom: 2rem;
}

.progress-track {
  position: relative;
  height: 8px;
  background: var(--color-bg-hover);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  position: relative;
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-glow {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  border-radius: 50%;
  filter: blur(12px);
  opacity: 0.7;
}

.progress-marker {
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background: white;
  border: 3px solid var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(217, 84, 104, 0.4);
}

/* 主要进度展示 */
.progress-main {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

/* 左侧 */
.progress-left {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chapter-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chapter-current {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chapter-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chapter-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.2;
}

.chapter-title {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.progress-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.detail-label {
  color: var(--color-text-muted);
}

.detail-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-separator {
  color: var(--color-text-muted);
}

/* 进度环 */
.progress-ring-wrapper {
  position: relative;
  width: fit-content;
  margin: 0 auto;
}

.progress-ring {
  transform: rotate(-90deg);
}

.ring-bg {
  stroke: var(--color-border-light);
}

.ring-progress {
  transition: stroke-dashoffset 0.5s ease;
}

.ring-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.progress-percent {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.progress-unit {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-left: 0.25rem;
}

/* 右侧统计 */
.progress-right {
  display: flex;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-card.session .stat-icon-wrapper {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-card.today .stat-icon-wrapper {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.stat-card.speed .stat-icon-wrapper {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.stat-card.estimate .stat-icon-wrapper {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.stat-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-extra {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

/* 章节导航 */
.chapter-nav {
  padding: 1.5rem;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.chapter-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.nav-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.nav-controls {
  display: flex;
  gap: 0.75rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.125rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn.primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
}

.nav-btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.3);
}

.nav-btn svg {
  width: 16px;
  height: 16px;
}

/* 章节滑块 */
.chapter-slider {
  position: relative;
  padding-top: 1.5rem;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--color-bg-hover);
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(217, 84, 104, 0.4);
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.6);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(217, 84, 104, 0.4);
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.6);
}

.slider-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.slider-marker {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

/* 成就提示 */
.achievement-toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(217, 84, 104, 0.4);
  z-index: 1000;
}

.achievement-icon {
  font-size: 2rem;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.achievement-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.achievement-title {
  font-size: 1rem;
  font-weight: 700;
}

.achievement-desc {
  font-size: 0.875rem;
  opacity: 0.9;
}

/* 成就动画 */
.achievement-pop-enter-active {
  animation: slideInRight 0.4s ease-out;
}

.achievement-pop-leave-active {
  animation: slideOutRight 0.3s ease-in;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100px);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .progress-main {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .chapter-nav-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .nav-controls {
    width: 100%;
  }

  .nav-btn {
    flex: 1;
    justify-content: center;
  }

  .achievement-toast {
    top: auto;
    bottom: 2rem;
    right: 1rem;
    left: 1rem;
  }
}
</style>

