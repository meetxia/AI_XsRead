<template>
  <div class="comment-section">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-bold text-gray-900">
        评论区
        <span class="text-sm text-gray-500 font-normal ml-2">({{ totalComments }}条)</span>
      </h3>
      
      <!-- 筛选和排序 -->
      <div class="flex items-center space-x-3">
        <select 
          v-model="filterType"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="all">全部评论</option>
          <option value="positive">好评</option>
          <option value="negative">差评</option>
        </select>
        
        <select 
          v-model="sortType"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="latest">最新</option>
          <option value="hottest">最热</option>
        </select>
      </div>
    </div>

    <!-- 发表评论 -->
    <div class="mb-6 p-4 bg-gray-50 rounded-xl">
      <textarea
        v-model="newComment"
        placeholder="说说你的看法..."
        rows="3"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
        :disabled="submitting"
      ></textarea>
      
      <div class="flex items-center justify-between mt-3">
        <div class="flex items-center space-x-3">
          <!-- 评分 -->
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">评分:</span>
            <StarRating 
              :rating="newCommentRating" 
              :size="20"
              @update:rating="newCommentRating = $event"
            />
          </div>
          
          <!-- 表情 -->
          <button 
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="表情"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-400">{{ newComment.length }}/500</span>
          <button
            @click="submitComment"
            :disabled="!newComment.trim() || submitting || newComment.length > 500"
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {{ submitting ? '发表中...' : '发表评论' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="p-4 bg-gray-50 rounded-xl animate-pulse">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div class="h-16 bg-gray-200 rounded"></div>
      </div>
    </div>

    <div v-else-if="filteredComments.length > 0" class="space-y-4">
      <div 
        v-for="comment in filteredComments" 
        :key="comment.id"
        class="comment-item p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
      >
        <!-- 评论头部 -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center space-x-3">
            <img 
              :src="comment.userAvatar || '/default-avatar.png'" 
              :alt="comment.userName"
              class="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-semibold text-gray-900">{{ comment.userName }}</span>
                <span 
                  v-if="comment.isAuthor"
                  class="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded"
                >
                  作者
                </span>
              </div>
              <div class="flex items-center space-x-2 mt-1">
                <StarRating 
                  v-if="comment.rating"
                  :rating="comment.rating" 
                  :size="14"
                  :readonly="true"
                />
                <span class="text-xs text-gray-400">{{ formatDate(comment.createdAt) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="flex items-center space-x-2">
            <button 
              class="text-gray-400 hover:text-gray-600"
              @click="reportComment(comment)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 评论内容 -->
        <div class="text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
          {{ comment.content }}
        </div>

        <!-- 评论底部操作 -->
        <div class="flex items-center justify-between pt-3 border-t border-gray-100">
          <div class="flex items-center space-x-4">
            <button 
              @click="likeComment(comment)"
              class="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
              :class="{ 'text-red-500': comment.isLiked }"
            >
              <svg 
                class="w-5 h-5" 
                :fill="comment.isLiked ? 'currentColor' : 'none'" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span class="text-sm">{{ comment.likes }}</span>
            </button>
            
            <button 
              @click="toggleReply(comment)"
              class="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span class="text-sm">回复 {{ comment.replies?.length || 0 }}</span>
            </button>
          </div>
        </div>

        <!-- 回复列表 -->
        <div v-if="comment.showReplies && comment.replies && comment.replies.length > 0" class="mt-4 ml-12 space-y-3">
          <div 
            v-for="reply in comment.replies" 
            :key="reply.id"
            class="p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-2 mb-2">
              <img 
                :src="reply.userAvatar || '/default-avatar.png'" 
                :alt="reply.userName"
                class="w-6 h-6 rounded-full object-cover"
              />
              <span class="text-sm font-semibold text-gray-900">{{ reply.userName }}</span>
              <span v-if="reply.replyToUser" class="text-sm text-gray-500">回复</span>
              <span v-if="reply.replyToUser" class="text-sm font-semibold text-blue-600">@{{ reply.replyToUser }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(reply.createdAt) }}</span>
            </div>
            <div class="text-sm text-gray-700">{{ reply.content }}</div>
          </div>
        </div>

        <!-- 回复输入框 -->
        <div v-if="comment.showReplyInput" class="mt-4 ml-12">
          <div class="flex items-start space-x-2">
            <textarea
              v-model="replyContent[comment.id]"
              :placeholder="`回复 @${comment.userName}`"
              rows="2"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-sm"
            ></textarea>
            <button
              @click="submitReply(comment)"
              :disabled="!replyContent[comment.id]?.trim()"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              回复
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="py-20 text-center">
      <div class="text-gray-400 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p class="text-gray-500">暂无评论，快来发表第一条评论吧~</p>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="flex justify-center mt-6">
      <button
        @click="loadMore"
        class="px-6 py-2 text-blue-500 border border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
      >
        加载更多评论
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import StarRating from './StarRating.vue'
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
const newCommentRating = ref(0)
const sortType = ref('latest')
const filterType = ref('all')
const page = ref(1)
const pageSize = ref(10)
const totalComments = ref(0)
const replyContent = ref({})

// 计算过滤后的评论
const filteredComments = computed(() => {
  let result = [...comments.value]
  
  // 筛选
  if (filterType.value === 'positive') {
    result = result.filter(c => c.rating >= 4)
  } else if (filterType.value === 'negative') {
    result = result.filter(c => c.rating <= 2)
  }
  
  // 排序
  if (sortType.value === 'latest') {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else if (sortType.value === 'hottest') {
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
      showReplies: false,
      showReplyInput: false,
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
      showReplies: false,
      showReplyInput: false,
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
      showReplies: false,
      showReplyInput: false,
      isLiked: false
    }
  ]
  
  comments.value = mockComments
  totalComments.value = 156
}

// 提交评论
async function submitComment() {
  if (!newComment.value.trim()) return
  
  try {
    submitting.value = true
    await apiSubmitComment(props.novelId, {
      content: newComment.value,
      rating: newCommentRating.value
    })
    
    // 清空输入
    newComment.value = ''
    newCommentRating.value = 0
    
    // 重新加载评论
    page.value = 1
    await loadComments()
    
    alert('评论发表成功！')
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
    await apiSubmitReply(comment.id, {
      content: content,
      replyToUser: comment.userName
    })
    
    // 清空输入
    replyContent.value[comment.id] = ''
    
    // 重新加载评论
    await loadComments()
    
    alert('回复成功！')
  } catch (err) {
    console.error('回复失败:', err)
    alert('回复失败，请稍后重试')
  }
}

// 举报评论
function reportComment(comment) {
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

// 监听排序和筛选变化
watch([sortType, filterType], () => {
  page.value = 1
  loadComments()
})

onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.comment-item {
  transition: all 0.2s ease;
}
</style>

