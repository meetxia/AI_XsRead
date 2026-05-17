import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMembership, activateMembership, getContact } from '@/api/membership'

/**
 * 会员体系 Pinia store
 *
 * - state: level / levelLabel / expiresAt / isActive / isPermanent / daysRemaining / status
 *   contact: { qq, wechat, qrcodeUrl, notice }
 * - actions: fetch / activate / loadContact / reset
 *
 * 设计取舍：
 * - 不在 user 登录后强制拉取，由需要会员状态的页面自己 ensure（onMounted 调 fetch；
 *   loaded 已经为 true 的话 fetch 内部直接 return），避免侵入 App.vue / userStore。
 * - 401（包括"匿名调"和"token 已过期"）一律视为非会员状态，不抛错，让页面照常渲染。
 */
export const useMembershipStore = defineStore('membership', () => {
  // ─── 会员状态 ───
  const level = ref(0)            // 0 普通 / 1 月卡 / 2 年卡 / 3 永久
  const levelLabel = ref('普通用户')
  const expiresAt = ref(null)     // ISO string，永久会员通常是 2099-12-31
  const isActive = ref(false)
  const isPermanent = ref(false)
  const daysRemaining = ref(0)
  const status = ref(1)           // vip_status: 1 正常 / 0 被管理员停用

  // 是否拉取过（避免每次进 page 重复请求）
  const loaded = ref(false)
  const loading = ref(false)

  // ─── 客服联系 ───
  const contact = ref({
    qq: '',
    wechat: '',
    qrcodeUrl: '',
    notice: ''
  })
  const contactLoaded = ref(false)
  const contactLoading = ref(false)

  // ─── 派生 ───
  const isMember = computed(() => isActive.value || isPermanent.value)
  const showRenewWarning = computed(
    () => !isPermanent.value && isActive.value && daysRemaining.value > 0 && daysRemaining.value <= 7
  )

  function applyMembershipPayload(data) {
    if (!data) return
    level.value = Number(data.vip_level ?? data.vipLevel ?? 0) || 0
    levelLabel.value = data.vip_level_label || data.vipLevelLabel || labelFromLevel(level.value)
    expiresAt.value = data.vip_expires_at ?? data.vipExpiresAt ?? null
    isActive.value = Boolean(data.is_active ?? data.isActive ?? false)
    isPermanent.value = Boolean(data.is_permanent ?? data.isPermanent ?? (level.value === 3))
    daysRemaining.value = Number(data.days_remaining ?? data.daysRemaining ?? 0) || 0
    status.value = Number(data.vip_status ?? data.vipStatus ?? 1)
    if (isPermanent.value) {
      isActive.value = true
    }
  }

  function labelFromLevel(lv) {
    switch (lv) {
      case 1: return '月卡会员'
      case 2: return '年卡会员'
      case 3: return '永久会员'
      default: return '普通用户'
    }
  }

  function reset() {
    level.value = 0
    levelLabel.value = '普通用户'
    expiresAt.value = null
    isActive.value = false
    isPermanent.value = false
    daysRemaining.value = 0
    status.value = 1
    loaded.value = false
  }

  /**
   * 拉取会员状态
   * @param {Object} options
   * @param {boolean} [options.force=false] 强制刷新
   */
  async function fetch({ force = false } = {}) {
    if (loaded.value && !force) return
    if (loading.value) return
    loading.value = true
    try {
      const res = await getMembership()
      if (res?.code === 200 && res.data) {
        applyMembershipPayload(res.data)
      }
      loaded.value = true
    } catch (error) {
      // 401（匿名 / token 失效）→ 视作非会员，不抛
      const status = error?.response?.status
      if (status === 401) {
        reset()
        loaded.value = true
        return
      }
      if (import.meta.env.DEV) {
        console.warn('[membership] fetch failed', error)
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 激活会员
   * @param {string} code
   * @param {'profile'|'reading_wall'|'register'} [channel='profile']
   * @returns 后端返回的 data（含 days_added 等），失败原样抛出
   */
  async function activate(code, channel = 'profile') {
    const res = await activateMembership({ code, channel })
    if (res?.code === 200 && res.data) {
      applyMembershipPayload(res.data)
      loaded.value = true
    }
    return res?.data || null
  }

  async function loadContact({ force = false } = {}) {
    if (contactLoaded.value && !force) return
    if (contactLoading.value) return
    contactLoading.value = true
    try {
      const res = await getContact()
      if (res?.code === 200 && res.data) {
        contact.value = {
          qq: res.data.qq || '',
          wechat: res.data.wechat || '',
          qrcodeUrl: res.data.qrcode_url || res.data.qrcodeUrl || '',
          notice: res.data.notice || ''
        }
      }
      contactLoaded.value = true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[membership] loadContact failed', error)
      }
    } finally {
      contactLoading.value = false
    }
  }

  return {
    // state
    level,
    levelLabel,
    expiresAt,
    isActive,
    isPermanent,
    daysRemaining,
    status,
    loaded,
    loading,
    contact,
    contactLoaded,
    contactLoading,

    // getters
    isMember,
    showRenewWarning,

    // actions
    fetch,
    activate,
    loadContact,
    reset,
    applyMembershipPayload
  }
})
