// vite.config.js
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // 将所有/api开头的请求代理到后端服务
      '/api': {
        target: 'http://localhost:8080',  // 后端网关地址
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          // 详细的请求日志
          proxy.on('error', (err, req, res) => {
            console.error('代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 在转发请求前记录详细信息
            console.log('正在代理请求:', {
              method: req.method,
              url: req.url,
              headers: req.headers,
              target: options.target + req.url
            });
            
            // 确保Content-Type正确传递
            if (req.body) {
              console.log('请求体:', req.body);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 记录代理响应信息
            console.log('收到代理响应:', {
              status: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers
            });
          });
        }
      }
    }
  },
  plugins: [
    vue(),
    vueDevTools()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
