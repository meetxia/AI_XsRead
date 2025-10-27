<template>
  <div class="category-grid">
    <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
      <svg class="w-7 h-7 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      分类精选
    </h3>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div
        v-for="category in categories"
        :key="category.id"
        @click="$emit('select', category)"
        class="category-card group cursor-pointer"
      >
        <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-center">
          <div
            :class="[
              'w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl transition-transform group-hover:scale-110',
              category.color
            ]"
          >
            {{ category.icon }}
          </div>
          <h4 class="font-semibold text-gray-800 mb-1">{{ category.name }}</h4>
          <p class="text-xs text-gray-500">{{ category.count }} 本</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select'])
</script>

<style scoped>
.category-card:hover .w-16 {
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>

