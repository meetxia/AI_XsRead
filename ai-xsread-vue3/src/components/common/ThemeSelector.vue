<template>
  <div class="theme-selector" ref="dropdownRef">
    <!-- 桌面端主题按钮 -->
    <button 
      v-if="!mobile"
      @click="toggleDropdown"
      class="theme-btn desktop"
    >
      <svg class="theme-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
      </svg>
      <span class="theme-name">{{ currentThemeName }}</span>
      <svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- 移动端主题按钮 -->
    <button 
      v-else
      @click="toggleDropdown"
      class="theme-btn mobile"
    >
      <svg class="theme-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
      </svg>
    </button>

    <!-- 主题下拉菜单 -->
    <Transition name="dropdown">
      <div 
        v-if="showDropdown"
        class="theme-dropdown"
        :class="{ 'mobile': mobile }"
      >
        <!-- 玫瑰温情 -->
        <button 
          @click="selectTheme('rose')"
          class="theme-option"
          :class="{ 'active': currentTheme === 'rose' }"
        >
          <div class="theme-info">
            <div class="color-swatches">
              <div class="color-swatch" style="background: #d95468"></div>
              <div class="color-swatch" style="background: #ed7654"></div>
              <div class="color-swatch" style="background: #FFBAAC"></div>
            </div>
            <span class="theme-label">玫瑰温情</span>
          </div>
          <svg v-if="currentTheme === 'rose'" class="check-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </button>

        <!-- 雅致高级 -->
        <button 
          @click="selectTheme('elegant')"
          class="theme-option"
          :class="{ 'active': currentTheme === 'elegant' }"
        >
          <div class="theme-info">
            <div class="color-swatches">
              <div class="color-swatch" style="background: #759148"></div>
              <div class="color-swatch" style="background: #FFBAAC"></div>
              <div class="color-swatch" style="background: #E9EDF0"></div>
            </div>
            <span class="theme-label">雅致高级</span>
          </div>
          <svg v-if="currentTheme === 'elegant'" class="check-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </button>

        <!-- 文物古韵 -->
        <button 
          @click="selectTheme('vintage')"
          class="theme-option"
          :class="{ 'active': currentTheme === 'vintage' }"
        >
          <div class="theme-info">
            <div class="color-swatches">
              <div class="color-swatch" style="background: #FA8F79"></div>
              <div class="color-swatch" style="background: #6BA16D"></div>
              <div class="color-swatch" style="background: #A2BB6A"></div>
            </div>
            <span class="theme-label">文物古韵</span>
          </div>
          <svg v-if="currentTheme === 'vintage'" class="check-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import useTheme from '@/composables/useTheme'

// Props
defineProps({
  mobile: {
    type: Boolean,
    default: false
  }
})

// 主题状态 - 使用 useTheme composable
const { currentTheme, currentMode, setTheme } = useTheme()

// 下拉菜单状态
const showDropdown = ref(false)
const dropdownRef = ref(null)

// 主题名称映射
const themeNames = {
  rose: '玫瑰温情',
  elegant: '雅致高级',
  vintage: '文物古韵'
}

// 当前主题名称
const currentThemeName = computed(() => {
  return themeNames[currentTheme.value] || '主题'
})

// 切换下拉菜单
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// 选择主题
const selectTheme = (theme) => {
  setTheme(theme)
  showDropdown.value = false
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 主题选择器容器 */
.theme-selector {
  position: relative;
}

/* 主题按钮 */
.theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.theme-btn:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.theme-btn.desktop {
  padding: 8px 12px;
}

.theme-btn.mobile {
  padding: 6px;
  width: 36px;
  height: 36px;
  justify-content: center;
}

.theme-btn.mobile:active {
  transform: scale(0.95);
}

/* 图标 */
.theme-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.theme-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* 下拉菜单 */
.theme-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 224px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--color-shadow);
  padding: 8px 0;
  z-index: 1001;
  overflow: hidden;
}

.theme-dropdown.mobile {
  width: 192px;
}

/* 主题选项 */
.theme-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.theme-option:hover {
  background-color: var(--color-bg-hover);
}

.theme-option.active {
  background-color: rgba(var(--color-primary-rgb, 217, 84, 104), 0.08);
}

.theme-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 颜色色板 */
.color-swatches {
  display: flex;
  gap: 4px;
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.theme-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.check-icon {
  width: 20px;
  height: 20px;
  color: var(--color-primary);
  flex-shrink: 0;
}

/* 下拉菜单动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top right;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>

