<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

// 触发 useTheme 的 watchEffect，确保浅深模式跨页同步
useTheme()

const router = useRouter()
const route = useRoute()

const cachedViews = computed(() =>
  router.getRoutes()
    .filter(r => r.meta?.keepAlive)
    .map(r => r.name)
)
</script>

<template>
  <router-view v-slot="{ Component, route: r }">
    <transition name="fade" mode="out-in">
      <keep-alive :include="cachedViews">
        <component :is="Component" :key="r.path" />
      </keep-alive>
    </transition>
  </router-view>
</template>

<style>
html, body, #app {
  width: 100%;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

/* 路由切换淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
