import service from './config'
import { doPost } from '../http/httpRequest';

// 登录 - 严格按照后端API格式
export function login(data) {
  console.log('发送登录请求，完整数据:', data)
  
  // 确保数据格式完全匹配后端期望的格式
  const loginPayload = {
    username: data.username,
    password: data.password
  }
  
  // 使用JSON格式，确保Content-Type正确设置
  return doPost('/auth/login', data)
    .then(response => {
      // 确保返回的是包含token的数据对象，而不是整个axios响应
      return response.data; 
    });
}

// 注册
export function register(data) {
  // 确保包含所有必要字段
  console.log('完整注册数据:', data)
  return service.post('/api/auth/register', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 获取当前用户信息
export function getUserInfo(userId) {
  return service.get(`/api/auth/user/${userId}`)
} 