<template>
  <div class="search-bar relative">
    <div class="relative">
      <input
        ref="inputRef"
        v-model="localKeyword"
        type="text"
        :placeholder="placeholder"
        @input="handleInput"
        @focus="handleFocus"
        @keyup.enter="handleSearch"
        class="w-full px-6 py-4 pl-14 pr-24 text-lg bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-all shadow-lg"
      />
      
      <!-- 搜索图标 -->
      <svg
        class="w-6 h-6 absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      <!-- 清空按钮 -->
      <button
        v-if="localKeyword"
        @click="handleClear"
        class="absolute right-20 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- 搜索按钮 -->
      <button
        @click="handleSearch"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all"
      >
        搜索
      </button>
    </div>

    <!-- 搜索建议下拉框 -->
    <div
      v-if="showSuggest && (suggestions.length > 0 || loading)"
      class="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
    >
      <!-- 加载状态 -->
      <div v-if="loading" class="p-4 text-center text-gray-500">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span class="ml-2">搜索中...</span>
      </div>

      <!-- 搜索建议列表 -->
      <div v-else class="max-h-96 overflow-y-auto">
        <div
          v-for="(item, index) in suggestions"
          :key="index"
          @click="handleSelectSuggest(item)"
          class="px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group"
        >
          <div class="flex items-center flex-1 min-w-0 gap-3">
            <!-- 类型图标 -->
            <div v-if="typeof item === 'object'" class="flex-shrink-0">
              <span v-if="item.type === 'novel'" class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">小说</span>
              <span v-else-if="item.type === 'author'" class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">作者</span>
            </div>
            <svg v-else class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span class="text-gray-800 truncate" v-html="highlightKeyword(getSuggestionText(item))"></span>
          </div>
          <svg class="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 点击遮罩关闭建议 -->
    <div
      v-if="showSuggest"
      @click="showSuggest = false"
      class="fixed inset-0 z-40"
    ></div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { debounce } from 'lodash-es'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索书名、作者、标签...'
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'input', 'suggest'])

const inputRef = ref(null)
const localKeyword = ref(props.modelValue)
const showSuggest = ref(false)

// 监听外部变化
watch(() => props.modelValue, (val) => {
  localKeyword.value = val
})

// 防抖输入处理
const handleInput = debounce(() => {
  emit('update:modelValue', localKeyword.value)
  emit('input', localKeyword.value)
  
  // 触发搜索建议
  if (localKeyword.value.trim().length >= 2) {
    showSuggest.value = true
    emit('suggest', localKeyword.value.trim())
  } else {
    showSuggest.value = false
  }
}, 300)

// 聚焦处理
function handleFocus() {
  if (localKeyword.value.trim().length >= 2 && props.suggestions.length > 0) {
    showSuggest.value = true
  }
}

// 清空输入
function handleClear() {
  localKeyword.value = ''
  emit('update:modelValue', '')
  showSuggest.value = false
  inputRef.value?.focus()
}

// 执行搜索
function handleSearch() {
  if (localKeyword.value.trim()) {
    showSuggest.value = false
    emit('search', localKeyword.value.trim())
  }
}

// 选择建议项
function handleSelectSuggest(item) {
  const text = getSuggestionText(item)
  localKeyword.value = text
  emit('update:modelValue', text)
  showSuggest.value = false
  emit('search', text)
}

// 获取建议文本
function getSuggestionText(item) {
  if (typeof item === 'object') {
    return item.text || item.suggestion || ''
  }
  return item || ''
}

// 高亮关键词
function highlightKeyword(text) {
  if (!localKeyword.value || !text) return text
  const regex = new RegExp(`(${localKeyword.value})`, 'gi')
  return text.replace(regex, '<span class="text-blue-600 font-semibold">$1</span>')
}

// 暴露方法
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur()
})
</script>

<style scoped>
/* 自定义滚动条 */
.max-h-96::-webkit-scrollbar {
  width: 6px;
}

.max-h-96::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.max-h-96::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.max-h-96::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

