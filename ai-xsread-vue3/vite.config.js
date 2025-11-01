import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    // Gzip 压缩
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // 10KB 以上才压缩
      deleteOriginFile: false
    }),
    // Brotli 压缩
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false
    }),
    // 打包分析插件
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3008,
    host: '0.0.0.0',
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8005',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 性能优化配置
    rollupOptions: {
      output: {
        // 代码分割优化
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'axios-vendor': ['axios'],
          'lodash-vendor': ['lodash-es']
        },
        // 资源文件命名优化
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].[ext]`
          } else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash].[ext]`
          } else if (/\.css$/i.test(assetInfo.name)) {
            return `css/[name]-[hash].[ext]`
          }
          return `assets/[name]-[hash].[ext]`
        }
      }
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 生产环境移除 console
        drop_debugger: true, // 移除 debugger
        pure_funcs: ['console.log', 'console.info'], // 移除特定函数调用
        passes: 2 // 多次压缩以获得更好的效果
      },
      format: {
        comments: false // 移除注释
      }
    },
    // chunk 大小警告限制
    chunkSizeWarningLimit: 800,
    // 预渲染大型依赖
    commonjsOptions: {
      transformMixedEsModules: true
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 启用资源内联
    assetsInlineLimit: 4096 // 4KB 以下的资源内联为 base64
  },
  // CSS 优化
  css: {
    // CSS 代码分割
    devSourcemap: false,
    // PostCSS 配置
    postcss: {
      plugins: []
    }
  },
  // 依赖优化
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'lodash-es'],
    exclude: []
  }
})
