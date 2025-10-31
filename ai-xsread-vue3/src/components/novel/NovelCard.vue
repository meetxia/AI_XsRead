<template>
  <div
    @click="handleClick"
    class="novel-card magazine-style"
    :class="cardSizeClass"
  >
    <!-- 渐变封面背景 - 带纹理和几何元素 -->
    <div class="card-cover" :style="getCoverGradient()">
      <!-- 纹理层 -->
      <div class="cover-texture"></div>
      <!-- 几何装饰 -->
      <div class="cover-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
      <!-- 叠加层 -->
      <div class="cover-overlay"></div>
    </div>

    <!-- 内容层 -->
    <div class="card-content">
    <!-- 顶部：分类和时间 -->
    <div class="card-header">
      <span class="category-tag" :style="getCategoryStyle()">
        {{ novel.category || '都市言情' }}
      </span>
      <span class="publish-time">{{ getPublishTime() }}</span>
    </div>

    <!-- 标题 -->
    <h3 class="card-title">{{ novel.title }}</h3>

    <!-- 描述 -->
    <p v-if="showDescription" class="card-description">
      {{ novel.description || '这是一个精彩的故事，讲述了一段动人的情节...' }}
    </p>

      <!-- 装饰引用线 -->
      <div class="decorative-quote"></div>

    <!-- 底部信息 -->
    <div class="card-footer">
      <div class="card-meta">
        <!-- 字数 -->
        <span class="meta-item">
          <svg class="meta-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
          </svg>
          {{ formatWordCount(novel.wordCount ?? novel.word_count) }}
        </span>

        <!-- 点赞数 -->
        <span class="meta-item meta-likes">
          <svg class="meta-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
          </svg>
          {{ formatLikes(novel.likes) }}
        </span>
      </div>

      <!-- 阅读按钮 -->
        <span class="read-btn">阅读</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

const props = defineProps({
  novel: {
    type: Object,
    required: true
  },
  showDescription: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'normal', // 'small', 'normal', 'large', 'featured'
    validator: (value) => ['small', 'normal', 'large', 'featured'].includes(value)
  }
})

const emit = defineEmits(['click', 'read', 'add-shelf'])
const router = useRouter()

// 获取主题信息
const { currentThemeConfig } = useTheme()

// 卡片尺寸类
const cardSizeClass = computed(() => {
  return `card-size-${props.size}`
})

// 点击事件处理
function handleClick() {
  emit('click', props.novel)
  // 跳转到阅读页
  router.push(`/reading/${props.novel.id}`)
}

// 格式化字数
function formatWordCount(count) {
  const value = Number(count)
  if (!Number.isFinite(value) || value <= 0) return '0字'
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万字`
  }
  return `${value}字`
}

// 格式化点赞数
function formatLikes(likes) {
  const value = Number(likes)
  if (!Number.isFinite(value) || value < 0) return '0'
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}w`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return value
}

// 获取发布时间
function getPublishTime() {
  // 模拟数据，实际应该从 novel.publishTime 计算
  const times = ['3天前', '5天前', '1周前', '2周前']
  return times[Math.floor(Math.random() * times.length)]
}

// 获取封面渐变 - 使用主题配置
function getCoverGradient() {
  // 优先使用主题配置的封面渐变
  const themeConfig = currentThemeConfig.value
  if (themeConfig && themeConfig.coverGradient) {
    return {
      background: themeConfig.coverGradient,
      transition: 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
  
  // 如果没有配置，使用CSS变量（从主题系统获取）
  return {
    background: 'var(--color-cover-gradient, var(--color-bg-gradient))',
    transition: 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  }
}

// 获取分类样式（低饱和度）
function getCategoryStyle() {
  const categories = {
    '都市言情': { bg: 'rgba(217, 84, 104, 0.08)', color: 'rgba(217, 84, 104, 0.85)' },
    '古风穿越': { bg: 'rgba(156, 120, 180, 0.08)', color: 'rgba(156, 120, 180, 0.85)' },
    '悬疑推理': { bg: 'rgba(100, 100, 120, 0.08)', color: 'rgba(100, 100, 120, 0.85)' },
    '治愈系': { bg: 'rgba(130, 170, 140, 0.08)', color: 'rgba(130, 170, 140, 0.85)' },
    '玄幻': { bg: 'rgba(140, 120, 200, 0.08)', color: 'rgba(140, 120, 200, 0.85)' },
    '言情': { bg: 'rgba(217, 84, 104, 0.08)', color: 'rgba(217, 84, 104, 0.85)' },
    '武侠': { bg: 'rgba(180, 140, 100, 0.08)', color: 'rgba(180, 140, 100, 0.85)' },
    '科幻': { bg: 'rgba(100, 140, 180, 0.08)', color: 'rgba(100, 140, 180, 0.85)' },
    '历史': { bg: 'rgba(180, 150, 110, 0.08)', color: 'rgba(180, 150, 110, 0.85)' },
    '游戏': { bg: 'rgba(140, 140, 200, 0.08)', color: 'rgba(140, 140, 200, 0.85)' }
  }
  
  const category = props.novel.category || '都市言情'
  const style = categories[category] || categories['都市言情']
  
  return {
    backgroundColor: style.bg,
    color: style.color
  }
}
</script>

<style scoped>
/* ===== 时尚杂志风格卡片 ===== */
.novel-card.magazine-style {
  position: relative;
  background-color: var(--color-bg-card);
  border-radius: 1.25rem;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* 关键：让卡片填充整个网格区域 */
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.novel-card.magazine-style:hover {
  transform: translateY(-6px);
  box-shadow: 
    0 12px 24px rgba(0, 0, 0, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.04);
}

/* 封面渐变区域 - 更紧凑的高度 */
.card-cover {
  position: relative;
  width: 100%;
  height: 40px;
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--color-cover-gradient, var(--color-bg-gradient)); /* 默认使用主题封面渐变 */
}

.novel-card.magazine-style:hover .card-cover {
  height: 45px;
}

/* 纹理层 - 添加噪点质感 */
.cover-texture {
  position: absolute;
  inset: 0;
  opacity: 0.4;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* 几何装饰层 - 模拟摄影构图元素 */
.cover-shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.15;
  animation: float 20s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  right: -50px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.5), transparent);
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  bottom: -30px;
  left: 20%;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.1), transparent);
  animation-delay: -7s;
}

.shape-3 {
  width: 180px;
  height: 180px;
  top: 50%;
  left: -60px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(20px, -20px) scale(1.1);
  }
  66% {
    transform: translate(-15px, 15px) scale(0.9);
  }
}

/* 封面叠加层（增加深度感和对比度） */
.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.02) 0%,
    rgba(0, 0, 0, 0.05) 100%
  );
  pointer-events: none;
  mix-blend-mode: multiply;
}

/* 内容区域 - 大量留白 */
.card-content {
  position: relative;
  padding: 1.5rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
  flex-shrink: 0;
}

.category-tag {
  padding: 0.25rem 0.625rem;
  font-size: 0.625rem;
  border-radius: 9999px;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.publish-time {
  font-size: 0.625rem;
  color: var(--color-text-muted);
  opacity: 0.65;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* 卡片标题 - 杂志式大标题 */
.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.375rem;
  line-height: 1.35;
  letter-spacing: -0.02em;
  flex-shrink: 0;
  
  /* 限制行数 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 作者 - 细线体 */
.card-author {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.625rem;
  font-weight: 400;
  letter-spacing: 0.01em;
  opacity: 0.8;
  flex-shrink: 0;
}

/* 卡片描述 - 优雅段落 */
.card-description {
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.6;
  margin-bottom: 0.875rem;
  letter-spacing: 0.01em;
  opacity: 0.85;
  flex: 1;
  
  /* 限制行数，保持留白 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 装饰引用线 - 杂志元素 */
.decorative-quote {
  width: 30px;
  height: 1.5px;
  background: linear-gradient(
    90deg,
    var(--color-primary),
    transparent
  );
  margin-bottom: 0.75rem;
  opacity: 0.4;
  flex-shrink: 0;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-top: auto;
  font-size: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  color: var(--color-text-muted);
  opacity: 0.7;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
}

.meta-icon {
  width: 0.875rem;
  height: 0.875rem;
  margin-right: 0.375rem;
  opacity: 0.7;
}

.meta-likes {
  color: var(--color-primary);
  opacity: 0.8;
}

.read-btn {
  font-weight: 500;
  font-size: 0.8125rem;
  color: var(--color-text-primary);
  padding: 0.5rem 1.125rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
}

.novel-card.magazine-style:hover .read-btn {
  background: rgba(217, 84, 104, 0.08);
  color: var(--color-primary);
}

/* ===== 卡片尺寸变体 ===== */

/* 小卡片 - 紧凑型 */
.card-size-small .card-cover {
  height: 35px;
}

.card-size-small .card-content {
  padding: 1.5rem 1.25rem 1.25rem;
}

.card-size-small .card-title {
  font-size: 1.125rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.card-size-small .card-description {
  -webkit-line-clamp: 2;
  line-clamp: 2;
  margin-bottom: 1rem;
}

/* 正常卡片（默认） */
.card-size-normal .card-cover {
  height: 40px;
}

/* 大卡片 */
.card-size-large .card-cover {
  height: 50px;
}

.card-size-large .card-content {
  padding: 2.5rem 2rem 1.75rem;
}

.card-size-large .card-title {
  font-size: 1.875rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.card-size-large .card-description {
  font-size: 0.9375rem;
  line-height: 1.9;
  -webkit-line-clamp: 4;
  line-clamp: 4;
}

/* 特色卡片 - 巨大尺寸 */
.card-size-featured .card-cover {
  height: 60px;
}

.card-size-featured .card-content {
  padding: 3rem 2.5rem 2rem;
}

.card-size-featured .card-title {
  font-size: 2.25rem;
  margin-bottom: 0.75rem;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.card-size-featured .card-description {
  font-size: 1rem;
  line-height: 2;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  margin-bottom: 2rem;
}

/* ===== 深色模式优化 ===== */
@media (prefers-color-scheme: dark) {
  .novel-card.magazine-style {
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.3),
      0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .novel-card.magazine-style:hover {
    box-shadow: 
      0 12px 24px rgba(0, 0, 0, 0.4),
      0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .cover-overlay {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.02) 0%,
      rgba(255, 255, 255, 0.04) 100%
    );
  }
  
  .card-footer {
    border-top-color: rgba(255, 255, 255, 0.06);
  }
  
  .read-btn {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
  }
  
  .novel-card.magazine-style:hover .read-btn {
    background: rgba(217, 84, 104, 0.15);
  }
}

/* ===== 卡片尺寸适配（智能内容调整）===== */

/* 小卡片 - 2行高度，紧凑布局 */
.card-size-small .card-content {
  padding: 1rem 1rem 0.875rem;
}

.card-size-small .card-header {
  margin-bottom: 0.5rem;
}

.card-size-small .card-title {
  font-size: 0.9375rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  margin-bottom: 0.25rem;
}

.card-size-small .card-author {
  font-size: 0.6875rem;
  margin-bottom: 0.375rem;
}

.card-size-small .card-description {
  font-size: 0.75rem;
  line-height: 1.5;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  margin-bottom: 0.5rem;
}

.card-size-small .decorative-quote {
  display: none;
}

.card-size-small .card-footer {
  font-size: 0.6875rem;
  padding-top: 0.5rem;
}

.card-size-small .meta-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.card-size-small .read-btn {
  font-size: 0.6875rem;
  padding: 0.25rem 0.625rem;
}

/* 正常卡片 - 3行高度，标准布局 */
.card-size-normal .card-content {
  padding: 1.5rem 1.25rem 1.25rem;
}

.card-size-normal .card-title {
  font-size: 1.125rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.card-size-normal .card-description {
  font-size: 0.8125rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

/* 大卡片 - 4行高度，宽敞布局 */
.card-size-large .card-content {
  padding: 1.75rem 1.5rem 1.5rem;
}

.card-size-large .card-header {
  margin-bottom: 1rem;
}

.card-size-large .card-title {
  font-size: 1.375rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.card-size-large .card-author {
  font-size: 0.875rem;
  margin-bottom: 0.875rem;
}

.card-size-large .card-description {
  font-size: 0.9375rem;
  line-height: 1.7;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  margin-bottom: 1.25rem;
}

.card-size-large .decorative-quote {
  width: 50px;
  height: 2px;
  margin-bottom: 1rem;
}

.card-size-large .card-footer {
  font-size: 0.875rem;
  padding-top: 1.25rem;
}

/* 特色卡片 - 2列2行，横向强调 */
.card-size-featured .card-cover {
  height: 50px;
}

.card-size-featured .card-content {
  padding: 1.75rem 2rem 1.5rem;
}

.card-size-featured .card-header {
  margin-bottom: 0.875rem;
}

.card-size-featured .card-title {
  font-size: 1.5rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  margin-bottom: 0.625rem;
  font-weight: 700;
  line-height: 1.35;
}

.card-size-featured .card-author {
  font-size: 0.9375rem;
  margin-bottom: 1rem;
}

.card-size-featured .card-description {
  font-size: 1rem;
  line-height: 1.75;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  margin-bottom: 1.25rem;
}

.card-size-featured .decorative-quote {
  width: 60px;
  height: 2.5px;
  margin-bottom: 1.125rem;
}

.card-size-featured .card-footer {
  font-size: 0.9375rem;
  padding-top: 1.25rem;
}

.card-size-featured .category-tag {
  padding: 0.375rem 0.875rem;
  font-size: 0.6875rem;
}

/* ===== 移动端优化 ===== */
@media (max-width: 640px) {
  .novel-card.magazine-style {
    border-radius: 0.875rem;  /* 减小圆角 */
  }
  
  .card-cover {
    height: 25px;  /* 减小封面高度从 35px 到 25px */
  }
  
  .novel-card.magazine-style:hover .card-cover {
    height: 25px; /* 移动端不改变高度 */
  }

  .card-content {
    padding: 1rem 1rem 0.875rem;  /* 减小内边距 */
  }

  .card-header {
    margin-bottom: 0.5rem;  /* 减小间距 */
    gap: 0.375rem;
  }

  .card-title {
    font-size: 1rem;  /* 减小字体从 1.125rem 到 1rem */
    margin-bottom: 0.25rem;
    line-height: 1.4;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  
  .card-author {
    font-size: 0.6875rem;  /* 减小字体 */
    margin-bottom: 0.5rem;
  }

  .card-description {
    font-size: 0.75rem;  /* 减小字体从 0.8125rem 到 0.75rem */
    line-height: 1.55;  /* 减小行高 */
    margin-bottom: 0.625rem;  /* 减小间距 */
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  
  .decorative-quote {
    width: 24px;  /* 减小宽度 */
    height: 1px;  /* 减小高度 */
    margin-bottom: 0.5rem;  /* 减小间距 */
  }

  .card-footer {
    font-size: 0.6875rem;  /* 减小字体 */
    padding-top: 0.625rem;  /* 减小间距 */
  }
  
  .card-meta {
    gap: 0.75rem;  /* 减小间距 */
  }
  
  .meta-icon {
    width: 0.8125rem;  /* 减小图标 */
    height: 0.8125rem;
  }
  
  .read-btn {
    font-size: 0.6875rem;  /* 减小字体 */
    padding: 0.375rem 0.75rem;  /* 减小内边距 */
  }
  
  /* 移动端触摸反馈 */
  .novel-card.magazine-style:active {
    transform: scale(0.98);
  }
  
  /* 移动端卡片尺寸统一 */
  .card-size-small .card-cover,
  .card-size-normal .card-cover,
  .card-size-large .card-cover,
  .card-size-featured .card-cover {
    height: 25px;
  }
  
  .card-size-small .card-content,
  .card-size-normal .card-content,
  .card-size-large .card-content,
  .card-size-featured .card-content {
    padding: 1rem 1rem 0.875rem;
  }
  
  .card-size-large .card-title,
  .card-size-featured .card-title {
    font-size: 1.125rem;  /* 大卡片稍大一点 */
  }
  
  /* 小卡片更紧凑 */
  .card-size-small .card-content {
    padding: 0.875rem 0.875rem 0.75rem;
  }
  
  .card-size-small .card-header {
    margin-bottom: 0.375rem;
  }
  
  .card-size-small .card-title {
    font-size: 0.9375rem;
    margin-bottom: 0.25rem;
  }
  
  .card-size-small .card-description {
    font-size: 0.6875rem;
    line-height: 1.5;
    margin-bottom: 0.5rem;
    -webkit-line-clamp: 1;  /* 小卡片只显示1行描述 */
    line-clamp: 1;
  }
  
  .card-size-small .card-footer {
    padding-top: 0.5rem;
  }
}
</style>
