import axios from './axios';

/**
 * 获取助教列表
 * @returns {Promise} 助教用户列表
 */
export const getAssistants = () => {
  return axios.get('/api/users/assistants');
}; 