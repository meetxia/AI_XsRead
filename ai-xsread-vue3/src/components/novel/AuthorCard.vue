<template>
  <div class="author-card bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white mb-6">
    <div class="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
      <!-- 头像 -->
      <div class="flex-shrink-0">
        <img 
          :src="author.avatar || '/default-avatar.png'" 
          :alt="author.name"
          class="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
        />
      </div>

      <!-- 信息 -->
      <div class="flex-1 text-center md:text-left">
        <h2 class="text-3xl font-bold mb-2">{{ author.name }}</h2>
        <p class="text-blue-100 mb-4 leading-relaxed">
          {{ author.bio || '这位作者很神秘，还没有留下简介~' }}
        </p>

        <!-- 统计信息 -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg">
            <div class="text-2xl font-bold">{{ author.worksCount || 0 }}</div>
            <div class="text-sm text-blue-100">作品数</div>
          </div>
          <div class="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg">
            <div class="text-2xl font-bold">{{ formatNumber(author.totalWords) }}</div>
            <div class="text-sm text-blue-100">总字数</div>
          </div>
          <div class="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg">
            <div class="text-2xl font-bold">{{ formatNumber(author.followers) }}</div>
            <div class="text-sm text-blue-100">粉丝数</div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-3 justify-center md:justify-start">
          <button
            @click="$emit('follow')"
            class="px-6 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
            :class="isFollowing 
              ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30' 
              : 'bg-white text-blue-600 hover:bg-blue-50'"
          >
            <svg v-if="isFollowing" class="w-5 h-5 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            {{ isFollowing ? '已关注' : '+ 关注' }}
          </button>
          
          <button
            @click="$emit('message')"
            class="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/30 transition-all shadow-lg hover:shadow-xl"
          >
            <svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            私信
          </button>

          <button
            @click="shareAuthor"
            class="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/30 transition-all shadow-lg hover:shadow-xl"
          >
            <svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            分享
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  author: {
    type: Object,
    required: true
  },
  isFollowing: {
    type: Boolean,
    default: false
  }
})

defineEmits(['follow', 'message'])

function formatNumber(num) {
  if (!num) return '0'
  if (num > 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  return num.toString()
}

function shareAuthor() {
  alert('分享功能开发中...')
}
</script>

