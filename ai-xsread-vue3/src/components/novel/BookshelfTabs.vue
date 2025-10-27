<template>
  <div class="bookshelf-tabs">
    <div class="tabs-container flex items-center justify-between mb-6">
      <div class="tabs flex space-x-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="$emit('change', tab.key)"
          :class="[
            'tab-item px-6 py-3 rounded-lg font-medium transition-all duration-200',
            activeTab === tab.key
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          ]"
        >
          {{ tab.label }}
          <span class="ml-2 text-sm opacity-75">({{ tab.count }})</span>
        </button>
      </div>

      <div class="actions flex items-center space-x-3">
        <!-- 视图切换 -->
        <div class="view-toggle flex bg-white rounded-lg p-1 shadow-sm">
          <button
            @click="$emit('view-change', 'grid')"
            :class="[
              'p-2 rounded transition-all',
              view === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            ]"
            title="网格视图"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            @click="$emit('view-change', 'list')"
            :class="[
              'p-2 rounded transition-all',
              view === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            ]"
            title="列表视图"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <!-- 排序 -->
        <select
          :value="sortBy"
          @change="$emit('sort-change', $event.target.value)"
          class="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="lastRead">最近阅读</option>
          <option value="addTime">添加时间</option>
          <option value="updateTime">更新时间</option>
          <option value="title">书名排序</option>
        </select>

        <!-- 批量管理 -->
        <button
          @click="$emit('toggle-edit')"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            editMode
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          ]"
        >
          {{ editMode ? '取消' : '管理' }}
        </button>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-box mb-4">
      <div class="relative">
        <input
          type="text"
          :value="searchKeyword"
          @input="$emit('search', $event.target.value)"
          placeholder="搜索书架中的书籍..."
          class="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          class="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true
  },
  tabs: {
    type: Array,
    required: true
  },
  view: {
    type: String,
    default: 'grid'
  },
  sortBy: {
    type: String,
    default: 'lastRead'
  },
  editMode: {
    type: Boolean,
    default: false
  },
  searchKeyword: {
    type: String,
    default: ''
  }
})

defineEmits(['change', 'view-change', 'sort-change', 'toggle-edit', 'search'])
</script>

<style scoped>
.tab-item {
  min-width: 120px;
  text-align: center;
}
</style>

