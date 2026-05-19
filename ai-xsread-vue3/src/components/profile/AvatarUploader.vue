<script setup>
/**
 * 头像上传组件
 *
 * Props:
 *   - modelValue: 当前头像 URL（可空）
 *   - letter: 头像为空时显示的字母占位（默认 'M'）
 *   - size: 头像尺寸（px，默认 96）
 *
 * Emits:
 *   - update:modelValue: 上传成功后回传新 URL
 *   - error: 校验或上传失败时回传 message
 */
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import Icon from '@/components/v2/icons/Icon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  letter: { type: String, default: 'M' },
  size: { type: Number, default: 96 }
})

const emit = defineEmits(['update:modelValue', 'error', 'update:uploading'])

const userStore = useUserStore()
const fileInput = ref(null)
const uploading = ref(false)

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

const sizeStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px'
}))

const initial = computed(() => (props.letter || 'M').charAt(0).toUpperCase())

const triggerPick = () => {
  if (uploading.value) return
  fileInput.value?.click()
}

const onFileChange = async (event) => {
  const input = event.target
  const file = input?.files?.[0]
  // 重置 input，方便同名文件再次触发 change
  if (input) input.value = ''
  if (!file) return

  // 类型校验
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    emit('error', '仅支持 JPG / PNG / WEBP 格式')
    return
  }
  // 大小校验
  if (file.size > MAX_SIZE) {
    emit('error', '图片大小不能超过 2MB')
    return
  }

  uploading.value = true
  emit('update:uploading', true)
  try {
    const avatarUrl = await userStore.uploadAvatar(file)
    if (avatarUrl) {
      emit('update:modelValue', avatarUrl)
    }
  } catch (e) {
    emit('error', (e && e.message) || '头像上传失败')
  } finally {
    uploading.value = false
    emit('update:uploading', false)
  }
}
</script>

<template>
  <div class="inline-flex flex-col items-center gap-3">
    <div
      class="relative group rounded-full overflow-hidden ring-2 ring-cream-200 dark:ring-night-700 shadow-sm cursor-pointer"
      :style="sizeStyle"
      role="button"
      tabindex="0"
      :aria-label="modelValue ? '点击更换头像' : '点击上传头像'"
      @click="triggerPick"
      @keydown.enter.prevent="triggerPick"
      @keydown.space.prevent="triggerPick"
    >
      <img
        v-if="modelValue"
        :src="modelValue"
        alt="头像"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="w-full h-full grid place-items-center bg-clay-400 dark:bg-clay-700 text-cream-50 font-serif text-3xl"
      >
        {{ initial }}
      </div>

      <!-- hover 蒙层 -->
      <div
        class="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition"
        :class="{ 'opacity-100': uploading }"
      >
        <span v-if="uploading" class="text-xs text-white">上传中…</span>
        <Icon v-else name="settings" class="w-6 h-6 text-white" />
      </div>
    </div>

    <button
      type="button"
      class="text-xs text-clay-700 dark:text-clay-400 hover:underline disabled:opacity-50 disabled:no-underline"
      :disabled="uploading"
      @click="triggerPick"
    >
      {{ uploading ? '上传中…' : '更换头像' }}
    </button>

    <input
      ref="fileInput"
      type="file"
      :accept="ACCEPT"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>
