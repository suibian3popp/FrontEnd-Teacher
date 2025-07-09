import axios from 'axios';

const instance = axios.create({
  baseURL: '/',
  timeout: 10000,
  // 可根据需要添加headers等配置
});

export default instance; 