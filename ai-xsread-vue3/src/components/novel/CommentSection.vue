<template>
  <div class="comment-section">
    <!-- 评论区标题 -->
    <div class="comment-header">
      <h3 class="comment-title">
        共 {{ totalComments }} 条评论
      </h3>

      <!-- 筛选和排序 -->
      <div class="comment-filters">
        <button
          @click="filterType = 'all'"
          :class="{ 'active': filterType === 'all' }"
          class="filter-btn"
        >
          全部评论
        </button>
        <button
          @click="sortType = 'time'"
          :class="{ 'active': sortType === 'time' }"
          class="filter-btn"
        >
          最新
        </button>
      </div>
    </div>

    <!-- 发表评论 -->
    <div class="comment-input-section">
      <textarea
        v-model="newComment"
        placeholder="说说你的看法..."
        rows="4"
        class="comment-textarea"
        :disabled="submitting"
      ></textarea>

      <div class="comment-input-footer">
        <div class="comment-tools">
          <!-- 表情 -->
          <div class="tool-item">
            <button @click="showEmojiPicker = !showEmojiPicker" class="tool-btn" title="表情">
              😊
            </button>

            <!-- 表情选择器 -->
            <div v-show="showEmojiPicker" class="emoji-picker" @click.stop>
              <div class="emoji-grid">
                <button
                  v-for="emoji in emojiList"
                  :key="emoji"
                  @click="insertEmoji(emoji)"
                  class="emoji-item"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="comment-submit-area">
          <span class="char-count">{{ newComment.length }}/500</span>
          <button
            @click="submitComment"
            :disabled="!newComment.trim() || submitting || newComment.length > 500"
            class="submit-btn"
          >
            {{ submitting ? '发表中...' : '发表评论' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div v-if="loading" class="comment-list">
      <div v-for="i in 3" :key="i" class="comment-skeleton">
        <div class="skeleton-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-info">
            <div class="skeleton-name"></div>
            <div class="skeleton-time"></div>
          </div>
        </div>
        <div class="skeleton-content"></div>
      </div>
    </div>

    <div v-else-if="filteredComments.length > 0" class="comment-list">
      <div
        v-for="comment in filteredComments"
        :key="comment.id"
        class="comment-item"
      >
        <!-- 评论头部 -->
        <div class="comment-header-row">
          <div class="comment-user-info">
            <img
              :src="comment.user?.avatar || '/default-avatar.png'"
              :alt="comment.user?.username"
              class="comment-avatar"
              @error="handleAvatarError"
            />
            <div class="comment-user-details">
              <div class="comment-username-row">
                <span class="comment-username">{{ comment.user?.username }}</span>
                <span v-if="comment.isAuthor" class="author-badge">作者</span>
              </div>
              <div class="comment-meta">
                <StarRating
                  v-if="comment.rating"
                  :rating="comment.rating"
                  :size="12"
                  :readonly="true"
                />
                <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                <span v-if="comment.location" class="comment-location">{{ comment.location }}</span>
              </div>
            </div>
          </div>

          <!-- 更多操作按钮 -->
          <div class="comment-more">
            <button class="more-btn" @click="toggleCommentMenu(comment)">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>

            <!-- 更多操作菜单 -->
            <div v-if="comment.showMenu" class="comment-menu">
              <button @click="reportComment(comment)" class="menu-item">举报</button>
            </div>
          </div>
        </div>

        <!-- 评论内容 -->
        <div class="comment-content">
          {{ comment.content }}
        </div>

        <!-- 评论图片 -->
        <div v-if="comment.images && comment.images.length > 0" class="comment-images">
          <img
            v-for="(img, index) in comment.images"
            :key="index"
            :src="img"
            @click="previewImage(img)"
            class="comment-image"
          />
        </div>

        <!-- 评论底部操作 -->
        <div class="comment-actions">
          <button
            @click="likeComment(comment)"
            class="action-btn"
            :class="{ 'liked': comment.isLiked }"
          >
            <svg class="action-icon" :fill="comment.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span class="action-text">{{ comment.likes || '' }}</span>
          </button>

          <button @click="toggleReply(comment)" class="action-btn">
            <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span class="action-text">{{ comment.replies?.length > 0 ? comment.replies.length : '回复' }}</span>
          </button>
        </div>

        <!-- 回复列表 -->
        <div v-if="comment.showReplies && comment.replies && comment.replies.length > 0" class="reply-list">
          <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
            <div class="reply-header">
              <img
                :src="reply.user?.avatar || '/default-avatar.png'"
                :alt="reply.user?.username"
                class="reply-avatar"
                @error="handleAvatarError"
              />
              <div class="reply-info">
                <span class="reply-username">{{ reply.user?.username }}</span>
                <template v-if="reply.replyTo?.username">
                  <span class="reply-arrow">回复</span>
                  <span class="reply-target">@{{ reply.replyTo.username }}</span>
                </template>
              </div>
              <span class="reply-time">{{ formatDate(reply.createdAt) }}</span>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
          </div>

          <!-- 展开/收起回复 -->
          <button
            v-if="comment.replies.length > 1"
            @click="comment.showReplies = false"
            class="collapse-replies-btn"
          >
            收起 {{ comment.replies.length }} 条回复
          </button>
        </div>

        <!-- 回复输入框 -->
        <div v-if="comment.showReplyInput" class="reply-input-wrapper">
          <textarea
            v-model="replyContent[comment.id]"
            :placeholder="`回复 @${comment.user?.username}`"
            rows="2"
            class="reply-textarea"
          ></textarea>
          <div class="reply-input-actions">
            <button @click="comment.showReplyInput = false" class="cancel-reply-btn">取消</button>
            <button
              @click="submitReply(comment)"
              :disabled="!replyContent[comment.id]?.trim()"
              class="submit-reply-btn"
            >
              回复
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p class="empty-text">暂无评论，快来发表第一条评论吧~</p>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more-wrapper">
      <button @click="loadMore" class="load-more-btn">加载更多评论</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { getComments, submitComment as apiSubmitComment, likeComment as apiLikeComment, submitReply as apiSubmitReply } from '@/api/novel'

const props = defineProps({
  novelId: {
    type: [String, Number],
    required: true
  }
})

const comments = ref([])
const loading = ref(true)
const submitting = ref(false)
const newComment = ref('')
const sortType = ref('time')
const filterType = ref('all')
const page = ref(1)
const pageSize = ref(10)
const totalComments = ref(0)
const replyContent = ref({})
const showEmojiPicker = ref(false)

// 常用表情列表
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
  '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
  '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
  '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
  '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵',
  '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐',
  '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳',
  '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭',
  '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱',
  '👍', '👎', '👏', '🙌', '👌', '✌️', '🤞', '🤝',
  '🙏', '💪', '❤️', '💔', '💕', '💖', '💗', '💓'
]

// 计算过滤后的评论
const filteredComments = computed(() => {
  let result = [...comments.value]

  // 筛选
  if (filterType.value === 'positive') {
    result = result.filter(c => c.rating >= 4)
  } else if (filterType.value === 'negative') {
    result = result.filter(c => c.rating <= 2)
  }

  // 排序（与后端键保持一致：time/hot）
  if (sortType.value === 'time') {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else if (sortType.value === 'hot') {
    result.sort((a, b) => b.likes - a.likes)
  }

  return result
})

// 是否还有更多
const hasMore = computed(() => {
  return comments.value.length < totalComments.value
})

// 加载评论
async function loadComments() {
  try {
    loading.value = true
    const res = await getComments(props.novelId, {
      page: page.value,
      pageSize: pageSize.value,
      sort: sortType.value
    })

    if (page.value === 1) {
      comments.value = res.data.list || res.data
    } else {
      comments.value = [...comments.value, ...(res.data.list || res.data)]
    }

    totalComments.value = res.data.total || comments.value.length

    // 初始化评论状态
    comments.value.forEach(comment => {
      comment.showReplies = false
      comment.showReplyInput = false
      comment.isLiked = false
    })
  } catch (err) {
    console.error('加载评论失败:', err)
    // 使用模拟数据
    generateMockComments()
  } finally {
    loading.value = false
  }
}

// 生成模拟评论
function generateMockComments() {
  const mockComments = [
    {
      id: 1,
      userName: '书虫小王',
      userAvatar: '',
      content: '这本书真的太好看了！剧情紧凑，人物刻画生动，强烈推荐！',
      rating: 5,
      likes: 128,
      replies: [],
      createdAt: new Date(Date.now() - 86400000),
      location: '浙江',
      showReplies: false,
      showReplyInput: false,
      showMenu: false,
      isLiked: false
    },
    {
      id: 2,
      userName: '夜读者',
      userAvatar: '',
      content: '前半部分不错，后面有点拖沓，不过整体还是值得一读的。',
      rating: 3,
      likes: 45,
      replies: [
        {
          id: 101,
          userName: '作者',
          userAvatar: '',
          content: '感谢您的反馈，后续会注意节奏把控！',
          createdAt: new Date(Date.now() - 43200000)
        }
      ],
      createdAt: new Date(Date.now() - 172800000),
      location: '河北',
      showReplies: false,
      showReplyInput: false,
      showMenu: false,
      isLiked: false,
      isAuthor: false
    },
    {
      id: 3,
      userName: '爱读书的猫',
      userAvatar: '',
      content: '世界观设定很有创意，期待后续更新！',
      rating: 4,
      likes: 89,
      replies: [],
      createdAt: new Date(Date.now() - 259200000),
      location: '湖南',
      showReplies: false,
      showReplyInput: false,
      showMenu: false,
      isLiked: false
    }
  ]

  comments.value = mockComments
  totalComments.value = 156
}

// 插入表情
function insertEmoji(emoji) {
  newComment.value += emoji
  showEmojiPicker.value = false
}

// 提交评论
async function submitComment() {
  if (!newComment.value.trim()) return

  try {
    submitting.value = true
    await apiSubmitComment(props.novelId, {
      content: newComment.value
    })

    // 清空输入
    newComment.value = ''

    // 重新加载评论
    page.value = 1
    await loadComments()

    // 不需要alert，直接显示
  } catch (err) {
    console.error('发表评论失败:', err)
    alert('评论发表失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 点赞评论
async function likeComment(comment) {
  try {
    await apiLikeComment(comment.id)
    comment.isLiked = !comment.isLiked
    if (comment.isLiked) {
      comment.likes++
    } else {
      comment.likes--
    }
  } catch (err) {
    console.error('点赞失败:', err)
  }
}

// 切换回复显示
function toggleReply(comment) {
  comment.showReplies = !comment.showReplies
  comment.showReplyInput = !comment.showReplyInput
}

// 提交回复
async function submitReply(comment) {
  const content = replyContent.value[comment.id]
  if (!content?.trim()) return

  try {
    const response = await apiSubmitReply(comment.id, {
      content: content,
      replyToUser: comment.user?.username
    })

    // 直接添加回复到当前评论，无需重新加载
    if (!comment.replies) {
      comment.replies = []
    }
    comment.replies.push(response.data)
    comment.replyCount = (comment.replyCount || 0) + 1

    // 清空输入并关闭回复框
    replyContent.value[comment.id] = ''
    comment.showReplyInput = false
    comment.showReplies = true

  } catch (err) {
    console.error('回复失败:', err)
    alert('回复失败，请稍后重试')
  }
}

// 切换评论菜单
function toggleCommentMenu(comment) {
  // 关闭其他评论的菜单
  comments.value.forEach(c => {
    if (c.id !== comment.id) {
      c.showMenu = false
    }
  })
  // 切换当前评论的菜单
  comment.showMenu = !comment.showMenu
}

// 举报评论
function reportComment(comment) {
  comment.showMenu = false
  if (confirm('确定要举报这条评论吗？')) {
    alert('举报成功，我们会尽快处理')
  }
}

// 加载更多
function loadMore() {
  page.value++
  loadComments()
}

// 格式化日期
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return `${d.getMonth() + 1}-${d.getDate()}`
}

// 头像加载失败处理
function handleAvatarError(event) {
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyNCIgZmlsbD0iI0ZGQkFBQyIvPgogIDxwYXRoIGQ9Ik0yNCAyNEMxOS41ODE3IDI0IDE2IDIwLjQxODMgMTYgMTZDMTYgMTEuNTgxNyAxOS41ODE3IDggMjQgOEMyOC40MTgzIDggMzIgMTEuNTgxNyAzMiAxNkMzMiAyMC40MTgzIDI4LjQxODMgMjQgMjQgMjRaTTI0IDI2QzMwLjYyNzQgMjYgMzYgMjguNjg2MyAzNiAzMlYzNkgxMlYzMkMxMiAyOC42ODYzIDE3LjM3MjYgMjYgMjQgMjZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='
}

// 监听排序和筛选变化
watch([sortType, filterType], () => {
  page.value = 1
  loadComments()
})

// 点击外部关闭表情选择器
function handleClickOutside(event) {
  const emojiPicker = document.querySelector('.emoji-picker')
  if (emojiPicker && !emojiPicker.contains(event.target)) {
    showEmojiPicker.value = false
  }
}

onMounted(() => {
  loadComments()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 评论区整体样式 */
.comment-section {
  padding: 1rem;
  width: 100%;
}

/* PC端居中布局，与正文对齐 */
@media (min-width: 768px) {
  .comment-section {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem 2rem;
  }
}

/* 评论区标题 */
.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.comment-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.comment-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
}

.filter-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #d95468 0%, #ed7654 100%);
  border-color: transparent;
}

/* 评论输入区 */
.comment-input-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}

.comment-textarea {
  width: 100%;
  padding: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  resize: none;
  outline: none;
}

.comment-textarea::placeholder {
  color: var(--color-text-muted);
}

.comment-input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.comment-tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tool-item {
  position: relative;
}

.tool-btn {
  padding: 0.375rem 0.5rem;
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.emoji-picker {
  position: absolute;
  bottom: 3rem;
  left: 0;
  z-index: 50;
  width: 16rem;
  padding: 0.75rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 12.5rem;
  overflow-y: auto;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.25rem;
}

.emoji-item {
  padding: 0.25rem;
  font-size: 1.5rem;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-item:hover {
  background: var(--color-bg-hover);
}

.comment-submit-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.char-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.submit-btn {
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #d95468 0%, #ed7654 100%);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c74458 0%, #dc6544 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(217, 84, 104, 0.3);
}

.submit-btn:disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 骨架屏 */
.comment-skeleton {
  padding: 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.skeleton-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-bg-hover);
  border-radius: 50%;
}

.skeleton-info {
  flex: 1;
}

.skeleton-name {
  width: 6rem;
  height: 1rem;
  background: var(--color-bg-hover);
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.skeleton-time {
  width: 8rem;
  height: 0.75rem;
  background: var(--color-bg-hover);
  border-radius: 0.25rem;
}

.skeleton-content {
  width: 100%;
  height: 4rem;
  background: var(--color-bg-hover);
  border-radius: 0.25rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 评论项 */
.comment-item {
  padding: 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.comment-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 评论头部 */
.comment-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.comment-user-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.comment-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-user-details {
  flex: 1;
  min-width: 0;
}

.comment-username-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.comment-username {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.author-badge {
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  color: #fff;
  background: linear-gradient(135deg, #d95468 0%, #ed7654 100%);
  border-radius: 0.75rem;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.comment-time {
  color: var(--color-text-muted);
}

.comment-location {
  color: var(--color-text-muted);
}

/* 更多操作 */
.comment-more {
  position: relative;
  flex-shrink: 0;
}

.more-btn {
  padding: 0.25rem;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.more-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.comment-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 10;
  min-width: 6rem;
  margin-top: 0.25rem;
  padding: 0.25rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.menu-item {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: var(--color-bg-hover);
}

/* 评论内容 */
.comment-content {
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 评论图片 */
.comment-images {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.comment-image {
  width: 6rem;
  height: 6rem;
  object-fit: cover;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.comment-image:hover {
  opacity: 0.8;
  transform: scale(1.02);
}

/* 评论操作 */
.comment-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.action-btn.liked {
  color: #ff4d4f;
}

.action-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.action-text {
  font-size: 0.8125rem;
}

/* 回复列表 */
.reply-list {
  margin-top: 0.75rem;
  margin-left: 2.5rem;
  padding: 0.75rem;
  background: var(--color-bg-secondary);
  border-radius: 0.5rem;
}

.reply-item {
  padding: 0.5rem 0;
}

.reply-item:not(:last-child) {
  border-bottom: 1px solid var(--color-border);
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.reply-avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.reply-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.reply-username {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.reply-arrow {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.reply-target {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #d95468;
}

.reply-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.reply-content {
  margin-left: 2rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.collapse-replies-btn {
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.collapse-replies-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

/* 回复输入框 */
.reply-input-wrapper {
  margin-top: 0.75rem;
  margin-left: 2.5rem;
  padding: 0.75rem;
  background: var(--color-bg-secondary);
  border-radius: 0.5rem;
}

.reply-textarea {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-primary);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  resize: none;
  outline: none;
  transition: all 0.2s;
}

.reply-textarea:focus {
  border-color: #d95468;
}

.reply-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.cancel-reply-btn {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-reply-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
}

.submit-reply-btn {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #d95468 0%, #ed7654 100%);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-reply-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c74458 0%, #dc6544 100%);
  transform: translateY(-1px);
}

.submit-reply-btn:disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

/* 空状态 */
.empty-state {
  padding: 5rem 0;
  text-align: center;
}

.empty-icon {
  margin-bottom: 1rem;
  color: var(--color-text-muted);
  opacity: 0.5;
}

.empty-icon svg {
  margin: 0 auto;
}

.empty-text {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

/* 加载更多 */
.load-more-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.load-more-btn {
  padding: 0.625rem 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover {
  color: #d95468;
  border-color: #d95468;
  background: rgba(217, 84, 104, 0.05);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .comment-section {
    padding: 0.5rem 0;
  }

  .comment-header {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
  }

  .comment-title {
    font-size: 0.875rem;
  }

  .filter-btn {
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
  }

  /* 移动端评论输入区优化 */
  .comment-input-section {
    padding: 1rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 250, 0.98) 100%);
    border: 2px solid rgba(217, 84, 104, 0.15);
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(217, 84, 104, 0.1);
  }

  .comment-textarea {
    font-size: 0.9375rem;
    min-height: 120px;
    padding: 0.75rem;
    line-height: 1.6;
  }

  /* 工具栏按钮优化 - 更大的触摸区域 */
  .tool-btn {
    font-size: 1.25rem;
    padding: 0.5rem;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .tool-btn:active {
    background: rgba(217, 84, 104, 0.1);
    transform: scale(0.95);
  }

  /* 提交按钮优化 - 更大更醒目 */
  .submit-btn {
    padding: 0.625rem 1.5rem;
    font-size: 0.9375rem;
    min-height: 44px;
    border-radius: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  /* 字数统计优化 */
  .char-count {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  /* 底部工具栏优化 */
  .comment-input-footer {
    margin-top: 1rem;
    padding-top: 1rem;
  }

  .comment-tools {
    gap: 0.75rem;
  }

  .comment-item {
    padding: 0.75rem;
  }

  .comment-avatar {
    width: 2rem;
    height: 2rem;
  }

  .comment-username {
    font-size: 0.875rem;
  }

  .comment-meta {
    font-size: 0.6875rem;
  }

  .comment-content {
    font-size: 0.875rem;
  }

  .comment-images {
    gap: 0.375rem;
  }

  .comment-image {
    width: 5rem;
    height: 5rem;
  }

  .action-btn {
    gap: 0.25rem;
    padding: 0.125rem 0.375rem;
  }

  .action-icon {
    width: 1rem;
    height: 1rem;
  }

  .action-text {
    font-size: 0.75rem;
  }

  .reply-list {
    margin-left: 2rem;
    padding: 0.5rem;
  }

  .reply-avatar {
    width: 1.25rem;
    height: 1.25rem;
  }

  .reply-username,
  .reply-target {
    font-size: 0.75rem;
  }

  .reply-time {
    font-size: 0.6875rem;
  }

  .reply-content {
    margin-left: 1.75rem;
    font-size: 0.8125rem;
  }

  .reply-input-wrapper {
    margin-left: 2rem;
    padding: 0.5rem;
  }

  .empty-state {
    padding: 3rem 0;
  }

  .empty-icon svg {
    width: 4rem;
    height: 4rem;
  }

  .empty-text {
    font-size: 0.875rem;
  }
}

/* 输入框样式 - 粉色调 */
.textarea-themed {
  border: 2px solid rgba(217, 84, 104, 0.2);
  background: rgba(255, 250, 250, 0.5);
  color: var(--color-text-primary);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.textarea-themed:focus {
  border-color: #d95468;
  background: rgba(255, 250, 250, 0.8);
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1);
  outline: none;
}

.dark .textarea-themed {
  background: rgba(40, 40, 40, 0.8);
  border-color: rgba(217, 84, 104, 0.25);
}

.dark .textarea-themed:focus {
  background: rgba(45, 45, 45, 0.9);
  border-color: #ed7654;
}

/* 按钮样式 - 粉色渐变 */
.btn-primary {
  background: linear-gradient(135deg, #d95468 0%, #ed7654 100%);
  color: #fff;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(217, 84, 104, 0.3);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #c74458 0%, #dc6544 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(217, 84, 104, 0.3);
}

.btn-primary:disabled {
  background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%);
  box-shadow: none;
  cursor: not-allowed;
}

.btn-outline {
  color: #d95468;
  border: 2px solid #d95468;
  border-radius: 12px;
  background: transparent;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-outline:hover {
  background: linear-gradient(135deg, rgba(217, 84, 104, 0.1) 0%, rgba(237, 118, 84, 0.1) 100%);
  border-color: #ed7654;
  transform: translateY(-2px);
}

/* 选择器样式 - 粉色调 */
.select-themed {
  border: 2px solid rgba(217, 84, 104, 0.2);
  background: rgba(255, 250, 250, 0.5);
  color: var(--color-text-primary);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.select-themed:focus {
  border-color: #d95468;
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1);
  outline: none;
}

.dark .select-themed {
  background: rgba(40, 40, 40, 0.8);
  border-color: rgba(217, 84, 104, 0.25);
  color: var(--color-text-primary);
}

.dark .select-themed:focus {
  border-color: #ed7654;
}

/* 紧凑化按钮与布局（移动端） */
@media (max-width: 640px) {
  .comment-section .themed-card {
    padding: 0.75rem;
  }
  .comment-section textarea {
    min-height: 110px;
    font-size: 0.875rem;
  }
  .comment-section .btn-primary {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    border-radius: 8px;
  }
}

/* 防止“发表评论”按钮被外部样式影响成方块 */
.comment-section .btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  width: auto;
  height: auto;
}

/* 表情选择器样式 */
.emoji-picker {
  background: white;
  border: 2px solid rgba(217, 84, 104, 0.2);
  box-shadow: 0 4px 16px rgba(217, 84, 104, 0.15);
}

.dark .emoji-picker {
  background: #2d2d2d;
  border-color: rgba(217, 84, 104, 0.3);
}

/* 头像样式 */
.comment-avatar {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border: 2px solid rgba(217, 84, 104, 0.2);
  box-shadow: 0 2px 4px rgba(217, 84, 104, 0.1);
}

.reply-avatar {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border: 2px solid rgba(217, 84, 104, 0.15);
}

@media (max-width: 640px) {
  .comment-avatar {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
  }

  .reply-avatar {
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
  }
}
</style>

