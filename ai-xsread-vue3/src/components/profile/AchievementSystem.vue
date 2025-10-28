<template>
  <div class="achievement-system">
    <!-- 成就概览 -->
    <div class="achievement-summary">
      <div class="summary-card">
        <div class="summary-icon">🏆</div>
        <div class="summary-content">
          <div class="summary-number">{{ summary.unlocked }}</div>
          <div class="summary-label">已解锁</div>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-icon">🎯</div>
        <div class="summary-content">
          <div class="summary-number">{{ summary.total }}</div>
          <div class="summary-label">总成就</div>
        </div>
      </div>
      
      <div class="summary-card wide">
        <div class="summary-icon">📈</div>
        <div class="summary-content">
          <div class="summary-label">完成度</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${summary.percentage}%` }"></div>
          </div>
          <div class="progress-text">{{ summary.percentage }}%</div>
        </div>
      </div>
    </div>

    <!-- 成就分类 -->
    <div class="achievement-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: currentTab === tab.key }]"
        @click="currentTab = tab.key"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- 成就列表 -->
    <div class="achievement-list">
      <div
        v-for="achievement in filteredAchievements"
        :key="achievement.id"
        :class="['achievement-card', { unlocked: achievement.unlocked }]"
      >
        <!-- 成就图标 -->
        <div class="achievement-icon">
          <span class="icon-emoji">{{ achievement.icon }}</span>
          <div v-if="achievement.unlocked" class="unlock-badge">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div v-else class="lock-badge">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>

        <!-- 成就信息 -->
        <div class="achievement-info">
          <h4 class="achievement-name">{{ achievement.name }}</h4>
          <p class="achievement-desc">{{ achievement.description }}</p>
          
          <!-- 进度条 -->
          <div class="achievement-progress">
            <div class="progress-bar-container">
              <div 
                class="progress-bar-fill" 
                :style="{ 
                  width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` 
                }"
              ></div>
            </div>
            <div class="progress-text">
              {{ achievement.progress }} / {{ achievement.target }}
            </div>
          </div>
        </div>

        <!-- 解锁状态 -->
        <div class="achievement-status">
          <span v-if="achievement.unlocked" class="status-unlocked">
            ✓ 已解锁
          </span>
          <span v-else class="status-locked">
            🔒 未解锁
          </span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredAchievements.length === 0" class="empty-state">
        <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
        <p>该分类暂无成就</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserAchievements } from '@/api/user'

const achievements = ref([])
const summary = ref({
  unlocked: 0,
  total: 0,
  percentage: 0
})

const currentTab = ref('all')

const tabs = [
  { key: 'all', label: '全部', icon: '🎯' },
  { key: 'bookshelf', label: '书架', icon: '📚' },
  { key: 'reading', label: '阅读', icon: '📖' },
  { key: 'habit', label: '习惯', icon: '🔥' },
  { key: 'milestone', label: '里程碑', icon: '🏆' }
]

// 筛选成就
const filteredAchievements = computed(() => {
  if (currentTab.value === 'all') {
    return achievements.value
  }
  return achievements.value.filter(a => a.category === currentTab.value)
})

// 加载成就数据
async function loadAchievements() {
  try {
    const res = await getUserAchievements()
    if (res.code === 200) {
      achievements.value = res.data.achievements || []
      summary.value = res.data.summary || { unlocked: 0, total: 0, percentage: 0 }
    }
  } catch (error) {
    console.error('获取成就列表失败:', error)
  }
}

onMounted(() => {
  loadAchievements()
})
</script>

<style scoped>
.achievement-system {
  width: 100%;
}

/* 成就概览 */
.achievement-summary {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .achievement-summary {
    grid-template-columns: repeat(3, 1fr);
  }
}

.summary-card {
  background: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px var(--color-shadow);
}

.summary-card.wide {
  grid-column: span 2;
}

@media (min-width: 768px) {
  .summary-card.wide {
    grid-column: span 1;
  }
}

.summary-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.summary-content {
  flex: 1;
}

.summary-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.6s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

/* 成就分类 */
.achievement-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 9999px;
  border: 2px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tab-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

/* 成就列表 */
.achievement-list {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 768px) {
  .achievement-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

.achievement-card {
  background: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 2px 8px var(--color-shadow);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  opacity: 0.6;
}

.achievement-card.unlocked {
  opacity: 1;
  border-color: var(--color-primary);
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow);
}

/* 成就图标 */
.achievement-icon {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: var(--color-bg-secondary);
}

.icon-emoji {
  font-size: 2rem;
}

.unlock-badge,
.lock-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-bg-card);
}

.unlock-badge {
  background: #10b981;
  color: white;
}

.lock-badge {
  background: #6b7280;
  color: white;
}

/* 成就信息 */
.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.achievement-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar-container {
  flex: 1;
  height: 6px;
  background: var(--color-bg-secondary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.6s ease;
}

.achievement-progress .progress-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
  white-space: nowrap;
}

/* 成就状态 */
.achievement-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.status-unlocked,
.status-locked {
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
}

.status-unlocked {
  background: #d1fae5;
  color: #065f46;
}

.status-locked {
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-text-muted);
}

.empty-state svg {
  width: 5rem;
  height: 5rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* 工具类 */
.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}

.w-20 {
  width: 5rem;
}

.h-20 {
  height: 5rem;
}

/* 移动端优化 */
@media (max-width: 640px) {
  /* 成就概览 */
  .achievement-summary {
    gap: 0.5rem;
    margin-bottom: 1rem;
    grid-template-columns: repeat(4, 1fr);
  }

  .summary-card {
    padding: 0.75rem 0.5rem;
    flex-direction: column;
    gap: 0.25rem;
    text-align: center;
  }

  .summary-card.wide {
    grid-column: span 4;
    flex-direction: row;
    padding: 0.75rem;
  }

  .summary-icon {
    font-size: 1.5rem;
  }

  .summary-number {
    font-size: 1.25rem;
    margin-bottom: 0;
  }

  .summary-label {
    font-size: 0.6875rem;
    margin-bottom: 0;
  }

  .summary-card.wide .summary-icon {
    font-size: 2rem;
  }

  /* 成就分类 */
  .achievement-tabs {
    gap: 0.375rem;
    margin-bottom: 1rem;
  }

  .tab-btn {
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
  }

  /* 成就列表 */
  .achievement-list {
    gap: 0.625rem;
    grid-template-columns: repeat(4, 1fr);
  }

  .achievement-card {
    padding: 0.625rem;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    text-align: center;
    border-radius: 0.75rem;
  }

  /* 成就图标 */
  .achievement-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .icon-emoji {
    font-size: 1.25rem;
  }

  .unlock-badge,
  .lock-badge {
    width: 16px;
    height: 16px;
    bottom: -2px;
    right: -2px;
  }

  .unlock-badge svg,
  .lock-badge svg {
    width: 0.625rem;
    height: 0.625rem;
  }

  /* 成就信息 */
  .achievement-name {
    font-size: 0.75rem;
    margin-bottom: 0.125rem;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .achievement-desc {
    display: none;
  }

  .achievement-progress {
    width: 100%;
    flex-direction: column;
    gap: 0.25rem;
  }

  .progress-bar-container {
    width: 100%;
  }

  .achievement-progress .progress-text {
    font-size: 0.625rem;
  }

  /* 成就状态 */
  .achievement-status {
    width: 100%;
  }

  .status-unlocked,
  .status-locked {
    font-size: 0.625rem;
    width: 100%;
    text-align: center;
  }

  /* 触摸反馈 */
  .achievement-card:active {
    transform: scale(0.95);
  }
}
</style>

