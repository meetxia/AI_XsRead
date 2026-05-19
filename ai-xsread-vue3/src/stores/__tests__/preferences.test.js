import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/preferences', () => ({
  getMyPreferences: vi.fn(),
  updateMyPreferences: vi.fn(),
}))

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  changePassword: vi.fn(),
}))

vi.mock('@/api/user', () => ({
  uploadAvatarApi: vi.fn(),
  updateUserProfile: vi.fn(),
}))

import { usePreferencesStore } from '@/stores/preferences'
import { updateMyPreferences } from '@/api/preferences'

const LOCAL_KEY = 'xs:preferences'

describe('preferences store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('updates locally without calling API when logged out', () => {
    const preferences = usePreferencesStore()

    preferences.update({
      fontSize: 18,
      lineHeight: 2,
      theme: 'night',
      pageMode: 'page',
      eyeProtection: true,
    })

    expect(updateMyPreferences).not.toHaveBeenCalled()
    expect(preferences.snapshot).toEqual({
      fontSize: 18,
      lineHeight: 2,
      theme: 'night',
      pageMode: 'page',
      eyeProtection: true,
    })
    expect(JSON.parse(localStorage.getItem(LOCAL_KEY))).toEqual(preferences.snapshot)
  })

  it('normalizes decimal font size to an integer before storing locally', () => {
    const preferences = usePreferencesStore()

    preferences.update({ fontSize: 18.6 })

    expect(preferences.fontSize).toBe(19)
    expect(JSON.parse(localStorage.getItem(LOCAL_KEY)).fontSize).toBe(19)
  })

  it('falls back to default theme and page mode for invalid values', () => {
    const preferences = usePreferencesStore()

    preferences.update({ theme: 'ocean', pageMode: 'flipbook' })

    expect(preferences.theme).toBe('cream')
    expect(preferences.pageMode).toBe('scroll')
    expect(JSON.parse(localStorage.getItem(LOCAL_KEY))).toMatchObject({
      theme: 'cream',
      pageMode: 'scroll',
    })
  })
})
