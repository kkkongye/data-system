import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',  // 添加基础路径配置
  server: {
    open: true // 自动打开浏览器
  }
})
