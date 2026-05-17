<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import { uploadNovel } from '@/api/upload'

const router = useRouter()

const file = ref(null)
const fileName = ref('')
const title = ref('')
const author = ref('')
const category = ref('')
const intro = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const errorMsg = ref('')
const successMsg = ref('')

const categories = [
  { id: 101, name: '都市言情' },
  { id: 102, name: '古风穿越' },
  { id: 103, name: '玄幻修仙' },
  { id: 104, name: '悬疑推理' },
  { id: 105, name: '科幻未来' },
  { id: 106, name: '青春校园' },
]

function pickFile(e) {
  const f = e.target.files?.[0]
  if (f) {
    file.value = f
    fileName.value = f.name
    if (!title.value) title.value = f.name.replace(/\.[^.]+$/, '')
  }
}

async function onUpload() {
  if (!file.value) {
    errorMsg.value = '请先选择 TXT 文件'
    return
  }
  if (!title.value.trim()) {
    errorMsg.value = '请填写书名'
    return
  }
  errorMsg.value = ''
  successMsg.value = ''
  uploading.value = true
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('file', file.value)
    formData.append('title', title.value.trim())
    if (author.value) formData.append('author', author.value.trim())
    if (category.value) formData.append('categoryId', category.value)
    if (intro.value) formData.append('description', intro.value.trim())

    const res = await uploadNovel(formData, (progressEvent) => {
      if (progressEvent.total) {
        uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
      }
    })

    if (res?.code === 200 || res?.code === 201) {
      successMsg.value = '上传成功！正在跳转到书架…'
      setTimeout(() => router.push('/bookshelf'), 1500)
    } else {
      errorMsg.value = res?.message || '上传失败，请重试'
    }
  } catch (e) {
    errorMsg.value = e?.message || '上传失败，请检查文件格式'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-md mx-auto px-3 h-14 flex items-center justify-between">
        <button @click="router.back()" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800" aria-label="返回">
          <Icon name="back" />
        </button>
        <h1 class="font-serif text-base font-semibold">上传小说</h1>
        <ThemeToggle />
      </div>
    </header>

    <main class="max-w-md mx-auto px-5 pt-6 pb-12">
      <div class="space-y-5">
        <!-- 文件选择 -->
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">TXT 文件 *</label>
          <label class="block w-full p-6 rounded-2xl border-2 border-dashed border-cream-300 dark:border-night-600 hover:border-clay-500 cursor-pointer text-center transition">
            <Icon name="plus" class="w-8 h-8 mx-auto mb-2 text-ink-500" />
            <p class="text-sm text-ink-700 dark:text-ink-300">{{ fileName || '点击选择 TXT 文件' }}</p>
            <p class="text-[11px] text-ink-500 mt-1">支持 UTF-8 / GBK 编码，单文件 ≤ 30 MB</p>
            <input type="file" accept=".txt" class="hidden" @change="pickFile" />
          </label>
        </div>

        <!-- 书名 -->
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">书名 *</label>
          <input v-model="title" type="text" placeholder="请输入书名" class="w-full h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 outline-none text-sm" />
        </div>

        <!-- 作者 -->
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">作者</label>
          <input v-model="author" type="text" placeholder="可选" class="w-full h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 outline-none text-sm" />
        </div>

        <!-- 分类 -->
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">分类</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="c in categories" :key="c.id"
              type="button" @click="category = category === c.id ? '' : c.id"
              :class="['px-3 py-1.5 rounded-full text-xs transition',
                category === c.id
                  ? 'bg-clay-700 dark:bg-clay-500 text-cream-50'
                  : 'bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700'
              ]"
            >{{ c.name }}</button>
          </div>
        </div>

        <!-- 简介 -->
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">简介</label>
          <textarea v-model="intro" rows="4" placeholder="一句话介绍这本书…" class="w-full p-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 outline-none text-sm resize-none"></textarea>
        </div>

        <!-- 进度条 -->
        <div v-if="uploading" class="rounded-xl bg-cream-100 dark:bg-night-800 p-4">
          <div class="flex items-center justify-between text-xs text-ink-700 dark:text-ink-300 mb-2">
            <span>上传中…</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="h-2 rounded-full bg-cream-200 dark:bg-night-700 overflow-hidden">
            <div class="h-full bg-clay-500 rounded-full transition-all" :style="{ width: uploadProgress + '%' }"></div>
          </div>
        </div>

        <!-- 错误/成功提示 -->
        <p v-if="errorMsg" class="text-sm text-cinnabar-500">{{ errorMsg }}</p>
        <p v-if="successMsg" class="text-sm text-moss-600 dark:text-moss-500">{{ successMsg }}</p>

        <button
          @click="onUpload"
          :disabled="uploading"
          class="w-full h-12 rounded-xl bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif font-semibold hover:bg-clay-600 active:scale-[0.98] transition shadow-cream disabled:opacity-60"
        >
          {{ uploading ? `上传中 ${uploadProgress}%…` : '上传到书架' }}
        </button>
      </div>
    </main>
  </div>
</template>
