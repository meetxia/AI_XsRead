<template>
  <div class="star-rating flex items-center">
    <button
      v-for="star in 5"
      :key="star"
      @click="!readonly && rate(star)"
      @mouseenter="!readonly && hover(star)"
      @mouseleave="!readonly && (hoverRating = 0)"
      :disabled="readonly"
      class="focus:outline-none transition-transform hover:scale-110"
      :class="{ 'cursor-pointer': !readonly, 'cursor-default': readonly }"
    >
      <svg
        :width="size"
        :height="size"
        viewBox="0 0 20 20"
        :fill="star <= (hoverRating || currentRating) ? 'currentColor' : 'none'"
        :stroke="star <= (hoverRating || currentRating) ? 'currentColor' : 'currentColor'"
        :class="star <= (hoverRating || currentRating) ? 'text-yellow-400' : 'text-gray-300'"
        class="transition-colors duration-150"
      >
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  rating: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    default: 20
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:rating'])

const currentRating = ref(props.rating)
const hoverRating = ref(0)

// 评分
function rate(star) {
  currentRating.value = star
  emit('update:rating', star)
}

// 悬停
function hover(star) {
  hoverRating.value = star
}

// 监听外部rating变化
watch(() => props.rating, (newVal) => {
  currentRating.value = newVal
})
</script>

<style scoped>
button:disabled {
  cursor: default;
}
</style>

