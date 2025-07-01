<template>
  <!-- 课程管理主容器 -->
  <div class="course-management">
    <!-- 课程管理头部区域 - 包含创建按钮、搜索框和视图切换 -->
    <div class="course-header">
      <div class="header-left">
        <!-- 创建课程按钮 -->
        <el-button type="primary" @click="showCreateModal = true">
          <el-icon class="el-icon--left"><Plus /></el-icon>创建课程
        </el-button>
        <!-- 搜索输入框 -->
        <el-input
          v-model="searchKeyword"
          placeholder="搜索课程"
          prefix-icon="Search"
          class="search-input"
        />
        <!-- 课程类型筛选 -->
        <el-radio-group v-model="courseTypeFilter" size="small">
          <el-radio-button value="all">全部课程</el-radio-button>
          <el-radio-button value="live">直播课程</el-radio-button>
          <el-radio-button value="recorded">录播课程</el-radio-button>
        </el-radio-group>
      </div>
      <!-- 视图模式切换 (网格/列表) -->
      <div class="view-toggle">
        <el-button-group>
          <el-button 
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            @click="viewMode = 'grid'"
            :icon="Grid"
          />
          <el-button 
            :type="viewMode === 'list' ? 'primary' : 'default'"
            @click="viewMode = 'list'"
            :icon="List"
          />
        </el-button-group>
      </div>
    </div>

    <!-- 课程列表区域 - 根据视图模式显示不同布局 -->
    <div :class="['course-list', viewMode === 'grid' ? 'grid-mode' : 'list-mode']">
      <!-- 遍历显示每个课程卡片 -->
      <el-card 
        v-for="course in filteredCourses" 
        :key="course.id"
        :body-style="{ padding: '0px' }"
        shadow="hover"
        class="course-card"
        @click="openCourseDetail(course)"
      >
        <!-- 课程卡片内容 -->
        <div :class="['card-content', viewMode === 'list' ? 'list-layout' : '']">
          <!-- 课程封面图片 -->
          <div class="course-image">
            <el-image 
              :src="course.cover" 
              :alt="course.name" 
              fit="cover"
            />
          </div>
          <!-- 课程信息区域 -->
          <div class="course-info">
            <!-- 课程标题和操作按钮 -->
            <div class="info-header">
              <div>
                <h3 class="course-name">{{ course.name }}</h3>
                <p class="assistant-info">
                  <el-icon><User /></el-icon>
                  助教：{{ course.assistant }}
                </p>
              </div>
              <!-- 编辑和删除按钮 -->
              <div class="course-actions">
                <el-button 
                  type="info" 
                  circle 
                  @click.stop="editCourse(course)"
                  :icon="Edit"
                  size="small"
                />
                <el-button 
                  type="danger" 
                  circle 
                  @click.stop="deleteCourse(course)"
                  :icon="Delete"
                  size="small"
                />
              </div>
            </div>
            <div class="course-stats">
              <el-tag :type="course.status === '进行中' ? 'success' : 'info'" size="small">{{ course.status }}</el-tag>
              <el-tag 
                :type="course.courseType === 'live' ? 'danger' : 'warning'" 
                size="small"
                class="ml-2"
              >
                {{ course.courseType === 'live' ? '直播' : '录播' }}
              </el-tag>
              <span class="chapter-count">
                <el-icon><Reading /></el-icon>
                {{ course.chapters.length }} 章节
              </span>
            </div>
            <!-- 课程时间信息 -->
            <div class="course-time-info">
              <p v-if="course.startTime" class="time-info">
                <el-icon><Calendar /></el-icon>
                开始: {{ formatDateTime(course.startTime) }}
              </p>
              <p v-if="course.endTime" class="time-info">
                <el-icon><Clock /></el-icon>
                结束: {{ formatDateTime(course.endTime) }}
              </p>
            </div>
            <div class="course-action-button">
              <el-button 
                :type="course.courseType === 'live' ? 'danger' : 'success'"
                size="small"
                @click.stop="handleCourseAction(course)"
              >
                <el-icon class="el-icon--left">
                  <VideoCamera v-if="course.courseType === 'live'" />
                  <Upload v-else />
                </el-icon>
                {{ course.courseType === 'live' ? '开始直播' : '上传录播' }}
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 创建课程的对话框 -->
    <el-dialog
      v-model="showCreateModal"
      title="创建课程"
      width="500px"
    >
      <!-- 创建课程的表单 -->
      <el-form :model="newCourse" label-position="top">
        <el-form-item label="课程名称" required>
          <el-input v-model="newCourse.course_name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="课程类型">
          <el-select v-model="newCourse.course_type" placeholder="请选择课程类型" class="w-100">
            <el-option label="录播课程" value="recorded" />
            <el-option label="直播课程" value="live" />
          </el-select>
        </el-form-item>
        <el-form-item label="助教">
          <el-select v-model="newCourse.assistant_id" placeholder="请选择助教" class="w-100">
            <el-option
              v-for="assistant in assistants"
              :key="assistant.id"
              :label="assistant.name"
              :value="assistant.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="课程封面">
          <el-input v-model="newCourse.cover_image" placeholder="请输入课程封面图片URL" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="newCourse.start_time"
            type="datetime"
            placeholder="请选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-100"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="newCourse.end_time"
            type="datetime"
            placeholder="请选择结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-100"
          />
        </el-form-item>
      </el-form>
      <!-- 对话框底部按钮 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateModal = false">取消</el-button>
          <el-button type="primary" @click="createCourse" :loading="loading">确认创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 录播上传对话框 -->
    <el-dialog
      v-model="showUploadModal"
      title="上传课程录播"
      width="500px"
    >
      <div v-if="currentCourse">
        <h3 class="upload-course-title">{{ currentCourse.name }}</h3>
        
        <!-- 上传组件 -->
        <el-upload
          class="upload-container"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持MP4格式视频文件，单个文件不超过2GB
            </div>
          </template>
        </el-upload>

        <!-- 章节信息 -->
        <el-form label-position="top" class="upload-form">
          <el-form-item label="章节标题">
            <el-input v-model="uploadForm.title" placeholder="请输入章节标题" />
          </el-form-item>
          <el-form-item label="章节简介">
            <el-input 
              v-model="uploadForm.description" 
              type="textarea" 
              rows="3"
              placeholder="请输入章节简介" 
            />
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 对话框底部按钮 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadModal = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="uploadVideo" 
            :loading="uploadLoading"
            :disabled="!selectedFile"
          >
            上传视频
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 直播准备对话框 -->
    <el-dialog
      v-model="showLiveModal"
      title="准备开始直播"
      width="500px"
    >
      <div v-if="currentCourse" class="live-preparation">
        <h3 class="live-course-title">{{ currentCourse.name }}</h3>
        
        <div class="live-camera-preview">
          <div class="camera-placeholder">
            <el-icon :size="64"><VideoCamera /></el-icon>
            <p>摄像头预览</p>
          </div>
        </div>

        <el-form label-position="top" class="live-form">
          <el-form-item label="直播标题">
            <el-input 
              v-model="liveForm.title" 
              placeholder="请输入直播标题"
              :maxlength="50"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="直播简介">
            <el-input 
              v-model="liveForm.description" 
              type="textarea" 
              rows="3"
              placeholder="请输入直播简介" 
              :maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 对话框底部按钮 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLiveModal = false">取消</el-button>
          <el-button 
            type="danger" 
            @click="startLive" 
            :loading="liveLoading"
          >
            开始直播
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 课程详情对话框 -->
    <el-dialog
      v-model="showCourseDetail"
      :title="currentCourse ? currentCourse.name : '课程详情'"
      width="85%"
      top="5vh"
      destroy-on-close
      @close="currentCourse = null"
    >
      <CourseDetail 
        v-if="currentCourse"
        :course="currentCourse" 
        @update:course="handleCourseUpdate"
      />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Plus, 
  Search, 
  User, 
  Edit, 
  Delete,
  Reading,
  Grid,
  List,
  Calendar,
  Clock,
  VideoCamera,
  Upload
} from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import CourseDetail from '../components/CourseDetail.vue';
// import axios from 'axios';

// 视图模式状态，默认为网格模式
const viewMode = ref('grid');
// 搜索关键词
const searchKeyword = ref('');
// 课程类型筛选，默认显示全部
const courseTypeFilter = ref('all');
// 控制创建课程对话框的显示状态
const showCreateModal = ref(false);
// 控制录播上传对话框的显示状态
const showUploadModal = ref(false);
// 控制直播准备对话框的显示状态
const showLiveModal = ref(false);
// 控制课程详情对话框的显示状态
const showCourseDetail = ref(false);
// 当前选中的课程
const currentCourse = ref(null);
// 选中的上传文件
const selectedFile = ref(null);
// 上传加载状态
const uploadLoading = ref(false);
// 直播加载状态
const liveLoading = ref(false);
// 上传表单
const uploadForm = ref({
  title: '',
  description: ''
});
// 直播表单
const liveForm = ref({
  title: '',
  description: ''
});

// 新课程表单数据
const newCourse = ref({
  course_name: '',
  course_type: 'recorded',
  assistant_id: null,
  cover_image: '',
  start_time: '',
  end_time: ''
});

// 助教列表
const assistants = ref([]);
// 加载状态
const loading = ref(false);

// 课程数据列表
const courses = ref([
  {
    id: 1,
    name: '高等数学（一）',
    assistant: '张三',
    cover: 'https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png',
    status: '进行中',
    courseType: 'recorded',
    startTime: '2024-03-01 09:00',
    endTime: '2024-07-01 18:00',
    chapters: [
      { 
        chapter_id: 1, 
        course_id: 1, 
        chapter_name: '课程介绍', 
        resources: [
          { id: 101, name: '课程大纲.pdf', type: 'pdf', size: '2.5MB', uploadTime: '2024-07-28' },
          { id: 102, name: '介绍视频.mp4', type: 'video', size: '156MB', uploadTime: '2024-07-28' }
        ]
      },
      { 
        chapter_id: 2, 
        course_id: 1, 
        chapter_name: '集合与函数', 
        resources: [
          { id: 201, name: '集合的概念.pdf', type: 'pdf', size: '3.1MB', uploadTime: '2024-07-29' }
        ]
      },
      { 
        chapter_id: 3, 
        course_id: 1, 
        chapter_name: '极限与连续', 
        resources: [] 
      }
    ]
  },
  {
    id: 2,
    name: '线性代数',
    assistant: '张晓峰',
    status: '已结束',
    courseType: 'live',
    startTime: '2023-09-01 14:00',
    endTime: '2024-01-15 16:00',
    chapters: []
  },
  {
    id: 3,
    name: '概率论与数理统计',
    assistant: '陈雨婷',
    status: '进行中',
    courseType: 'recorded',
    startTime: '2024-03-01 09:00',
    endTime: '2024-07-01 18:00',
    chapters: []
  }
]);

// 根据搜索关键词和课程类型过滤课程列表
const filteredCourses = computed(() => {
  let result = courses.value;
  
  // 按关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(course => 
      course.name.toLowerCase().includes(keyword) ||
      course.assistant.toLowerCase().includes(keyword)
    );
  }
  
  // 按课程类型过滤
  if (courseTypeFilter.value !== 'all') {
    result = result.filter(course => course.courseType === courseTypeFilter.value);
  }
  
  return result;
});

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 页面加载时获取助教列表
onMounted(() => {
  fetchAssistants();
});

// 获取助教列表的方法
const fetchAssistants = async () => {
  try {
    // 在实际应用中，应该替换为真实的API地址
    // const response = await axios.get('/api/assistants');
    // assistants.value = response.data.data;
    
    // 模拟数据
    assistants.value = [
      { id: 1, name: '李思琪' },
      { id: 2, name: '张晓峰' },
      { id: 3, name: '陈雨婷' },
      { id: 4, name: '王明辉' },
      { id: 5, name: '林小雨' }
    ];
  } catch (error) {
    console.error('获取助教列表失败:', error);
    ElMessage.error('获取助教列表失败');
  }
};

// 创建新课程的方法
const createCourse = async () => {
  // 表单验证
  if (!newCourse.value.course_name) {
    ElMessage.warning('请输入课程名称');
    return;
  }

  try {
    loading.value = true;
    
    // 准备请求数据
    const courseData = {
      course_name: newCourse.value.course_name,
      course_type: newCourse.value.course_type,
      assistant_id: newCourse.value.assistant_id,
      cover_image: newCourse.value.cover_image,
      start_time: newCourse.value.start_time,
      end_time: newCourse.value.end_time
    };
    
    // 在实际应用中，应该使用真实的API调用
    // const response = await axios.post('/api/courses', courseData);
    // const courseId = response.data.data;
    
    // 模拟成功响应
    const courseId = courses.value.length + 1;
    
    // 更新本地课程列表
    courses.value.push({
      id: courseId,
      name: courseData.course_name,
      assistant: assistants.value.find(a => a.id === courseData.assistant_id)?.name || '暂无助教',
      status: '未开始',
      chapters: [],
      courseType: courseData.course_type,
      startTime: courseData.start_time,
      endTime: courseData.end_time,
      cover: courseData.cover_image
    });
    
    ElMessage.success('创建课程成功');
    showCreateModal.value = false;
    
    // 重置表单
    newCourse.value = {
      course_name: '',
      course_type: 'recorded',
      assistant_id: null,
      cover_image: '',
      start_time: '',
      end_time: ''
    };
  } catch (error) {
    console.error('创建课程失败:', error);
    ElMessage.error('创建课程失败');
  } finally {
    loading.value = false;
  }
};

// 编辑课程的方法
const editCourse = (course) => {
  // 设置当前课程并显示详情
  currentCourse.value = {
    ...course,
    chapters: course.chapters && typeof course.chapters === 'number' 
      ? generateDummyChapters(course.chapters, course.name)
      : course.chapters || []
  };
  showCourseDetail.value = true;
};

// 生成模拟章节数据
const generateDummyChapters = (count, courseName) => {
  const chapters = [];
  for (let i = 1; i <= count; i++) {
    chapters.push({
      id: i,
      title: `第${i}章：${getChapterName(i, courseName)}`,
      description: `${courseName}的第${i}章内容介绍`,
      resources: []
    });
  }
  return chapters;
};

// 根据章节序号生成章节名称
const getChapterName = (index, courseName) => {
  const names = {
    1: '课程概述',
    2: '基本概念',
    3: '核心理论',
    4: '实践应用',
    5: '案例分析',
    6: '进阶技巧',
    7: '综合实践',
    8: '总结与展望'
  };
  
  return names[index] || `${courseName}章节${index}`;
};

// 删除课程的方法，带确认对话框
const deleteCourse = (course) => {
  // 防止事件冒泡
  event.stopPropagation();
  ElMessageBox.confirm('确定要删除该课程吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 确认删除，从列表中移除课程
    courses.value = courses.value.filter(c => c.id !== course.id);
    ElMessage({
      type: 'success',
      message: '删除成功'
    });
  }).catch(() => {
    // 取消删除，显示取消消息
    ElMessage({
      type: 'info',
      message: '已取消删除'
    });
  });
};

// 处理课程操作的方法
const handleCourseAction = (course) => {
  // 设置当前选中的课程
  currentCourse.value = course;
  
  if (course.courseType === 'live') {
    // 打开直播准备对话框
    showLiveModal.value = true;
    // 预填充直播表单
    liveForm.value.title = `${course.name} - 直播课`;
    liveForm.value.description = `${course.name}的直播课程`;
  } else {
    // 打开录播上传对话框
    showUploadModal.value = true;
    // 重置上传表单
    uploadForm.value = {
      title: '',
      description: ''
    };
    selectedFile.value = null;
  }
};

// 处理文件选择
const handleFileChange = (file) => {
  selectedFile.value = file;
};

// 上传视频文件
const uploadVideo = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要上传的视频文件');
    return;
  }
  
  if (!uploadForm.value.title) {
    ElMessage.warning('请输入章节标题');
    return;
  }
  
  try {
    uploadLoading.value = true;
    
    // 模拟上传过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 在实际应用中，应该使用真实的API调用
    // const formData = new FormData();
    // formData.append('file', selectedFile.value.raw);
    // formData.append('courseId', currentCourse.value.id);
    // formData.append('title', uploadForm.value.title);
    // formData.append('description', uploadForm.value.description);
    // await axios.post('/api/course/upload', formData);
    
    // 更新UI
    const courseIndex = courses.value.findIndex(c => c.id === currentCourse.value.id);
    if (courseIndex !== -1) {
     courses.value[courseIndex].chapters.push({
       chapter_id: Date.now(), // 使用时间戳作为唯一ID
       chapter_name: uploadForm.value.title,
       course_id: currentCourse.value.id,
       resources: [{
          id: Date.now() + 1,
          name: selectedFile.value.name,
          type: 'video',
          size: 'N/A',
          uploadTime: new Date().toISOString().split('T')[0]
       }]
     });
    }
    
    showUploadModal.value = false;
  } catch (error) {
    console.error('上传视频失败:', error);
    ElMessage.error('上传视频失败');
  } finally {
    uploadLoading.value = false;
  }
};

// 开始直播
const startLive = async () => {
  if (!liveForm.value.title) {
    ElMessage.warning('请输入直播标题');
    return;
  }
  
  try {
    liveLoading.value = true;
    
    // 模拟直播准备过程
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 在实际应用中，应该使用真实的API调用
    // const liveData = {
    //   courseId: currentCourse.value.id,
    //   title: liveForm.value.title,
    //   description: liveForm.value.description
    // };
    // await axios.post('/api/course/live/start', liveData);
    
    ElMessage.success('直播已开始');
    showLiveModal.value = false;
    
    // 更新课程状态
    const courseIndex = courses.value.findIndex(c => c.id === currentCourse.value.id);
    if (courseIndex !== -1) {
      courses.value[courseIndex].status = '进行中';
    }
  } catch (error) {
    console.error('开始直播失败:', error);
    ElMessage.error('开始直播失败');
  } finally {
    liveLoading.value = false;
  }
};

// 打开课程详情对话框
const openCourseDetail = (course) => {
  // 设置当前课程并显示详情
  currentCourse.value = {
    ...course,
    // 如果课程没有章节数据，则初始化为空数组
    chapters: course.chapters && typeof course.chapters === 'number' 
      ? generateDummyChapters(course.chapters, course.name)
      : course.chapters || []
  };
  
  showCourseDetail.value = true;
};

const handleCourseUpdate = (updatedCourse) => {
  if (!updatedCourse) return;
  const index = courses.value.findIndex(c => c.id === updatedCourse.id);
  if (index !== -1) {
    // 更新课程总列表
    courses.value[index] = updatedCourse;
    // 同步更新当前正在查看的课程对象，这是确保子组件立即刷新的关键
    currentCourse.value = updatedCourse;
  }
};
</script>

<style scoped>
/* 课程管理主容器样式 */
.course-management {
  padding: 20px;
}

/* 头部区域样式 */
.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 头部左侧区域 */
.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 搜索输入框样式 */
.search-input {
  width: 250px;
}

/* 课程列表区域 */
.course-list {
  margin-top: 20px;
}

/* 网格模式布局 */
.grid-mode {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* 列表模式布局 */
.list-mode {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 课程卡片样式 */
.course-card {
  transition: transform 0.3s;
}

/* 卡片悬停效果 */
.course-card:hover {
  transform: translateY(-5px);
}

/* 卡片内容布局 */
.card-content {
  display: flex;
  flex-direction: column;
}

/* 列表模式的卡片内容布局 */
.list-layout {
  flex-direction: row;
}

/* 课程图片容器 */
.course-image {
  height: 180px;
  overflow: hidden;
}

/* 列表模式下的图片尺寸 */
.list-layout .course-image {
  width: 200px;
  height: 120px;
}

/* 课程信息区域 */
.course-info {
  padding: 15px;
  flex: 1;
}

/* 信息头部布局 */
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

/* 课程名称样式 */
.course-name {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 5px 0;
}

/* 助教信息样式 */
.assistant-info {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 14px;
  margin: 5px 0;
}

/* 操作按钮区域 */
.course-actions {
  display: flex;
  gap: 5px;
}

/* 课程统计信息区域 */
.course-stats {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 10px;
}

/* 章节数量样式 */
.chapter-count {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  font-size: 14px;
}

/* 课程时间信息 */
.course-time-info {
  margin-top: 10px;
  font-size: 13px;
  color: #606266;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 5px 0;
}

/* 课程操作按钮样式 */
.course-action-button {
  margin-top: 15px;
  text-align: right;
}

/* 上传对话框相关样式 */
.upload-course-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #303133;
  text-align: center;
}

.upload-container {
  width: 100%;
  margin-bottom: 20px;
}

.upload-form {
  margin-top: 1rem;
}

/* 直播准备对话框相关样式 */
.live-course-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #303133;
  text-align: center;
}

.live-camera-preview {
  width: 100%;
  height: 180px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #909399;
}

.camera-placeholder p {
  margin-top: 10px;
}

.live-form {
  margin-top: 20px;
}

/* 边距工具类 */
.ml-2 {
  margin-left: 8px;
}

/* 表单控件宽度100% */
.w-100 {
  width: 100%;
}
</style> 