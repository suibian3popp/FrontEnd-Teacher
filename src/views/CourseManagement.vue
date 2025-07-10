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
          @keyup.enter="handleSearch"
          @clear="fetchCourses"
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
                {{ course.chapter_count || 0 }} 章节
                
              </span>
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
      title="创建新课程"
      width="600px"
      top="5vh"
    >
      <!-- 创建课程的表单 -->
      <el-form :model="newCourse" label-position="top" ref="createCourseForm">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程名称" prop="name" required>
              <el-input v-model="newCourse.name" placeholder="请输入课程名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开设学期" prop="semester">
              <el-input v-model="newCourse.semester" placeholder="例如：2024-2025-1" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="助教" prop="assistant_id">
              <el-select v-model="newCourse.assistant_id" placeholder="请选择助教" class="w-100">
                <el-option
                  v-for="assistant in assistants"
                  :key="assistant.id"
                  :label="assistant.name"
                  :value="assistant.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属院系" prop="department_id">
              <el-select v-model="newCourse.department_id" placeholder="请选择院系" class="w-100">
                <el-option
                  v-for="department in departments"
                  :key="department.id"
                  :label="department.name"
                  :value="department.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="课程类型" prop="course_type" required>
          <el-radio-group v-model="newCourse.course_type">
            <el-radio-button value="recorded">录播</el-radio-button>
            <el-radio-button value="live">直播</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="课程简介" prop="description">
          <el-input 
            v-model="newCourse.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入课程简介" 
          />
        </el-form-item>

        <el-form-item label="封面图资源ID" prop="cover_image_resource">
          <el-input 
            v-model.number="newCourse.cover_image_resource" 
            type="number" 
            placeholder="请输入封面图资源ID"
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
        @add-chapter="handleChapterAdd"
        @edit-chapter="handleChapterEdit"
        @delete-chapter="handleChapterDelete"
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
import { getTeacherCourses, createCourse as apiCreateCourse, deleteCourse as apiDeleteCourse, getCourseChapters, addChapter, deleteChapter, updateChapter, createLiveSession,startLiveSession,getTrtcParams} from '@/api/course.js';
import { getAssistants as apiGetAssistants } from '@/api/assistant.js';
import { getDepartments as apiGetDepartments } from '@/api/department';
import axios from 'axios';
import { getUser } from '../utils/auth';
import { useRouter } from 'vue-router';
import { checkAuthStatus } from '@/utils/auth';

//获取当前userId
let ownerId = ref(getUser().userId) 
//获取路由实例
const router = useRouter()

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
//声明title

// 新课程表单数据
const newCourse = ref({
  name: '',
  teacher_id: null, // Assuming teacher_id is from logged-in user
  assistant_id: null,
  department_id: null,
  semester: '',
  description: '',
  course_type: 'recorded',
  cover_image_resource: null,
});

// 助教列表
const assistants = ref([]);
// 部门列表
const departments = ref([]);
const loading = ref(false);

// 课程数据列表
const courses = ref([]);

const fetchCourses = async () => {
  loading.value = true;
  try {
    console.log('获取课程列表');
    const response = await getTeacherCourses(16); 
    
    console.log('获取课程响应:', response.data);

    // 首先检查业务响应码是否成功
    if (response.data && response.data.code === 200) {
      // 然后再安全地检查data字段是否存在且有内容
      if (response.data.data && response.data.data.length > 0) {
        // 对后端返回的数据进行转换
        courses.value = response.data.data.map(course => ({
          id: course.course_id,
          name: course.course_name,
          courseType: course.course_type,
          cover: course.cover_image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="100%" height="100%" fill="%23e9ecef"/%3E%3Ctext x="50%" y="50%" fill="%236c757d" dy=".3em" text-anchor="middle"%3E无封面%3C/text%3E%3C/svg%3E',
          chapter_count: course.chapter_count || 0,
          assistant: course.assistant_realname || '暂无助教',
          status: '进行中'
        }));
        ElMessage.success('课程列表获取成功');
      } else {
        // 业务成功，但没有课程数据
        courses.value = [];
        ElMessage.info('您还没有任何课程');
      }
    } else {
      // 业务不成功 (e.g., code !== 200)
      ElMessage.error(response.data.message || '获取课程列表失败');
      courses.value = [];
    }
  } catch (error) {
    console.error("获取课程列表失败:", error);
    ElMessage.error('获取课程列表失败，请检查网络或联系管理员');
    courses.value = []; // 网络请求等其他错误的回退
  } finally {
    loading.value = false;
  }
};

// 组件挂载时自动获取数据
onMounted(() => {
  // 检查认证状态
  console.log('组件挂载，检查认证状态:');
  const authStatus = checkAuthStatus();
  if (!authStatus.token) {
    ElMessage.error('未检测到有效登录状态，请重新登录');
    router.push('/login');
    return;
  }
  
  fetchCourses();
  fetchAssistants();
  fetchDepartments();
});

// 获取助教列表的方法
const fetchAssistants = async () => {
  try {
    const response = await apiGetAssistants();
    if (response.data && response.data.code === 200) {
      assistants.value = response.data.data;
    } else {
      ElMessage.error('获取助教列表失败');
    }
  } catch (error) {
    console.error('获取助教列表失败:', error);
    ElMessage.error('获取助教列表失败');
  }
};

const fetchDepartments = async () => {
  try {
    const res = await apiGetDepartments();
    if (res.data && res.data.code === 200) {
      // The component expects `id` and `name`, so we map the response
      departments.value = res.data.data.map(dep => ({
        id: dep.department_id,
        name: dep.name,
      }));
    } else {
      ElMessage.error('获取院系列表失败');
    }
  } catch (error) {
    console.error('获取院系列表失败:', error);
    ElMessage.error('获取院系列表失败');
  }
};

const createCourse = async () => {
  // Optional: Add form validation
  // const form = refs.createCourseForm;
  // if (!form) return;
  // await form.validate();

  loading.value = true;
  try {
    const courseData = {
      ...newCourse.value,
      teacher_id: 16, // Updated teacher_id to 16 for consistency
    };
    
    console.log("Submitting new course data to backend:", courseData);
    
    const createRes = await apiCreateCourse(courseData);
    if (createRes.data && createRes.data.code === 200) {
      ElMessage.success('课程创建成功');
      showCreateModal.value = false;
      fetchCourses(); // Refresh the course list
    } else {
      throw new Error(createRes.data.message || '创建课程失败');
    }

  } catch (error) {
    console.error('创建课程失败:', error);
    ElMessage.error(error.message || '创建课程失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const editCourse = async (course) => {
  showCourseDetail.value = true;
  currentCourse.value = { ...course, chapters: [] }; // Set basic info first, clear old chapters

  try {
    const res = await getCourseChapters(course.id);
    if (res.data && res.data.code === 200) {
      // Filter out top-level chapters with chapter_id === 0
      const filteredChapters = res.data.data.filter(chapter => chapter.chapter_id !== 0);
      // Add prefixes to the chapter titles
      const formattedChapters = addChapterPrefixes(filteredChapters);
      currentCourse.value.chapters = formattedChapters;
    } else {
      ElMessage.error('获取章节信息失败');
      // Even if fetching fails, we keep the detail modal open with basic info
    }
  } catch (error) {
    console.error('获取章节失败:', error);
    ElMessage.error('获取章节信息失败');
  }
};

const deleteCourse = (course) => {
  ElMessageBox.confirm(
    `您确定要删除课程《${course.name}》吗？此操作将无法撤销。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await apiDeleteCourse(course.id);
      if (res.data && res.data.code === 200) {
        ElMessage.success('课程已成功删除');
        fetchCourses(); // Refresh the course list
      } else {
        throw new Error(res.data.message || '删除课程失败');
      }
    } catch (error) {
      console.error(`删除课程 ${course.id} 失败:`, error);
      ElMessage.error(error.message || '删除操作失败，请稍后重试');
    }
  }).catch(() => {
    ElMessage.info('已取消删除操作');
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



console.log(" ======="+liveForm.value.title)
//开始直播
const startLive = async () => {
  if (!liveForm.value.title) {
    ElMessage.warning('请输入直播标题');
    return;
  }

  liveLoading.value = true;

  try {
    // 1. 创建直播会话
    console.log("开始创建直播会话...");
    const createRes = await createLiveSession({
      sessionTitle: liveForm.value.title, // 这里可以使用liveForm.value.title
      teacherId: ownerId.value, // 这里应该是当前教师ID，建议使用动态值
      maxUsers: 100,
      courseId: currentCourse.value.id
    });
    
    console.log("创建直播会话响应:", createRes);
    
    // 检查API响应格式（与您的getTeacherCourses一致）
    if (!createRes.data) {
      throw new Error(createRes.data?.message || '创建直播会话失败');
    }
    
    const liveSession = createRes.data;
    if (!liveSession.sessionId) {
      throw new Error('创建直播会话失败：缺少sessionId');
    }
    
    console.log("直播会话创建成功，sessionId:", liveSession.sessionId);

    // 2. 开始直播会话
    console.log("开始启动直播会话...");
    const startRes = await startLiveSession(liveSession.sessionId);
    
    console.log("启动直播会话响应:", startRes);
    
    // 检查启动响应
    if (!startRes.data) {
      throw new Error(startRes.data?.message || '启动直播失败');
    }
    
    console.log("直播会话启动成功");

    // 3. 获取TRTC参数
    console.log("获取TRTC参数...");
    const trtcRes = await getTrtcParams(liveSession.sessionId, ownerId.value, 'teacher');
    
    console.log("TRTC参数响应:", trtcRes);
    
    if (!trtcRes.data) {
      throw new Error(trtcRes.data?.message || '获取TRTC参数失败');
    }
    
    const trtcParams = trtcRes.data;
    console.log("TRTC参数获取成功");

    // 4. 更新UI和路由
    ElMessage.success('直播已准备就绪，即将进入直播教室');
    showLiveModal.value = false;
    
    // 更新课程状态（与您的课程列表更新逻辑一致）
    const courseIndex = courses.value.findIndex(c => c.id === currentCourse.value.id);
    if (courseIndex !== -1) {
      courses.value[courseIndex].status = '直播中';
      // 添加日志以便调试
      console.log(`课程ID ${currentCourse.value.id} 状态更新为直播中`);
    }

    // 使用 encodeURIComponent 确保参数安全传递
    const encodedParams = encodeURIComponent(JSON.stringify(trtcParams));
    console.log("编码后的参数长度:", encodedParams.length); // 检查参数长度是否合理


    // 路由跳转
    router.push({
      path: '/live-class/online',
      query: {
        sessionId: liveSession.sessionId,
        trtcParams: encodedParams
      }
    });
    
  } catch (error) {
    console.error('开始直播失败:', error);
    
    // 统一错误处理（与您的createCourse等函数一致）
    const errorMessage = error.response?.data?.message || 
                         error.message || 
                         '开始直播失败，请稍后重试';
    
    ElMessage.error(errorMessage);
  } finally {
    liveLoading.value = false;
  }
};




// 打开课程详情对话框
const openCourseDetail = (course) => {
  // Call this function to ensure chapters are fetched
  editCourse(course);
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

const handleSearch = () => {
  // 本地搜索逻辑，可以根据需要改为后端搜索
  if (!searchKeyword.value) {
    fetchCourses(); // 如果搜索词为空，重新获取全部课程
    return;
  }
  const keyword = searchKeyword.value.toLowerCase();
  courses.value = courses.value.filter(course =>
    course.course_name.toLowerCase().includes(keyword)
  );
};

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return 'N/A';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// 根据搜索和筛选计算最终显示的课程
const filteredCourses = computed(() => {
  let result = courses.value;
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(course => 
      course.course_name.toLowerCase().includes(keyword)
    );
  }
  
  // 课程类型筛选
  if (courseTypeFilter.value !== 'all') {
    result = result.filter(course => course.course_type === courseTypeFilter.value);
  }
  
  return result;
});

const addChapterPrefixes = (chapters) => {
  // Deep copy to avoid side effects, although data is fresh from API here.
  const chaptersCopy = JSON.parse(JSON.stringify(chapters));

  // Sort top-level chapters by their order number
  chaptersCopy.sort((a, b) => a.order_num - b.order_num);

  chaptersCopy.forEach((chapter) => {
    // Add prefix to top-level chapters
    chapter.title = `第${chapter.order_num}章：${chapter.title}`;

    if (chapter.children && chapter.children.length > 0) {
      // Sort child chapters
      chapter.children.sort((a, b) => a.order_num - b.order_num);
      
      // Add prefixes to children
      chapter.children.forEach((child) => {
        child.title = `${chapter.order_num}.${child.order_num} ${child.title}`;
      });
    }
  });

  return chaptersCopy;
};

const handleChapterAdd = async (chapterData, callback) => {
  try {
    const payload = {
      course_id: currentCourse.value.id,
      parent_id: chapterData.parent_id,
      title: chapterData.title,
    };
    const res = await addChapter(payload);
    if (res.data && res.data.code === 201) {
      ElMessage.success('章节添加成功');
      // Re-fetch all chapters to ensure UI is consistent with the backend state
      await editCourse(currentCourse.value);
      if (callback) callback(true);
    } else {
      throw new Error(res.data.message || '添加章节失败');
    }
  } catch (error) {
    console.error('添加章节失败:', error);
    ElMessage.error(error.message || '添加章节失败');
    if (callback) callback(false);
  }
};

const handleChapterEdit = async (chapterData, callback) => {
  try {
    const payload = {
      title: chapterData.title,
    };
    const res = await updateChapter(chapterData.chapter_id, payload);
    if (res.data && res.data.code === 200) {
      ElMessage.success('章节更新成功');
      // Re-fetch all chapters to ensure UI is consistent with the backend state
      await editCourse(currentCourse.value);
      if (callback) callback(true);
    } else {
      throw new Error(res.data.message || '更新章节失败');
    }
  } catch (error) {
    console.error('更新章节失败:', error);
    ElMessage.error(error.message || '更新章节失败');
    if (callback) callback(false);
  }
};

const handleChapterDelete = async (chapterId) => {
  try {
    const res = await deleteChapter(chapterId);
    if (res.data && res.data.code === 200) {
      ElMessage.success('章节删除成功');
      // Re-fetch all chapters to ensure UI is consistent with the backend state
      await editCourse(currentCourse.value);
    } else {
      throw new Error(res.data.message || '删除章节失败');
    }
  } catch (error) {
    console.error('删除章节失败:', error);
    ElMessage.error(error.message || '删除章节失败');
  }
};
</script>

<style scoped>
/* 课程管理主容器样式 */
.course-management {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
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

.cover-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.cover-uploader .el-upload:hover {
  border-color: #409eff;
}
.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}
.cover-image {
  width: 178px;
  height: 178px;
  display: block;
}
</style> 