<template>
  <div class="relative" ref="dropdownRef">
    <!-- 桌面端主题按钮 -->
    <button 
      v-if="!mobile"
      @click="toggleDropdown"
      class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:opacity-80 transition text-themed-secondary"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
      </svg>
      <span class="text-sm">{{ currentThemeName }}</span>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- 移动端主题按钮 -->
    <button 
      v-else
      @click="toggleDropdown"
      class="p-2 rounded-lg active:scale-95 transition"
    >
      <svg class="w-5 h-5 text-themed-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
      </svg>
    </button>

    <!-- 主题下拉菜单 -->
    <Transition name="dropdown">
      <div 
        v-if="showDropdown"
        :class="mobile ? 'w-48' : 'w-56'"
        class="absolute right-0 mt-2 rounded-xl shadow-lg py-2 z-50 theme-dropdown"
      >
        <!-- 玫瑰温情 -->
        <button 
          @click="selectTheme('rose')"
          class="theme-option-item w-full px-4 py-2 text-left hover:opacity-80 transition flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <div class="flex space-x-1">
              <div class="w-4 h-4 rounded" style="background: #d95468"></div>
              <div class="w-4 h-4 rounded" style="background: #ed7654"></div>
              <div class="w-4 h-4 rounded" style="background: #FFBAAC"></div>
            </div>
            <span class="text-sm text-themed-primary">玫瑰温情</span>
          </div>
          <svg v-if="currentTheme === 'rose'" class="w-5 h-5" style="color: var(--color-primary)" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </button>

        <!-- 雅致高级 -->
        <button 
          @click="selectTheme('elegant')"
          class="theme-option-item w-full px-4 py-2 text-left hover:opacity-80 transition flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <div class="flex space-x-1">
              <div class="w-4 h-4 rounded" style="background: #759148"></div>
              <div class="w-4 h-4 rounded" style="background: #FFBAAC"></div>
              <div class="w-4 h-4 rounded" style="background: #E9EDF0"></div>
            </div>
            <span class="text-sm text-themed-primary">雅致高级</span>
          </div>
          <svg v-if="currentTheme === 'elegant'" class="w-5 h-5" style="color: var(--color-primary)" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </button>

        <!-- 文物古韵 -->
        <button 
          @click="selectTheme('vintage')"
          class="theme-option-item w-full px-4 py-2 text-left hover:opacity-80 transition flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <div class="flex space-x-1">
              <div class="w-4 h-4 rounded" style="background: #FA8F79"></div>
              <div class="w-4 h-4 rounded" style="background: #6BA16D"></div>
              <div class="w-4 h-4 rounded" style="background: #A2BB6A"></div>
            </div>
            <span class="text-sm text-themed-primary">文物古韵</span>
          </div>
          <svg v-if="currentTheme === 'vintage'" class="w-5 h-5" style="color: var(--color-primary)" fill="currentColor" viewBox="0 0 20 20">
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
.text-themed-secondary {
  color: var(--color-text-secondary);
}

.text-themed-primary {
  color: var(--color-text-primary);
}

.theme-dropdown {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
}

.theme-option-item:hover {
  background-color: var(--color-accent);
  opacity: 0.8;
}

/* 下拉菜单动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>

