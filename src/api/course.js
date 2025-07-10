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


/**
 * 创建直播会话
 * @param {Object} data 直播数据
 * @param {string} data.sessionTitle 直播标题
 * @param {number} data.teacherId 教师ID
 * @param {number} data.maxUsers 最大用户数
 * @param {number} data.courseId 课程ID
 * @returns {Promise} 创建的直播会话
 */
export const createLiveSession = (data) => {
  return axios.post('/api/service/live-sessions/create', {
    sessionTitle: data.sessionTitle,
    teacherId: data.teacherId,
    maxUsers: data.maxUsers,
    courseId: data.courseId
  });
};

/**
 * 开始直播会话
 * @param {number} sessionId 直播会话ID
 * @returns {Promise}
 */
export const startLiveSession = (sessionId) => {
  return axios.put(`/api/service/live-sessions/${sessionId}/start`);
};

/**
 * 获取TRTC参数
 * @param {number} sessionId 直播会话ID
 * @param {number} userId 用户ID
 * @param {string} role 用户角色 (teacher/student)
 * @returns {Promise} TRTC参数
 */
export const getTrtcParams = (sessionId, userId, role) => {
  return axios.get(`/api/service/live-sessions/${sessionId}/trtc-params`, {
    params: { userId, role }
  });
};

/**
 * 获取TRTC参数
 * @param {number} userId 用户ID
 * @param {string} role 用户角色 (teacher/student)
 * @returns {Promise} TRTC参数
 */
export const getTrtcParams_1 = (userId, role) => {
  return axios.get(`/api/service/live-sessions/trtc-params`, {
    params: { userId, role }
  });
};