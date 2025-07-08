import axios from 'axios'

// API基础URL，使用空字符串避免路径重叠
export const BASE_URL = ''

// 创建axios实例
const service = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true, // 启用跨域请求时发送凭据
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 请求拦截器（可加token）
service.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token
  }
  
  // 防止CSRF攻击，添加XSRF令牌
  const xsrfToken = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (xsrfToken) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken[1]);
  }
  
  // 打印请求信息，方便调试
  console.log('发送请求:', config.method.toUpperCase(), config.url, config.data || config.params)
  
  return config
}, error => {
  console.error('请求拦截器错误:', error)
  return Promise.reject(error)
})

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 打印响应数据，方便调试
    console.log('请求成功:', response.config.url, response.data)
    return response.data
  },
  error => {
    // 详细记录错误信息
    console.error('API请求错误:', error.response ? {
      url: error.config?.url,
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : error.message || error)
    
    return Promise.reject(error)
  }
)

export default service 