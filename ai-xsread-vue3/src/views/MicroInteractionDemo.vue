<template>
  <div class="micro-interaction-demo">
    <div class="demo-header">
      <h1>微交互设计演示</h1>
      <p class="subtitle">体验增强的用户交互效果</p>
    </div>

    <!-- 1. 涟漪效果演示 -->
    <section class="demo-section">
      <h2><i class="bi bi-water"></i> 涟漪效果 (Ripple Effect)</h2>
      <div class="demo-content">
        <ripple-effect>
          <button class="demo-button primary">
            点击查看涟漪效果
          </button>
        </ripple-effect>

        <ripple-effect :color="'rgba(16, 185, 129, 0.3)'">
          <button class="demo-button success">
            绿色涟漪
          </button>
        </ripple-effect>

        <ripple-effect center>
          <button class="demo-button secondary">
            中心扩散
          </button>
        </ripple-effect>
      </div>
    </section>

    <!-- 2. v-feedback指令演示 -->
    <section class="demo-section">
      <h2><i class="bi bi-phone-vibrate"></i> 触觉反馈指令 (v-feedback)</h2>
      <div class="demo-content">
        <button v-feedback class="demo-button primary">
          完整反馈（涟漪+触觉+缩放）
        </button>

        <button v-feedback="{ haptic: true, ripple: false }" class="demo-button">
          仅触觉反馈
        </button>

        <button v-feedback="{ ripple: true, haptic: false, scale: false }" class="demo-button">
          仅涟漪效果
        </button>

        <button 
          v-feedback="{ 
            haptic: true, 
            ripple: true, 
            rippleColor: 'rgba(239, 68, 68, 0.3)' 
          }" 
          class="demo-button danger"
        >
          自定义颜色
        </button>
      </div>
    </section>

    <!-- 3. 手势交互演示 -->
    <section class="demo-section">
      <h2><i class="bi bi-hand-index"></i> 手势交互 (Gestures)</h2>
      
      <!-- 滑动手势 -->
      <div class="gesture-demo-box" ref="swipeBox">
        <div class="gesture-hint">
          <p><i class="bi bi-arrow-left-right"></i> 在此区域滑动</p>
          <p class="gesture-result">{{ swipeResult }}</p>
        </div>
      </div>

      <!-- 双击手势 -->
      <div class="gesture-demo-box" ref="doubleTapBox">
        <div class="gesture-hint">
          <p><i class="bi bi-hand-index"></i><i class="bi bi-hand-index"></i> 双击此区域</p>
          <p class="gesture-result">{{ doubleTapResult }}</p>
        </div>
      </div>

      <!-- 长按手势 -->
      <div class="gesture-demo-box" ref="longPressBox">
        <div class="gesture-hint">
          <p><i class="bi bi-hand-index-fill"></i> 长按此区域</p>
          <p class="gesture-result">{{ longPressResult }}</p>
        </div>
      </div>
    </section>

    <!-- 4. 下拉刷新演示 -->
    <section class="demo-section">
      <h2><i class="bi bi-arrow-repeat"></i> 下拉刷新 (Pull to Refresh)</h2>
      <div class="pull-refresh-demo">
        <pull-to-refresh @refresh="handleRefresh">
          <div class="content-list">
            <div 
              v-for="item in refreshItems" 
              :key="item.id"
              class="content-item"
            >
              <div class="item-icon"><i class="bi bi-book"></i></div>
              <div class="item-text">{{ item.text }}</div>
            </div>
          </div>
        </pull-to-refresh>
      </div>
    </section>

    <!-- 5. 进度条演示 -->
    <section class="demo-section">
      <h2><i class="bi bi-bar-chart"></i> 进度条 (Progress Bar)</h2>
      <div class="demo-content">
        <!-- 普通进度条 -->
        <div class="progress-demo-item">
          <h3>普通进度</h3>
          <progress-bar :percent="normalProgress" />
          <div class="progress-controls">
            <button @click="normalProgress = Math.max(0, normalProgress - 10)" class="control-btn">-10</button>
            <button @click="normalProgress = Math.min(100, normalProgress + 10)" class="control-btn">+10</button>
            <button @click="normalProgress = 0" class="control-btn">重置</button>
          </div>
        </div>

        <!-- 不确定进度 -->
        <div class="progress-demo-item">
          <h3>不确定进度</h3>
          <progress-bar indeterminate loading-text="正在处理..." />
        </div>

        <!-- 带状态的进度 -->
        <div class="progress-demo-item">
          <h3>成功状态</h3>
          <progress-bar 
            :percent="100" 
            show-status 
            status="success" 
            status-text="上传完成" 
          />
        </div>

        <!-- 不同尺寸 -->
        <div class="progress-demo-item">
          <h3>不同尺寸</h3>
          <progress-bar :percent="60" size="small" />
          <progress-bar :percent="60" size="medium" />
          <progress-bar :percent="60" size="large" />
        </div>

        <!-- 自定义颜色 -->
        <div class="progress-demo-item">
          <h3>自定义颜色</h3>
          <progress-bar :percent="75" color="#10b981" />
        </div>
      </div>
    </section>

    <!-- 6. 加载状态演示 -->
    <section class="demo-section">
      <h2><i class="bi bi-hourglass-split"></i> 加载状态 (Loading)</h2>
      <div class="demo-content loading-demos">
        <div class="loading-demo-item">
          <h3>圆圈旋转</h3>
          <loading variant="circle" text="加载中..." size="medium" />
        </div>

        <div class="loading-demo-item">
          <h3>点跳动</h3>
          <loading variant="dots" text="请稍候..." size="medium" />
        </div>

        <div class="loading-demo-item">
          <h3>波浪</h3>
          <loading variant="wave" text="处理中..." size="medium" />
        </div>

        <div class="loading-demo-item">
          <h3>书本翻页</h3>
          <loading variant="book" text="阅读中..." size="medium" />
        </div>

        <div class="loading-demo-item">
          <h3>智能提示</h3>
          <loading variant="gradient" smart-text size="medium" />
        </div>
      </div>
    </section>

    <!-- 7. Toast消息演示 -->
    <section class="demo-section">
      <h2><i class="bi bi-chat-dots"></i> Toast消息</h2>
      <div class="demo-content">
        <button @click="showSuccessToast" class="demo-button success">
          成功消息
        </button>
        <button @click="showErrorToast" class="demo-button danger">
          错误消息
        </button>
        <button @click="showWarningToast" class="demo-button warning">
          警告消息
        </button>
        <button @click="showInfoToast" class="demo-button info">
          信息消息
        </button>
      </div>
    </section>

    <!-- 8. 点赞按钮演示 -->
    <section class="demo-section">
      <h2><i class="bi bi-heart-fill"></i> 点赞按钮</h2>
      <div class="demo-content">
        <like-button 
          :liked="liked1" 
          :count="likeCount1"
          @like="handleLike1"
          @unlike="handleUnlike1"
        />
        
        <like-button 
          :liked="liked2" 
          :count="likeCount2"
          size="large"
          @like="handleLike2"
          @unlike="handleUnlike2"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import RippleEffect from '@/components/common/RippleEffect.vue'
import PullToRefresh from '@/components/common/PullToRefresh.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import Loading from '@/components/common/Loading.vue'
import LikeButton from '@/components/common/LikeButton.vue'
import { useSwipe, useDoubleTap, useLongPress } from '@/composables/useGestures'
import toast from '@/utils/toast'

// 手势演示
const swipeBox = ref(null)
const doubleTapBox = ref(null)
const longPressBox = ref(null)

const swipeResult = ref('等待滑动...')
const doubleTapResult = ref('等待双击...')
const longPressResult = ref('等待长按...')

// 下拉刷新
const refreshItems = ref([
  { id: 1, text: '第一条内容' },
  { id: 2, text: '第二条内容' },
  { id: 3, text: '第三条内容' },
  { id: 4, text: '第四条内容' },
  { id: 5, text: '第五条内容' }
])

// 进度条
const normalProgress = ref(30)

// 点赞
const liked1 = ref(false)
const likeCount1 = ref(1234)
const liked2 = ref(true)
const likeCount2 = ref(5678)

// 初始化手势
onMounted(() => {
  // 滑动手势
  useSwipe(swipeBox, {
    onSwipeLeft: () => {
      swipeResult.value = '← 向左滑动'
    },
    onSwipeRight: () => {
      swipeResult.value = '→ 向右滑动'
    },
    onSwipeUp: () => {
      swipeResult.value = '↑ 向上滑动'
    },
    onSwipeDown: () => {
      swipeResult.value = '↓ 向下滑动'
    }
  })

  // 双击手势
  useDoubleTap(doubleTapBox, () => {
    doubleTapResult.value = '✓ 双击成功！'
    setTimeout(() => {
      doubleTapResult.value = '等待双击...'
    }, 2000)
  })

  // 长按手势
  useLongPress(longPressBox, () => {
    longPressResult.value = '✓ 长按触发！'
    setTimeout(() => {
      longPressResult.value = '等待长按...'
    }, 2000)
  })
})

// 下拉刷新处理
async function handleRefresh() {
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // 添加新内容
  const newItem = {
    id: Date.now(),
    text: `新内容 - ${new Date().toLocaleTimeString()}`
  }
  refreshItems.value.unshift(newItem)
  
  toast.success('refresh', { message: '刷新成功' })
}

// Toast演示
function showSuccessToast() {
  toast.success('addToBookshelf')
}

function showErrorToast() {
  toast.error('network')
}

function showWarningToast() {
  toast.warning('unsaved')
}

function showInfoToast() {
  toast.info('loading')
}

// 点赞处理
function handleLike1() {
  liked1.value = true
  likeCount1.value++
}

function handleUnlike1() {
  liked1.value = false
  likeCount1.value--
}

function handleLike2() {
  liked2.value = true
  likeCount2.value++
}

function handleUnlike2() {
  liked2.value = false
  likeCount2.value--
}
</script>

<style scoped>
.micro-interaction-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.demo-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
  border-bottom: 2px solid var(--color-border, #e5e7eb);
}

.demo-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
}

.demo-section {
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--color-bg-elevated, #ffffff);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.demo-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.demo-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.demo-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.demo-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.demo-button.primary {
  background: var(--color-primary);
  color: white;
}

.demo-button.success {
  background: #10b981;
  color: white;
}

.demo-button.danger {
  background: #ef4444;
  color: white;
}

.demo-button.warning {
  background: #f59e0b;
  color: white;
}

.demo-button.info {
  background: #3b82f6;
  color: white;
}

.demo-button.secondary {
  background: #6b7280;
  color: white;
}

/* 手势演示区域 */
.gesture-demo-box {
  flex: 1;
  min-width: 250px;
  min-height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.gesture-hint {
  text-align: center;
  color: white;
}

.gesture-hint p {
  margin: 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 500;
}

.gesture-result {
  font-size: 1.5rem !important;
  font-weight: 700 !important;
  margin-top: 1rem !important;
}

/* 下拉刷新演示 */
.pull-refresh-demo {
  height: 400px;
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.content-list {
  padding: 1rem;
}

.content-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: var(--color-bg-hover);
  border-radius: 8px;
}

.item-icon {
  font-size: 1.5rem;
}

.item-icon i {
  font-size: 1.5rem;
}

.item-text {
  font-size: 1rem;
  color: var(--color-text-primary);
}

/* 进度条演示 */
.progress-demo-item {
  width: 100%;
  margin-bottom: 1.5rem;
}

.progress-demo-item h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.progress-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.control-btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.control-btn:hover {
  opacity: 0.9;
}

/* 加载状态演示 */
.loading-demos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.loading-demo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1rem;
  background: var(--color-bg-hover);
  border-radius: 12px;
}

.loading-demo-item h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* 响应式 */
@media (max-width: 768px) {
  .micro-interaction-demo {
    padding: 1rem;
  }

  .demo-header h1 {
    font-size: 2rem;
  }

  .demo-section {
    padding: 1rem;
  }

  .gesture-demo-box {
    min-width: 100%;
  }

  .loading-demos {
    grid-template-columns: 1fr;
  }
}
</style>

