<template>
  <div class="upload-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <button @click="goBack" class="back-btn">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="page-title">上传小说</h1>
      <div class="w-10"></div>
    </div>

    <div class="container">
      <!-- 上传区域 -->
      <div class="upload-section">
        <div 
          class="upload-area"
          :class="{ 'drag-over': isDragging }"
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".txt"
            multiple
            @change="handleFileSelect"
            class="file-input"
          />
          
          <div class="upload-content">
            <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <h3>拖拽TXT文件到这里</h3>
            <p>或</p>
            <button @click="triggerFileSelect" class="select-btn">
              选择文件
            </button>
            <p class="hint">支持批量上传，单个文件最大10MB</p>
          </div>
        </div>

        <!-- 文件列表 -->
        <div v-if="selectedFiles.length > 0" class="file-list">
          <h3 class="list-title">待上传文件 ({{ selectedFiles.length }})</h3>
          <div class="file-items">
            <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
              <div class="file-info">
                <svg class="file-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
                </svg>
                <div class="file-details">
                  <p class="file-name">{{ file.name }}</p>
                  <p class="file-size">{{ formatFileSize(file.size) }}</p>
                </div>
              </div>
              <button @click="removeFile(index)" class="remove-btn">×</button>
            </div>
          </div>
          
          <!-- 上传按钮 -->
          <div class="upload-actions">
            <button @click="clearFiles" class="clear-btn">清空</button>
            <button @click="startUpload" :disabled="uploading" class="upload-btn">
              <span v-if="!uploading">开始上传</span>
              <span v-else>上传中... {{ uploadProgress }}%</span>
            </button>
          </div>
        </div>

        <!-- 上传结果 -->
        <div v-if="uploadResult" class="upload-result">
          <h3 class="result-title">上传结果</h3>
          <div class="result-summary">
            <div class="summary-item success">
              <span class="label">成功</span>
              <span class="value">{{ uploadResult.successCount }}</span>
            </div>
            <div class="summary-item exists">
              <span class="label">已存在</span>
              <span class="value">{{ uploadResult.existsCount }}</span>
            </div>
            <div class="summary-item failed">
              <span class="label">失败</span>
              <span class="value">{{ uploadResult.failedCount }}</span>
            </div>
          </div>
          
          <!-- 成功列表 -->
          <div v-if="uploadResult.details.success.length > 0" class="result-list success-list">
            <h4><SvgIcon name="check-circle-fill" class="result-icon" /> 成功上传 ({{ uploadResult.details.success.length }})</h4>
            <div v-for="item in uploadResult.details.success" :key="item.novelId" class="result-item">
              <span class="item-name">{{ item.title }}</span>
              <span class="item-info">{{ item.wordCount }}字</span>
              <button @click="viewNovel(item.novelId)" class="view-btn">查看</button>
            </div>
          </div>
          
          <!-- 已存在列表 -->
          <div v-if="uploadResult.details.exists.length > 0" class="result-list exists-list">
            <h4><SvgIcon name="skip-forward-fill" class="result-icon" /> 已存在 ({{ uploadResult.details.exists.length }})</h4>
            <div v-for="item in uploadResult.details.exists" :key="item.filename" class="result-item">
              <span class="item-name">{{ item.title }}</span>
              <span class="item-info text-yellow-600">重复</span>
            </div>
          </div>
          
          <!-- 失败列表 -->
          <div v-if="uploadResult.details.failed.length > 0" class="result-list failed-list">
            <h4><SvgIcon name="x-circle-fill" class="result-icon" /> 失败 ({{ uploadResult.details.failed.length }})</h4>
            <div v-for="item in uploadResult.details.failed" :key="item.filename" class="result-item">
              <span class="item-name">{{ item.filename }}</span>
              <span class="item-info text-red-600">{{ item.reason }}</span>
            </div>
          </div>
          
          <button @click="resetUpload" class="reset-btn">继续上传</button>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="instructions">
        <h3><SvgIcon name="book" class="title-icon" /> 使用说明</h3>
        <div class="instruction-list">
          <div class="instruction-item">
            <span class="step">1</span>
            <div class="step-content">
              <h4>准备TXT文件</h4>
              <p>将小说内容保存为UTF-8编码的TXT文件，文件名即为小说标题</p>
            </div>
          </div>
          <div class="instruction-item">
            <span class="step">2</span>
            <div class="step-content">
              <h4>上传文件</h4>
              <p>拖拽文件到上传区域，或点击"选择文件"按钮</p>
            </div>
          </div>
          <div class="instruction-item">
            <span class="step">3</span>
            <div class="step-content">
              <h4>自动处理</h4>
              <p>系统会自动解析内容、生成简介、智能分类</p>
            </div>
          </div>
          <div class="instruction-item">
            <span class="step">4</span>
            <div class="step-content">
              <h4>立即可读</h4>
              <p>上传成功后，小说立即出现在网站上，读者可以阅读</p>
            </div>
          </div>
        </div>
        
        <div class="tips">
          <h4>💡 温馨提示</h4>
          <ul>
            <li>支持批量上传，最多50个文件</li>
            <li>单个文件大小限制：10MB</li>
            <li>建议字数：5000字以上</li>
            <li>文件名会自动作为小说标题</li>
            <li>系统会根据标题关键词自动分类</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SvgIcon from '@/components/common/SvgIcon.vue'
import { uploadNovel, batchUploadNovels } from '@/api/upload'

const router = useRouter()

// 文件相关
const fileInput = ref(null)
const selectedFiles = ref([])
const isDragging = ref(false)

// 上传状态
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadResult = ref(null)

// 触发文件选择
function triggerFileSelect() {
  fileInput.value.click()
}

// 文件选择处理
function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  addFiles(files)
  // 清空input，允许重复选择同一文件
  event.target.value = ''
}

// 拖拽处理
function handleDrop(event) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files).filter(f => f.name.endsWith('.txt'))
  if (files.length === 0) {
    alert('请上传TXT格式文件')
    return
  }
  addFiles(files)
}

// 添加文件
function addFiles(files) {
  for (const file of files) {
    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) {
      alert(`文件 ${file.name} 超过10MB限制`)
      continue
    }
    
    // 检查是否已添加
    const exists = selectedFiles.value.some(f => f.name === file.name && f.size === file.size)
    if (exists) {
      console.log('文件已存在:', file.name)
      continue
    }
    
    selectedFiles.value.push(file)
  }
}

// 移除文件
function removeFile(index) {
  selectedFiles.value.splice(index, 1)
}

// 清空文件
function clearFiles() {
  selectedFiles.value = []
}

// 开始上传
async function startUpload() {
  if (selectedFiles.value.length === 0) {
    alert('请选择要上传的文件')
    return
  }
  
  uploading.value = true
  uploadProgress.value = 0
  uploadResult.value = null
  
  try {
    const files = selectedFiles.value
    
    // 进度回调
    const onProgress = (progressEvent) => {
      uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    }
    
    let result
    if (files.length === 1) {
      // 单个文件上传
      result = await uploadNovel(files[0], onProgress)
      uploadResult.value = {
        total: 1,
        successCount: result.code === 200 ? 1 : 0,
        failedCount: result.code === 200 ? 0 : 1,
        existsCount: 0,
        details: {
          success: result.code === 200 ? [result.data] : [],
          failed: result.code === 200 ? [] : [{ filename: files[0].name, reason: result.message }],
          exists: []
        }
      }
    } else {
      // 批量上传
      result = await batchUploadNovels(files, onProgress)
      uploadResult.value = result.data
    }
    
    // 清空选择的文件
    selectedFiles.value = []
    
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败: ' + (error.message || '网络错误'))
  } finally {
    uploading.value = false
  }
}

// 重置上传
function resetUpload() {
  uploadResult.value = null
  uploadProgress.value = 0
}

// 查看小说
function viewNovel(novelId) {
  router.push(`/novel/${novelId}`)
}

// 返回
function goBack() {
  router.back()
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.upload-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.back-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #333;
  transition: all 0.3s;
  border-radius: 8px;
}

.back-btn:hover {
  background: rgba(0,0,0,0.05);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1rem;
}

/* 上传区域 */
.upload-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.upload-area {
  position: relative;
  border: 3px dashed #d1d5db;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f9fafb;
}

.upload-area.drag-over {
  border-color: #667eea;
  background: #eef2ff;
  transform: scale(1.02);
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  width: 64px;
  height: 64px;
  color: #667eea;
}

.upload-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.upload-content p {
  color: #666;
}

.select-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.select-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.hint {
  font-size: 0.875rem;
  color: #999;
}

/* 文件列表 */
.file-list {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f3f4f6;
}

.list-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.3s;
}

.file-item:hover {
  background: #f3f4f6;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.file-icon {
  width: 32px;
  height: 32px;
  color: #667eea;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.875rem;
  color: #999;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  line-height: 1;
}

.remove-btn:hover {
  background: #fecaca;
  transform: scale(1.1);
}

/* 上传按钮 */
.upload-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.clear-btn, .upload-btn {
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-btn {
  background: white;
  border: 2px solid #d1d5db;
  color: #666;
}

.clear-btn:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.upload-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 上传结果 */
.upload-result {
  margin-top: 2rem;
  padding: 2rem;
  background: #f0fdf4;
  border-radius: 12px;
  border: 2px solid #86efac;
}

.result-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #166534;
  margin-bottom: 1.5rem;
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-item {
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.summary-item.success {
  background: #dcfce7;
}

.summary-item.exists {
  background: #fef3c7;
}

.summary-item.failed {
  background: #fee2e2;
}

.summary-item .label {
  display: block;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.summary-item .value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
}

.result-list {
  margin-bottom: 1.5rem;
}

.result-list h4 {
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.item-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.item-info {
  font-size: 0.875rem;
  color: #666;
  margin: 0 1rem;
}

.view-btn {
  padding: 0.375rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
}

.view-btn:hover {
  background: #5568d3;
}

.reset-btn {
  width: 100%;
  padding: 0.875rem;
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 1rem;
}

.reset-btn:hover {
  background: #eef2ff;
}

/* 使用说明 */
.instructions {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.instructions h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}

.instruction-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.instruction-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content h4 {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.step-content p {
  font-size: 0.875rem;
  color: #666;
  line-height: 1.6;
}

.tips {
  padding: 1.5rem;
  background: #fef3c7;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.tips h4 {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.75rem;
}

.tips ul {
  list-style: none;
  padding: 0;
}

.tips li {
  padding: 0.375rem 0;
  color: #78350f;
  font-size: 0.9375rem;
  line-height: 1.6;
}

.tips li::before {
  content: '• ';
  color: #f59e0b;
  font-weight: bold;
  margin-right: 0.5rem;
}

/* 响应式 */
@media (max-width: 640px) {
  .container {
    padding: 0 0.5rem;
  }
  
  .upload-section, .instructions {
    padding: 1.5rem;
  }
  
  .result-summary {
    grid-template-columns: 1fr;
  }
  
  .upload-actions {
    flex-direction: column;
  }
  
  .clear-btn, .upload-btn {
    width: 100%;
  }
}
</style>

