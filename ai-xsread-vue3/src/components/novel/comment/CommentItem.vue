<template>
  <div class="comment-item">
    <div class="comment-header-row">
      <div class="comment-user-info">
        <img
          :src="comment.user?.avatar || '/default-avatar.png'"
          :alt="comment.user?.username"
          class="comment-avatar"
          @error="$emit('avatar-error', $event)"
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

      <div class="comment-more">
        <button class="more-btn" @click="$emit('toggle-menu', comment)">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="12" cy="19" r="2"/>
          </svg>
        </button>

        <div v-if="comment.showMenu" class="comment-menu">
          <button @click="$emit('report', comment)" class="menu-item">举报</button>
        </div>
      </div>
    </div>

    <div class="comment-content">
      {{ comment.content }}
    </div>

    <div v-if="comment.images && comment.images.length > 0" class="comment-images">
      <img
        v-for="(img, index) in comment.images"
        :key="index"
        :src="img"
        @click="$emit('preview-image', img)"
        class="comment-image"
      />
    </div>

    <div class="comment-actions">
      <button
        @click="$emit('like', comment)"
        class="action-btn"
        :class="{ 'liked': comment.isLiked }"
      >
        <svg class="action-icon" :fill="comment.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span class="action-text">{{ comment.likes || '' }}</span>
      </button>

      <button @click="$emit('toggle-reply', comment)" class="action-btn">
        <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span class="action-text">{{ comment.replies?.length > 0 ? comment.replies.length : '回复' }}</span>
      </button>
    </div>

    <div v-if="comment.showReplies && comment.replies && comment.replies.length > 0" class="reply-list">
      <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
        <div class="reply-header">
          <img
            :src="reply.user?.avatar || '/default-avatar.png'"
            :alt="reply.user?.username"
            class="reply-avatar"
            @error="$emit('avatar-error', $event)"
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

      <button
        v-if="comment.replies.length > 1"
        @click="comment.showReplies = false"
        class="collapse-replies-btn"
      >
        收起 {{ comment.replies.length }} 条回复
      </button>
    </div>

    <div v-if="comment.showReplyInput" class="reply-input-wrapper">
      <textarea
        :value="replyContent"
        :placeholder="`回复 @${comment.user?.username}`"
        rows="2"
        class="reply-textarea"
        @input="$emit('update-reply-content', comment.id, $event.target.value)"
      ></textarea>
      <div class="reply-input-actions">
        <button @click="comment.showReplyInput = false" class="cancel-reply-btn">取消</button>
        <button
          @click="$emit('submit-reply', comment)"
          :disabled="!replyContent?.trim()"
          class="submit-reply-btn"
        >
          回复
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import StarRating from '../StarRating.vue'

defineProps({
  comment: {
    type: Object,
    required: true
  },
  replyContent: {
    type: String,
    default: ''
  },
  formatDate: {
    type: Function,
    required: true
  }
})

defineEmits([
  'avatar-error',
  'like',
  'toggle-reply',
  'toggle-menu',
  'report',
  'preview-image',
  'update-reply-content',
  'submit-reply'
])
</script>

<style scoped>
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
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border: 2px solid rgba(217, 84, 104, 0.2);
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(217, 84, 104, 0.1);
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

.comment-time,
.comment-location {
  color: var(--color-text-muted);
}

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

.comment-content {
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

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
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border: 2px solid rgba(217, 84, 104, 0.15);
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

@media (max-width: 640px) {
  .comment-item {
    padding: 0.75rem;
  }

  .comment-avatar {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
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
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
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
}
</style>
