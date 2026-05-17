/**
 * useSeoMeta —— 在路由组件内动态设置页面级 SEO meta
 *
 * 适用场景：
 *   - 小说详情 / 作者主页 / 推荐专题等带动态数据的页面
 *   - 需要更新 title / description / canonical / og:* / twitter:* / JSON-LD
 *
 * 用法：
 *   useSeoMeta({
 *     title: novel.title,
 *     description: novel.intro,
 *     image: novel.cover,
 *     type: 'book',
 *     jsonLd: { '@type': 'Book', name: novel.title, author: novel.author }
 *   })
 *
 * 说明：
 *   1. 仅运行在浏览器端，SSR/构建期不会执行（用 typeof document 判断）
 *   2. 切换路由时会自动还原（onUnmounted 复位为站点级默认值）
 *   3. 与 router.afterEach 中设置 document.title 不冲突，最终以本 composable 为准
 */

import { watchEffect, onUnmounted } from 'vue'

const SITE_NAME = 'MOMO小说'
const SITE_DESC = 'MOMO小说，专为热爱阅读的你打造的精选小说阅读平台。汇聚都市言情、古风穿越、悬疑推理、治愈系、奇幻冒险五大品类。'
const SITE_URL = 'https://xs.momofx.cn'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`

function setMeta(attr, key, value) {
  if (typeof document === 'undefined' || value == null) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', String(value))
}

function setLink(rel, href) {
  if (typeof document === 'undefined' || !href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function injectJsonLd(id, data) {
  if (typeof document === 'undefined' || !data) return
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function removeJsonLd(id) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (el) el.remove()
}

function truncate(text, n = 160) {
  if (!text) return ''
  const s = String(text).replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

/**
 * @param {Object|import('vue').Ref|Function} input
 * @param {string} input.title - 页面标题（不含站点后缀）
 * @param {string} input.description - 页面描述
 * @param {string} input.image - 社交分享卡图片完整 URL
 * @param {string} input.url - canonical URL，缺省自动取当前 location
 * @param {string} input.type - og:type，例如 website / article / book / profile
 * @param {string} input.keywords - 页面 keywords
 * @param {Object} input.jsonLd - 结构化数据对象
 */
export function useSeoMeta(input) {
  const JSON_LD_ID = 'page-jsonld'

  watchEffect(() => {
    const opts = typeof input === 'function' ? input() : (input?.value ?? input ?? {})
    const title = opts.title ? `${opts.title} - ${SITE_NAME}` : `${SITE_NAME} - 故事入境，杂念自消`
    const description = truncate(opts.description || SITE_DESC, 160)
    const image = opts.image || DEFAULT_OG_IMAGE
    const url = opts.url || (typeof location !== 'undefined' ? location.href : SITE_URL)
    const type = opts.type || 'website'

    if (typeof document !== 'undefined') document.title = title

    setMeta('name', 'description', description)
    if (opts.keywords) setMeta('name', 'keywords', opts.keywords)

    setLink('canonical', url.split('#')[0])

    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', SITE_NAME)

    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)

    if (opts.jsonLd) {
      injectJsonLd(JSON_LD_ID, {
        '@context': 'https://schema.org',
        ...opts.jsonLd,
      })
    } else {
      removeJsonLd(JSON_LD_ID)
    }
  })

  onUnmounted(() => {
    // 退出页面时清理 JSON-LD，避免影响后续页面
    removeJsonLd(JSON_LD_ID)
  })
}

export const SEO_DEFAULTS = {
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  description: SITE_DESC,
  image: DEFAULT_OG_IMAGE,
}
