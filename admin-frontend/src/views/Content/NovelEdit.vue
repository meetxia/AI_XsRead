<template>
  <div class="novel-edit-container">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑小说' : '创建小说' }}</h2>
      <el-button @click="router.back()">返回</el-button>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="novel-form"
    >
      <el-card class="form-card">
        <template #header>
          <span>基本信息</span>
        </template>

        <el-form-item label="小说标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入小说标题（2-100字符）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="小说封面" prop="cover">
          <el-upload
            class="cover-uploader"
            action="/api/admin/upload/image"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            :before-upload="beforeCoverUpload"
          >
            <img v-if="form.cover" :src="form.cover" class="cover-preview" />
            <div v-else class="upload-placeholder">
              <el-icon class="uploader-icon"><Plus /></el-icon>
              <div class="upload-text">点击上传封面</div>
              <div class="upload-tip">建议尺寸: 750x1000px</div>
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item label="分类选择" prop="categoryId">
          <el-radio-group v-model="form.categoryId">
            <el-radio :label="101">都市言情</el-radio>
            <el-radio :label="102">古风穿越</el-radio>
            <el-radio :label="103">悬疑推理</el-radio>
            <el-radio :label="104">治愈系</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-tag
            v-for="tag in form.tags"
            :key="tag"
            closable
            @close="handleRemoveTag(tag)"
            style="margin-right: 10px;"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInputRef"
            v-model="tagInputValue"
            size="small"
            style="width: 100px;"
            @keyup.enter="handleAddTag"
            @blur="handleAddTag"
          />
          <el-button v-else size="small" @click="showTagInput">
            + 添加标签
          </el-button>
        </el-form-item>

        <el-form-item label="连载状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">连载中</el-radio>
            <el-radio :label="0">已完结</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-card>

      <el-card class="form-card">
        <template #header>
          <span>内容简介</span>
        </template>

        <el-form-item label="简介" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="6"
            placeholder="请输入小说简介（20-500字）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-card>

      <el-card class="form-card">
        <template #header>
          <span>高级设置</span>
        </template>

        <el-form-item label="是否推荐">
          <el-switch v-model="form.isRecommended" />
        </el-form-item>

        <el-form-item label="是否热门">
          <el-switch v-model="form.isHot" />
        </el-form-item>

        <el-form-item label="VIP作品">
          <el-switch v-model="form.isVip" />
        </el-form-item>
      </el-card>

      <div class="form-actions">
        <el-button @click="router.back()">取消</el-button>
        <el-button @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '立即发布' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createNovel, updateNovel, getNovelDetail } from '@/api/novel'

const router = useRouter()
const route = useRoute()

const formRef = ref(null)
const tagInputRef = ref(null)
const tagInputVisible = ref(false)
const tagInputValue = ref('')

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  cover: '',
  categoryId: 101,
  tags: [],
  status: 1,
  description: '',
  isRecommended: false,
  isHot: false,
  isVip: false
})

const rules = {
  title: [
    { required: true, message: '请输入小说标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度为2-100个字符', trigger: 'blur' }
  ],
  cover: [
    { required: true, message: '请上传小说封面', trigger: 'change' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入简介', trigger: 'blur' },
    { min: 20, max: 500, message: '简介长度为20-500个字符', trigger: 'blur' }
  ]
}

const handleCoverSuccess = (response, file) => {
  form.cover = URL.createObjectURL(file.raw)
  ElMessage.success('封面上传成功')
}

const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const handleAddTag = () => {
  if (tagInputValue.value) {
    if (form.tags.length >= 5) {
      ElMessage.warning('最多只能添加5个标签')
      return
    }
    if (!form.tags.includes(tagInputValue.value)) {
      form.tags.push(tagInputValue.value)
    }
    tagInputValue.value = ''
  }
  tagInputVisible.value = false
}

const handleRemoveTag = (tag) => {
  form.tags = form.tags.filter(t => t !== tag)
}

const handleSaveDraft = async () => {
  ElMessage.info('保存草稿功能开发中...')
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (isEdit.value) {
        await updateNovel(route.params.id, form)
        ElMessage.success('修改成功')
      } else {
        await createNovel(form)
        ElMessage.success('创建成功')
      }
      router.push('/novels')
    } catch (error) {
      ElMessage.error(error.message || '操作失败')
    }
  })
}

const loadNovelDetail = async () => {
  if (!isEdit.value) return

  try {
    const res = await getNovelDetail(route.params.id)
    Object.assign(form, res.data)
  } catch (error) {
    ElMessage.error('加载小说详情失败')
    router.back()
  }
}

onMounted(() => {
  loadNovelDetail()
})
</script>

<style scoped lang="scss">
.novel-edit-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
      margin: 0;
    }
  }

  .form-card {
    margin-bottom: 20px;
  }

  .cover-uploader {
    .cover-preview {
      width: 150px;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
    }

    .upload-placeholder {
      width: 150px;
      height: 200px;
      border: 2px dashed #d9d9d9;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color 0.3s;

      &:hover {
        border-color: #409eff;
      }

      .uploader-icon {
        font-size: 28px;
        color: #8c939d;
      }

      .upload-text {
        margin-top: 10px;
        font-size: 14px;
        color: #606266;
      }

      .upload-tip {
        margin-top: 5px;
        font-size: 12px;
        color: #909399;
      }
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

