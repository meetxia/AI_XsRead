export const SITE_NAME = 'MOMO小说'
export const SITE_TAGLINE = '故事入境，杂念自消'
export const SITE_DESC = 'MOMO小说，专为热爱阅读的你打造的精选小说阅读平台。汇聚都市言情、古风穿越、悬疑推理、治愈系、奇幻冒险五大品类。'
export const SITE_URL = 'https://xs.momofx.cn'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`

export function truncate(text, max = 160) {
  if (!text) return ''
  const value = String(text).replace(/\s+/g, ' ').trim()
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function absoluteUrl(value, fallback = SITE_URL) {
  if (!value) return fallback
  try {
    return new URL(String(value), SITE_URL).toString()
  } catch (e) {
    return fallback
  }
}

export function canonicalUrl(value) {
  const url = absoluteUrl(value)
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    return parsed.toString()
  } catch (e) {
    return SITE_URL
  }
}

export function pageTitle(title) {
  const clean = truncate(title, 80)
  return clean ? `${clean} - ${SITE_NAME}` : `${SITE_NAME} - ${SITE_TAGLINE}`
}

export function normalizeRobots(value, fallback = 'index,follow') {
  if (value === false || value === 'noindex') return 'noindex,follow'
  if (value === true || !value) return fallback
  return String(value)
}
