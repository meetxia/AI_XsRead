<template>
  <!-- 设置面板遮罩 -->
  <Transition name="fade">
    <div
      v-if="visible"
      class="panel-overlay"
      @click="handleClose"
    ></div>
  </Transition>

  <!-- 设置面板 -->
  <Transition name="slide-up">
    <div v-if="visible" class="setting-panel">
      <!-- 面板头部 -->
      <div class="panel-header">
        <h2>阅读设置</h2>
        <button @click="handleClose" class="close-btn">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- 设置内容 -->
      <div class="panel-content">
        <!-- 字体大小 -->
        <div class="setting-section">
          <div class="setting-label">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M3 12h18m-7 6h7"></path>
            </svg>
            <span>字体大小</span>
            <span class="setting-value">{{ settings.fontSize }}px</span>
          </div>
          <div class="font-size-control">
            <button @click="decreaseFontSize" class="size-btn">
              <span>A-</span>
            </button>
            <input
              type="range"
              :value="settings.fontSize"
              @input="handleFontSizeChange"
              min="12"
              max="24"
              step="1"
              class="size-slider"
            />
            <button @click="increaseFontSize" class="size-btn">
              <span>A+</span>
            </button>
          </div>
        </div>

        <!-- 行间距 -->
        <div class="setting-section">
          <div class="setting-label">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
            <span>行间距</span>
          </div>
          <div class="line-height-options">
            <button
              v-for="lh in lineHeights"
              :key="lh.value"
              @click="setLineHeight(lh.value)"
              :class="['option-btn', { 'active': settings.lineHeight === lh.value }]"
            >
              {{ lh.name }}
            </button>
          </div>
        </div>

        <!-- 背景色 -->
        <div class="setting-section">
          <div class="setting-label">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
            </svg>
            <span>背景色</span>
          </div>
          <div class="background-colors">
            <button
              v-for="bg in backgroundColors"
              :key="bg.value"
              @click="setBackgroundColor(bg.value, bg.textColor)"
              :class="['color-btn', { 'active': settings.backgroundColor === bg.value }]"
              :style="{ backgroundColor: bg.value }"
            >
              <span :style="{ color: bg.textColor }">{{ bg.name }}</span>
              <svg v-if="settings.backgroundColor === bg.value" class="check-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- 字体 -->
        <div class="setting-section">
          <div class="setting-label">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>字体</span>
          </div>
          <div class="font-options">
            <button
              v-for="font in fontFamilies"
              :key="font.value"
              @click="setFontFamily(font.value)"
              :class="['option-btn', { 'active': settings.fontFamily === font.value }]"
              :style="{ fontFamily: font.value }"
            >
              {{ font.name }}
            </button>
          </div>
        </div>

        <!-- 翻页方式 -->
        <div class="setting-section">
          <div class="setting-label">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <span>翻页方式</span>
          </div>
          <div class="flip-mode-options">
            <button
              v-for="mode in pageFlipModes"
              :key="mode.value"
              @click="setPageFlipMode(mode.value)"
              :class="['option-btn', { 'active': settings.pageFlipMode === mode.value }]"
            >
              {{ mode.name }}
            </button>
          </div>
        </div>

        <!-- 亮度 -->
        <div class="setting-section">
          <div class="setting-label">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <span>亮度</span>
            <span class="setting-value">{{ (settings.brightness * 100).toFixed(0) }}%</span>
          </div>
          <input
            type="range"
            :value="settings.brightness"
            @input="handleBrightnessChange"
            min="0.5"
            max="1.0"
            step="0.05"
            class="brightness-slider"
          />
        </div>

        <!-- 自动朗读 -->
        <div class="setting-section">
          <div class="setting-label">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
            </svg>
            <span>自动朗读</span>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="settings.autoRead"
              @change="toggleAutoRead"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- 重置设置 -->
        <button @click="handleReset" class="reset-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>恢复默认设置</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useReadingSettings } from '@/composables/useReadingSettings'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close'])

// 阅读设置
const {
  settings,
  backgroundColors,
  fontFamilies,
  lineHeights,
  pageFlipModes,
  setFontSize,
  increaseFontSize,
  decreaseFontSize,
  setLineHeight,
  setBackgroundColor,
  setFontFamily,
  setPageFlipMode,
  setBrightness,
  toggleAutoRead,
  resetSettings
} = useReadingSettings()

/**
 * 关闭面板
 */
const handleClose = () => {
  emit('close')
}

/**
 * 处理字体大小变化
 */
const handleFontSizeChange = (event) => {
  setFontSize(parseInt(event.target.value))
}

/**
 * 处理亮度变化
 */
const handleBrightnessChange = (event) => {
  setBrightness(parseFloat(event.target.value))
}

/**
 * 重置设置
 */
const handleReset = () => {
  if (confirm('确定要恢复默认设置吗？')) {
    resetSettings()
  }
}
</script>

<style scoped>
/* 遮罩 */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 300;
}

/* 设置面板 */
.setting-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  background-color: var(--color-bg-card);
  border-radius: 1.5rem 1.5rem 0 0;
  box-shadow: 0 -4px 16px var(--color-shadow);
  z-index: 301;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-btn {
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--color-accent);
  color: var(--color-primary);
}

/* 面板内容 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
}

/* 设置区块 */
.setting-section {
  margin-bottom: 2rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

.setting-label svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.setting-value {
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

/* 字体大小控制 */
.font-size-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.size-btn {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background-color: var(--color-accent);
  color: var(--color-primary);
  font-weight: 600;
  transition: all 0.2s;
}

.size-btn:hover {
  background-color: var(--color-primary);
  color: white;
}

.size-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-border);
  border-radius: 2px;
  outline: none;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
}

.size-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* 行间距选项 */
.line-height-options,
.flip-mode-options,
.font-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.option-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.option-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.option-btn.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* 背景色 */
.background-colors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.color-btn {
  position: relative;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 2px solid transparent;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}

.color-btn.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1);
}

.check-icon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
}

/* 亮度滑块 */
.brightness-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, #666, #fff);
  border-radius: 3px;
  outline: none;
}

.brightness-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brightness-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 开关按钮 */
.toggle-switch {
  position: relative;
  width: 50px;
  height: 28px;
  display: inline-block;
  margin-left: auto;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 28px;
  transition: 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

/* 重置按钮 */
.reset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.2s;
  margin-top: 1rem;
}

.reset-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: var(--color-accent);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>

