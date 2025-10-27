<template>
  <div class="author-page min-h-screen bg-gray-50 pb-20">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <button @click="goBack" class="flex items-center text-gray-600 hover:text-gray-900">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="ml-2">返回</span>
        </button>
        <h1 class="text-xl font-bold text-gray-900">作者主页</h1>
        <div class="w-20"></div>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 py-8">
      <div class="animate-pulse">
        <div class="h-48 bg-gray-200 rounded-2xl mb-6"></div>
        <div class="h-64 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>

    <!-- 作者信息 -->
    <div v-else-if="author" class="max-w-7xl mx-auto px-4 py-8">
      <!-- 作者卡片 -->
      <AuthorCard 
        :author="author" 
        :is-following="isFollowing"
        @follow="toggleFollow"
        @message="openMessage"
      />

      <!-- 公告栏 -->
      <div v-if="author.notice" class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <AuthorNotice :notice="author.notice" />
      </div>

      <!-- 作品列表 -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <AuthorWorks 
          :author-id="author.id"
          :works="authorWorks"
          @select-work="goToNovel"
        />
      </div>

      <!-- 相似作者推荐 -->
      <div v-if="similarAuthors.length > 0" class="bg-white rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">相似作者</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="item in similarAuthors" 
            :key="item.id"
            @click="goToAuthor(item.id)"
            class="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <img 
              :src="item.avatar || '/default-avatar.png'" 
              :alt="item.name"
              class="w-16 h-16 rounded-full object-cover"
            />
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-gray-900 truncate">{{ item.name }}</h4>
              <p class="text-sm text-gray-500 truncate">{{ item.worksCount }}部作品</p>
              <p class="text-sm text-gray-400">{{ item.followers }}粉丝</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 py-20 text-center">
      <div class="text-gray-400 mb-4">
        <svg class="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-xl text-gray-600 mb-4">{{ error }}</p>
      <button @click="loadAuthorInfo" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        重新加载
      </button>
    </div>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAuthorInfo, getAuthorWorks, followAuthor } from '@/api/novel'
import BottomNav from '@/components/common/BottomNav.vue'
import AuthorCard from '@/components/novel/AuthorCard.vue'
import AuthorWorks from '@/components/novel/AuthorWorks.vue'
import AuthorNotice from '@/components/novel/AuthorNotice.vue'

const route = useRoute()
const router = useRouter()

const author = ref(null)
const authorWorks = ref([])
const similarAuthors = ref([])
const loading = ref(true)
const error = ref(null)
const isFollowing = ref(false)

// 加载作者信息
async function loadAuthorInfo() {
  try {
    loading.value = true
    error.value = null
    const id = route.params.id
    
    const res = await getAuthorInfo(id)
    author.value = res.data
    
    // 加载作者作品
    await loadAuthorWorks()
    
    // 加载相似作者
    loadSimilarAuthors()
    
    // 检查是否已关注
    checkFollowStatus()
  } catch (err) {
    console.error('加载作者信息失败:', err)
    error.value = '加载失败，请稍后重试'
    
    // 使用模拟数据
    generateMockAuthorData()
  } finally {
    loading.value = false
  }
}

// 加载作者作品
async function loadAuthorWorks() {
  try {
    const res = await getAuthorWorks(author.value.id)
    authorWorks.value = res.data
  } catch (err) {
    console.error('加载作者作品失败:', err)
  }
}

// 加载相似作者
function loadSimilarAuthors() {
  // TODO: 实现相似作者推荐
  similarAuthors.value = [
    {
      id: 2,
      name: '笔下生花',
      avatar: '',
      worksCount: 8,
      followers: 15600
    },
    {
      id: 3,
      name: '文字匠人',
      avatar: '',
      worksCount: 5,
      followers: 8900
    },
    {
      id: 4,
      name: '故事大师',
      avatar: '',
      worksCount: 12,
      followers: 23400
    }
  ]
}

// 检查关注状态
function checkFollowStatus() {
  // TODO: 从API或localStorage检查
  const followedAuthors = JSON.parse(localStorage.getItem('followed_authors') || '[]')
  isFollowing.value = followedAuthors.includes(author.value.id)
}

// 切换关注
async function toggleFollow() {
  try {
    await followAuthor(author.value.id)
    isFollowing.value = !isFollowing.value
    
    // 更新本地存储
    const followedAuthors = JSON.parse(localStorage.getItem('followed_authors') || '[]')
    if (isFollowing.value) {
      followedAuthors.push(author.value.id)
      author.value.followers++
    } else {
      const index = followedAuthors.indexOf(author.value.id)
      if (index > -1) {
        followedAuthors.splice(index, 1)
      }
      author.value.followers--
    }
    localStorage.setItem('followed_authors', JSON.stringify(followedAuthors))
  } catch (err) {
    console.error('关注操作失败:', err)
  }
}

// 打开私信
function openMessage() {
  alert('私信功能开发中...')
}

// 跳转到小说
function goToNovel(novelId) {
  router.push(`/novel/${novelId}`)
}

// 跳转到其他作者
function goToAuthor(authorId) {
  router.push(`/author/${authorId}`)
  loadAuthorInfo()
}

// 返回
function goBack() {
  router.back()
}

// 生成模拟数据
function generateMockAuthorData() {
  author.value = {
    id: route.params.id,
    name: '知名作家',
    avatar: '',
    bio: '专注于玄幻、仙侠题材创作，笔耕不辍十余年，致力于为读者带来精彩的阅读体验。',
    worksCount: 10,
    totalWords: 5000000,
    followers: 52000,
    notice: {
      title: '新书预告',
      content: '各位书友大家好！新书《XXX》已经在筹备中，预计下月上线，敬请期待！',
      createdAt: new Date()
    }
  }
  
  authorWorks.value = []
}

onMounted(() => {
  loadAuthorInfo()
})
</script>

