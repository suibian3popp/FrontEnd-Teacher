import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios';
import {createPinia} from "pinia";

const instance = axios.create({
  baseURL: 'http://localhost:8082/api', // 端口号8082，api为统一前缀
  timeout: 10000,
  // 如果有token，可以在这里加headers
});

export default instance;
const app = createApp(App)
// 注册 pinia
app.use(createPinia());

app.use(router)
app.use(ElementPlus)
app.mount('#app')