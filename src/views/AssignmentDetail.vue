<template>
  <div class="assignment-detail-container">
    <div class="header">
      <div class="title-section">
        <el-button @click="goBack" text>
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h2>{{ assignment.name }}</h2>
      </div>
      <div class="actions">
        <el-button type="primary" @click="editAssignment">编辑</el-button>
      </div>
    </div>

    <el-card class="assignment-info-card">
      <template #header>
        <div class="card-header">
          <h3>作业信息</h3>
          <div class="debug-info">
            <el-tag type="info">作业ID: {{ assignment.id }}</el-tag>
          </div>
        </div>
      </template>
      
      <!-- 作业共性信息 -->
      <div class="assignment-common-info">
        <h4>作业描述</h4>
        <p class="description-text">{{ assignment.description || '无描述' }}</p>
        
        <el-descriptions :column="2" border style="margin-top: 20px;">
          <el-descriptions-item label="总分">{{ assignment.score }} 分</el-descriptions-item>
          <el-descriptions-item label="附件">
            <el-button 
              v-if="assignment.resourceId" 
              type="primary" 
              link 
              @click="downloadResource"
            >
              <el-icon><Download /></el-icon> 
              {{ assignment.resourceName || '下载附件' }}
            </el-button>
            <span v-else>无附件</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <!-- 班级信息展示 -->
      <div class="classes-section">
        <h4>班级信息</h4>
        
        <!-- 班级加载错误提示 -->
        <div v-if="assignment.classLoadError" class="class-error">
          <el-alert
            :title="assignment.classLoadError.message"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="class-error-content">
                <span>错误码: {{ assignment.classLoadError.code }}</span>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="retryFetchClasses"
                  :disabled="requestStatus.classesRequestInProgress || 
                            (Date.now() - requestStatus.classesLastRequestTime) < requestStatus.classesRequestCooldown"
                >
                  {{ (Date.now() - requestStatus.classesLastRequestTime) < requestStatus.classesRequestCooldown ? 
                    `请等待${Math.ceil((requestStatus.classesRequestCooldown - (Date.now() - requestStatus.classesLastRequestTime)) / 1000)}秒` : 
                    '重新获取' }}
                </el-button>
            </div>
          </template>
        </el-alert>
      </div>
        
        <!-- 无班级信息提示 -->
        <el-empty v-else-if="!assignment.classes || assignment.classes.length === 0" description="暂无班级信息"></el-empty>
        
        <!-- 按班级分区展示信息 -->
        <div v-else class="classes-grid">
          <el-card 
            v-for="cls in assignment.classes" 
            :key="cls.classId" 
            class="class-card"
            shadow="hover"
          >
            <template #header>
              <div class="class-card-header">
                <el-tag type="success" size="large">{{ cls.className }}</el-tag>
              </div>
            </template>
            
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="开始时间">
                <span>{{ assignment.startDate }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="截止日期">
                <span v-if="getClassDeadline(cls.classId)">
                  {{ formatDate(getClassDeadline(cls.classId)) }}
                </span>
                <span v-else class="no-deadline">未设置</span>
              </el-descriptions-item>
              <el-descriptions-item label="提交情况">
                <div v-if="cls.submissionStatus && !cls.loadingSubmissions">
                  <el-progress 
                    :percentage="cls.submissionStatus.percentage" 
                    :format="() => `${cls.submissionStatus.submittedCount}/${cls.submissionStatus.totalCount}`"
                  />
                  <el-button link type="primary" size="small" @click="viewSubmissions(cls.classId)" style="margin-top: 5px;">
                    查看详情
                  </el-button>
                </div>
                <div v-else-if="cls.loadingSubmissions">
                  <el-spinner size="small" />
                  <span>加载中...</span>
                </div>
                <div v-else>
                   <el-button link @click="fetchSubmissionStatus(cls)">点击加载</el-button>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
      </div>
      
      <!-- 调试信息 -->
      <div class="debug-section" v-if="showDebugInfo">
        <el-divider>调试信息</el-divider>
        <div class="debug-content">
          <h4>作业信息</h4>
          <pre>{{ JSON.stringify(assignment, null, 2) }}</pre>
          
          <h4>请求状态</h4>
          <pre>{{ JSON.stringify(requestStatus, null, 2) }}</pre>
          
          <h4>截止日期信息</h4>
          <pre>{{ JSON.stringify(classDeadlines, null, 2) }}</pre>
          
          <h4>API请求调试</h4>
          <div>
            <p>班级信息API路径测试：</p>
            <el-button
              v-for="(url, index) in [
                `/api/service/assignmentClasses/${assignment.id}/classes`,
                `/api/service/assignment/${assignment.id}/classes`,
                `/api/service/assignment/classes/${assignment.id}`
              ]" 
              :key="index"
              size="small"
              type="primary"
              @click="() => testApiUrl(url)"
            >
              测试 {{ url }}
            </el-button>
            
            <p>截止时间API路径测试：</p>
            <el-button
              size="small"
              type="success"
              @click="() => testApiUrl(`/api/service/assignmentClasses/${assignment.id}/deadlines`)"
            >
              测试截止时间API
            </el-button>
      </div>
        </div>
        <el-button size="small" type="info" @click="toggleDebugInfo">
          隐藏调试信息
            </el-button>
      </div>
      <div v-else class="show-debug">
        <el-button size="small" type="info" @click="toggleDebugInfo">
          显示调试信息
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, ArrowLeft } from '@element-plus/icons-vue';
import { doGet } from '../http/httpRequest';
import axios from 'axios'; // 导入 axios

// 引入防抖函数
const debounce = (fn, delay) => {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 请求状态管理
const requestStatus = ref({
  classesLastRequestTime: 0,
  classesRequestInProgress: false,
  classesRequestCooldown: 5000, // 5秒冷却时间
  deadlinesLastRequestTime: 0,
  deadlinesRequestInProgress: false,
  deadlinesRequestCooldown: 5000 // 5秒冷却时间
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const showDebugInfo = ref(false);
const classDeadlines = ref([]); // 存储班级截止时间信息

// 作业基本信息
const assignment = ref({
  id: null,
  name: '',
  description: '',
  // 删除课程字段
  class: '',
  startDate: '',
  dueDate: '',
  score: 90,
  resourceId: null,
  resourceUrl: '',
  resourceName: '',
  classes: [], // 添加班级列表字段
  classLoadError: null // 新增错误状态字段
});

// 根据班级ID获取截止时间
const getClassDeadline = (classId) => {
  const deadlineInfo = classDeadlines.value.find(d => d.classId === classId);
  return deadlineInfo ? deadlineInfo.deadline : null;
};

// 获取作业截止时间信息
const fetchAssignmentDeadlines = async (assignmentId) => {
  // 检查是否正在请求中
  if (requestStatus.value.deadlinesRequestInProgress) {
    console.log('已有截止时间请求正在进行中，请等待...');
    return;
  }
  
  // 检查冷却时间
  const now = Date.now();
  const timeSinceLastRequest = now - requestStatus.value.deadlinesLastRequestTime;
  if (timeSinceLastRequest < requestStatus.value.deadlinesRequestCooldown) {
    const remainingCooldown = Math.ceil((requestStatus.value.deadlinesRequestCooldown - timeSinceLastRequest) / 1000);
    console.log(`截止时间请求过于频繁，请等待${remainingCooldown}秒后再试`);
    return;
  }
  
  try {
    // 设置请求状态
    requestStatus.value.deadlinesRequestInProgress = true;
    requestStatus.value.deadlinesLastRequestTime = now;
    
    console.log('获取作业截止时间信息，ID:', assignmentId);
    
    // 调用API获取截止时间信息
    const apiUrl = `/api/service/assignmentClasses/${assignmentId}/deadlines`;
    console.log(`调用API获取截止时间，URL: ${apiUrl}`);
    
    const response = await doGet(apiUrl);
    console.log('截止时间API响应:', response);
    
    // 处理5001错误 - 系统繁忙
    if (response.data && response.data.code === 5001) {
      console.warn('获取截止时间失败: 系统繁忙，错误码5001');
      throw new Error('系统繁忙，请稍后再试');
    }
    
    // 提取截止时间数据 - 增强数据提取逻辑
    let deadlinesList = [];
    
    // 尝试多种可能的数据结构
    if (response.data && Array.isArray(response.data)) {
      console.log('检测到数据是数组格式');
      deadlinesList = response.data;
    } else if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
      console.log('检测到标准响应格式: {code, message, data}，data是数组');
      deadlinesList = response.data.data;
    } else if (response.data && response.data.list && Array.isArray(response.data.list)) {
      console.log('检测到列表格式: {list: [...]}');
      deadlinesList = response.data.list;
    } else if (response.data && typeof response.data === 'object') {
      // 尝试从对象中提取可能的截止时间数据
      console.log('未检测到标准格式，尝试从对象中提取截止时间数据');
      for (const key in response.data) {
        const value = response.data[key];
        if (Array.isArray(value) && value.length > 0 && 
          (value[0].classId !== undefined || value[0].deadline !== undefined)) {
          console.log(`找到可能的截止时间数组字段: ${key}`);
          deadlinesList = value;
          break;
        }
      }
    }
    
    console.log('提取的截止时间列表:', deadlinesList);
    
    // 规范化截止时间数据格式
    classDeadlines.value = deadlinesList.map(item => {
      return {
        classId: item.classId || item.class_id || 0,
        className: item.className || item.class_name || '未知班级',
        deadline: item.deadline || item.dueDate || item.due_date || null
      };
    });
    
    console.log('处理后的截止时间信息:', classDeadlines.value);
    
  } catch (error) {
    console.error('获取截止时间信息失败:', error);
    ElMessage.warning(`获取截止时间信息失败: ${error.message || '未知错误'}`);
  } finally {
    // 重置请求状态
    requestStatus.value.deadlinesRequestInProgress = false;
  }
};

// 使用防抖处理的获取截止时间函数
const debouncedFetchDeadlines = debounce(async (assignmentId) => {
  await fetchAssignmentDeadlines(assignmentId);
}, 500);

// 在实际项目中，这里会根据 route.params.id 调用 API 获取数据
const fetchAssignmentDetail = async (id) => {
  try {
    loading.value = true;
    console.log('获取作业详情，ID:', id);
    
    // 调用API获取作业详情
    console.log('调用API获取作业详情，URL:', `/api/service/assignment/${id}/basic`);
    const response = await doGet(`/api/service/assignment/${id}/basic`);
    
    // 打印原始API响应，便于调试
    console.log('API作业详情原始响应:', response);
    
    // 如果响应为空或无效
    if (!response || !response.data) {
      throw new Error('API响应无效或为空');
    }
    
    // 提取数据层，尝试多种可能的格式
    let assignmentData = null;
    
    console.log('检测API响应数据格式...');
    if (response.data.code === 200 && response.data.data) {
      // 标准格式: {code: 200, message: "success", data: {...}}
      console.log('检测到标准响应格式: {code, message, data}');
      assignmentData = response.data.data;
    } else if (response.data.assignmentId !== undefined) {
      // 直接返回作业对象: {assignmentId: 1, title: "...", ...}
      console.log('检测到直接返回作业对象格式');
      assignmentData = response.data;
    } else if (response.list && Array.isArray(response.list) && response.list.length > 0) {
      // 列表格式: {list: [{...}], total: 1}
      console.log('检测到列表格式，提取第一项');
      assignmentData = response.list[0];
    } else {
      console.error('无法从API响应中提取作业数据:', response.data);
      console.log('API响应数据结构:', JSON.stringify(response));
      throw new Error('API返回的数据格式不符合预期');
    }
    
    console.log('提取的作业数据:', assignmentData);
    
    // 重点处理基本字段，暂不处理复杂关联数据
      assignment.value = {
      id: assignmentData.assignmentId || assignmentData.id,
      name: assignmentData.title || assignmentData.name || '未命名作业',
        description: assignmentData.description || '',
      // 删除课程字段
      class: '加载班级信息中...', // 临时占位
      startDate: formatDate(assignmentData.startTime || assignmentData.startDate),
      dueDate: formatDate(assignmentData.endTime || assignmentData.deadline || assignmentData.dueDate),
      score: assignmentData.totalScore || assignmentData.score || 90,
      resourceId: assignmentData.resourceId,
      resourceUrl: assignmentData.resourceUrl || '',
      resourceName: assignmentData.resourceName || '',
      classes: [], // 初始化为空数组
      classLoadError: null // 实际数据不包含错误状态
    };
    
    console.log('作业基本信息处理完成:', assignment.value);
    
    // 获取作业关联班级信息和截止时间信息 - 使用防抖处理
    if (assignment.value.id) {
      setTimeout(() => {
        debouncedFetchClasses(assignment.value.id);
        debouncedFetchDeadlines(assignment.value.id);
      }, 300); // 延迟300ms后获取信息，避免同时发送多个请求
    }
    
  } catch (error) {
    console.error('获取作业详情异常:', error);
    ElMessage.error(`获取作业详情失败: ${error.message || '未知错误'}`);
    
    // 移除模拟数据相关的弹窗逻辑
    router.push('/task-assignment');

  } finally {
    loading.value = false;
  }
};

// 获取作业关联班级 - 添加防抖和请求限制
const fetchAssignmentClasses = async (assignmentId) => {
  // 检查是否正在请求中
  if (requestStatus.value.classesRequestInProgress) {
    console.log('已有班级信息请求正在进行中，请等待...');
    ElMessage.info('正在获取班级信息，请稍候...');
    return;
  }
  
  // 检查冷却时间
  const now = Date.now();
  const timeSinceLastRequest = now - requestStatus.value.classesLastRequestTime;
  if (timeSinceLastRequest < requestStatus.value.classesRequestCooldown) {
    const remainingCooldown = Math.ceil((requestStatus.value.classesRequestCooldown - timeSinceLastRequest) / 1000);
    console.log(`请求过于频繁，请等待${remainingCooldown}秒后再试`);
    ElMessage.warning(`请求过于频繁，请等待${remainingCooldown}秒后再试`);
      return;
    }
    
  try {
    // 设置请求状态
    requestStatus.value.classesRequestInProgress = true;
    requestStatus.value.classesLastRequestTime = now;
    
    console.log('获取作业关联班级信息，ID:', assignmentId);
    
    // 尝试不同的API路径获取班级信息
    let apiUrls = [
      `/api/service/assignmentClasses/${assignmentId}/classes`,
      `/api/service/assignment/${assignmentId}/classes`,
      `/api/service/assignment/classes/${assignmentId}`
    ];
    
    let response = null;
    let successUrl = null;
    let errors = [];
    
    // 依次尝试不同的API路径
    for (const url of apiUrls) {
      try {
        console.log(`尝试调用API获取班级信息，URL: ${url}`);
        response = await doGet(url);
        console.log(`班级信息API响应(${url}):`, response);
        
        // 检查是否有错误码
        if (response.data && response.data.code === 5001) {
          console.warn(`API路径 ${url} 返回系统繁忙错误`);
          errors.push({ url, code: 5001, message: '系统繁忙，请稍后再试' });
          continue;
        }
        
        // 如果没有错误，则认为成功
        successUrl = url;
        console.log(`成功从 ${url} 获取班级信息`);
        break;
  } catch (error) {
        console.error(`从 ${url} 获取班级信息失败:`, error);
        errors.push({ url, message: error.message });
      }
    }
    
    // 如果所有API路径都失败
    if (!response || !successUrl) {
      console.error('所有API路径都失败:', errors);
      assignment.value.classLoadError = {
        code: 'API_FAILURE',
        message: '所有API路径都无法获取班级信息',
        details: errors
      };
      throw new Error('无法获取班级信息，所有API路径都失败');
    }
    
    // 处理5001错误 - 系统繁忙
    if (response.data && response.data.code === 5001) {
      console.warn('获取班级信息失败: 系统繁忙，错误码5001');
      assignment.value.classLoadError = {
        code: 5001,
        message: '系统繁忙，请稍后再试'
      };
      throw new Error('系统繁忙，请稍后再试');
    }
    
    // 提取班级数据 - 增强数据提取逻辑
    let classesList = [];
    
    console.log('尝试从响应中提取班级数据，响应结构:', JSON.stringify(response.data).substring(0, 200));
    
    // 尝试多种可能的数据结构
    if (response.data && Array.isArray(response.data)) {
      console.log('检测到数据是数组格式');
      classesList = response.data;
    } else if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
      console.log('检测到标准响应格式: {code, message, data}，data是数组');
      classesList = response.data.data;
    } else if (response.data && response.data.list && Array.isArray(response.data.list)) {
      console.log('检测到列表格式: {list: [...]}');
      classesList = response.data.list;
    } else if (response.data && response.data.classes && Array.isArray(response.data.classes)) {
      console.log('检测到classes字段格式: {classes: [...]}');
      classesList = response.data.classes;
    } else if (response.data && response.data.data && response.data.data.classes && Array.isArray(response.data.data.classes)) {
      console.log('检测到嵌套classes字段格式: {data: {classes: [...]}}');
      classesList = response.data.data.classes;
    } else {
      // 尝试从对象中提取可能的班级数据
      console.log('未检测到标准格式，尝试从对象中提取班级数据');
      if (response.data && typeof response.data === 'object') {
        // 查找可能包含班级信息的字段
        for (const key in response.data) {
          const value = response.data[key];
          if (Array.isArray(value) && value.length > 0 && (value[0].classId !== undefined || value[0].className !== undefined)) {
            console.log(`找到可能的班级数组字段: ${key}`);
            classesList = value;
            break;
          }
        }
      }
    }
    
    console.log('提取的班级列表:', classesList);
    
    // 如果提取的班级列表为空，但响应不为空，则记录详细信息
    if (classesList.length === 0 && response.data) {
      console.warn('从响应中提取班级列表为空，记录完整响应以便调试:', JSON.stringify(response.data));
    }
    
    // 规范化班级数据格式并添加附加状态
    const rawClassesList = classesList.map(cls => ({
      classId: cls.classId || cls.id || 0,
      className: cls.className || cls.name || `班级${cls.classId || cls.id || '未知'}`,
      // 假设API现在会返回这两个关键字段
      assignmentClassId: cls.assignmentClassId, 
      studentCount: cls.studentCount || 0,
    }));
    
    // 更新班级信息
    assignment.value.classes = processClasses(rawClassesList); // 使用 processClasses
    assignment.value.classLoadError = null; // 清除错误状态
    
    // 更新班级显示文本
    if (classesList.length > 0) {
      assignment.value.class = classesList
        .map(c => c.className)
        .join(', ');
      console.log('班级信息已更新:', assignment.value.class);
    } else {
      assignment.value.class = '未指定班级';
      console.log('未找到班级信息，设置为默认值');
    }

    // 获取班级的截止时间信息
    debouncedFetchDeadlines(assignmentId);
    
  } catch (error) {
    console.error('获取班级信息失败:', error);
    
    // 设置错误状态
    assignment.value.classLoadError = assignment.value.classLoadError || {
      code: 'UNKNOWN',
      message: error.message || '获取班级信息失败'
    };
    
    // 显示提示信息
    ElMessage.warning(`获取班级信息失败: ${error.message || '未知错误'}`);
    assignment.value.class = '暂无班级信息';
  } finally {
    // 重置请求状态
    requestStatus.value.classesRequestInProgress = false;
  }
};

// 使用防抖处理的重试函数
const debouncedFetchClasses = debounce(async (assignmentId) => {
  await fetchAssignmentClasses(assignmentId);
}, 500);

// 重试获取班级信息
const retryFetchClasses = async () => {
  if (!assignment.value.id) return;
  
  try {
    ElMessage.info('正在重新获取班级信息...');
    await debouncedFetchClasses(assignment.value.id);
  } catch (error) {
    console.error('重试获取班级信息失败:', error);
  }
};

// 下载资源文件
const downloadResource = async () => {
  if (!assignment.value.resourceId) {
    ElMessage.warning('没有可下载的附件');
    return;
  }
  
  const resourceId = assignment.value.resourceId;
  const fileName = assignment.value.resourceName || `resource-${resourceId}`;

  try {
    // 使用 axios 发起带认证的请求
    const response = await axios({
      url: `/api/service/resource/download/${resourceId}`,
      method: 'GET',
      responseType: 'blob', // 关键：期望响应是二进制数据
    });

    // 创建一个指向Blob的URL
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('开始下载附件');

  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error('下载失败，请检查网络或登录状态');
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未设置';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return '日期无效';
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString; // 返回原始字符串
  }
};

// 格式化班级名称
const formatClassNames = (classes) => {
  if (!classes || !Array.isArray(classes) || classes.length === 0) {
    return '无班级信息';
  }
  
  try {
    return classes.map(c => c.className || `班级${c.classId}`).join(', ');
  } catch (error) {
    console.error('格式化班级名称错误:', error);
    return '无班级信息';
  }
};

// 处理模拟数据切换
const handleMockDataToggle = () => {
  fetchAssignmentDetail(route.params.id);
  if (useMockData.value) {
    ElMessage.info('已切换到模拟数据模式');
  } else {
    ElMessage.info('已切换到实际数据模式');
  }
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 编辑作业
const editAssignment = () => {
  // 实际项目中应跳转到编辑页面
  ElMessage.info('编辑功能尚未实现');
};

// 切换调试信息显示
const toggleDebugInfo = () => {
  showDebugInfo.value = !showDebugInfo.value;
};

// 测试API URL
const testApiUrl = async (url) => {
  try {
    const res = await doGet(url);
    ElMessageBox.alert(JSON.stringify(res.data, null, 2), `API响应: ${url}`);
  } catch (error) {
    ElMessageBox.alert(error.message, `API错误: ${url}`, { type: 'error' });
  }
};

// 在 fetchAssignmentClasses 成功获取班级列表后，初始化班级的附加状态
const processClasses = (classesList) => {
  return classesList.map(cls => ({
    ...cls,
    loadingSubmissions: false,
    submissionStatus: null,
  }));
};

// 获取单个班级的提交情况
const fetchSubmissionStatus = async (cls) => {
  if (!cls.assignmentClassId) {
    ElMessage.error("缺少必要的关联ID (assignmentClassId)，无法获取提交情况。");
    return;
  }
  cls.loadingSubmissions = true;
  try {
    const response = await doGet(`/api/service/assignmentSubmission/all`, { assignmentClassId: cls.assignmentClassId });
    if (response.data && Array.isArray(response.data)) {
      const submissions = response.data;
      const submittedCount = submissions.length;
      const totalCount = cls.studentCount || 0; // 从班级对象获取总人数

      cls.submissionStatus = {
        submittedCount,
        totalCount,
        percentage: totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0,
        submissions: submissions, // 存储完整的提交列表以备后用
      };
    } else {
      ElMessage.error(`获取'${cls.className}'提交情况失败`);
      cls.submissionStatus = { submittedCount: 'N/A', totalCount: 'N/A', percentage: 0 };
    }
  } catch (error) {
    console.error(`获取班级 ${cls.classId} 提交情况失败:`, error);
    ElMessage.error(`获取'${cls.className}'提交情况失败`);
  } finally {
    cls.loadingSubmissions = false;
  }
};


// 查看提交详情（占位）
const viewSubmissions = (classId) => {
  ElMessage.info(`查看班级 ${classId} 的提交详情功能暂未实现`);
};


// --- 生命周期 ---
onMounted(() => {
  const assignmentId = route.params.id;
  if (assignmentId) {
    fetchAssignmentDetail(assignmentId);
  }
});

watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchAssignmentDetail(newId);
  }
});
</script>

<style scoped>
.assignment-detail-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  align-items: center;
}

.title-section h2 {
  margin-left: 10px;
}

.actions {
  display: flex;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignment-info-card {
  margin-bottom: 20px;
}

.assignment-common-info {
  margin-bottom: 30px;
}

.description-text {
  color: #606266;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  line-height: 1.6;
}

/* 班级信息样式 */
.classes-section {
  margin-top: 20px;
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.class-card {
  transition: all 0.3s;
}

.class-card:hover {
  transform: translateY(-5px);
}

.class-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.no-deadline {
  color: #909399;
  font-style: italic;
}

.class-error {
  width: 100%;
  margin-bottom: 16px;
}

.class-error-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}

.debug-section {
  margin-top: 20px;
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
}

.debug-content {
  overflow-x: auto;
  background-color: #2c3e50;
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.debug-content pre {
  margin: 0;
  white-space: pre-wrap;
}

.show-debug {
  margin-top: 20px;
  text-align: right;
}
</style>