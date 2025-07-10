import axios from 'axios'
import { getToken } from '../utils/auth'

// API基础URL，使用空字符串让请求通过Vite代理转发
export const BASE_URL = ''

// 创建axios实例
const service = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,  // 增加超时时间
  withCredentials: false, // 关闭跨域凭据以避免CORS预检请求问题
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 请求拦截器
service.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    // 尝试不使用Bearer前缀
    config.headers['Authorization'] = `Bearer ${token}`
  }
  
  // 确保所有请求都有正确的Content-Type
  if (config.method === 'post' || config.method === 'put') {
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
  }
  
  // 调试信息 - 打印完整的请求信息
  console.log(`[API] 请求详情:`, { 
    url: config.url,
    method: config.method?.toUpperCase() || 'GET',
    headers: config.headers,
    data: config.data,
    params: config.params
  })
  
  return config
}, error => {
  console.error('请求拦截器错误:', error)
  return Promise.reject(error)
})

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 调试响应数据
    console.log(`[API] 响应详情:`, {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    })
    
    // 直接返回响应数据，不做额外处理
    return response.data
  },
  error => {
    // 详细记录错误信息
    const errorInfo = {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data
    }
    console.error('[API] 请求错误详情:', errorInfo)
    
    // 不做额外处理，直接抛出原始错误
    return Promise.reject(error)
  }
)

export default service 