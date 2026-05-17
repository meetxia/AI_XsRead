import { defineStore } from 'pinia'
import { useReadingSettings } from '@/composables/useReadingSettings'

export const useReadingSettingsStore = defineStore('readingSettings', () => {
  const readingSettings = useReadingSettings()
  return readingSettings
})
