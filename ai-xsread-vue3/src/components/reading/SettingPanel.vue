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
              max="28"
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

        <!-- 段间距 -->
        <div class="setting-section">
          <div class="setting-label">
            <span>段间距</span>
          </div>
          <div class="line-height-options">
            <button
              v-for="item in paragraphSpacings"
              :key="item.value"
              @click="setParagraphSpacing(item.value)"
              :class="['option-btn', { 'active': settings.paragraphSpacing === item.value }]"
            >
              {{ item.name }}
            </button>
          </div>
        </div>

        <!-- 页边距 -->
        <div class="setting-section">
          <div class="setting-label">
            <span>页边距</span>
          </div>
          <div class="line-height-options">
            <button
              v-for="item in pageMargins"
              :key="item.value"
              @click="setPageMargin(item.value)"
              :class="['option-btn', { 'active': settings.pageMargin === item.value }]"
            >
              {{ item.name }}
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
              @click="setBackground(bg.value)"
              :class="['color-btn', { 'active': settings.background === bg.value }]"
              :style="{ backgroundColor: bg.bg }"
            >
              <span :style="{ color: bg.text }">{{ bg.name }}</span>
              <svg v-if="settings.background === bg.value" class="check-icon" fill="currentColor" viewBox="0 0 20 20">
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
            <span class="setting-value">{{ settings.brightness }}%</span>
          </div>
          <input
            type="range"
            :value="settings.brightness"
            @input="handleBrightnessChange"
            min="50"
            max="100"
            step="5"
            class="brightness-slider"
          />
        </div>

        <!-- 屏幕常亮 -->
        <div class="setting-section">
          <div class="setting-label">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
            </svg>
            <span>阅读时保持屏幕常亮</span>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="settings.keepAwake"
              :disabled="!wakeLockSupported"
              @change="setKeepAwake($event.target.checked)"
            />
            <span class="toggle-slider"></span>
          </label>
          <p v-if="!wakeLockSupported" class="support-tip">当前浏览器不支持，建议使用最新版 Chrome / Edge / Safari</p>
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
  paragraphSpacings,
  pageMargins,
  pageFlipModes,
  wakeLockSupported,
  setFontSize,
  increaseFontSize,
  decreaseFontSize,
  setLineHeight,
  setParagraphSpacing,
  setPageMargin,
  setBackground,
  setFontFamily,
  setPageFlipMode,
  setBrightness,
  setKeepAwake,
  reset
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
  setBrightness(parseInt(event.target.value, 10))
}

/**
 * 重置设置
 */
const handleReset = () => {
  if (confirm('确定要恢复默认设置吗？')) {
    reset()
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
  background-color: rgba(20, 17, 15, 0.46);
  backdrop-filter: blur(2px);
  z-index: 80;
}

/* 设置面板 */
.setting-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: min(82vh, 720px);
  background: #fffaf3;
  color: #2f241d;
  border: 1px solid rgba(88, 61, 42, 0.14);
  border-bottom: 0;
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -18px 48px rgba(36, 25, 18, 0.22);
  z-index: 90;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(88, 61, 42, 0.14);
  background: rgba(255, 250, 243, 0.98);
  flex-shrink: 0;
}

.panel-header h2 {
  font-size: 1.05rem;
  font-weight: 600;
  color: #3b2f25;
}

.close-btn {
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: #6b5543;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: rgba(127, 85, 57, 0.1);
  color: #8f3f48;
}

/* 面板内容 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));
  background: #fffaf3;
  overscroll-behavior: contain;
}

/* 设置区块 */
.setting-section {
  margin-bottom: 1.35rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #3b2f25;
  font-weight: 500;
}

.setting-label svg {
  color: #8f3f48;
  flex-shrink: 0;
}

.setting-value {
  margin-left: auto;
  color: #806957;
  font-size: 0.875rem;
}

/* 字体大小控制 */
.font-size-control {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.size-btn {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.65rem;
  background-color: #f3eadc;
  color: #7f4a35;
  font-weight: 600;
  transition: all 0.2s;
}

.size-btn:hover {
  background-color: #8f3f48;
  color: white;
}

.size-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #ded0bd;
  border-radius: 2px;
  outline: none;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #8f3f48;
  border-radius: 50%;
  cursor: pointer;
}

.size-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #8f3f48;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* 行间距选项 */
.line-height-options,
.flip-mode-options,
.font-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
  gap: 0.55rem;
}

.option-btn {
  min-height: 2.5rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.65rem;
  border: 1px solid #e2d5c5;
  background-color: #fffdf8;
  color: #5f4a3a;
  font-size: 0.875rem;
  text-align: center;
  transition: all 0.2s;
}

.option-btn:hover {
  border-color: #a75b5f;
  color: #8f3f48;
}

.option-btn.active {
  background-color: #8f3f48;
  border-color: #8f3f48;
  color: white;
}

/* 背景色 */
.background-colors {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.color-btn {
  position: relative;
  min-height: 3.25rem;
  padding: 0.75rem 0.5rem;
  border-radius: 0.65rem;
  border: 2px solid rgba(88, 61, 42, 0.12);
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.38);
}

.color-btn.active {
  border-color: #8f3f48;
  box-shadow: 0 0 0 3px rgba(143, 63, 72, 0.14);
}

.check-icon {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  width: 1rem;
  height: 1rem;
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
  background: #8f3f48;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brightness-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #8f3f48;
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
  background-color: #8f3f48;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle-switch input:disabled + .toggle-slider {
  cursor: not-allowed;
  opacity: 0.45;
}

.support-tip {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #806957;
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
  border: 1px solid #e2d5c5;
  background-color: #fffdf8;
  color: #5f4a3a;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.2s;
  margin-top: 1rem;
}

.reset-btn:hover {
  border-color: #a75b5f;
  color: #8f3f48;
  background-color: #f3eadc;
}

:global([data-bg="dark"]) .setting-panel,
:global(.dark) .setting-panel {
  background: #211f1d;
  color: #eee5da;
  border-color: rgba(238, 229, 218, 0.12);
  box-shadow: 0 -18px 48px rgba(0, 0, 0, 0.48);
}

:global([data-bg="dark"]) .panel-header,
:global([data-bg="dark"]) .panel-content,
:global(.dark) .panel-header,
:global(.dark) .panel-content {
  background: #211f1d;
}

:global([data-bg="dark"]) .panel-header,
:global(.dark) .panel-header {
  border-bottom-color: rgba(238, 229, 218, 0.12);
}

:global([data-bg="dark"]) .panel-header h2,
:global([data-bg="dark"]) .setting-label,
:global(.dark) .panel-header h2,
:global(.dark) .setting-label {
  color: #eee5da;
}

:global([data-bg="dark"]) .close-btn,
:global([data-bg="dark"]) .setting-value,
:global([data-bg="dark"]) .support-tip,
:global(.dark) .close-btn,
:global(.dark) .setting-value,
:global(.dark) .support-tip {
  color: #b8aa9b;
}

:global([data-bg="dark"]) .option-btn,
:global([data-bg="dark"]) .reset-btn,
:global(.dark) .option-btn,
:global(.dark) .reset-btn {
  background: #2c2926;
  border-color: rgba(238, 229, 218, 0.14);
  color: #ded6cc;
}

:global([data-bg="dark"]) .size-btn,
:global(.dark) .size-btn {
  background: #2c2926;
}

@media (max-width: 420px) {
  .panel-header,
  .panel-content {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .background-colors {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .line-height-options,
  .flip-mode-options,
  .font-options {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
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

