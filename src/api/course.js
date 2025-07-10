import axios from './axios';

/**
 * 获取当前教师的课程列表
 * @param {Number} teacherId 教师ID
 * @returns {Promise} 课程列表数据
 */
export const getTeacherCourses = (teacherId) => {
  return axios.get(`/api/service/courses/teacher/${teacherId}`);
};

/**
 * 创建新课程
 * @param {Object} courseData 课程数据
 * @returns {Promise}
 */
export const createCourse = (courseData) => {
  return axios.post('/api/service/courses', courseData);
};

/**
 * 删除指定课程
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export const deleteCourse = (courseId) => {
  return axios.delete(`/api/service/courses/${courseId}`);
};

/**
 * 获取指定课程的章节列表
 * @param {Number} courseId 课程ID
 * @returns {Promise} 章节列表数据
 */
export const getCourseChapters = (courseId) => {
  return axios.get(`/api/service/courses/${courseId}/chapters`);
};

/**
 * 添加新章节
 * @param {Object} chapterData 章节数据
 * @returns {Promise}
 */
export const addChapter = (chapterData) => {
  return axios.post('/api/service/chapters', chapterData);
};

/**
 * 删除指定章节
 * @param {Number} chapterId 章节ID
 * @returns {Promise}
 */
export const deleteChapter = (chapterId) => {
  return axios.delete(`/api/service/chapters/${chapterId}`);
};

/**
 * 更新指定章节
 * @param {Number} chapterId 章节ID
 * @param {Object} chapterData 要更新的章节数据
 * @returns {Promise}
 */
export const updateChapter = (chapterId, chapterData) => {
  return axios.patch(`/api/service/chapters/update/${chapterId}`, chapterData);
}; 