<template>
  <div class="reading-presets">
    <div class="presets-title">快速设置</div>
    
    <div class="preset-cards">
      <!-- 日间模式 -->
      <div
        class="preset-card"
        :class="{ active: currentPreset === 'day' }"
        @click="applyPreset('day')"
        role="button"
        :aria-pressed="currentPreset === 'day'"
        aria-label="日间模式：明亮清晰"
      >
        <div class="preset-icon">☀️</div>
        <div class="preset-name">日间模式</div>
        <div class="preset-desc">明亮清晰</div>
      </div>
      
      <!-- 夜间模式 -->
      <div
        class="preset-card"
        :class="{ active: currentPreset === 'night' }"
        @click="applyPreset('night')"
        role="button"
        :aria-pressed="currentPreset === 'night'"
        aria-label="夜间模式：柔和护眼"
      >
        <div class="preset-icon">🌙</div>
        <div class="preset-name">夜间模式</div>
        <div class="preset-desc">柔和护眼</div>
      </div>
      
      <!-- 怀旧模式 -->
      <div
        class="preset-card"
        :class="{ active: currentPreset === 'vintage' }"
        @click="applyPreset('vintage')"
        role="button"
        :aria-pressed="currentPreset === 'vintage'"
        aria-label="怀旧模式：纸质书感"
      >
        <div class="preset-icon">📖</div>
        <div class="preset-name">怀旧模式</div>
        <div class="preset-desc">纸质书感</div>
      </div>
      
      <!-- 护眼模式 -->
      <div
        class="preset-card"
        :class="{ active: currentPreset === 'eyecare' }"
        @click="applyPreset('eyecare')"
        role="button"
        :aria-pressed="currentPreset === 'eyecare'"
        aria-label="护眼模式：绿色舒适"
      >
        <div class="preset-icon">🌿</div>
        <div class="preset-name">护眼模式</div>
        <div class="preset-desc">绿色舒适</div>
      </div>
      
      <!-- 自定义 -->
      <div
        class="preset-card"
        :class="{ active: currentPreset === 'custom' }"
        @click="showCustomSettings"
        role="button"
        :aria-pressed="currentPreset === 'custom'"
        aria-label="自定义设置"
      >
        <div class="preset-icon">⚙️</div>
        <div class="preset-name">自定义</div>
        <div class="preset-desc">个性设置</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['preset-change', 'show-custom'])

const currentPreset = ref('day')

// 预设配置
const presets = {
  day: {
    fontSize: 18,
    lineHeight: 1.8,
    fontFamily: 'system-ui',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    brightness: 100
  },
  night: {
    fontSize: 18,
    lineHeight: 1.9,
    fontFamily: 'system-ui',
    backgroundColor: '#1a1a1a',
    textColor: '#cccccc',
    brightness: 80
  },
  vintage: {
    fontSize: 19,
    lineHeight: 2.0,
    fontFamily: 'serif',
    backgroundColor: '#f5f1e8',
    textColor: '#5a4a3a',
    brightness: 90
  },
  eyecare: {
    fontSize: 18,
    lineHeight: 1.9,
    fontFamily: 'system-ui',
    backgroundColor: '#e8f5e9',
    textColor: '#2d4a2f',
    brightness: 95
  },
  custom: {
    // 用户自定义设置
  }
}

// 应用预设
function applyPreset(presetName) {
  currentPreset.value = presetName
  
  if (presetName !== 'custom') {
    const preset = presets[presetName]
    emit('preset-change', { presetName, settings: preset })
    
    // 保存到本地
    localStorage.setItem('readingPreset', presetName)
    localStorage.setItem('readingSettings', JSON.stringify(preset))
  }
}

// 显示自定义设置
function showCustomSettings() {
  currentPreset.value = 'custom'
  emit('show-custom')
}

// 加载保存的预设
function loadSavedPreset() {
  const saved = localStorage.getItem('readingPreset')
  if (saved && presets[saved]) {
    currentPreset.value = saved
  }
}

// 初始化
loadSavedPreset()
</script>

<style scoped>
.reading-presets {
  padding: 1.5rem;
}

.presets-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.preset-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: var(--color-bg-elevated, #ffffff);
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.preset-card:hover {
  background: var(--color-bg-hover, #f8f8f8);
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.preset-card.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.3);
}

.preset-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.preset-name {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.preset-card.active .preset-name {
  color: white;
}

.preset-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.preset-card.active .preset-desc {
  color: rgba(255, 255, 255, 0.9);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .preset-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .preset-card {
    padding: 1.25rem 0.75rem;
  }
  
  .preset-icon {
    font-size: 2rem;
  }
}
</style>

