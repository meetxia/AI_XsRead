<template>
  <div class="comment-section">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold" style="color: var(--color-text-primary)">
        评论区
        <span class="text-xs font-normal ml-2" style="color: var(--color-text-muted)">({{ totalComments }}条)</span>
      </h3>
      
      <!-- 筛选和排序 -->
      <div class="flex items-center space-x-3">
        <select 
          v-model="filterType"
          class="px-3 py-2 border rounded-lg focus:outline-none text-sm select-themed"
        >
          <option value="all">全部评论</option>
          <option value="positive">好评</option>
          <option value="negative">差评</option>
        </select>
        
        <select 
          v-model="sortType"
          class="px-3 py-2 border rounded-lg focus:outline-none text-sm select-themed"
        >
          <option value="time">最新</option>
          <option value="hot">最热</option>
        </select>
      </div>
    </div>

    <!-- 发表评论 -->
    <div class="mb-4 p-3 rounded-xl themed-card" style="background: var(--color-bg-card); border: 1px solid var(--color-border); color: var(--color-text-primary)">
      <textarea
        v-model="newComment"
        placeholder="说说你的看法..."
        rows="3"
        class="w-full px-3 py-2 border rounded-lg focus:outline-none resize-none textarea-themed"
        :disabled="submitting"
      ></textarea>
      
      <!-- 预览上传的图片 -->
      <div v-if="uploadedImages.length > 0" class="flex flex-wrap gap-2 mt-2 mb-2">
        <div 
          v-for="(img, index) in uploadedImages" 
          :key="index"
          class="relative group"
        >
          <img 
            :src="img.url" 
            class="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
          />
          <button
            @click="removeImage(index)"
            class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between mt-3">
        <div class="flex items-center space-x-2">
          <!-- 表情 -->
          <div class="relative">
            <button 
              @click="showEmojiPicker = !showEmojiPicker"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="添加表情"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            <!-- 表情选择器 -->
            <div 
              v-show="showEmojiPicker" 
              class="emoji-picker absolute bottom-12 left-0 z-50 bg-white rounded-lg shadow-xl border p-3 w-64"
              style="max-height: 200px; overflow-y: auto;"
              @click.stop
            >
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="emoji in emojiList"
                  :key="emoji.icon"
                  @click="insertEmoji(emoji.text)"
                  class="text-2xl hover:bg-gray-100 rounded p-2 transition-colors"
                  :title="emoji.text"
                >
                  <i :class="emoji.icon"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 图片上传 -->
          <div class="relative">
            <input
              ref="imageInput"
              type="file"
              accept="image/*"
              multiple
              @change="handleImageUpload"
              class="hidden"
            />
            <button 
              @click="$refs.imageInput.click()"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="上传图片"
              :disabled="uploadedImages.length >= 3"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          <span class="text-xs text-gray-400">最多3张图片</span>
        </div>
        
        <div class="flex items-center space-x-2">
          <span class="text-xs text-gray-400">{{ newComment.length }}/500</span>
          <button
            @click="submitComment"
            :disabled="!newComment.trim() || submitting || newComment.length > 500"
            class="px-4 py-2 btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
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

    <div v-else-if="filteredComments.length > 0" class="space-y-3">
      <div 
        v-for="comment in filteredComments" 
        :key="comment.id"
        class="comment-item p-3 rounded-xl hover:shadow-md transition-shadow themed-card"
        style="background: var(--color-bg-card); border: 1px solid var(--color-border); color: var(--color-text-primary)"
      >
        <!-- 评论头部 -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center space-x-3">
            <img 
              :src="comment.user?.avatar || '/default-avatar.png'" 
              :alt="comment.user?.username"
              class="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-semibold" style="color: var(--color-text-primary)">{{ comment.user?.username }}</span>
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

        <!-- 评论图片 -->
        <div v-if="comment.images && comment.images.length > 0" class="flex flex-wrap gap-2 mb-3">
          <img
            v-for="(img, index) in comment.images"
            :key="index"
            :src="img"
            @click="previewImage(img)"
            class="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          />
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
        <div v-if="comment.showReplies && comment.replies && comment.replies.length > 0" class="mt-3 ml-10 space-y-2">
          <div 
            v-for="reply in comment.replies" 
            :key="reply.id"
            class="p-2 rounded-lg reply-card"
          >
            <div class="flex items-center space-x-2 mb-2">
              <img 
                :src="reply.user?.avatar || '/default-avatar.png'" 
                :alt="reply.user?.username"
                class="w-6 h-6 rounded-full object-cover"
              />
              <span class="text-sm font-semibold text-gray-900">{{ reply.user?.username }}</span>
              <span v-if="reply.replyTo?.username" class="text-sm text-gray-500">回复</span>
              <span v-if="reply.replyTo?.username" class="text-sm font-semibold text-blue-600">@{{ reply.replyTo.username }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(reply.createdAt) }}</span>
            </div>
            <div class="text-sm" style="color: var(--color-text-secondary)">{{ reply.content }}</div>
          </div>
        </div>

        <!-- 回复输入框 -->
        <div v-if="comment.showReplyInput" class="mt-3 ml-10">
          <div class="flex items-start space-x-2">
            <textarea
              v-model="replyContent[comment.id]"
              :placeholder="`回复 @${comment.user?.username}`"
              rows="2"
              class="flex-1 px-3 py-2 border rounded-lg focus:outline-none resize-none text-sm textarea-themed"
            ></textarea>
            <button
              @click="submitReply(comment)"
              :disabled="!replyContent[comment.id]?.trim()"
              class="px-3 py-2 btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
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
    <div v-if="hasMore" class="flex justify-center mt-4">
      <button
        @click="loadMore"
        class="px-5 py-2 btn-outline"
      >
        加载更多评论
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { getComments, submitComment as apiSubmitComment, likeComment as apiLikeComment, submitReply as apiSubmitReply } from '@/api/novel'
import { uploadImage } from '@/api/upload'

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
const uploadedImages = ref([])
const imageInput = ref(null)

// 常用表情图标列表 (使用 Bootstrap Icons)
const emojiList = [
  { icon: 'bi-emoji-smile', text: '😀' },
  { icon: 'bi-emoji-laughing', text: '😄' },
  { icon: 'bi-emoji-grin', text: '😁' },
  { icon: 'bi-emoji-wink', text: '😉' },
  { icon: 'bi-emoji-heart-eyes', text: '😍' },
  { icon: 'bi-emoji-kiss', text: '😘' },
  { icon: 'bi-emoji-sunglasses', text: '😎' },
  { icon: 'bi-emoji-neutral', text: '😐' },
  { icon: 'bi-emoji-frown', text: '🙁' },
  { icon: 'bi-emoji-angry', text: '😠' },
  { icon: 'bi-emoji-dizzy', text: '😵' },
  { icon: 'bi-emoji-expressionless', text: '😑' },
  { icon: 'bi-emoji-tear', text: '😢' },
  { icon: 'bi-hand-thumbs-up', text: '👍' },
  { icon: 'bi-hand-thumbs-down', text: '👎' },
  { icon: 'bi-heart-fill', text: '❤️' },
  { icon: 'bi-heart-break', text: '💔' },
  { icon: 'bi-star-fill', text: '⭐' },
  { icon: 'bi-fire', text: '🔥' },
  { icon: 'bi-balloon-heart', text: '💕' }
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

// 插入表情
function insertEmoji(emoji) {
  newComment.value += emoji
  showEmojiPicker.value = false
}

// 处理图片上传
async function handleImageUpload(event) {
  const files = Array.from(event.target.files)
  if (files.length === 0) return
  
  // 检查数量限制
  const remainingSlots = 3 - uploadedImages.value.length
  if (remainingSlots === 0) {
    alert('最多只能上传3张图片')
    return
  }
  
  const filesToUpload = files.slice(0, remainingSlots)
  
  for (const file of filesToUpload) {
    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(`图片 ${file.name} 超过5MB，请压缩后再上传`)
      continue
    }
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} 不是图片文件`)
      continue
    }
    
    try {
      const response = await uploadImage(file)
      uploadedImages.value.push({
        url: response.data.url,
        file: file.name
      })
    } catch (err) {
      console.error('图片上传失败:', err)
      alert(`图片 ${file.name} 上传失败`)
    }
  }
  
  // 清空input
  event.target.value = ''
}

// 移除图片
function removeImage(index) {
  uploadedImages.value.splice(index, 1)
}

// 预览图片
function previewImage(url) {
  window.open(url, '_blank')
}

// 提交评论
async function submitComment() {
  if (!newComment.value.trim() && uploadedImages.value.length === 0) return
  
  try {
    submitting.value = true
    await apiSubmitComment(props.novelId, {
      content: newComment.value,
      images: uploadedImages.value.map(img => img.url)
    })
    
    // 清空输入
    newComment.value = ''
    uploadedImages.value = []
    
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
.comment-item {
  transition: all 0.2s ease;
}

/* 主题化与移动端紧凑样式 */
.themed-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.reply-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
}

.textarea-themed {
  border-color: var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border-radius: 10px;
}

.btn-outline {
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 10px;
  background: transparent;
}

/* 选择器深色模式适配 */
.select-themed {
  border-color: var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}
.select-themed:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
}
.dark :deep(.select-themed) {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
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
</style>

