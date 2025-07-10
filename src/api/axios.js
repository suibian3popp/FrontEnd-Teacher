import axios from 'axios';
import { getToken } from '../utils/auth';

const instance = axios.create({
  baseURL: '/',
  timeout: 10000,
  // 可根据需要添加headers等配置
});

// 添加请求拦截器，自动添加token到请求头
instance.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = getToken();
    if (token) {
      // 添加Authorization头，使用Bearer格式
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('请求添加token:', token);
      console.log('请求URL:', config.url);
      console.log('请求头:', config.headers);
    }
    return config;
  },
  error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器，处理常见错误
instance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      // 请求已发出，但服务器响应状态码不在2xx范围内
      console.error('请求失败:', {
        url: error.config.url,
        status: error.response.status,
        data: error.response.data
      });
      
      // 处理401错误 - 未授权
      if (error.response.status === 401) {
        console.error('认证失败! 请检查token是否有效');
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('无法连接到服务器:', error.request);
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance; 