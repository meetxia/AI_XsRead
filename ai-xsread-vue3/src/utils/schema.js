import { DEFAULT_OG_IMAGE, SITE_DESC, SITE_NAME, SITE_URL, absoluteUrl } from './seo'

function stripEmpty(value) {
  if (Array.isArray(value)) {
    return value.map(stripEmpty).filter(item => item !== undefined)
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, item]) => {
      const next = stripEmpty(item)
      if (next !== undefined) acc[key] = next
      return acc
    }, {})
  }
  return value === undefined || value === null || value === '' ? undefined : value
}

export function buildWebSiteSchema() {
  return {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESC,
    inLanguage: 'zh-CN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?keyword={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildOrganizationSchema() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    image: DEFAULT_OG_IMAGE,
  }
}

export function buildBreadcrumbSchema(items) {
  return stripEmpty({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  })
}

export function buildBookSchema(book) {
  const rating = Number(book.rating || 0)
  const ratingCount = Number(book.ratingCount || book.commentCount || 0)

  return stripEmpty({
    '@type': 'Book',
    name: book.title,
    author: book.author ? { '@type': 'Person', name: book.author } : undefined,
    image: book.cover ? absoluteUrl(book.cover) : undefined,
    genre: book.category,
    keywords: Array.isArray(book.tags) ? book.tags.join(',') : book.tags,
    description: book.description,
    bookFormat: 'https://schema.org/EBook',
    inLanguage: 'zh-CN',
    url: absoluteUrl(book.url),
    aggregateRating: rating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: rating,
      ratingCount: ratingCount || 1,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  })
}
