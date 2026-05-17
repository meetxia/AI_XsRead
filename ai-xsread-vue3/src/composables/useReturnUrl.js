import { useRoute, useRouter } from 'vue-router'

export function safeReturnUrl(raw, fallback = '/') {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return fallback
  if (raw.startsWith('//') || raw.includes('://')) return fallback
  return raw
}

export function buildLoginUrl(currentPath = '/') {
  const target = safeReturnUrl(currentPath, '/')
  return `/login?returnUrl=${encodeURIComponent(target)}`
}

export function useReturnUrl() {
  const route = useRoute()
  const router = useRouter()

  const currentFullPath = () => route.fullPath || '/'

  const requireLogin = (isLogin, next) => {
    if (isLogin) return next?.()
    return router.push(buildLoginUrl(currentFullPath()))
  }

  const resolveReturnUrl = () => safeReturnUrl(route.query.returnUrl || route.query.redirect || '/')

  return {
    buildLoginUrl,
    safeReturnUrl,
    requireLogin,
    resolveReturnUrl,
  }
}

export default useReturnUrl
