<template>
  <div class="reading-progress-container">
    <!-- 顶部进度条 -->
    <div class="progress-bar-top" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
      <div
        class="progress-bar-fill"
        :style="{ width: progressPercent + '%' }"
      >
        <div class="progress-glow"></div>
      </div>
    </div>
    
    <!-- 章节进度指示器 -->
    <div class="chapter-progress">
      <div class="progress-info">
        <span class="current-chapter">第{{ currentChapter }}章</span>
        <span class="separator">/</span>
        <span class="total-chapters">共{{ totalChapters }}章</span>
        <span class="percent">{{ progressPercent }}%</span>
      </div>
      
      <!-- 进度环 -->
      <div class="progress-ring-container">
        <svg class="progress-ring" width="80" height="80">
          <circle
            class="progress-ring-bg"
            r="32"
            cx="40"
            cy="40"
            fill="transparent"
            stroke="currentColor"
            stroke-width="6"
          />
          <circle
            class="progress-ring-fill"
            r="32"
            cx="40"
            cy="40"
            fill="transparent"
            stroke="currentColor"
            stroke-width="6"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="progress-text">
          <span class="progress-percent">{{ progressPercent }}</span>
          <span class="progress-unit">%</span>
        </div>
      </div>
    </div>
    
    <!-- 阅读统计 -->
    <div class="reading-stats">
      <div class="stat-card">
        <svg class="stat-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
        </svg>
        <div class="stat-info">
          <span class="stat-label">本次阅读</span>
          <span class="stat-value">{{ formatTime(sessionReadTime) }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <svg class="stat-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
        </svg>
        <div class="stat-info">
          <span class="stat-label">今日阅读</span>
          <span class="stat-value">{{ formatTime(todayReadTime) }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <svg class="stat-icon" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
        </svg>
        <div class="stat-info">
          <span class="stat-label">剩余章节</span>
          <span class="stat-value">{{ remainingChapters }}章</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentChapter: {
    type: Number,
    default: 1
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
  }
})

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
const radius = 32
const circumference = 2 * Math.PI * radius
const dashOffset = computed(() => {
  return circumference * (1 - progressPercent.value / 100)
})

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
    return `${hours}小时${minutes}分钟`
  }
}
</script>

<style scoped>
.reading-progress-container {
  padding: 1.5rem;
}

/* 顶部进度条 */
.progress-bar-top {
  position: relative;
  height: 4px;
  background: var(--color-bg-hover, #f3f4f6);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
  transition: width 0.3s ease;
  position: relative;
}

.progress-glow {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 50%;
  filter: blur(8px);
  opacity: 0.6;
}

/* 章节进度 */
.chapter-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.current-chapter {
  font-weight: 600;
  color: var(--color-primary);
}

.separator {
  color: var(--color-text-muted);
}

.total-chapters {
  color: var(--color-text-secondary);
}

.percent {
  margin-left: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--color-accent, #FFBAAC);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* 进度环 */
.progress-ring-container {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-bg {
  stroke: var(--color-border-light, #f3f4f6);
}

.progress-ring-fill {
  stroke: var(--color-primary);
  transition: stroke-dashoffset 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.progress-percent {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.progress-unit {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-left: 2px;
}

/* 阅读统计 */
.reading-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-bg-hover, #f8f8f8);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.stat-card:hover {
  background: var(--color-bg-base, #f3f4f6);
  transform: translateY(-2px);
}

.stat-icon {
  width: 32px;
  height: 32px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .reading-progress-container {
    padding: 1rem;
  }
  
  .chapter-progress {
    flex-direction: column;
    gap: 1rem;
  }
  
  .progress-info {
    font-size: 0.875rem;
  }
  
  .progress-ring-container {
    width: 60px;
    height: 60px;
  }
  
  .progress-percent {
    font-size: 1.125rem;
  }
  
  .reading-stats {
    grid-template-columns: 1fr;
  }
}
</style>

