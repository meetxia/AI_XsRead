<template>
  <div class="home-page">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 欢迎标语区域 -->
      <section class="welcome-section">
        <div class="welcome-content">
          <h1 class="welcome-title fade-in">故事入境，杂念自消</h1>
          <p class="welcome-subtitle fade-in">每个故事都是一扇门，每次阅读都是一场相遇</p>
        </div>
      </section>

      <!-- 小说列表 - 瀑布流 -->
      <section class="novels-section">
        <div class="container">
          <MasonryLayout
            :novels="displayNovels"
            :loading="loading"
            :has-more="hasMore"
            :columns="3"
            :show-description="true"
            :auto-load="true"
            @load-more="loadMoreNovels"
          />
          
          <!-- 加载更多按钮 -->
          <div v-if="!loading && hasMore" class="load-more-container">
            <button @click="loadMoreNovels" class="load-more-btn">
              发现更多故事
            </button>
          </div>
        </div>
      </section>
    </main>
    
    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/common/AppHeader.vue'
import BottomNav from '@/components/common/BottomNav.vue'
import MasonryLayout from '@/components/novel/MasonryLayout.vue'
import { getNovels } from '@/api/novel'

// 分类列表
const categories = ref([
  { label: '全部', value: 'all' },
  { label: '玄幻', value: 'xuanhuan' },
  { label: '都市', value: 'dushi' },
  { label: '言情', value: 'yanqing' },
  { label: '武侠', value: 'wuxia' },
  { label: '科幻', value: 'kehuan' },
  { label: '历史', value: 'lishi' },
  { label: '游戏', value: 'youxi' }
])

// 当前选中的分类
const currentCategory = ref('all')

// 小说列表
const novels = ref([])
const loading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = ref(12)

// 显示的小说列表（根据分类筛选）
const displayNovels = computed(() => {
  if (currentCategory.value === 'all') {
    return novels.value
  }
  return novels.value.filter(novel => novel.category === currentCategory.value)
})

/**
 * 选择分类
 */
const selectCategory = (category) => {
  currentCategory.value = category
  // 重置列表
  novels.value = []
  currentPage.value = 1
  hasMore.value = true
  // 重新加载
  loadNovels()
}

/**
 * 加载小说列表
 */
const loadNovels = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      category: currentCategory.value === 'all' ? undefined : currentCategory.value
    }
    
    // 调用API
    const response = await getNovels(params)
    
    if (response && response.data) {
      // 后端返回格式：data 直接是数组，pagination 在外层
      const newNovels = Array.isArray(response.data) ? response.data : (response.data.list || [])
      
      if (currentPage.value === 1) {
        novels.value = newNovels
      } else {
        novels.value = [...novels.value, ...newNovels]
      }
      
      // 判断是否还有更多（根据 pagination 或数组长度判断）
      if (response.pagination) {
        hasMore.value = response.pagination.page < response.pagination.totalPages
      } else {
        hasMore.value = newNovels.length === pageSize.value
      }
    }
  } catch (error) {
    console.error('加载小说列表失败:', error)
    
    // 如果API调用失败，使用模拟数据
    const mockNovels = generateMockNovels(currentPage.value, pageSize.value)
    
    if (currentPage.value === 1) {
      novels.value = mockNovels
    } else {
      novels.value = [...novels.value, ...mockNovels]
    }
    
    hasMore.value = currentPage.value < 5 // 模拟5页数据
  } finally {
    loading.value = false
  }
}

/**
 * 加载更多小说
 */
const loadMoreNovels = () => {
  if (!loading.value && hasMore.value) {
    currentPage.value++
    loadNovels()
  }
}

/**
 * 生成模拟数据（用于开发测试）
 */
const generateMockNovels = (page, size) => {
  const categories = ['都市言情', '古风穿越', '悬疑推理', '治愈系', '玄幻', '武侠', '科幻', '历史']
  const titles = [
    '时光里的温柔相遇', '长安月下，归人未归', '雨夜迷雾中的真相', '咖啡馆里的小确幸',
    '修真世界', '武侠传奇', '星际争霸', '大明风华',
    '遮天', '完美世界', '元尊', '天道图书馆',
    '凡人修仙传', '诡秘之主', '雪中悍刀行', '庆余年'
  ]
  const authors = [
    '温柔笔触', '墨染流年', '悬疑女王', '治愈系作者',
    '唐家三少', '辰东', '我吃西红柿', '天蚕土豆'
  ]
  
  const descriptions = [
    '那年春天，我在图书馆的角落遇见了他。阳光透过窗棂洒在他的书页上，恰好照亮了我的心房...',
    '宫墙深深，月色清冷。她站在长安城楼上，等待一个永远不会回来的人。三年了，那个许诺要回来娶她的少年郎，再无音讯...',
    '雨夜，老宅，消失的遗嘱。三个女人，一个秘密。当真相浮出水面，所有人都沉默了...',
    '在城市的角落开了一家小咖啡馆。每天，不同的客人带来不同的故事，温暖而治愈...',
    '这是一个关于修真的故事，主人公历经磨难，最终成就无上大道...',
    '江湖险恶，侠之大者。一段快意恩仇的武侠传奇就此展开...',
    '在浩瀚的星海中，人类的命运将何去何从？一场史诗般的星际冒险即将开始...',
    '穿越回大明王朝，看他如何在历史的长河中留下浓墨重彩的一笔...'
  ]
  
  const novels = []
  const start = (page - 1) * size
  
  for (let i = 0; i < size; i++) {
    const index = start + i
    const categoryIndex = index % categories.length
    const titleIndex = index % titles.length
    const authorIndex = index % authors.length
    const descIndex = index % descriptions.length
    
    novels.push({
      id: index + 1,
      title: titles[titleIndex] + (index > 15 ? ` ${Math.floor(index / 16) + 1}` : ''),
      author: authors[authorIndex],
      category: categories[categoryIndex],
      description: descriptions[descIndex],
      wordCount: Math.floor(Math.random() * 500000) + 100000,
      likes: Math.floor(Math.random() * 10000) + 1000,
      status: Math.random() > 0.5 ? 'ongoing' : 'completed'
    })
  }
  
  return novels
}

// 组件挂载时加载数据
onMounted(() => {
  loadNovels()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding-top: 4rem; /* 为顶部导航留出空间 */
  padding-bottom: 5rem; /* 为底部导航留出空间 (仅移动端) */
}

@media (min-width: 768px) {
  .home-page {
    padding-bottom: 2rem;
  }
}

.main-content {
  width: 100%;
}

/* 欢迎区域 */
.welcome-section {
  padding: 4rem 1rem 3rem;
  text-align: center;
}

.welcome-content {
  max-width: 900px;
  margin: 0 auto;
}

.welcome-title {
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  animation-delay: 0.1s;
  line-height: 1.2;
}

.welcome-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  animation-delay: 0.2s;
}

@media (max-width: 640px) {
  .welcome-section {
    padding: 3rem 1rem 2rem;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
}

@media (min-width: 768px) {
  .welcome-title {
    font-size: 3.5rem;
  }
  
  .welcome-subtitle {
    font-size: 1.25rem;
  }
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 小说列表区域 */
.novels-section {
  padding: 2rem 0 3rem;
}

/* 加载更多按钮 */
.load-more-container {
  text-align: center;
  margin-top: 3rem;
}

.load-more-btn {
  padding: 0.875rem 2.5rem;
  color: white;
  background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
  border: none;
  border-radius: 9999px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgba(217, 84, 104, 0.3);
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px -5px rgba(217, 84, 104, 0.4);
}

.load-more-btn:active {
  transform: translateY(0);
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
</style>
