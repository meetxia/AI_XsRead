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
import {
  DEFAULT_OG_IMAGE,
  SITE_DESC,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
  canonicalUrl,
  normalizeRobots,
  pageTitle,
  truncate,
} from '@/utils/seo'

const JSON_LD_PREFIX = 'page-jsonld'

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

function removeMeta(attr, key) {
  if (typeof document === 'undefined') return
  const el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (el) el.remove()
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

function normalizeJsonLd(data) {
  if (!data) return []
  return (Array.isArray(data) ? data : [data]).filter(Boolean).map(item => ({
    '@context': 'https://schema.org',
    ...item,
  }))
}

function removeJsonLd() {
  if (typeof document === 'undefined') return
  document.head.querySelectorAll(`script[id^="${JSON_LD_PREFIX}"]`).forEach(el => el.remove())
}

function injectJsonLd(data) {
  if (typeof document === 'undefined') return
  removeJsonLd()
  normalizeJsonLd(data).forEach((item, index) => {
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = `${JSON_LD_PREFIX}-${index}`
    el.textContent = JSON.stringify(item)
    document.head.appendChild(el)
  })
}

function getLocationHref() {
  if (typeof location === 'undefined') return SITE_URL
  return location.href
}

function applyDefaults() {
  const title = `${SITE_NAME} - ${SITE_TAGLINE}`
  const url = canonicalUrl(getLocationHref())
  if (typeof document !== 'undefined') document.title = title
  setMeta('name', 'description', SITE_DESC)
  setMeta('name', 'robots', 'index,follow')
  removeMeta('name', 'keywords')
  setLink('canonical', url)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', SITE_DESC)
  setMeta('property', 'og:image', DEFAULT_OG_IMAGE)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:site_name', SITE_NAME)
  setMeta('property', 'og:locale', 'zh_CN')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', SITE_DESC)
  setMeta('name', 'twitter:image', DEFAULT_OG_IMAGE)
}

function resolveInput(input) {
  if (typeof input === 'function') return input() || {}
  return input?.value ?? input ?? {}
}

/**
 * @param {Object|import('vue').Ref|Function} input
 * @param {string} input.title - 页面标题（不含站点后缀）
 * @param {string} input.description - 页面描述
 * @param {string} input.image - 社交分享卡图片完整 URL
 * @param {string} input.url - canonical URL，缺省自动取当前 location
 * @param {string} input.type - og:type，例如 website / article / book / profile
 * @param {string} input.robots - robots 指令，例如 index,follow / noindex,follow
 * @param {string} input.keywords - 页面 keywords
 * @param {Object|Object[]} input.jsonLd - 结构化数据对象或对象数组
 */
export function useSeoMeta(input) {
  watchEffect(() => {
    const opts = resolveInput(input)
    const title = pageTitle(opts.title)
    const description = truncate(opts.description || SITE_DESC, 160)
    const image = absoluteUrl(opts.image || DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE)
    const url = canonicalUrl(opts.url || getLocationHref())
    const type = opts.type || 'website'
    const robots = normalizeRobots(opts.robots)

    if (typeof document !== 'undefined') document.title = title

    setMeta('name', 'description', description)
    setMeta('name', 'robots', robots)
    if (opts.keywords) setMeta('name', 'keywords', opts.keywords)
    else removeMeta('name', 'keywords')

    setLink('canonical', url)

    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:locale', 'zh_CN')

    setMeta('name', 'twitter:card', opts.twitterCard || 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)

    injectJsonLd(opts.jsonLd || opts.structuredData)
  })

  onUnmounted(() => {
    removeJsonLd()
    applyDefaults()
  })
}

export const SEO_DEFAULTS = {
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  description: SITE_DESC,
  image: DEFAULT_OG_IMAGE,
}
