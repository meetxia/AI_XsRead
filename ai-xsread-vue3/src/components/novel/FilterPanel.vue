<template>
  <div class="filter-panel" role="group" aria-label="筛选条件">
    <!-- 分类筛选 -->
    <div class="filter-group">
      <div class="group-title">分类</div>
      <div class="filter-options" role="radiogroup">
        <label
          v-for="category in categories"
          :key="category.id"
          class="filter-option"
        >
          <input
            type="radio"
            name="category"
            :value="category.id"
            v-model="localFilters.categoryId"
            :aria-label="`${category.name}分类，共${category.count}本`"
          />
          <span class="option-label">{{ category.name }}</span>
          <span class="option-count">{{ category.count }}</span>
        </label>
      </div>
    </div>
    
    <!-- 状态筛选 -->
    <div class="filter-group">
      <div class="group-title">状态</div>
      <div class="filter-options">
        <label class="filter-option checkbox">
          <input
            type="checkbox"
            v-model="localFilters.isFinished"
            aria-label="只看完结小说"
          />
          <span class="option-label">完结</span>
        </label>
        <label class="filter-option checkbox">
          <input
            type="checkbox"
            v-model="localFilters.isUpdating"
            aria-label="只看连载小说"
          />
          <span class="option-label">连载中</span>
        </label>
        <label class="filter-option checkbox">
          <input
            type="checkbox"
            v-model="localFilters.isFree"
            aria-label="只看免费小说"
          />
          <span class="option-label">免费</span>
        </label>
      </div>
    </div>
    
    <!-- 字数筛选 -->
    <div class="filter-group">
      <div class="group-title">字数</div>
      <div class="filter-range">
        <input
          type="range"
          min="0"
          max="500000"
          step="10000"
          v-model.number="localFilters.minWords"
          aria-label="最小字数"
        />
        <span class="range-value">{{ formatWords(localFilters.minWords) }}</span>
      </div>
    </div>
    
    <!-- 排序方式 -->
    <div class="filter-group">
      <div class="group-title">排序</div>
      <select
        v-model="localFilters.sortBy"
        class="sort-select"
        aria-label="排序方式"
      >
        <option value="recommend">智能推荐</option>
        <option value="views">人气最高</option>
        <option value="likes">点赞最多</option>
        <option value="updated_at">最新更新</option>
        <option value="rating">评分最高</option>
        <option value="word_count">字数最多</option>
      </select>
    </div>
    
    <!-- 操作按钮 -->
    <div class="filter-actions">
      <button class="btn-reset" @click="resetFilters">
        <svg fill="currentColor" viewBox="0 0 20 20" class="btn-icon">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path>
        </svg>
        重置
      </button>
      <button class="btn-apply" @click="applyFilters">
        <svg fill="currentColor" viewBox="0 0 20 20" class="btn-icon">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
        应用筛选
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({})
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:filters', 'apply', 'reset'])

// 本地筛选状态
const localFilters = ref({
  categoryId: null,
  isFinished: false,
  isUpdating: false,
  isFree: false,
  minWords: 0,
  sortBy: 'recommend',
  ...props.filters
})

// 格式化字数
function formatWords(words) {
  if (words === 0) return '不限'
  if (words >= 10000) {
    return `${(words / 10000).toFixed(0)}万字以上`
  }
  return `${words}字以上`
}

// 重置筛选
function resetFilters() {
  localFilters.value = {
    categoryId: null,
    isFinished: false,
    isUpdating: false,
    isFree: false,
    minWords: 0,
    sortBy: 'recommend'
  }
  emit('reset')
}

// 应用筛选
function applyFilters() {
  emit('update:filters', { ...localFilters.value })
  emit('apply', { ...localFilters.value })
}

// 监听父组件筛选变化
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...localFilters.value, ...newFilters }
}, { deep: true })
</script>

<style scoped>
.filter-panel {
  background: var(--color-bg-elevated, #ffffff);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-group:last-of-type {
  margin-bottom: 0;
}

.group-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}

/* 选项 */
.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: var(--color-bg-base, #fafafa);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.filter-option:hover {
  background: var(--color-bg-hover, #f3f4f6);
  border-color: var(--color-primary);
}

.filter-option input[type="radio"],
.filter-option input[type="checkbox"] {
  cursor: pointer;
}

.filter-option input[type="radio"]:checked ~ .option-label,
.filter-option input[type="checkbox"]:checked ~ .option-label {
  color: var(--color-primary);
  font-weight: 600;
}

.option-label {
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.option-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 范围滑块 */
.filter-range {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-range input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--color-bg-hover, #f3f4f6);
  outline: none;
  -webkit-appearance: none;
}

.filter-range input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.filter-range input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-value {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 100px;
  text-align: right;
}

/* 排序选择 */
.sort-select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: var(--color-bg-base, #fafafa);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-select:hover {
  border-color: var(--color-primary);
}

.sort-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1);
}

/* 操作按钮 */
.filter-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.btn-reset,
.btn-apply {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-reset {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--color-text-secondary);
}

.btn-reset:hover {
  background: var(--color-bg-base, #e5e7eb);
}

.btn-apply {
  background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
  color: white;
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.3);
}

.btn-apply:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(217, 84, 104, 0.4);
}

.btn-apply:active {
  transform: translateY(0);
}
</style>

