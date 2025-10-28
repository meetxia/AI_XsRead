import request from './request'

/**
 * 上传单个TXT小说
 * @param {File} file TXT文件
 * @param {Function} onProgress 进度回调
 * @returns {Promise}
 */
export function uploadNovel(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/upload/novel',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress
  })
}

/**
 * 批量上传TXT小说
 * @param {FileList} files TXT文件列表
 * @param {Function} onProgress 进度回调
 * @returns {Promise}
 */
export function batchUploadNovels(files, onProgress) {
  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i])
  }
  
  return request({
    url: '/upload/novels/batch',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress
  })
}

/**
 * 获取我的小说列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getMyNovels(params) {
  return request({
    url: '/upload/my-novels',
    method: 'get',
    params
  })
}

