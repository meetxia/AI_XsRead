<template>
  <div class="settings-container">
    <div class="page-header">
      <h2>系统设置</h2>
      <p class="page-tip">维护站点基础信息与客服联系方式</p>
    </div>

    <el-card v-loading="loading" shadow="never" class="settings-card">
      <el-tabs v-model="activeTab">
        <!-- 基础设置 -->
        <el-tab-pane label="基础设置" name="basic">
          <el-form
            ref="basicFormRef"
            :model="basicForm"
            :rules="basicRules"
            label-width="140px"
            class="settings-form"
          >
            <el-form-item label="站点名称" prop="site_name">
              <el-input
                v-model="basicForm.site_name"
                maxlength="50"
                show-word-limit
                placeholder="如：文字之城"
              />
            </el-form-item>
            <el-form-item label="站点描述" prop="site_description">
              <el-input
                v-model="basicForm.site_description"
                maxlength="200"
                show-word-limit
                placeholder="一句话描述"
              />
            </el-form-item>
            <el-form-item label="站点 Logo" prop="site_logo_url">
              <el-input
                v-model="basicForm.site_logo_url"
                placeholder="如：/uploads/logo.png 或绝对地址"
              />
              <div v-if="basicForm.site_logo_url" class="logo-preview">
                <img :src="basicForm.site_logo_url" alt="logo" @error="onLogoError" />
              </div>
            </el-form-item>
            <el-form-item label="网站关键词" prop="site_keywords">
              <el-input
                v-model="basicForm.site_keywords"
                maxlength="200"
                show-word-limit
                placeholder="逗号分隔，例：小说,阅读,女性向"
              />
            </el-form-item>
            <el-form-item label="ICP 备案号" prop="icp_number">
              <el-input
                v-model="basicForm.icp_number"
                maxlength="64"
                placeholder="如：京ICP备XXXXXXXX号-1"
              />
            </el-form-item>
            <el-form-item label="客服邮箱" prop="contact_email">
              <el-input
                v-model="basicForm.contact_email"
                placeholder="example@domain.com"
              />
            </el-form-item>
            <el-form-item label="客服 QQ" prop="contact_qq">
              <el-input
                v-model="basicForm.contact_qq"
                maxlength="20"
                placeholder="数字 QQ 号"
              />
            </el-form-item>
            <el-form-item label="开放注册" prop="enable_register">
              <el-switch
                v-model="basicForm.enable_register"
                active-text="开放"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item label="允许评论" prop="enable_comment">
              <el-switch
                v-model="basicForm.enable_comment"
                active-text="开放"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item label="上传上限(MB)" prop="max_upload_size_mb">
              <el-input-number
                v-model="basicForm.max_upload_size_mb"
                :min="1"
                :max="2048"
                :step="1"
                controls-position="right"
              />
              <span class="form-hint">用户后台上传单文件最大体积，单位 MB</span>
            </el-form-item>
            <el-form-item label="每日免费章节" prop="daily_free_chapters">
              <el-input-number
                v-model="basicForm.daily_free_chapters"
                :min="0"
                :max="100"
                :step="1"
                controls-position="right"
              />
            </el-form-item>
            <el-form-item label="首页公告" prop="announcement">
              <el-input
                v-model="basicForm.announcement"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="可留空，将显示在首页顶部"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="saving" @click="onSaveBasic">
                保存基础设置
              </el-button>
              <el-button @click="loadBasic">还原</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 联系方式 -->
        <el-tab-pane label="联系方式" name="contact">
          <el-form
            ref="contactFormRef"
            :model="contactForm"
            :rules="contactRules"
            label-width="140px"
            class="settings-form"
          >
            <el-form-item label="客服 QQ" prop="qq">
              <el-input v-model="contactForm.qq" maxlength="20" placeholder="数字 QQ 号" />
            </el-form-item>
            <el-form-item label="客服微信" prop="wechat">
              <el-input v-model="contactForm.wechat" maxlength="50" placeholder="微信号" />
            </el-form-item>
            <el-form-item label="联系公告" prop="notice">
              <el-input
                v-model="contactForm.notice"
                type="textarea"
                :rows="3"
                maxlength="200"
                show-word-limit
                placeholder="客服弹窗中的提示文字"
              />
            </el-form-item>
            <el-form-item label="客服二维码">
              <el-upload
                class="qrcode-uploader"
                :show-file-list="false"
                :before-upload="beforeQrUpload"
                :http-request="customQrUpload"
                accept="image/png,image/jpeg,image/webp"
              >
                <div class="qr-slot">
                  <img
                    v-if="contactForm.qrcode_url"
                    :src="contactForm.qrcode_url"
                    class="qr-preview"
                    @error="onQrError"
                  />
                  <div v-else class="qr-placeholder">
                    <el-icon><Plus /></el-icon>
                    <span>点击上传二维码</span>
                  </div>
                </div>
              </el-upload>
              <div class="form-hint">支持 jpg / png / webp，单图最大 2MB</div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="contactSaving" @click="onSaveContact">
                保存联系方式
              </el-button>
              <el-button @click="loadContact">还原</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getAllConfigs,
  batchUpdateConfigs,
  getContact,
  updateContact,
  uploadContactQrcode
} from '@/api/system'

const activeTab = ref('basic')
const loading = ref(false)
const saving = ref(false)
const contactSaving = ref(false)

// 基础设置：扁平字段映射 system_config 表中的 key
const DEFAULT_BASIC = {
  site_name: '',
  site_description: '',
  site_logo_url: '',
  site_keywords: '',
  icp_number: '',
  contact_email: '',
  contact_qq: '',
  enable_register: true,
  enable_comment: true,
  max_upload_size_mb: 10,
  daily_free_chapters: 5,
  announcement: ''
}

// 字段类型，决定写回时的 type 列与值序列化方式
const FIELD_TYPES = {
  site_name: 'string',
  site_description: 'string',
  site_logo_url: 'string',
  site_keywords: 'string',
  icp_number: 'string',
  contact_email: 'string',
  contact_qq: 'string',
  enable_register: 'boolean',
  enable_comment: 'boolean',
  max_upload_size_mb: 'number',
  daily_free_chapters: 'number',
  announcement: 'string'
}

const FIELD_DESCRIPTIONS = {
  site_name: '网站名称',
  site_description: '网站描述',
  site_logo_url: '站点 Logo 图片地址',
  site_keywords: '网站关键词',
  icp_number: 'ICP 备案号',
  contact_email: '客服邮箱',
  contact_qq: '客服 QQ',
  enable_register: '允许用户注册',
  enable_comment: '允许评论',
  max_upload_size_mb: '上传文件最大 MB',
  daily_free_chapters: '每日免费章节数',
  announcement: '首页公告'
}

const basicForm = reactive({ ...DEFAULT_BASIC })

const basicRules = {
  site_name: [
    { required: true, message: '请填写站点名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度 2-50 字符', trigger: 'blur' }
  ],
  contact_email: [
    {
      validator: (_rule, value, cb) => {
        if (!value) return cb()
        const ok = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(value)
        ok ? cb() : cb(new Error('邮箱格式不正确'))
      },
      trigger: 'blur'
    }
  ],
  contact_qq: [
    {
      validator: (_rule, value, cb) => {
        if (!value) return cb()
        /^\d{5,15}$/.test(value) ? cb() : cb(new Error('QQ 应为 5-15 位数字'))
      },
      trigger: 'blur'
    }
  ],
  max_upload_size_mb: [
    {
      validator: (_rule, value, cb) => {
        if (value === null || value === undefined || value === '') return cb()
        const n = Number(value)
        Number.isInteger(n) && n > 0 ? cb() : cb(new Error('必须为正整数'))
      },
      trigger: 'change'
    }
  ]
}

const basicFormRef = ref(null)

/** 把 system_config 的 string 值按字段类型解码 */
function decodeValue(key, raw) {
  if (raw === null || raw === undefined) return DEFAULT_BASIC[key]
  const type = FIELD_TYPES[key] || 'string'
  if (type === 'boolean') {
    return raw === true || raw === 'true' || raw === 1 || raw === '1'
  }
  if (type === 'number') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : DEFAULT_BASIC[key]
  }
  return String(raw)
}

/** 将表单值序列化成 system_config 存储用的字符串 */
function encodeValue(key, val) {
  const type = FIELD_TYPES[key] || 'string'
  if (type === 'boolean') return val ? 'true' : 'false'
  if (type === 'number') return String(val ?? 0)
  return val == null ? '' : String(val)
}

async function loadBasic() {
  loading.value = true
  try {
    const res = await getAllConfigs()
    const map = (res && res.data && res.data.map) || {}
    Object.keys(DEFAULT_BASIC).forEach((key) => {
      basicForm[key] = decodeValue(key, map[key])
    })
  } catch (err) {
    // request 拦截器已经弹过 toast
  } finally {
    loading.value = false
  }
}

async function onSaveBasic() {
  if (!basicFormRef.value) return
  try {
    await basicFormRef.value.validate()
  } catch (_) {
    return
  }
  saving.value = true
  const configs = Object.keys(DEFAULT_BASIC).map((key) => ({
    key,
    value: encodeValue(key, basicForm[key]),
    description: FIELD_DESCRIPTIONS[key],
    type: FIELD_TYPES[key]
  }))
  try {
    await batchUpdateConfigs(configs)
    ElMessage.success('基础设置已保存')
  } catch (err) {
    // toast 已由拦截器处理
  } finally {
    saving.value = false
  }
}

function onLogoError() {
  ElMessage.warning('Logo 图片加载失败，请检查地址')
}

// 联系方式
const contactForm = reactive({
  qq: '',
  wechat: '',
  qrcode_url: '',
  notice: ''
})

const contactRules = {
  qq: [
    {
      validator: (_rule, value, cb) => {
        if (!value) return cb()
        /^\d{5,15}$/.test(value) ? cb() : cb(new Error('QQ 应为 5-15 位数字'))
      },
      trigger: 'blur'
    }
  ],
  wechat: [
    { max: 50, message: '微信号最长 50 字符', trigger: 'blur' }
  ],
  notice: [
    { max: 200, message: '公告最长 200 字符', trigger: 'blur' }
  ]
}

const contactFormRef = ref(null)

async function loadContact() {
  try {
    const res = await getContact()
    const data = (res && res.data) || {}
    contactForm.qq = data.qq || ''
    contactForm.wechat = data.wechat || ''
    contactForm.qrcode_url = data.qrcode_url || ''
    contactForm.notice = data.notice || ''
  } catch (err) {
    // 拦截器已提示
  }
}

async function onSaveContact() {
  if (!contactFormRef.value) return
  try {
    await contactFormRef.value.validate()
  } catch (_) {
    return
  }
  contactSaving.value = true
  try {
    await updateContact({
      qq: contactForm.qq,
      wechat: contactForm.wechat,
      notice: contactForm.notice,
      qrcode_url: contactForm.qrcode_url
    })
    ElMessage.success('联系方式已保存')
  } catch (err) {
    // 拦截器已提示
  } finally {
    contactSaving.value = false
  }
}

function beforeQrUpload(file) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    ElMessage.error('仅支持 jpg/png/webp')
    return false
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片不能超过 2MB')
    return false
  }
  return true
}

async function customQrUpload(opt) {
  try {
    const res = await uploadContactQrcode(opt.file)
    const url = res && res.data && res.data.qrcode_url
    if (url) {
      contactForm.qrcode_url = url
      ElMessage.success('二维码已上传')
    } else {
      ElMessage.error('上传失败：返回数据异常')
    }
  } catch (err) {
    // 拦截器已提示
  }
}

function onQrError() {
  ElMessage.warning('二维码图片加载失败')
}

onMounted(async () => {
  await Promise.all([loadBasic(), loadContact()])
})
</script>

<style scoped lang="scss">
.settings-container {
  .page-header {
    margin-bottom: 16px;

    h2 {
      margin: 0 0 4px;
      font-size: 20px;
    }

    .page-tip {
      margin: 0;
      color: #909399;
      font-size: 13px;
    }
  }

  .settings-card {
    border-radius: 6px;
  }

  .settings-form {
    max-width: 720px;
    padding-top: 8px;
  }

  .form-hint {
    margin-left: 12px;
    color: #909399;
    font-size: 12px;
  }

  .logo-preview {
    margin-top: 8px;

    img {
      max-width: 160px;
      max-height: 80px;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      padding: 4px;
      background: #fafafa;
    }
  }

  .qrcode-uploader {
    .qr-slot {
      width: 160px;
      height: 160px;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color 0.2s;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }

    .qr-preview {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 6px;
    }

    .qr-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: #909399;
      font-size: 13px;
    }
  }
}
</style>
