import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import {createPinia} from "pinia"
import axios from 'axios'
import { getToken } from './utils/auth'

// 全局配置 axios，确保所有请求都带有 token
axios.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => {
    console.error('全局请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

const app = createApp(App)
// 注册 pinia
app.use(createPinia());

app.use(router)
app.use(ElementPlus)
app.mount('#app')
