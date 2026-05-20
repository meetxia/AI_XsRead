<script setup>
/**
 * 书籍封面组件
 * 显示真实 JPG 封面，加载失败回退到 SVG 渐变占位。
 *
 * Props:
 *   - title: 显示在封面上的中文标题（建议 2~4 字）
 *   - sub: 副标题（可选）
 *   - variant: 0~5 不同色板
 *   - footer: 是否显示底部 "AI GENERATED" 字样（默认 true）
 *   - cover: 真实封面 URL（如有）
 */
import { computed, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  sub:   { type: String, default: '' },
  variant: { type: [Number, String], default: 0 },
  footer: { type: Boolean, default: true },
  cover: { type: String, default: '' },
})

const imgFailed = ref(false)

// 当 cover URL 变化时重置失败状态
watch(() => props.cover, () => { imgFailed.value = false })

const showImg = computed(() => !!props.cover && !imgFailed.value)

const palettes = [
  ['#A87A56', '#5C3B25'], // 0 陶土
  ['#6B7B5A', '#2A3528'], // 1 墨绿
  ['#3D5A80', '#0F1F30'], // 2 青花
  ['#9A3429', '#5C1F18'], // 3 朱砂
  ['#E5D6C4', '#A87A56'], // 4 暖米
  ['#2A2520', '#5C3B25'], // 5 暗夜
]

const colors = computed(() => {
  const v = (Number(props.variant) || 0) % palettes.length
  return palettes[v]
})

const id = 'cv' + Math.random().toString(36).slice(2, 8)
const titleShort = computed(() => (props.title || '').slice(0, 4))
</script>

<template>
  <!-- 优先尝试真实封面（JPG），失败回退到 SVG 占位 -->
  <img
    v-if="showImg"
    :src="cover"
    :alt="title"
    class="w-full h-full object-cover"
    loading="lazy"
    decoding="async"
    @error="imgFailed = true"
  />

  <!-- 兜底 SVG 占位封面 -->
  <svg
    v-else
    viewBox="0 0 300 400"
    class="w-full h-full"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="id" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="colors[0]" />
        <stop offset="100%" :stop-color="colors[1]" />
      </linearGradient>
    </defs>
    <rect width="300" height="400" :fill="`url(#${id})`" />
    <rect x="20" y="20" width="260" height="360" stroke="#FDFAF6" stroke-opacity="0.18" fill="none" rx="6" />
    <text v-if="titleShort" x="150" y="195" font-family="Noto Serif SC, serif" font-size="40" font-weight="600" fill="#FDFAF6" text-anchor="middle">{{ titleShort }}</text>
    <text v-if="sub" x="150" y="225" font-family="Noto Serif SC, serif" font-size="20" font-weight="400" fill="#FDFAF6" text-anchor="middle" opacity="0.85">{{ sub }}</text>
    <text v-if="footer" x="150" y="355" font-family="Inter, sans" font-size="9" fill="#FDFAF6" text-anchor="middle" opacity="0.45" letter-spacing="3">A I  G E N E R A T E D</text>
  </svg>
</template>
