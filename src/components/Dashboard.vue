<template>
  <div class="dashboard-container">
    <!-- 1. 欢迎模块 -->
    <div class="welcome-module">
      <h2>下午好, 张老师!</h2>
      <p>今天是 {{ currentDate }}</p>
    </div>

    <!-- 2. 数据统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card shadow="hover">
          <div class="stat-card-content">
            <el-icon :size="40" class="stat-icon"><component :is="stat.icon" /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 3. 近期课程 & 任务中心 -->
    <el-row :gutter="20" class="list-cards">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>近期课程</span>
              <el-button type="primary" link @click="goTo('/course-management')">查看全部</el-button>
            </div>
          </template>
          <ul class="item-list">
            <li v-for="course in recentCourses" :key="course.id">{{ course.name }}</li>
          </ul>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>任务中心</span>
              <el-button type="primary" link @click="goTo('/task')">查看全部</el-button>
            </div>
          </template>
          <ul class="item-list">
            <li v-for="task in tasks" :key="task.id">{{ task.title }}</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>

    <!-- 4. 活跃学生 -->
    <el-row class="active-students-card">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>活跃学生</span>
          </template>
          <el-table :data="activeStudents" stripe>
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="class" label="班级" />
            <el-table-column prop="progress" label="学习进度">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 调试面板 -->
    <el-row :gutter="20" style="margin-top: 20px;" v-if="showDebugPanel">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>API调试面板</h3>
              <el-switch v-model="showDebugPanel" active-text="显示" inactive-text="隐藏" />
            </div>
          </template>
          <div class="debug-panel">
            <el-tabs>
              <el-tab-pane label="认证信息">
                <div class="debug-section">
                  <h4>当前Token</h4>
                  <el-input v-model="debugInfo.token" type="textarea" :rows="3" readonly />
                  
                  <h4>Token状态</h4>
                  <el-descriptions border>
                    <el-descriptions-item label="是否存在">
                      {{ debugInfo.token ? '是' : '否' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="格式是否正确">
                      {{ debugInfo.token && debugInfo.token.split('.').length === 3 ? '是' : '否' }}
                    </el-descriptions-item>
                  </el-descriptions>
                  
                  <h4>操作</h4>
                  <el-button type="primary" @click="testAuth">测试认证</el-button>
                  <el-button type="warning" @click="clearToken">清除Token</el-button>
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="API测试">
                <div class="debug-section">
                  <h4>API请求</h4>
                  <el-form>
                    <el-form-item label="请求URL">
                      <el-input v-model="debugInfo.testUrl" placeholder="/api/service/assignment/creator" />
                    </el-form-item>
                    <el-form-item label="请求方法">
                      <el-radio-group v-model="debugInfo.testMethod">
                        <el-radio label="GET">GET</el-radio>
                        <el-radio label="POST">POST</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="请求参数" v-if="debugInfo.testMethod === 'GET'">
                      <el-input v-model="debugInfo.testParams" placeholder='{"page":1,"size":10}' type="textarea" :rows="3" />
                    </el-form-item>
                    <el-form-item label="请求体" v-if="debugInfo.testMethod === 'POST'">
                      <el-input v-model="debugInfo.testBody" placeholder='{"title":"测试作业","description":"测试描述"}' type="textarea" :rows="3" />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="sendTestRequest">发送请求</el-button>
                    </el-form-item>
                  </el-form>
                  
                  <h4>响应结果</h4>
                  <el-alert
                    v-if="debugInfo.testError"
                    :title="debugInfo.testError"
                    type="error"
                    :closable="false"
                    show-icon
                  />
                  <el-input 
                    v-model="debugInfo.testResponse" 
                    type="textarea" 
                    :rows="8" 
                    readonly 
                    placeholder="响应将显示在这里"
                  />
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="网络配置">
                <div class="debug-section">
                  <h4>Vite代理配置</h4>
                  <el-descriptions border>
                    <el-descriptions-item label="/api 代理目标">
                      http://localhost:8080
                    </el-descriptions-item>
                    <el-descriptions-item label="/api/service 代理目标">
                      http://localhost:8082
                    </el-descriptions-item>
                  </el-descriptions>
                  
                  <h4>后端服务状态检查</h4>
                  <el-button @click="checkBackendStatus('/api/health')">检查API网关</el-button>
                  <el-button @click="checkBackendStatus('/api/service/health')">检查业务服务</el-button>
                  
                  <div v-if="debugInfo.backendStatus" class="backend-status">
                    <el-tag :type="debugInfo.backendStatus.success ? 'success' : 'danger'">
                      {{ debugInfo.backendStatus.message }}
                    </el-tag>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 调试面板开关 -->
    <div class="debug-toggle">
      <el-button 
        type="primary" 
        circle 
        @click="showDebugPanel = !showDebugPanel"
        size="small"
      >
        <el-icon><Tools /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { Collection, Avatar, Tickets, Files, Calendar, Document, Bell, Tools } from '@element-plus/icons-vue';
import BarChart from './BarChart.vue';
import { getToken, removeToken } from '../utils/auth';
import { doGet, doPost } from '../http/httpRequest';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const router = useRouter();

// 1. 欢迎模块数据
const currentDate = computed(() => new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }));

// 2. 数据卡片 (图标与数据)
const stats = ref([
  { title: '课程数量', value: 8, icon: markRaw(Collection) },
  { title: '学生数量', value: 152, icon: markRaw(Avatar) },
  { title: '任务数量', value: 6, icon: markRaw(Tickets) },
  { title: '个人资源', value: 24, icon: markRaw(Files) },
]);

// 3. 列表卡片数据
const recentCourses = ref([
  { id: 1, name: '《软件工程》 - 第三章 需求分析' },
  { id: 2, name: '《计算机网络》 - 第五章 传输层' },
  { id: 3, name: '《操作系统》 - 第四章 存储管理' },
]);

const tasks = ref([
  { id: 1, title: '批改《软件工程》期中测试卷' },
  { id: 2, title: '审核"计算机2101班"的课程项目申请' },
  { id: 3, title: '上传《计算机网络》第六章课件' },
]);

// 4. 活跃学生数据
const activeStudents = ref([
  { name: '王晓明', class: '软件工程2101', progress: 95 },
  { name: '李静', class: '计算机2102', progress: 92 },
  { name: '陈伟', class: '软件工程2101', progress: 88 },
  { name: '赵琳', class: '人工智能2103', progress: 85 },
]);

// 跳转方法
const goTo = (path) => {
  router.push(path);
};

// 调试面板相关
const showDebugPanel = ref(false);
const debugInfo = ref({
  token: '',
  testUrl: '/api/service/assignment/creator',
  testMethod: 'GET',
  testParams: '{"page":1,"size":10}',
  testBody: '{}',
  testResponse: '',
  testError: '',
  backendStatus: null
});

// 获取并显示当前token
const updateTokenInfo = () => {
  debugInfo.value.token = getToken() || '无';
};

// 测试认证
const testAuth = async () => {
  try {
    const response = await doGet('/api/service/user/info');
    debugInfo.value.testResponse = JSON.stringify(response.data, null, 2);
    debugInfo.value.testError = '';
    ElMessage.success('认证成功');
  } catch (error) {
    debugInfo.value.testError = `认证失败: ${error.message}`;
    debugInfo.value.testResponse = '';
  }
};

// 清除token
const clearToken = () => {
  removeToken();
  updateTokenInfo();
  ElMessage.success('Token已清除');
};

// 发送测试请求
const sendTestRequest = async () => {
  try {
    debugInfo.value.testError = '';
    debugInfo.value.testResponse = '';
    
    let response;
    if (debugInfo.value.testMethod === 'GET') {
      let params = {};
      try {
        params = JSON.parse(debugInfo.value.testParams || '{}');
      } catch (e) {
        ElMessage.warning('参数格式错误，请检查JSON格式');
        debugInfo.value.testError = `参数解析失败: ${e.message}`;
        return;
      }
      
      // 直接使用axios而不是封装的doGet，以便查看原始响应
      response = await axios.get(debugInfo.value.testUrl, { params });
    } else {
      let body = {};
      try {
        body = JSON.parse(debugInfo.value.testBody || '{}');
      } catch (e) {
        ElMessage.warning('请求体格式错误，请检查JSON格式');
        debugInfo.value.testError = `请求体解析失败: ${e.message}`;
        return;
      }
      
      // 直接使用axios而不是封装的doPost，以便查看原始响应
      response = await axios.post(debugInfo.value.testUrl, body);
    }
    
    // 处理响应
    if (response.status === 200) {
      // 显示完整响应，包括headers
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      };
      
      debugInfo.value.testResponse = JSON.stringify(responseData, null, 2);
      ElMessage.success('请求成功');
    } else {
      debugInfo.value.testError = `请求返回非200状态码: ${response.status} ${response.statusText}`;
      debugInfo.value.testResponse = JSON.stringify(response.data, null, 2);
    }
  } catch (error) {
    console.error('测试请求失败:', error);
    
    // 详细的错误信息
    if (error.response) {
      // 服务器返回了错误响应
      const errorData = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      };
      
      debugInfo.value.testError = `请求失败: 服务器返回 ${error.response.status} ${error.response.statusText}`;
      debugInfo.value.testResponse = JSON.stringify(errorData, null, 2);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      debugInfo.value.testError = `请求失败: 服务器无响应 - ${error.message}`;
      debugInfo.value.testResponse = JSON.stringify(error.request, null, 2);
    } else {
      // 请求配置出错
      debugInfo.value.testError = `请求配置错误: ${error.message}`;
    }
  }
};

// 检查后端服务状态
const checkBackendStatus = async (url) => {
  try {
    debugInfo.value.backendStatus = null;
    const response = await axios.get(url, { timeout: 3000 });
    debugInfo.value.backendStatus = {
      success: true,
      message: `服务正常 (${url})`
    };
  } catch (error) {
    debugInfo.value.backendStatus = {
      success: false,
      message: `服务异常: ${error.message} (${url})`
    };
  }
};

// 初始化调试信息
onMounted(() => {
  updateTokenInfo();
  
  // 添加键盘快捷键 Ctrl+Shift+D 切换调试面板
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      showDebugPanel.value = !showDebugPanel.value;
      e.preventDefault();
    }
  });
});
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
}

.welcome-module {
  margin-bottom: 24px;
}

.welcome-module h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.welcome-module p {
  margin: 0;
  color: #606266;
}

.stats-cards, .list-cards, .active-students-card {
  margin-bottom: 20px;
}

.stat-card-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  color: #409EFF;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-title {
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f2f2f2;
}

.item-list li:last-child {
  border-bottom: none;
}

.debug-panel {
  margin-top: 10px;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section h4 {
  margin-top: 15px;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
}

.backend-status {
  margin-top: 10px;
}

.debug-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}
</style>