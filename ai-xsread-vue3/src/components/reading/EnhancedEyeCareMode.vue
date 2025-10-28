<template>
  <div class="enhanced-eye-care-mode">
    <!-- 快速预设 -->
    <div class="presets-section">
      <div class="section-title">
        <svg class="title-icon" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span>护眼模式预设</span>
      </div>
      
      <div class="presets-grid">
        <div
          v-for="preset in presets"
          :key="preset.id"
          class="preset-card"
          :class="{ active: currentPreset === preset.id }"
          @click="applyPreset(preset.id)"
          v-feedback
        >
          <div class="preset-icon">{{ preset.icon }}</div>
          <div class="preset-name">{{ preset.name }}</div>
          <div class="preset-desc">{{ preset.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 详细设置 -->
    <div class="settings-section">
      <!-- 护眼模式主开关 -->
      <div class="setting-card">
        <div class="setting-header">
          <div class="setting-label">
            <svg class="label-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
            </svg>
            <div class="label-text">
              <div class="label-title">护眼模式</div>
              <div class="label-subtitle">减少蓝光，保护视力</div>
            </div>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              v-model="localSettings.eyeCareMode"
              @change="handleEyeCareModeChange"
            />
            <span class="slider"></span>
          </label>
        </div>

        <!-- 蓝光过滤 -->
        <transition name="slide-down">
          <div v-show="localSettings.eyeCareMode" class="setting-content">
            <div class="setting-item">
              <div class="item-label">
                <span>蓝光过滤强度</span>
                <span class="item-value">{{ localSettings.blueFilterIntensity }}%</span>
              </div>
              <div class="slider-wrapper">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  v-model.number="localSettings.blueFilterIntensity"
                  class="range-slider blue-filter"
                />
                <div class="slider-track-fill" :style="{ width: localSettings.blueFilterIntensity + '%' }"></div>
              </div>
              <div class="slider-labels">
                <span>轻度</span>
                <span>中度</span>
                <span>强度</span>
              </div>
            </div>

            <!-- 色温调节 -->
            <div class="setting-item">
              <div class="item-label">
                <span>色温</span>
                <span class="item-value">{{ getColorTempLabel(localSettings.colorTemp) }}</span>
              </div>
              <div class="slider-wrapper">
                <input
                  type="range"
                  min="3000"
                  max="6500"
                  step="100"
                  v-model.number="localSettings.colorTemp"
                  class="range-slider color-temp"
                />
                <div class="slider-track-fill" :style="{ width: getColorTempPercent() + '%' }"></div>
              </div>
              <div class="slider-labels">
                <span>🔥 暖色</span>
                <span>⚪ 自然</span>
                <span>❄️ 冷色</span>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 亮度调节 -->
      <div class="setting-card">
        <div class="setting-header">
          <div class="setting-label">
            <svg class="label-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
            <div class="label-text">
              <div class="label-title">亮度</div>
              <div class="label-subtitle">{{ localSettings.brightness }}%</div>
            </div>
          </div>
        </div>
        <div class="setting-content">
          <div class="slider-wrapper">
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              v-model.number="localSettings.brightness"
              class="range-slider brightness"
            />
            <div class="slider-track-fill" :style="{ width: (localSettings.brightness - 50) * 2 + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 定时提醒 -->
      <div class="setting-card">
        <div class="setting-header">
          <div class="setting-label">
            <svg class="label-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <div class="label-text">
              <div class="label-title">休息提醒</div>
              <div class="label-subtitle">{{ getReminderText() }}</div>
            </div>
          </div>
          <select
            v-model.number="localSettings.restReminder"
            class="select-input"
          >
            <option :value="0">关闭</option>
            <option :value="15">15分钟</option>
            <option :value="20">20分钟</option>
            <option :value="30">30分钟</option>
            <option :value="45">45分钟</option>
            <option :value="60">60分钟</option>
          </select>
        </div>
      </div>

      <!-- 夜间模式自动切换 -->
      <div class="setting-card">
        <div class="setting-header">
          <div class="setting-label">
            <svg class="label-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            <div class="label-text">
              <div class="label-title">夜间自动切换</div>
              <div class="label-subtitle">{{ getAutoNightModeText() }}</div>
            </div>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              v-model="localSettings.autoNightMode"
            />
            <span class="slider"></span>
          </label>
        </div>

        <transition name="slide-down">
          <div v-show="localSettings.autoNightMode" class="setting-content">
            <div class="time-range-picker">
              <div class="time-input-group">
                <label class="time-label">开始时间</label>
                <input
                  type="time"
                  v-model="localSettings.nightModeStart"
                  class="time-input"
                />
              </div>
              <div class="time-separator">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="time-input-group">
                <label class="time-label">结束时间</label>
                <input
                  type="time"
                  v-model="localSettings.nightModeEnd"
                  class="time-input"
                />
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 眼保健操提醒 -->
      <div class="setting-card">
        <div class="setting-header">
          <div class="setting-label">
            <svg class="label-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
            <div class="label-text">
              <div class="label-title">眼保健操提醒</div>
              <div class="label-subtitle">定时提醒做眼保健操</div>
            </div>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              v-model="localSettings.eyeExerciseReminder"
            />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 护眼小贴士 -->
    <div class="tips-section">
      <div class="tips-header">
        <svg class="tips-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <span>护眼小贴士</span>
      </div>
      <div class="tips-content">
        <div
          v-for="tip in eyeCareTips"
          :key="tip.id"
          class="tip-item"
        >
          <div class="tip-icon">{{ tip.icon }}</div>
          <div class="tip-text">{{ tip.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import toast from '@/utils/toast'

const props = defineProps({
  settings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:settings'])

// 预设模式
const presets = [
  {
    id: 'comfort',
    name: '舒适模式',
    desc: '日常阅读推荐',
    icon: '☀️',
    settings: {
      eyeCareMode: true,
      blueFilterIntensity: 30,
      colorTemp: 5000,
      brightness: 90,
      restReminder: 30
    }
  },
  {
    id: 'night',
    name: '夜间模式',
    desc: '深夜阅读护眼',
    icon: '🌙',
    settings: {
      eyeCareMode: true,
      blueFilterIntensity: 60,
      colorTemp: 3500,
      brightness: 70,
      restReminder: 20
    }
  },
  {
    id: 'strong',
    name: '强效护眼',
    desc: '长时间阅读',
    icon: '🛡️',
    settings: {
      eyeCareMode: true,
      blueFilterIntensity: 80,
      colorTemp: 3000,
      brightness: 75,
      restReminder: 15
    }
  },
  {
    id: 'custom',
    name: '自定义',
    desc: '按需调整',
    icon: '⚙️',
    settings: {}
  }
]

// 护眼小贴士
const eyeCareTips = [
  { id: 1, icon: '👁️', text: '每20分钟远眺20秒，放松眼睛' },
  { id: 2, icon: '💡', text: '保持适当的阅读距离（30-40cm）' },
  { id: 3, icon: '🌟', text: '避免在过暗或过亮的环境阅读' },
  { id: 4, icon: '💧', text: '多眨眼，保持眼睛湿润' },
  { id: 5, icon: '😊', text: '感到眼睛疲劳时，及时休息' }
]

// 本地设置
const localSettings = ref({
  eyeCareMode: false,
  blueFilterIntensity: 30,
  colorTemp: 5000, // 色温 (K)
  brightness: 90,
  restReminder: 0,
  autoNightMode: false,
  nightModeStart: '22:00',
  nightModeEnd: '06:00',
  eyeExerciseReminder: false,
  ...props.settings
})

const currentPreset = ref('custom')
let restTimer = null
let exerciseTimer = null

// 获取色温标签
function getColorTempLabel(temp) {
  if (temp < 4000) return '暖色'
  if (temp < 5500) return '自然'
  return '冷色'
}

// 获取色温百分比
function getColorTempPercent() {
  return ((localSettings.value.colorTemp - 3000) / (6500 - 3000)) * 100
}

// 获取提醒文本
function getReminderText() {
  if (localSettings.value.restReminder === 0) {
    return '未开启'
  }
  return `每${localSettings.value.restReminder}分钟提醒`
}

// 获取自动夜间模式文本
function getAutoNightModeText() {
  if (!localSettings.value.autoNightMode) {
    return '未开启'
  }
  return `${localSettings.value.nightModeStart} - ${localSettings.value.nightModeEnd}`
}

// 应用预设
function applyPreset(presetId) {
  const preset = presets.find(p => p.id === presetId)
  if (preset && preset.settings && Object.keys(preset.settings).length > 0) {
    Object.assign(localSettings.value, preset.settings)
    currentPreset.value = presetId
    toast.success(`已应用${preset.name} ✨`)
  } else {
    currentPreset.value = 'custom'
  }
}

// 处理护眼模式变化
function handleEyeCareModeChange() {
  if (localSettings.value.eyeCareMode) {
    toast.success('护眼模式已开启 👁️')
    applyEyeCareFilter()
  } else {
    toast.info('护眼模式已关闭')
    removeEyeCareFilter()
  }
}

// 应用护眼滤镜
function applyEyeCareFilter() {
  if (!localSettings.value.eyeCareMode) return

  const intensity = localSettings.value.blueFilterIntensity
  const colorTemp = localSettings.value.colorTemp
  
  // 根据色温计算色调偏移
  const hueRotate = ((6500 - colorTemp) / 3500) * 20
  
  const filter = `
    sepia(${intensity * 0.3}%)
    saturate(${100 - intensity * 0.2}%)
    hue-rotate(${hueRotate}deg)
    brightness(${localSettings.value.brightness}%)
  `
  
  document.documentElement.style.filter = filter
}

// 移除护眼滤镜
function removeEyeCareFilter() {
  document.documentElement.style.filter = ''
}

// 设置休息提醒
function setupRestReminder() {
  if (restTimer) {
    clearInterval(restTimer)
  }
  
  if (localSettings.value.restReminder > 0) {
    const interval = localSettings.value.restReminder * 60 * 1000
    restTimer = setInterval(() => {
      showRestReminder()
    }, interval)
  }
}

// 显示休息提醒
function showRestReminder() {
  toast.info(`该休息一下了！您已经连续阅读了${localSettings.value.restReminder}分钟 😊`, {
    duration: 5000
  })
  
  // 触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200])
  }
}

// 设置眼保健操提醒
function setupEyeExerciseReminder() {
  if (exerciseTimer) {
    clearInterval(exerciseTimer)
  }
  
  if (localSettings.value.eyeExerciseReminder) {
    // 每小时提醒一次
    exerciseTimer = setInterval(() => {
      showEyeExerciseReminder()
    }, 60 * 60 * 1000)
  }
}

// 显示眼保健操提醒
function showEyeExerciseReminder() {
  toast.info('该做眼保健操了！让眼睛休息一下吧 👀', {
    duration: 5000
  })
}

// 检查是否应该启用夜间模式
function checkAutoNightMode() {
  if (!localSettings.value.autoNightMode) return

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  const [startHour, startMin] = localSettings.value.nightModeStart.split(':').map(Number)
  const [endHour, endMin] = localSettings.value.nightModeEnd.split(':').map(Number)
  
  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin
  
  let shouldEnableNightMode = false
  
  if (startTime < endTime) {
    // 同一天内
    shouldEnableNightMode = currentTime >= startTime && currentTime < endTime
  } else {
    // 跨越午夜
    shouldEnableNightMode = currentTime >= startTime || currentTime < endTime
  }
  
  if (shouldEnableNightMode && !localSettings.value.eyeCareMode) {
    applyPreset('night')
    toast.info('已自动切换到夜间模式 🌙')
  }
}

// 监听设置变化
watch(() => localSettings.value.eyeCareMode, () => {
  if (localSettings.value.eyeCareMode) {
    applyEyeCareFilter()
  } else {
    removeEyeCareFilter()
  }
})

watch([
  () => localSettings.value.blueFilterIntensity,
  () => localSettings.value.colorTemp,
  () => localSettings.value.brightness
], () => {
  if (localSettings.value.eyeCareMode) {
    applyEyeCareFilter()
  }
})

watch(() => localSettings.value.restReminder, () => {
  setupRestReminder()
})

watch(() => localSettings.value.eyeExerciseReminder, () => {
  setupEyeExerciseReminder()
})

watch(localSettings, (newSettings) => {
  emit('update:settings', { ...newSettings })
  // 保存到本地存储
  localStorage.setItem('enhancedEyeCareSettings', JSON.stringify(newSettings))
  
  // 检测是否使用自定义设置
  const isCustom = !presets.some(preset => {
    if (preset.id === 'custom' || !preset.settings) return false
    return Object.keys(preset.settings).every(key => 
      preset.settings[key] === newSettings[key]
    )
  })
  
  if (isCustom) {
    currentPreset.value = 'custom'
  }
}, { deep: true })

onMounted(() => {
  // 加载保存的设置
  const saved = localStorage.getItem('enhancedEyeCareSettings')
  if (saved) {
    try {
      const savedSettings = JSON.parse(saved)
      localSettings.value = { ...localSettings.value, ...savedSettings }
    } catch (e) {
      console.error('加载护眼设置失败:', e)
    }
  }
  
  // 应用设置
  if (localSettings.value.eyeCareMode) {
    applyEyeCareFilter()
  }
  setupRestReminder()
  setupEyeExerciseReminder()
  checkAutoNightMode()
  
  // 每分钟检查一次自动夜间模式
  setInterval(checkAutoNightMode, 60 * 1000)
})

onBeforeUnmount(() => {
  if (restTimer) clearInterval(restTimer)
  if (exerciseTimer) clearInterval(exerciseTimer)
  removeEyeCareFilter()
})
</script>

<style scoped>
.enhanced-eye-care-mode {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 预设区域 */
.presets-section {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.title-icon {
  width: 20px;
  height: 20px;
  color: var(--color-primary);
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 1rem;
  background: var(--color-bg-base);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.preset-card:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.preset-card.active {
  background: linear-gradient(135deg, rgba(217, 84, 104, 0.1), rgba(255, 186, 172, 0.1));
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.2);
}

.preset-icon {
  font-size: 2rem;
}

.preset-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.preset-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 设置区域 */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-card {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.setting-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex: 1;
}

.label-icon {
  width: 24px;
  height: 24px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.label-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.label-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* 开关 */
.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--color-border);
  transition: 0.3s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* 选择框 */
.select-input {
  padding: 0.625rem 1rem;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.select-input:hover {
  border-color: var(--color-primary);
}

.select-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1);
}

/* 设置内容 */
.setting-content {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.item-value {
  color: var(--color-primary);
  font-weight: 600;
}

/* 滑块 */
.slider-wrapper {
  position: relative;
  height: 8px;
}

.range-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  background: transparent;
  outline: none;
  -webkit-appearance: none;
  z-index: 2;
  cursor: pointer;
}

.range-slider::-webkit-slider-track {
  background: var(--color-bg-hover);
  border-radius: 4px;
  height: 8px;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid var(--color-primary);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(217, 84, 104, 0.4);
  transition: all 0.2s ease;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.6);
}

.range-slider::-moz-range-track {
  background: var(--color-bg-hover);
  border-radius: 4px;
  height: 8px;
}

.range-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-primary);
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(217, 84, 104, 0.4);
  transition: all 0.2s ease;
}

.slider-track-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: 4px;
  pointer-events: none;
  transition: width 0.2s ease;
  z-index: 1;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 时间选择器 */
.time-range-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.time-input {
  padding: 0.75rem 1rem;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-input:hover {
  border-color: var(--color-primary);
}

.time-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1);
}

.time-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--color-primary);
  margin-top: 1.5rem;
}

.time-separator svg {
  width: 100%;
  height: 100%;
}

/* 小贴士区域 */
.tips-section {
  background: linear-gradient(135deg, rgba(217, 84, 104, 0.05), rgba(255, 186, 172, 0.05));
  border: 1px solid rgba(217, 84, 104, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.tips-icon {
  width: 20px;
  height: 20px;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  background: var(--color-bg-elevated);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.tip-item:hover {
  background: var(--color-bg-hover);
  transform: translateX(4px);
}

.tip-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.tip-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* 滑入动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .presets-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .setting-header {
    flex-wrap: wrap;
  }

  .time-range-picker {
    flex-direction: column;
  }

  .time-separator {
    transform: rotate(90deg);
    margin: 0;
  }
}
</style>

