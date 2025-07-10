// token管理
export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  localStorage.setItem('token', token)
}

export function removeToken() {
  localStorage.removeItem('token')
}

// 用户信息管理
export function getUser() {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user))
}

export function removeUser() {
  localStorage.removeItem('user')
}

// 添加调试函数，验证token是否存在且有效
export function checkAuthStatus() {
  const token = getToken();
  const user = getUser();
  
  console.log('=== 认证状态检查 ===');
  console.log('Token存在:', !!token);
  if (token) {
    console.log('Token值:', token);
    console.log('Token长度:', token.length);
    
    // 解析JWT结构(不验证签名)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Token payload:', payload);
        console.log('过期时间:', new Date(payload.exp * 1000).toLocaleString());
        
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          console.warn('⚠️ Token已过期!');
        } else {
          console.log('✅ Token有效');
        }
      }
    } catch (e) {
      console.log('无法解析Token，可能不是标准JWT格式');
    }
  }
  
  console.log('用户信息存在:', !!user);
  if (user) {
    console.log('用户信息:', user);
  }
  
  return { token, user };
} 