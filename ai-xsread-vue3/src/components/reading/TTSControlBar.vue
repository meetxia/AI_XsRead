<script setup>
/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 22.2 — TTSControlBar 控制条
 *
 * 这是一个纯展示组件：
 *   - 全部可读状态都通过 props 注入；
 *   - 不直接访问 window.speechSynthesis（Requirement 8 设计原则：
 *     ReadingPage 持有 useTTS，由它把 voices / rate 等下发到这里）。
 *
 * Validates: Requirements 8.2, 8.3
 */
import { computed } from 'vue'

const TTS_SPEEDS = Object.freeze([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2])

const props = defineProps({
  visible: { type: Boolean, default: false },
  playing: { type: Boolean, default: false },
  preview: { type: String, default: '' },
  rate: { type: Number, default: 1 },
  voices: { type: Array, default: () => [] },
  currentVoiceId: { type: String, default: '' },
})

const emit = defineEmits([
  'pause',
  'resume',
  'prev',
  'next',
  'close',
  'change-rate',
  'change-voice',
])

const truncatedPreview = computed(() => {
  const text = String(props.preview || '')
  if (text.length <= 60) return text
  return `${text.slice(0, 60)}…`
})

const hasVoices = computed(() => Array.isArray(props.voices) && props.voices.length > 0)

function onRateChange(event) {
  const value = Number(event?.target?.value)
  if (!Number.isFinite(value)) return
  emit('change-rate', value)
}

function onVoiceChange(event) {
  emit('change-voice', String(event?.target?.value || ''))
}

function togglePlay() {
  emit(props.playing ? 'pause' : 'resume')
}
</script>

<template>
  <section v-if="visible" class="tts-bar" aria-label="听书控制">
    <button class="tts-btn" type="button" @click="$emit('prev')">上一段</button>
    <button class="tts-btn primary" type="button" @click="togglePlay">
      {{ playing ? '暂停' : '继续' }}
    </button>
    <button class="tts-btn" type="button" @click="$emit('next')">下一段</button>

    <p class="tts-preview" :title="preview">{{ truncatedPreview }}</p>

    <label class="tts-select">
      <span class="tts-select-label">速度</span>
      <select :value="rate" @change="onRateChange">
        <option v-for="speed in TTS_SPEEDS" :key="speed" :value="speed">{{ speed }}x</option>
      </select>
    </label>

    <label v-if="hasVoices" class="tts-select">
      <span class="tts-select-label">音色</span>
      <select :value="currentVoiceId" @change="onVoiceChange">
        <option
          v-for="voice in voices"
          :key="voice.voiceURI"
          :value="voice.voiceURI"
        >
          {{ voice.name || voice.voiceURI }}
        </option>
      </select>
    </label>

    <button class="tts-btn" type="button" @click="$emit('close')">关闭</button>
  </section>
</template>

<style scoped>
.tts-bar {
  position: fixed;
  left: 0.75rem;
  right: 0.75rem;
  bottom: calc(5.5rem + env(safe-area-inset-bottom));
  z-index: 35;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  max-width: 720px;
  margin: 0 auto;
  padding: 0.65rem;
  border: 1px solid rgba(120, 113, 108, 0.22);
  border-radius: 0.75rem;
  background: rgba(255, 251, 245, 0.96);
  box-shadow: 0 10px 28px rgba(31, 23, 18, 0.14);
  color: #292524;
}

.tts-btn {
  min-height: 2rem;
  padding: 0 0.55rem;
  border-radius: 0.5rem;
  background: rgba(120, 113, 108, 0.12);
  font-size: 0.75rem;
  white-space: nowrap;
}

.tts-btn.primary {
  background: #292524;
  color: #fffaf5;
}

.tts-preview {
  flex: 1 1 100%;
  overflow: hidden;
  margin: 0;
  color: #57534e;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tts-select {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  color: #57534e;
}

.tts-select-label {
  white-space: nowrap;
}

.tts-select select {
  min-height: 2rem;
  padding: 0 0.4rem;
  border: 1px solid rgba(120, 113, 108, 0.32);
  border-radius: 0.45rem;
  background: #fffaf5;
  font-size: 0.75rem;
  color: #292524;
}

@media (min-width: 521px) {
  .tts-preview {
    flex: 1 1 auto;
  }
}
</style>
