<template>
  <div class="novel-detail-page">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 detail-header">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <button @click="goBack" class="flex items-center header-btn">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="ml-2">返回</span>
        </button>
        <div class="flex items-center space-x-4">
          <button @click="shareNovel" class="header-btn">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- 加载骨架屏 -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 py-8">
      <div class="animate-pulse">
        <div class="flex flex-col md:flex-row gap-6 mb-8">
          <div class="w-full md:w-48 h-64 skeleton rounded-xl"></div>
          <div class="flex-1 space-y-4">
            <div class="h-8 skeleton rounded w-3/4"></div>
            <div class="h-4 skeleton rounded w-1/2"></div>
            <div class="h-20 skeleton rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 小说详情内容 -->
    <div v-else-if="novel" class="max-w-7xl mx-auto px-4 py-8">
      <!-- 主信息区 -->
      <div class="detail-card rounded-2xl shadow-lg p-6 mb-6">
        <div class="flex flex-col md:flex-row gap-6">
          <!-- 封面 -->
          <div class="flex-shrink-0">
            <div 
              @click="previewCover" 
              class="w-32 h-44 md:w-48 md:h-64 rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-xl transition-shadow cover-card"
            >
              <img
                v-if="novel.cover"
                :src="novel.cover"
                :alt="novel.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-white text-4xl md:text-5xl font-bold cover-fallback">
                {{ novel.title.charAt(0) }}
              </div>
            </div>
          </div>

          <!-- 信息区 -->
          <div class="flex-1">
            <!-- 标题和作者 -->
            <h1 class="text-3xl font-bold novel-title mb-3">{{ novel.title }}</h1>
            <div class="flex items-center space-x-4 mb-4">
              <router-link 
                :to="`/author/${novel.authorId}`"
                class="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                <span class="text-lg">{{ novel.author }}</span>
              </router-link>
              <button 
                @click="followAuthor"
                class="px-4 py-1 text-sm rounded-full transition-colors"
                :class="isFollowing ? 'bg-gray-200 text-gray-600' : 'bg-blue-500 text-white hover:bg-blue-600'"
              >
                {{ isFollowing ? '已关注' : '+ 关注' }}
              </button>
            </div>

            <!-- 标签 -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span 
                v-for="tag in novel.tags" 
                :key="tag"
                @click="searchByTag(tag)"
                class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm cursor-pointer hover:bg-blue-100 transition-colors"
              >
                {{ tag }}
              </span>
              <span 
                class="px-3 py-1 rounded-full text-sm font-semibold"
                :class="novel.status === 'finished' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'"
              >
                {{ novel.status === 'finished' ? '已完结' : '连载中' }}
              </span>
            </div>

            <!-- 统计信息 -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{{ formatWordCount(novel.wordCount) }}</div>
                <div class="text-sm text-gray-500">字数</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{{ novel.chapterCount || 0 }}</div>
                <div class="text-sm text-gray-500">章节</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{{ formatNumber(novel.views) }}</div>
                <div class="text-sm text-gray-500">阅读</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{{ formatNumber(novel.likes) }}</div>
                <div class="text-sm text-gray-500">点赞</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{{ formatNumber(novel.collects) }}</div>
                <div class="text-sm text-gray-500">收藏</div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex flex-wrap gap-3 relative">
              <button 
                @click="startReading"
                class="flex-1 md:flex-none px-8 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg read-primary-btn"
              >
                {{ readingProgress ? '继续阅读' : '开始阅读' }}
              </button>
              <button 
                @click="addToBookshelf"
                class="flex-1 md:flex-none px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
                :class="isInBookshelf ? 'bg-gray-200 text-gray-600' : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-gray-400'"
              >
                {{ isInBookshelf ? '已在书架' : '加入书架' }}
              </button>
              <button 
                @click="toggleLike"
                class="px-6 py-3 rounded-lg transition-colors shadow-md"
                :class="isLiked ? 'bg-red-50 text-red-600' : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-gray-400'"
              >
                <svg class="w-5 h-5" :fill="isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 简介 -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">内容简介</h3>
          <div class="text-gray-600 leading-relaxed">
            <p :class="{ 'line-clamp-3': !showFullDescription }" class="whitespace-pre-wrap">{{ novel.description }}</p>
            <button 
              v-if="novel.description && novel.description.length > 100"
              @click="showFullDescription = !showFullDescription"
              class="text-blue-500 hover:text-blue-600 mt-2 text-sm font-medium"
            >
              {{ showFullDescription ? '收起' : '展开全部' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 评分系统 -->
      <div v-if="novel && novel.id" class="detail-card rounded-2xl shadow-lg p-6 mb-6">
        <RatingSystem :novel-id="novel.id" :initial-rating="novel.rating || 0" />
      </div>

      <!-- 章节列表 -->
      <div v-if="novel && novel.id" class="detail-card rounded-2xl shadow-lg p-6 mb-6">
        <ChapterList :novel-id="novel.id" @select-chapter="goToChapter" />
      </div>

      <!-- 评论区 -->
      <div v-if="novel && novel.id" class="detail-card rounded-2xl shadow-lg p-6 mb-6">
        <CommentSection :novel-id="novel.id" />
      </div>

      <!-- 相似推荐 -->
      <div v-if="similarNovels.length > 0" class="detail-card rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">相似推荐</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <NovelCard 
            v-for="item in similarNovels" 
            :key="item.id"
            :novel="item"
            @click="goToNovel(item.id)"
          />
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
      <button @click="loadNovelDetail" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        重新加载
      </button>
    </div>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNovelDetail, getRecommendNovels, likeNovel } from '@/api/novel'
import { useBookshelfStore } from '@/stores/bookshelf'
import BottomNav from '@/components/common/BottomNav.vue'
import NovelCard from '@/components/novel/NovelCard.vue'
import ChapterList from '@/components/novel/ChapterList.vue'
import RatingSystem from '@/components/novel/RatingSystem.vue'
import CommentSection from '@/components/novel/CommentSection.vue'

const route = useRoute()
const router = useRouter()
const bookshelfStore = useBookshelfStore()

const novel = ref(null)
const loading = ref(true)
const error = ref(null)
const showFullDescription = ref(false)
const similarNovels = ref([])
const isFollowing = ref(false)
const isLiked = ref(false)
const readingProgress = ref(null)

// 计算是否在书架中
const isInBookshelf = computed(() => {
  if (!novel.value) return false
  return bookshelfStore.isInBookshelf(novel.value.id)
})

// 加载小说详情
async function loadNovelDetail() {
  try {
    loading.value = true
    error.value = null
    const id = route.params.id
    
    console.log('正在加载小说详情，ID:', id)
    const res = await getNovelDetail(id)
    
    if (!res || !res.data) {
      throw new Error('小说数据为空')
    }
    
    novel.value = res.data
    console.log('小说详情加载成功:', novel.value.title)
    
    // 加载相似推荐
    loadSimilarNovels()
    
    // 检查阅读进度
    checkReadingProgress()
  } catch (err) {
    console.error('加载小说详情失败:', err)
    error.value = err.response?.status === 404 ? '小说不存在' : '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 加载相似推荐
async function loadSimilarNovels() {
  try {
    const res = await getRecommendNovels({ 
      category: novel.value.category,
      limit: 5 
    })
    // 适配后端返回格式
    const novels = Array.isArray(res.data) ? res.data : (res.data.list || [])
    similarNovels.value = novels.filter(item => item.id !== novel.value.id).slice(0, 5)
  } catch (err) {
    console.error('加载推荐失败:', err)
  }
}

// 检查阅读进度
function checkReadingProgress() {
  // 从localStorage或store获取阅读进度
  const progress = localStorage.getItem(`reading_progress_${novel.value.id}`)
  if (progress) {
    readingProgress.value = JSON.parse(progress)
  }
}

// 开始阅读
async function startReading() {
  try {
    console.log('🚀 开始阅读，小说ID:', novel.value.id)
    
    // 尝试获取章节列表
    const { getChapterList } = await import('@/api/novel')
    const res = await getChapterList(novel.value.id, { pageSize: 1 })
    
    if (res.code === 200 && res.data && res.data.length > 0) {
      // 有章节列表，跳转到第一章或保存的进度
      const targetChapter = readingProgress.value?.chapterNumber || 1
      console.log('✓ 跳转到章节:', targetChapter)
      router.push(`/reading/${novel.value.id}?chapter=${targetChapter}`)
    } else {
      // 没有章节列表，可能是短篇，直接跳转
      console.log('⚠ 没有章节列表，可能是短篇小说，直接跳转')
      router.push(`/reading/${novel.value.id}`)
    }
  } catch (err) {
    console.error('✗ 获取章节列表失败:', err)
    // 出错时也尝试跳转，让阅读页自己处理
    router.push(`/reading/${novel.value.id}`)
  }
}

// 加入书架
async function addToBookshelf() {
  if (isInBookshelf.value) {
    bookshelfStore.removeFromBookshelf(novel.value.id)
  } else {
    bookshelfStore.addToBookshelf(novel.value, 'reading')
  }
}

// 点赞
async function toggleLike() {
  try {
    await likeNovel(novel.value.id)
    isLiked.value = !isLiked.value
    if (isLiked.value) {
      novel.value.likes++
    } else {
      novel.value.likes--
    }
  } catch (err) {
    console.error('点赞失败:', err)
  }
}

// 关注作者
function followAuthor() {
  isFollowing.value = !isFollowing.value
  // TODO: 调用关注API
}

// 跳转到章节
function goToChapter(chapterId) {
  router.push(`/reading/${novel.value.id}?chapter=${chapterId}`)
}

// 跳转到其他小说
function goToNovel(novelId) {
  router.push(`/novel/${novelId}`)
  // 重新加载
  loadNovelDetail()
}

// 按标签搜索
function searchByTag(tag) {
  router.push(`/search?tag=${tag}`)
}

// 分享小说
function shareNovel() {
  // TODO: 实现分享功能
  alert('分享功能开发中...')
}

// 预览封面
function previewCover() {
  // TODO: 实现封面预览
  console.log('预览封面')
}

// 返回
function goBack() {
  // 优先返回首页，避免返回到空白页面
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

// 格式化字数
function formatWordCount(count) {
  if (!count) return '0'
  if (count > 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}

// 格式化数字
function formatNumber(num) {
  if (!num) return '0'
  if (num > 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  return num.toString()
}

onMounted(() => {
  loadNovelDetail()
})
</script>

<style scoped>
.novel-detail-page {
  min-height: 100vh;
  padding-bottom: 5rem;
}

/* 详情页头部 */
.detail-header {
  background-color: var(--color-bg-card);
  box-shadow: 0 1px 3px 0 var(--color-shadow);
  transition: all 0.3s ease;
}

.header-btn {
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.header-btn:hover {
  color: var(--color-text-primary);
}

/* 详情卡片 */
.detail-card {
  background-color: var(--color-bg-card);
  color: var(--color-text-primary);
  transition: all 0.3s ease;
}

/* 移动端封面与按钮主题适配 */
.cover-card {
  background: var(--color-bg-card);
}

.cover-fallback {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.read-primary-btn {
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  color: #fff;
}

/* 骨架屏 */
.skeleton {
  background-color: var(--color-border);
}

/* 小说标题 */
.novel-title {
  color: var(--color-text-primary);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

