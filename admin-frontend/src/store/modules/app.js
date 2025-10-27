import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarOpened: true,
    darkMode: false,
    pageLoading: false
  }),

  getters: {
    isSidebarOpened: (state) => state.sidebarOpened,
    isDarkMode: (state) => state.darkMode
  },

  actions: {
    toggleSidebar() {
      this.sidebarOpened = !this.sidebarOpened
    },

    closeSidebar() {
      this.sidebarOpened = false
    },

    openSidebar() {
      this.sidebarOpened = true
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode
      if (this.darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('darkMode', this.darkMode)
    },

    initDarkMode() {
      const darkMode = localStorage.getItem('darkMode')
      if (darkMode === 'true') {
        this.darkMode = true
        document.documentElement.classList.add('dark')
      }
    },

    setPageLoading(loading) {
      this.pageLoading = loading
    }
  }
})

