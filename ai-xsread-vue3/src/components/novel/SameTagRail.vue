<script setup>
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import BookCover from '@/components/v2/book/BookCover.vue'
import { getNovelByTags } from '@/api/novel'

const props = defineProps({
  tags: { type: Array, default: () => [] },
  excludeId: { type: [String, Number], default: null },
})

const books = ref([])

watch(
  () => [props.tags.join(','), props.excludeId],
  async () => {
    books.value = []
    if (!props.tags.length) return
    try {
      const res = await getNovelByTags({
        tags: props.tags.slice(0, 3).join(','),
        exclude: props.excludeId,
        pageSize: 8,
      })
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.list || [])
      books.value = list
        .filter(item => String(item.id || item.novel_id) !== String(props.excludeId))
        .slice(0, 8)
        .map((item, index) => ({
          id: item.id || item.novel_id,
          title: item.title || '未命名小说',
          author: item.author || '佚名',
          cover: item.cover,
          variant: index + 2,
        }))
    } catch (error) {
      books.value = []
    }
  },
  { immediate: true }
)
</script>

<template>
  <section v-if="books.length">
    <h2 class="font-serif text-base font-semibold mb-3 flex items-center gap-2">
      <span class="w-1 h-4 rounded-full bg-clay-500"></span>
      同标签好书
    </h2>
    <div class="flex gap-3 overflow-x-auto no-scrollbar -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 pb-1">
      <RouterLink v-for="book in books" :key="book.id" :to="`/novel/${book.id}`" class="shrink-0 w-24 sm:w-28">
        <div class="aspect-[3/4] rounded-lg overflow-hidden shadow-cream">
          <BookCover :title="book.title.slice(0, 2)" :variant="book.variant" :cover="book.cover" />
        </div>
        <p class="mt-2 text-xs font-medium line-clamp-1">{{ book.title }}</p>
        <p class="text-[10px] text-ink-500 dark:text-ink-300">{{ book.author }}</p>
      </RouterLink>
    </div>
  </section>
</template>
