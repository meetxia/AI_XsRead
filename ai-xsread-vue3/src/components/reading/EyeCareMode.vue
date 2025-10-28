<template>
  <div class="eye-care-settings">
    <!-- 护眼模式开关 -->
    <div class="setting-item">
      <div class="setting-label">
        <svg class="label-icon" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
        </svg>
        <span>护眼模式</span>
      </div>
      <label class="switch">
        <input
          type="checkbox"
          v-model="localSettings.eyeCareMode"
          aria-label="开启或关闭护眼模式"
        />
        <span class="slider"></span>
      </label>
    </div>
    
    <!-- 蓝光过滤强度 -->
    <transition name="slide-down">
      <div v-show="localSettings.eyeCareMode" class="setting-item">
        <div class="setting-label">
          <span>蓝光过滤</span>
        </div>
        <div class="slider-group">
          <input
            type="range"
            min="0"
            max="100"
            v-model.number="localSettings.blueFilterIntensity"
            class="range-slider"
            aria-label="蓝光过滤强度"
          />
          <span class="slider-value">{{ localSettings.blueFilterIntensity }}%</span>
        </div>
      </div>
    </transition>
    
    <!-- 定时休息提醒 -->
    <div class="setting-item">
      <div class="setting-label">
        <svg class="label-icon" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
        </svg>
        <span>定时休息提醒</span>
      </div>
      <select
        v-model.number="localSettings.restReminder"
        class="setting-select"
        aria-label="定时休息提醒间隔"
      >
        <option :value="0">关闭</option>
        <option :value="20">20分钟</option>
        <option :value="30">30分钟</option>
        <option :value="45">45分钟</option>
        <option :value="60">60分钟</option>
      </select>
    </div>
    
    <!-- 夜间模式自动切换 -->
    <div class="setting-item">
      <div class="setting-label">
        <svg class="label-icon" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
        </svg>
        <span>夜间自动切换</span>
      </div>
      <label class="switch">
        <input
          type="checkbox"
          v-model="localSettings.autoNightMode"
          aria-label="开启或关闭夜间模式自动切换"
        />
        <span class="slider"></span>
      </label>
    </div>
    
    <!-- 夜间模式时间范围 -->
    <transition name="slide-down">
      <div v-show="localSettings.autoNightMode" class="setting-item">
        <div class="setting-label">
          <span>自动切换时间</span>
        </div>
        <div class="time-range">
          <input
            type="time"
            v-model="localSettings.nightModeStart"
            class="time-input"
            aria-label="夜间模式开始时间"
          />
          <span class="time-separator">-</span>
          <input
            type="time"
            v-model="localSettings.nightModeEnd"
            class="time-input"
            aria-label="夜间模式结束时间"
          />
        </div>
      </div>
    </transition>
    
    <!-- 亮度调节 -->
    <div class="setting-item">
      <div class="setting-label">
        <svg class="label-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
        </svg>
        <span>屏幕亮度</span>
      </div>
      <div class="slider-group">
        <input
          type="range"
          min="50"
          max="100"
          v-model.number="localSettings.brightness"
          class="range-slider"
          aria-label="屏幕亮度"
        />
        <span class="slider-value">{{ localSettings.brightness }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  settings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:settings'])

// 本地设置
const localSettings = ref({
  eyeCareMode: false,
  blueFilterIntensity: 30,
  restReminder: 0,
  autoNightMode: false,
  nightModeStart: '22:00',
  nightModeEnd: '06:00',
  brightness: 100,
  ...props.settings
})

let restTimer = null

// 应用护眼模式
function applyEyeCareFilter() {
  if (localSettings.value.eyeCareMode) {
    const intensity = localSettings.value.blueFilterIntensity
    const filter = `
      sepia(${intensity * 0.3}%)
      saturate(${100 - intensity * 0.2}%)
      hue-rotate(${intensity * 0.5}deg)
    `
    document.documentElement.style.filter = filter
  } else {
    document.documentElement.style.filter = ''
  }
}

// 应用亮度
function applyBrightness() {
  const brightness = localSettings.value.brightness / 100
  document.documentElement.style.opacity = brightness.toString()
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
  // 这里应该调用Toast或通知组件
  console.log('该休息一下了！您已经连续阅读了', localSettings.value.restReminder, '分钟')
}

// 监听设置变化
watch(() => localSettings.value.eyeCareMode, () => {
  applyEyeCareFilter()
})

watch(() => localSettings.value.blueFilterIntensity, () => {
  if (localSettings.value.eyeCareMode) {
    applyEyeCareFilter()
  }
})

watch(() => localSettings.value.brightness, () => {
  applyBrightness()
})

watch(() => localSettings.value.restReminder, () => {
  setupRestReminder()
})

watch(localSettings, (newSettings) => {
  emit('update:settings', { ...newSettings })
  // 保存到本地存储
  localStorage.setItem('eyeCareSettings', JSON.stringify(newSettings))
}, { deep: true })

onMounted(() => {
  // 加载保存的设置
  const saved = localStorage.getItem('eyeCareSettings')
  if (saved) {
    try {
      const savedSettings = JSON.parse(saved)
      localSettings.value = { ...localSettings.value, ...savedSettings }
    } catch (e) {
      console.error('加载护眼设置失败:', e)
    }
  }
  
  // 应用设置
  applyEyeCareFilter()
  applyBrightness()
  setupRestReminder()
})

onBeforeUnmount(() => {
  if (restTimer) {
    clearInterval(restTimer)
  }
  // 清除滤镜
  document.documentElement.style.filter = ''
  document.documentElement.style.opacity = '1'
})
</script>

<style scoped>
.eye-care-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--color-bg-elevated, #ffffff);
  border-radius: 10px;
  gap: 1rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

.label-icon {
  width: 20px;
  height: 20px;
  color: var(--color-primary);
}

/* 开关 */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
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
  background-color: var(--color-border, #e5e7eb);
  transition: 0.3s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(22px);
}

/* 滑块组 */
.slider-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  max-width: 300px;
}

.range-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--color-bg-hover, #f3f4f6);
  outline: none;
  -webkit-appearance: none;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-value {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 45px;
  text-align: right;
}

/* 选择框 */
.setting-select {
  padding: 0.5rem 0.875rem;
  background: var(--color-bg-base, #fafafa);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  cursor: pointer;
  min-width: 120px;
}

.setting-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1);
}

/* 时间范围 */
.time-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-input {
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-base, #fafafa);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  cursor: pointer;
}

.time-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1);
}

.time-separator {
  color: var(--color-text-muted);
}

/* 滑入动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 100px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .slider-group,
  .time-range {
    width: 100%;
  }
  
  .setting-select {
    width: 100%;
  }
}
</style>

