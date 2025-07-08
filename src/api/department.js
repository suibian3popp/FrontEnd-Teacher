import axios from './axios';

/**
 * 获取所有院系的列表
 * @returns {Promise} 院系列表数据
 */
export const getDepartments = () => {
  return axios.get('/api/departments');
}; 