import request from '@/utils/request'

/**
 * 系统配置（system_config）
 */
export function getAllConfigs() {
  return request({
    url: '/admin/system/configs',
    method: 'get'
  })
}

export function getConfigByKey(key) {
  return request({
    url: `/admin/system/configs/${encodeURIComponent(key)}`,
    method: 'get'
  })
}

export function updateConfig(key, data) {
  return request({
    url: `/admin/system/configs/${encodeURIComponent(key)}`,
    method: 'put',
    data
  })
}

export function batchUpdateConfigs(configs) {
  return request({
    url: '/admin/system/configs',
    method: 'put',
    data: { configs }
  })
}

/**
 * 客服信息（system_contact）
 */
export function getContact() {
  return request({
    url: '/admin/system/contact',
    method: 'get'
  })
}

export function updateContact(data) {
  return request({
    url: '/admin/system/contact',
    method: 'put',
    data
  })
}

/**
 * 客服二维码上传（FormData）
 * 注意：Content-Type 设为 undefined，让 axios 根据 FormData 自动追加 boundary
 */
export function uploadContactQrcode(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/admin/system/contact/qrcode',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': undefined
    }
  })
}
