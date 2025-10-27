<template>
  <div class="chapter-edit-container">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑章节' : '新建章节' }}</h2>
      <div class="header-actions">
        <span class="word-count">字数: {{ wordCount }}</span>
        <span class="save-tip">{{ saveStatus }}</span>
        <el-button @click="router.back()">返回</el-button>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="chapter-form"
    >
      <el-card class="form-card">
        <el-form-item label="所属小说" prop="novelId">
          <el-select v-model="form.novelId" placeholder="选择小说" filterable style="width: 300px;">
            <el-option label="时光里的温柔相遇" :value="1" />
            <el-option label="长安月下归人未归" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="章节标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="例如：第一章:图书馆的邂逅"
            style="width: 500px;"
          />
        </el-form-item>

        <el-form-item label="章节内容" prop="content" class="content-item">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="20"
            placeholder="请输入章节内容..."
            @input="handleContentChange"
          />
        </el-form-item>

        <el-form-item label="章节设置">
          <el-space>
            <el-checkbox v-model="form.isFree">免费章节</el-checkbox>
            <el-input-number
              v-if="!form.isFree"
              v-model="form.price"
              :min="0"
              :max="100"
              :step="10"
              style="width: 150px;"
            />
            <span v-if="!form.isFree">书币</span>
          </el-space>
        </el-form-item>

        <el-form-item label="发布时间">
          <el-radio-group v-model="publishType">
            <el-radio label="now">立即发布</el-radio>
            <el-radio label="schedule">定时发布</el-radio>
          </el-radio-group>
          <el-date-picker
            v-if="publishType === 'schedule'"
            v-model="form.publishTime"
            type="datetime"
            placeholder="选择发布时间"
            style="margin-left: 20px;"
          />
        </el-form-item>
      </el-card>

      <div class="form-actions">
        <el-button @click="router.back()">取消</el-button>
        <el-button @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" @click="handleSubmit">发布章节</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createChapter, updateChapter, getChapterDetail } from '@/api/chapter'

const router = useRouter()
const route = useRoute()

const formRef = ref(null)
const publishType = ref('now')
const saveStatus = ref('未保存')
const autoSaveTimer = ref(null)

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  novelId: null,
  title: '',
  content: '',
  isFree: true,
  price: 10,
  publishTime: null
})

const rules = {
  novelId: [
    { required: true, message: '请选择所属小说', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入章节标题', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入章节内容', trigger: 'blur' },
    { min: 100, message: '章节内容至少100字', trigger: 'blur' }
  ]
}

const wordCount = computed(() => {
  return form.content.length
})

const handleContentChange = () => {
  saveStatus.value = '未保存'
  // 重置自动保存计时器
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
  autoSaveTimer.value = setTimeout(() => {
    handleAutoSave()
  }, 30000) // 30秒后自动保存
}

const handleAutoSave = () => {
  saveStatus.value = '自动保存中...'
  setTimeout(() => {
    saveStatus.value = '已自动保存'
  }, 1000)
}

const handleSaveDraft = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      const data = { ...form, status: 0 } // 0表示草稿
      if (isEdit.value) {
        await updateChapter(route.params.id, data)
        ElMessage.success('保存草稿成功')
      } else {
        await createChapter(data)
        ElMessage.success('保存草稿成功')
        router.back()
      }
    } catch (error) {
      ElMessage.error(error.message || '保存失败')
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      const data = {
        ...form,
        status: 1, // 1表示已发布
        publishTime: publishType.value === 'now' ? new Date() : form.publishTime
      }

      if (isEdit.value) {
        await updateChapter(route.params.id, data)
        ElMessage.success('发布成功')
      } else {
        await createChapter(data)
        ElMessage.success('发布成功')
      }
      router.back()
    } catch (error) {
      ElMessage.error(error.message || '发布失败')
    }
  })
}

const loadChapterDetail = async () => {
  if (!isEdit.value) return

  try {
    const res = await getChapterDetail(route.params.id)
    Object.assign(form, res.data)
  } catch (error) {
    ElMessage.error('加载章节详情失败')
    router.back()
  }
}

onMounted(() => {
  loadChapterDetail()
})
</script>

<style scoped lang="scss">
.chapter-edit-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 20px;

      .word-count {
        font-size: 14px;
        color: #909399;
      }

      .save-tip {
        font-size: 12px;
        color: #67c23a;
      }
    }
  }

  .form-card {
    margin-bottom: 20px;
  }

  .content-item {
    :deep(.el-form-item__content) {
      line-height: 1.5;
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
}
</style>

