<script setup>
import { RouterLink } from 'vue-router'
import BookCover from './BookCover.vue'
import Icon from '@/components/v2/icons/Icon.vue'

defineProps({
  book: {
    type: Object,
    required: true,
    // { id, title, author, cat/category, rating, variant, cover }
  },
  showRating: { type: Boolean, default: true },
})
</script>

<template>
  <RouterLink :to="`/novel/${book.id}`" class="book-card group block">
    <div class="aspect-[3/4] rounded-2xl overflow-hidden shadow-cream relative bg-cream-200 dark:bg-night-800">
      <BookCover
        :title="book.title"
        :sub="book.sub"
        :variant="book.variant"
        :cover="book.cover"
      />
    </div>
    <div class="mt-2.5 px-0.5">
      <h4 class="font-serif font-semibold text-sm leading-snug line-clamp-1">{{ book.title }}</h4>
      <p class="text-xs text-ink-500 dark:text-ink-300 mt-0.5 line-clamp-1">
        {{ book.author }}<span v-if="book.cat || book.category"> · {{ book.cat || book.category }}</span>
      </p>
      <div v-if="showRating && book.rating" class="flex items-center gap-1 mt-1 text-[11px] text-clay-500 dark:text-clay-400">
        <Icon name="starFill" class="w-3 h-3" />
        <span class="font-medium">{{ book.rating }}</span>
      </div>
    </div>
  </RouterLink>
</template>
