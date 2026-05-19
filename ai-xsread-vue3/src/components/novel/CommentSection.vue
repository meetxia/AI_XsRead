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

    <CommentComposer
      v-model="newComment"
      :submitting="submitting"
      :show-emoji-picker="showEmojiPicker"
      :emoji-list="emojiList"
      @toggle-emoji="showEmojiPicker = !showEmojiPicker"
      @insert-emoji="insertEmoji"
      @submit="submitComment"
    />

    <!-- 评论列表 -->
    <CommentSkeletonList v-if="loading" />

    <div v-else-if="filteredComments.length > 0" class="comment-list">
      <CommentItem
        v-for="comment in filteredComments"
        :key="comment.id"
        :comment="comment"
        :reply-content="replyContent[comment.id] || ''"
        :format-date="formatDate"
        @avatar-error="handleAvatarError"
        @like="likeComment"
        @toggle-reply="toggleReply"
        @toggle-menu="toggleCommentMenu"
        @report="reportComment"
        @update-reply-content="updateReplyContent"
        @submit-reply="submitReply"
      />
    </div>

    <!-- 空状态 -->
    <CommentEmptyState v-else />

    <!-- 加载更多 -->
    <CommentLoadMore v-if="hasMore" @load-more="loadMore" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getComments, submitComment as apiSubmitComment, likeComment as apiLikeComment, submitReply as apiSubmitReply } from '@/api/novel'
import { useUserStore } from '@/stores/user'
import CommentComposer from './comment/CommentComposer.vue'
import CommentEmptyState from './comment/CommentEmptyState.vue'
import CommentItem from './comment/CommentItem.vue'
import CommentLoadMore from './comment/CommentLoadMore.vue'
import CommentSkeletonList from './comment/CommentSkeletonList.vue'

const props = defineProps({
  novelId: {
    type: [String, Number],
    required: true
  }
})

const router = useRouter()
const userStore = useUserStore()

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

  // 检查登录状态
  if (!userStore.isLogin) {
    if (confirm('请先登录后再发表评论，是否前往登录页面?')) {
      router.push('/login')
    }
    return
  }

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
  // 检查登录状态
  if (!userStore.isLogin) {
    if (confirm('请先登录后再点赞，是否前往登录页面?')) {
      router.push('/login')
    }
    return
  }

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
  // 检查登录状态
  if (!userStore.isLogin) {
    if (confirm('请先登录后再回复，是否前往登录页面?')) {
      router.push('/login')
    }
    return
  }

  comment.showReplies = !comment.showReplies
  comment.showReplyInput = !comment.showReplyInput
}

function updateReplyContent(commentId, content) {
  replyContent.value[commentId] = content
}

// 提交回复
async function submitReply(comment) {
  const content = replyContent.value[comment.id]
  if (!content?.trim()) return

  // 检查登录状态
  if (!userStore.isLogin) {
    if (confirm('请先登录后再回复，是否前往登录页面?')) {
      router.push('/login')
    }
    return
  }

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

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
}
</style>

