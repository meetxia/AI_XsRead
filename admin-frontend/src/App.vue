<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()

onMounted(() => {
  appStore.initDarkMode()
})
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
