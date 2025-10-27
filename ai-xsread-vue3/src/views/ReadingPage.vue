<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-center text-green-600 mb-8">
        📖 阅读页面
      </h1>
      <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p class="text-gray-600">阅读页面开发中...</p>
        <p class="text-sm text-gray-500 mt-2">小说ID: {{ $route.params.id }}</p>
        <router-link to="/" class="inline-block mt-4 text-green-600 hover:underline">
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// 阅读页面逻辑
</script>

