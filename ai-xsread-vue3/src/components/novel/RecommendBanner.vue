<template>
  <div class="recommend-banner relative rounded-2xl overflow-hidden shadow-2xl mb-8">
    <!-- 轮播容器 -->
    <div class="relative h-96">
      <transition-group name="fade">
        <div
          v-for="(item, index) in items"
          v-show="currentIndex === index"
          :key="item.id"
          class="absolute inset-0"
        >
          <!-- 背景图 -->
          <div class="absolute inset-0">
            <img
              :src="item.cover"
              :alt="item.title"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
          </div>

          <!-- 内容 -->
          <div class="relative h-full flex items-center px-8 md:px-16">
            <div class="max-w-2xl text-white">
              <div class="mb-4">
                <span class="inline-block px-4 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full">
                  ⭐ 本周必读
                </span>
              </div>
              <h2 class="text-4xl md:text-5xl font-bold mb-4">{{ item.title }}</h2>
              <p class="text-lg mb-2 text-gray-200">作者：{{ item.author }}</p>
              <p class="text-base mb-6 line-clamp-3 text-gray-300">{{ item.description }}</p>
              
              <div class="flex items-center space-x-4 mb-6">
                <span class="flex items-center">
                  <svg class="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {{ item.rating }}
                </span>
                <span>{{ formatReadCount(item.readCount) }} 阅读</span>
                <span>{{ item.chapterCount }} 章</span>
              </div>

              <div class="flex space-x-4">
                <button
                  @click="$emit('read', item)"
                  class="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  立即阅读
                </button>
                <button
                  @click="$emit('add-shelf', item)"
                  class="px-8 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-lg transition-all border border-white/30"
                >
                  加入书架
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- 指示器 -->
    <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
      <button
        v-for="(item, index) in items"
        :key="index"
        @click="goToSlide(index)"
        :class="[
          'w-3 h-3 rounded-full transition-all',
          currentIndex === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
        ]"
      ></button>
    </div>

    <!-- 左右箭头 -->
    <button
      @click="prev"
      class="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <button
      @click="next"
      class="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  autoplay: {
    type: Boolean,
    default: true
  },
  interval: {
    type: Number,
    default: 5000
  }
})

defineEmits(['read', 'add-shelf'])

const currentIndex = ref(0)
let timer = null

function next() {
  currentIndex.value = (currentIndex.value + 1) % props.items.length
}

function prev() {
  currentIndex.value = (currentIndex.value - 1 + props.items.length) % props.items.length
}

function goToSlide(index) {
  currentIndex.value = index
}

function startAutoplay() {
  if (props.autoplay && props.items.length > 1) {
    timer = setInterval(next, props.interval)
  }
}

function stopAutoplay() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function formatReadCount(count) {
  if (count > 100000000) {
    return `${(count / 100000000).toFixed(1)}亿`
  }
  if (count > 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count
}

onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

