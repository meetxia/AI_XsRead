<template>
  <div class="recommend-page">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <div class="main-content">
      <!-- 页面标题 -->
      <div class="page-header fade-in">
        <h1 class="page-title">编辑精选</h1>
        <p class="page-subtitle">作者心声，精选故事，创作心路</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>

      <div v-else class="content-wrapper">
        <!-- 本周必读 -->
        <section class="weekly-pick-section fade-in">
          <h2 class="section-title">
            <span class="title-accent"></span>
            本周必读
          </h2>
          <div class="weekly-pick-card">
            <div class="weekly-pick-cover">
              <h3 class="weekly-pick-title">时光里的温柔相遇</h3>
            </div>
            <div class="weekly-pick-content">
              <div class="tags">
                <span class="tag tag-primary">都市言情</span>
                <span class="tag tag-secondary">编辑推荐</span>
              </div>
              <h3 class="novel-title">时光里的温柔相遇</h3>
              <p class="novel-description">
                一个关于相遇与重逢的故事。那年春天，图书馆的角落，阳光恰好照亮了彼此的心房。
                这不仅仅是一个爱情故事，更是关于成长、梦想和坚持的温柔叙事。作者用细腻的笔触，
                描绘出都市青年的情感世界，每一个细节都触动人心。
              </p>
              <div class="novel-meta">
                <span>作者：温柔笔触</span>
                <span>12.8万字</span>
                <span class="likes"><i class="bi bi-heart-fill"></i> 2.3k</span>
              </div>
              <button @click="handleRead({ id: 1 })" class="read-btn">立即阅读</button>
            </div>
          </div>
        </section>

        <!-- 热门榜单 -->
        <section class="hot-rank-section fade-in" style="animation-delay: 0.1s">
          <h2 class="section-title">
            <span class="title-accent-secondary"></span>
            热门榜单
          </h2>
          <div class="rank-grid">
            <div v-for="(book, index) in hotRankList.slice(0, 4)" :key="book.id" 
                 class="rank-card" @click="handleNovelClick(book)">
              <div class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
              <div class="rank-content">
                <h3 class="rank-title">{{ book.title }}</h3>
                <p class="rank-description">{{ book.description || '精彩内容等你来读...' }}</p>
                <div class="rank-meta">
                  <span>{{ book.author }}</span>
                  <span>{{ book.category || '都市言情' }}</span>
                  <span class="rank-likes"><i class="bi bi-heart-fill"></i> {{ formatNumber(book.hotValue) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 作者心声 -->
        <section class="author-voice-section fade-in" style="animation-delay: 0.2s">
          <h2 class="section-title">
            <span class="title-accent-purple"></span>
            作者心声
          </h2>
          <div class="author-grid">
            <div v-for="author in authorVoices" :key="author.id" class="author-card">
              <div class="author-header">
                <div class="author-avatar" :style="{ background: author.avatarGradient }"></div>
                <div>
                  <h4 class="author-name">{{ author.name }}</h4>
                  <p class="author-type">{{ author.type }}</p>
                </div>
              </div>
              <p class="author-quote">{{ author.quote }}</p>
            </div>
          </div>
        </section>

        <!-- 分类精选 -->
        <section class="category-section fade-in" style="animation-delay: 0.3s">
          <h2 class="section-title">
            <span class="title-accent-pink"></span>
            分类精选
          </h2>
          <div class="category-grid">
            <div v-for="category in categories.slice(0, 4)" :key="category.id" 
                 class="category-card" :style="{ background: category.gradient }"
                 @click="handleCategorySelect(category)">
              <div class="category-icon"><i :class="category.icon"></i></div>
              <h3 class="category-name">{{ category.name }}</h3>
              <p class="category-count">{{ category.count }}部作品</p>
            </div>
          </div>
        </section>
      </div>
    </div>
    
    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookshelfStore } from '@/stores/bookshelf'
import AppHeader from '@/components/common/AppHeader.vue'
import BottomNav from '@/components/common/BottomNav.vue'
import {
  getWeeklyPicks,
  getHotRankList,
  getEditorPicks,
  getCategoryRecommend,
  getNewBooks,
  getPersonalRecommend,
  getCategories
} from '@/api/recommend'

const router = useRouter()
const bookshelfStore = useBookshelfStore()

const loading = ref(false)
const weeklyPicks = ref([])
const hotRankList = ref([])
const editorPicks = ref([])
const categories = ref([])
const newBooks = ref([])
const personalRecommend = ref([])

// 作者心声数据
const authorVoices = ref([
  {
    id: 1,
    name: '温柔笔触',
    type: '都市言情作者',
    avatarGradient: 'linear-gradient(to bottom right, #ec4899, #d95468)',
    quote: '"每个故事都源自生活的某个瞬间。我想用文字记录下那些温柔的相遇，让读者在忙碌的生活中，找到一丝温暖。"'
  },
  {
    id: 2,
    name: '墨染流年',
    type: '古风穿越作者',
    avatarGradient: 'linear-gradient(to bottom right, #fbbf24, #f97316)',
    quote: '"古风不是简单的穿越，而是用现代人的情感去理解古代的故事。我希望读者能在历史的长河中，感受到不变的真情。"'
  },
  {
    id: 3,
    name: '治愈系作者',
    type: '治愈系作者',
    avatarGradient: 'linear-gradient(to bottom right, #4ade80, #10b981)',
    quote: '"生活已经够累了，我的故事想成为读者的避风港。让每个疲惫的灵魂，都能在文字中找到片刻的宁静。"'
  }
])

// 格式化数字
function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num
}

// 获取本周必读
async function fetchWeeklyPicks() {
  try {
    const res = await getWeeklyPicks()
    if (res.code === 200) {
      // 适配后端返回格式：data 直接是数组
      const novels = Array.isArray(res.data) ? res.data : (res.data.list || [])
      weeklyPicks.value = novels[0] || getMockWeeklyPicks()[0]
    }
  } catch (err) {
    console.error('获取本周必读失败:', err)
    // 使用模拟数据
    weeklyPicks.value = getMockWeeklyPicks()
  }
}

// 获取热门榜单
async function fetchHotRankList() {
  try {
    const res = await getHotRankList({ limit: 10 })
    if (res.code === 200) {
      // 适配后端返回格式：data 直接是数组
      hotRankList.value = Array.isArray(res.data) ? res.data : (res.data.list || [])
    }
  } catch (err) {
    console.error('获取热门榜单失败:', err)
    hotRankList.value = getMockHotRankList()
  }
}

// 获取编辑精选
async function fetchEditorPicks() {
  try {
    const res = await getEditorPicks({ limit: 6 })
    if (res.code === 200) {
      // 适配后端返回格式：data 直接是数组
      editorPicks.value = Array.isArray(res.data) ? res.data : (res.data.list || [])
    }
  } catch (err) {
    console.error('获取编辑精选失败:', err)
    editorPicks.value = getMockEditorPicks()
  }
}

// 获取分类
async function fetchCategories() {
  try {
    const res = await getCategories()
    if (res.code === 200) {
      // 适配后端返回格式：data 直接是数组
      categories.value = Array.isArray(res.data) ? res.data : (res.data.list || [])
    }
  } catch (err) {
    console.error('获取分类失败:', err)
    categories.value = getMockCategories()
  }
}

// 获取新书推荐
async function fetchNewBooks() {
  try {
    const res = await getNewBooks({ limit: 10 })
    if (res.code === 200) {
      // 适配后端返回格式：data 直接是数组
      newBooks.value = Array.isArray(res.data) ? res.data : (res.data.list || [])
    }
  } catch (err) {
    console.error('获取新书推荐失败:', err)
    newBooks.value = getMockNewBooks()
  }
}

// 获取个性化推荐
async function fetchPersonalRecommend() {
  try {
    const res = await getPersonalRecommend({ limit: 10 })
    if (res.code === 200) {
      // 适配后端返回格式：data 直接是数组
      personalRecommend.value = Array.isArray(res.data) ? res.data : (res.data.list || [])
    }
  } catch (err) {
    console.error('获取个性化推荐失败:', err)
    personalRecommend.value = getMockPersonalRecommend()
  }
}

// 刷新个性化推荐
async function refreshPersonalRecommend() {
  await fetchPersonalRecommend()
}

// 点击小说
function handleNovelClick(novel) {
  router.push(`/read/${novel.id}/1`)
}

// 阅读
function handleRead(novel) {
  router.push(`/read/${novel.id}/1`)
}

// 加入书架
async function handleAddToShelf(novel) {
  const success = await bookshelfStore.addBook(novel, 'reading')
  if (success) {
    alert('已加入书架')
  } else {
    alert('加入书架失败')
  }
}

// 选择分类
function handleCategorySelect(category) {
  router.push(`/category/${category.id}`)
}

// 模拟数据
function getMockWeeklyPicks() {
  return [
    {
      id: 1,
      title: '剑来',
      author: '烽火戏诸侯',
      cover: 'https://picsum.photos/800/400?random=1',
      description: '大千世界，无奇不有。我陈平安，唯有一剑，可搬山，倒海，降妖，镇魔，敕神，摘星，断江，摧城，开天！',
      rating: 9.5,
      readCount: 58000000,
      chapterCount: 1200
    }
  ]
}

function getMockHotRankList() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `热门小说 ${i + 1}`,
    author: `作者 ${i + 1}`,
    cover: `https://picsum.photos/300/400?random=${i + 10}`,
    rating: (8 + Math.random()).toFixed(1),
    hotValue: Math.floor(Math.random() * 100000) + 10000,
    trend: i < 5 ? 'up' : 'down',
    trendValue: Math.floor(Math.random() * 100)
  }))
}

function getMockEditorPicks() {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i + 20,
    title: `编辑精选 ${i + 1}`,
    author: `作者 ${i + 20}`,
    cover: `https://picsum.photos/300/400?random=${i + 20}`,
    description: '这是一本精彩的小说，讲述了一个激动人心的故事。',
    rating: (8 + Math.random()).toFixed(1),
    wordCount: Math.floor(Math.random() * 1000000) + 500000,
    status: i % 2 === 0 ? 'finished' : 'ongoing',
    tag: '热门'
  }))
}

function getMockCategories() {
  return [
    { id: 1, name: '都市言情', icon: 'bi-heart-fill', count: 328, gradient: 'linear-gradient(to bottom right, #fce7f3, #fbcfe8)' },
    { id: 2, name: '古风穿越', icon: 'bi-lantern-fill', count: 256, gradient: 'linear-gradient(to bottom right, #fef3c7, #fed7aa)' },
    { id: 3, name: '悬疑推理', icon: 'bi-search', count: 189, gradient: 'linear-gradient(to bottom right, #e9d5ff, #ddd6fe)' },
    { id: 4, name: '治愈系', icon: 'bi-flower1', count: 412, gradient: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)' }
  ]
}

function getMockNewBooks() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 30,
    title: `新书推荐 ${i + 1}`,
    author: `作者 ${i + 30}`,
    cover: `https://picsum.photos/300/400?random=${i + 30}`,
    description: '这是一本全新上架的小说，故事引人入胜。',
    rating: (7 + Math.random()).toFixed(1),
    wordCount: Math.floor(Math.random() * 500000) + 100000,
    status: 'ongoing',
    tag: '新书'
  }))
}

function getMockPersonalRecommend() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 40,
    title: `为你推荐 ${i + 1}`,
    author: `作者 ${i + 40}`,
    cover: `https://picsum.photos/300/400?random=${i + 40}`,
    description: '根据你的阅读喜好为你推荐的精彩小说。',
    rating: (8 + Math.random()).toFixed(1),
    wordCount: Math.floor(Math.random() * 2000000) + 500000,
    status: i % 3 === 0 ? 'finished' : 'ongoing'
  }))
}

// 初始化
onMounted(async () => {
  loading.value = true
  await Promise.all([
    fetchWeeklyPicks(),
    fetchHotRankList(),
    fetchEditorPicks(),
    fetchCategories(),
    fetchNewBooks(),
    fetchPersonalRecommend()
  ])
  loading.value = false
})
</script>

<style scoped>
.recommend-page {
  min-height: 100vh;
  padding-top: 4rem;
  padding-bottom: 5rem;
}

@media (min-width: 768px) {
  .recommend-page {
    padding-bottom: 2rem;
  }
}

.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 页面头部 */
.page-header {
  text-align: center;
  padding: 3rem 0 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
}

/* 加载状态 */
.loading-container {
  text-align: center;
  padding: 5rem 0;
}

.loading-spinner {
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 1rem;
  color: var(--color-text-muted);
}

.content-wrapper {
  padding-bottom: 2rem;
}

/* 章节标题 */
.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

.title-accent {
  width: 0.25rem;
  height: 2rem;
  background-color: var(--color-primary);
  margin-right: 0.75rem;
}

.title-accent-secondary {
  width: 0.25rem;
  height: 2rem;
  background-color: var(--color-secondary);
  margin-right: 0.75rem;
}

.title-accent-purple {
  width: 0.25rem;
  height: 2rem;
  background-color: #9333ea;
  margin-right: 0.75rem;
}

.title-accent-pink {
  width: 0.25rem;
  height: 2rem;
  background-color: #ec4899;
  margin-right: 0.75rem;
}

/* 本周必读卡片 */
.weekly-pick-section {
  margin-bottom: 4rem;
}

.weekly-pick-card {
  background-color: var(--color-bg-card);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
  transition: all 0.3s ease;
}

.weekly-pick-card:hover {
  box-shadow: 0 20px 25px -5px var(--color-shadow);
}

@media (min-width: 768px) {
  .weekly-pick-card {
    display: flex;
  }
}

.weekly-pick-cover {
  background: linear-gradient(to bottom right, var(--color-primary), var(--color-secondary));
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
}

@media (min-width: 768px) {
  .weekly-pick-cover {
    flex: 0 0 33.333333%;
  }
}

.weekly-pick-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: white;
  text-align: center;
}

.weekly-pick-content {
  padding: 2rem;
  flex: 1;
}

.tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-primary {
  background-color: var(--color-accent);
  color: var(--color-primary);
}

.tag-secondary {
  background-color: var(--color-accent);
  color: var(--color-secondary);
}

.novel-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.novel-description {
  color: var(--color-text-secondary);
  line-height: 1.75;
  margin-bottom: 1rem;
}

.novel-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.likes {
  color: var(--color-primary);
}

.read-btn {
  padding: 0.625rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 9999px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.read-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(217, 84, 104, 0.4);
}

/* 热门榜单 */
.hot-rank-section {
  margin-bottom: 4rem;
}

.rank-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .rank-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.rank-card {
  background-color: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
  transition: all 0.3s ease;
}

.rank-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px var(--color-shadow);
}

.rank-number {
  font-size: 2.5rem;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-1 { color: var(--color-primary); }
.rank-2 { color: var(--color-secondary); }
.rank-3 { color: #9333ea; }
.rank-4 { color: #ec4899; }

.rank-content {
  flex: 1;
}

.rank-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.rank-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rank-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.rank-likes {
  color: var(--color-primary);
}

/* 作者心声 */
.author-voice-section {
  margin-bottom: 4rem;
}

.author-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .author-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.author-card {
  background-color: var(--color-bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px var(--color-shadow);
}

.author-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.author-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.author-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.author-type {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.author-quote {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.75;
  font-style: italic;
}

/* 分类精选 */
.category-section {
  margin-bottom: 2rem;
}

.category-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.category-card {
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: scale(1.05);
}

.category-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.category-icon i {
  font-size: 2rem;
}

.category-name {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.category-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 淡入动画 */
.fade-in {
  animation: fadeIn 0.8s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端优化 */
@media (max-width: 640px) {
  .main-content {
    padding: 0 0.75rem;
  }
  
  /* 页面头部 */
  .page-header {
    padding: 2rem 0 1.5rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .page-subtitle {
    font-size: 0.9375rem;
  }
  
  /* 章节标题 */
  .section-title {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
  
  .title-accent,
  .title-accent-secondary,
  .title-accent-purple,
  .title-accent-pink {
    height: 1.5rem;
    margin-right: 0.5rem;
  }
  
  /* 本周必读卡片 */
  .weekly-pick-section {
    margin-bottom: 2.5rem;
  }
  
  .weekly-pick-card {
    border-radius: 1rem;
  }
  
  .weekly-pick-cover {
    padding: 2rem 1.5rem;
    min-height: 180px;
  }
  
  .weekly-pick-title {
    font-size: 1.5rem;
  }
  
  .weekly-pick-content {
    padding: 1.25rem;
  }
  
  .novel-title {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }
  
  .novel-description {
    font-size: 0.875rem;
    line-height: 1.6;
    margin-bottom: 0.75rem;
  }
  
  .novel-meta {
    gap: 0.75rem;
    font-size: 0.8125rem;
    margin-bottom: 1rem;
  }
  
  .read-btn {
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
  }
  
  /* 热门榜单 */
  .hot-rank-section {
    margin-bottom: 2.5rem;
  }
  
  .rank-grid {
    gap: 0.75rem;
  }
  
  .rank-card {
    padding: 1rem;
    gap: 0.75rem;
    border-radius: 0.875rem;
  }
  
  .rank-number {
    font-size: 2rem;
  }
  
  .rank-title {
    font-size: 1rem;
    margin-bottom: 0.375rem;
  }
  
  .rank-description {
    font-size: 0.8125rem;
    margin-bottom: 0.5rem;
  }
  
  .rank-meta {
    gap: 0.75rem;
    font-size: 0.6875rem;
  }
  
  /* 作者心声 */
  .author-voice-section {
    margin-bottom: 2.5rem;
  }
  
  .author-grid {
    gap: 0.75rem;
  }
  
  .author-card {
    padding: 1rem;
    border-radius: 0.875rem;
  }
  
  .author-header {
    gap: 0.625rem;
    margin-bottom: 0.75rem;
  }
  
  .author-avatar {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .author-name {
    font-size: 0.9375rem;
  }
  
  .author-quote {
    font-size: 0.8125rem;
    line-height: 1.6;
  }
  
  /* 分类精选 */
  .category-section {
    margin-bottom: 1.5rem;
  }
  
  .category-grid {
    gap: 0.625rem;
  }
  
  .category-card {
    padding: 1rem;
    border-radius: 0.875rem;
  }
  
  .category-icon {
    font-size: 1.75rem;
    margin-bottom: 0.375rem;
  }

  .category-icon i {
    font-size: 1.75rem;
  }
  
  .category-name {
    font-size: 0.9375rem;
    margin-bottom: 0.125rem;
  }
  
  .category-count {
    font-size: 0.6875rem;
  }
  
  /* 移动端触摸反馈 */
  .rank-card:active {
    transform: scale(0.98);
  }
  
  .category-card:active {
    transform: scale(0.98);
  }
  
  .read-btn:active {
    transform: scale(0.95);
  }
}
</style>

