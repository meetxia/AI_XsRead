import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const userState = vi.hoisted(() => ({
  userInfo: {
    id: 7,
    username: 'momo_reader',
    nickname: '桃桃',
    email: 'reader@example.com',
    avatar: ''
  },
  isLogin: true,
  updateUserInfo: vi.fn(),
  uploadAvatar: vi.fn(),
  logout: vi.fn()
}))

vi.mock('@/stores/user', () => ({
  useUserStore: () => userState
}))

vi.mock('@/stores/membership', () => ({
  useMembershipStore: () => ({
    level: 0,
    levelLabel: '普通读者',
    isActive: false,
    isPermanent: false,
    daysRemaining: 0,
    fetch: vi.fn()
  })
}))

vi.mock('@/stores/notification', () => ({
  useNotificationStore: () => ({
    unreadCount: 0,
    fetchUnreadCount: vi.fn(),
    reset: vi.fn()
  })
}))

vi.mock('@/composables/useUserStats', () => ({
  useUserStats: () => ({
    shelfCount: { value: 3 },
    readingStreak: { value: 2 },
    totalMinutes: { value: 125 },
    todayMinutes: { value: 25 },
    joinDays: { value: 18 },
    weekTrend: { value: [] },
    formatMinutes: vi.fn((minutes) => `${minutes} 分钟`),
    loadStats: vi.fn()
  })
}))

vi.mock('@/api/user', () => ({
  getFollowingAuthors: vi.fn().mockResolvedValue({ data: [] }),
  uploadAvatarApi: vi.fn(),
  updateUserProfile: vi.fn()
}))

vi.mock('@/api/interestTags', () => ({
  getMyInterestTags: vi.fn().mockResolvedValue({ data: { tags: ['甜宠'] } }),
  saveInterestTags: vi.fn()
}))

vi.mock('@/composables/useSeoMeta', () => ({
  SEO_DEFAULTS: { siteUrl: 'https://xs.example.test' },
  useSeoMeta: vi.fn()
}))

vi.mock('/logo.svg', () => ({
  default: '/logo.svg'
}))

const routerBackMock = vi.fn()
const routerPushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    back: routerBackMock,
    push: routerPushMock
  }),
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a><slot /></a>'
  }
}))

const commonStubs = {
  Icon: true,
  ThemeToggle: true,
  BottomNav: true,
  MembershipBadge: true,
  Countdown: true,
  WeekBarChart: true,
  FollowingAuthorList: true,
  ChangePasswordDialog: true,
  AvatarUploader: true,
  InterestTagPicker: true
}

const SecurityPage = (await import('@/views/SecurityPage.vue')).default
const ProfileEditPage = (await import('@/views/profile/ProfileEditPage.vue')).default
const ProfilePage = (await import('@/views/ProfilePage.vue')).default

describe('account email display', () => {
  beforeEach(() => {
    routerBackMock.mockClear()
    routerPushMock.mockClear()
  })

  it('shows the current account email on the security page', () => {
    const wrapper = mount(SecurityPage, {
      global: { stubs: commonStubs }
    })

    expect(wrapper.text()).toContain('当前邮箱')
    expect(wrapper.text()).toContain('reader@example.com')
  })

  it('shows account email as read-only information on the profile edit page', async () => {
    const wrapper = mount(ProfileEditPage, {
      global: { stubs: commonStubs }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('账号邮箱')
    expect(wrapper.text()).toContain('reader@example.com')
    const emailInputs = wrapper.findAll('input[type="email"]')
    expect(emailInputs).toHaveLength(0)
  })

  it('surfaces the account email in the main profile card', async () => {
    const wrapper = mount(ProfilePage, {
      global: { stubs: commonStubs }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('reader@example.com')
  })
})
