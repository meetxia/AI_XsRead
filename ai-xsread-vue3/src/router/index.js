import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue')
    },
    {
      path: '/recommend',
      name: 'recommend',
      component: () => import('@/views/RecommendPage.vue')
    },
    {
      path: '/bookshelf',
      name: 'bookshelf',
      component: () => import('@/views/BookshelfPage.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfilePage.vue')
    },
    {
      path: '/reading/:id',
      name: 'reading',
      component: () => import('@/views/ReadingPage.vue')
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchPage.vue')
    },
    {
      path: '/novel/:id',
      name: 'novel-detail',
      component: () => import('@/views/NovelDetailPage.vue')
    },
    {
      path: '/author/:id',
      name: 'author',
      component: () => import('@/views/AuthorPage.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginPage.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterPage.vue')
    }
  ]
})

export default router

