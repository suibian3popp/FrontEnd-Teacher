import service from './config'
import { doPost } from '../http/httpRequest';

// 登录 - 严格按照后端API格式
export function login(data) {
  console.log('发送登录请求，原始数据:', data)
  
  // 确保数据格式完全匹配后端期望的格式
  const loginPayload = {
    username: data.username,
    password: data.password
  };
  
  console.log('发送登录请求，清理后的数据:', loginPayload);
  
  // 使用清理后的数据
  return doPost('/auth/login', loginPayload)
    .then(response => {
      // 检查：如果doPost已经处理了.data，这里就不需要了。
      // 但根据我们之前的约定，doPost返回整个response，所以这里需要.data
      if (response && response.data) {
        return response.data;
      }
      // 兼容doPost直接返回数据的情况
      return response;
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