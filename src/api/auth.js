import service from './config'

// 登录
export function login(data) {
  console.log('发送登录请求，完整数据:', data)
  // 主要尝试，用API前缀
  return service.post('/api/auth/login', data)
    .catch(error => {
      if (error.response && error.response.status === 403) {
        console.log('尝试使用不带前缀的路径')
        return service.post('/auth/login', data)
      }
      throw error
    })
}

// 注册
export function register(data) {
  // 确保包含所有必要字段
  console.log('完整注册数据:', data)
  return service.post('/api/auth/register', data)
}

// 获取当前用户信息（可选）
export function getUserInfo(userId) {
  return service.get(`/api/auth/${userId}`)
} 