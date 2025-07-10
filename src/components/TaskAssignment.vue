<template>
  <div class="task-assignment-container">
    <div class="header">
      <h2>作业管理</h2>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索作业"
          class="search-input"
          clearable
          @clear="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        
        <el-button type="primary" @click="openCreateDialog">创建作业</el-button>
      </div>
    </div>

    <!-- 统一的作业列表 -->
    <el-card class="assignment-list-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">全部作业</div>
          <div class="header-actions">
            <el-select v-model="filterStatus" placeholder="状态筛选" clearable @change="handleFilterChange">
              <el-option label="全部" value="" />
              <el-option label="进行中" value="ongoing" />
              <el-option label="已结束" value="finished" />
              <el-option label="未开始" value="pending" />
              <el-option label="草稿" value="draft" />
            </el-select>
          </div>
        </div>
      </template>

      <div v-loading="loading.all">
        <el-table :data="filteredAssignments" style="width: 100%" v-if="filteredAssignments.length > 0">
          <el-table-column prop="title" label="作业名称" min-width="200">
            <template #default="{ row }">
              <router-link :to="`/assignment/${row.assignmentId}`" class="assignment-title-link">
                {{ row.title }}
              </router-link>
            </template>
          </el-table-column>
          
          <el-table-column label="总分值" width="100">
            <template #default="{ row }">
              <span>{{ row.score || 90 }}分</span>
            </template>
          </el-table-column>
          
          <el-table-column label="提交情况" width="120">
            <template #default="{ row }">
              <el-progress 
                :percentage="calculateSubmissionPercentage(row)" 
                :format="() => `${row.submittedCount || 0}/${row.totalCount || 0}`"
                :status="getSubmissionStatus(row)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                link 
                @click="viewAssignment(row.assignmentId)"
              >
                <el-icon><View /></el-icon> 查看
              </el-button>
              <el-button 
                type="danger" 
                link 
                @click="confirmDeleteAssignment(row)"
              >
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div v-else class="empty-state">
          <el-empty description="暂无作业" v-if="!loading.all">
            <el-button type="primary" @click="openCreateDialog">创建作业</el-button>
          </el-empty>
        </div>
        
        <div class="pagination-container" v-if="pagination.total > 0">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 创建作业对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建作业"
      width="60%"
      destroy-on-close
    >
      <create-assignment-form
        ref="createFormRef"
        @created="handleAssignmentCreated"
      />
    </el-dialog>

    <!-- 编辑作业对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑作业"
      width="60%"
      destroy-on-close
    >
      <create-assignment-form
        ref="editFormRef"
        :is-edit="true"
        :assignment-data="currentAssignment"
        @updated="handleAssignmentUpdated"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, View, Delete } from '@element-plus/icons-vue';
import CreateAssignmentForm from './common/CreateAssignmentForm.vue';
import { doGet, doPost, doPut, doDelete } from '../http/httpRequest';

const router = useRouter();
const searchQuery = ref('');
const filterStatus = ref('');
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const createFormRef = ref(null);
const editFormRef = ref(null);
const currentAssignment = ref(null);

const allAssignments = ref([]);

const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

const loading = ref({
  all: false,
});

// 过滤后的作业列表
const filteredAssignments = computed(() => {
  let filtered = [...allAssignments.value];
  
  // 根据状态筛选
  if (filterStatus.value) {
    filtered = filtered.filter(item => item.status === filterStatus.value);
  }
  
  // 根据搜索关键字筛选
  if (searchQuery.value) {
    const keyword = searchQuery.value.toLowerCase();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(keyword) || 
      item.description.toLowerCase().includes(keyword)
    );
  }
  
  return filtered;
});

// 计算提交百分比
const calculateSubmissionPercentage = (assignment) => {
  const submittedCount = assignment.submittedCount || 0;
  const totalCount = assignment.totalCount || 0;
  
  if (!totalCount) return 0;
  return Math.round((submittedCount / totalCount) * 100);
};

// 获取提交状态
const getSubmissionStatus = (assignment) => {
  const submittedCount = assignment.submittedCount || 0;
  const totalCount = assignment.totalCount || 0;
  
  if (!totalCount) return '';
  
  const percentage = calculateSubmissionPercentage(assignment);
  if (percentage >= 90) return 'success';
  if (percentage >= 60) return 'warning';
  return 'exception';
};

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    ongoing: 'success',
    finished: 'info',
    pending: 'warning',
    draft: 'danger'
  };
  return types[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    ongoing: '进行中',
    finished: '已结束',
    pending: '未开始',
    draft: '草稿'
  };
  return texts[status] || '未知';
};

// 格式化班级名称
const formatClassNames = (classes) => {
  if (!classes || !classes.length) return '未指定班级';
  return classes.map(c => c.className || `班级${c.classId}`).join(', ');
};

// 格式化日期
const formatDate = (dateString) => {
  // 如果日期为空，直接返回未设置
  if (!dateString) return '未设置';
  
  try {
    // 尝试转换为日期对象
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '未设置';
    }
    
    // 使用简单的日期格式输出
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) {
    console.error('日期格式化错误:', e, dateString);
    return '未设置';
  }
};

// --- API调用函数 ---
const fetchAssignments = async () => {
  try {
    loading.value.all = true;
    
    const params = {
      page: pagination.value.currentPage,
      size: pagination.value.pageSize,
      keyword: searchQuery.value
    };
    
    // 调用API获取作业列表
    const response = await doGet('/api/service/assignment/creator', params);
    
    if (response && response.data && response.data.code === 200) {
      const { list, total } = response.data.data;
      allAssignments.value = list;
      pagination.value.total = total;
    } else {
      ElMessage.error('获取作业列表失败');
      allAssignments.value = [];
      pagination.value.total = 0;
    }
  } catch (error) {
    console.error('获取作业列表异常:', error);
    ElMessage.error(`获取作业列表失败: ${error.message || '未知错误'}`);
    allAssignments.value = [];
    pagination.value.total = 0;
  } finally {
    loading.value.all = false;
  }
};

const createAssignment = async (formData) => {
  try {
    // 构建请求数据
    const requestData = {
      title: formData.name,
      description: formData.description || `${formData.name}的详细描述`,
      startTime: formData.dates[0],
      endTime: formData.dates[1],
      totalScore: formData.score,
      attachments: []
    };

    // 如果有选定资源，添加到附件
    if (formData.selectedResource) {
      requestData.attachments.push({
        resourceId: formData.selectedResource.id,
        resourceName: formData.selectedResource.name
      });
    }

    const response = await doPost('/api/service/assignments', requestData);
    
    if (response.data.code === 200) {
      const assignmentId = response.data.data.assignmentId;
      
      // 发布到班级
      await publishAssignmentToClasses(
        assignmentId, 
        Array.isArray(formData.class) ? 
          formData.class.filter(c => c !== 'all') : 
          [formData.class],
        formData.dates[0],
        formData.dates[1]
      );
      
      ElMessage.success('作业创建成功');
      fetchAssignments(); // 重新获取列表
      return true;
    } else {
      ElMessage.error('创建作业失败：' + response.data.message);
      return false;
    }
  } catch (error) {
    console.error('创建作业异常:', error);
    ElMessage.error('创建作业失败，请检查网络连接');
    return false;
  }
};

const publishAssignmentToClasses = async (assignmentId, classIds, startTime, endTime) => {
  try {
    const response = await doPost(`/api/service/assignments/${assignmentId}/publish`, {
      classIds: classIds.map(className => getClassIdByName(className)), // 这里假设有个函数转换班级名称到ID
      startTime: startTime,
      endTime: endTime
    });
    
    if (response.data.code !== 200) {
      throw new Error(response.data.message);
    }
    
    return true;
  } catch (error) {
    console.error('发布作业到班级失败:', error);
    throw error;
  }
};

// 临时函数：根据班级名获取班级ID
const getClassIdByName = (className) => {
  // 这里应该从实际API获取班级ID，暂时返回模拟数据
  const classMap = {
    '软件2101': 1,
    '计算机2102': 2,
    '人工智能2103': 3
  };
  
  return classMap[className] || 1; // 默认返回ID 1
};

const updateAssignment = async (assignmentId, formData) => {
  try {
    // 构建请求数据
    const requestData = {
      title: formData.name,
      description: formData.description,
      totalScore: formData.score,
      attachments: []
    };

    // 如果有选定资源，添加到附件
    if (formData.selectedResource) {
      requestData.attachments.push({
        resourceId: formData.selectedResource.id,
        resourceName: formData.selectedResource.name
      });
    }

    const response = await doPut(`/api/service/assignments/${assignmentId}`, requestData);
    
    if (response.data.code === 200) {
      ElMessage.success('作业更新成功');
      fetchAssignments(); // 重新获取列表
      return true;
    } else {
      ElMessage.error('更新作业失败：' + response.data.message);
      return false;
    }
  } catch (error) {
    console.error('更新作业异常:', error);
    ElMessage.error('更新作业失败，请检查网络连接');
    return false;
  }
};

const deleteAssignmentFromAPI = async (assignmentId) => {
  try {
    const response = await doDelete(`/api/service/assignments/${assignmentId}`);
    
    if (response.data.code === 200) {
      ElMessage.success('作业删除成功');
      fetchAssignments(); // 重新获取列表
      return true;
    } else {
      ElMessage.error('删除作业失败：' + response.data.message);
      return false;
    }
  } catch (error) {
    console.error('删除作业异常:', error);
    ElMessage.error('删除作业失败，请检查网络连接');
    return false;
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.value.currentPage = 1;
  fetchAssignments();
};

// 处理筛选变化
const handleFilterChange = () => {
  pagination.value.currentPage = 1;
  fetchAssignments(); // 状态筛选也应重新获取数据
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.value.pageSize = size;
  fetchAssignments();
};

// 处理页码变化
const handleCurrentChange = (page) => {
  pagination.value.currentPage = page;
  fetchAssignments();
};

// 打开创建对话框
const openCreateDialog = () => {
  createDialogVisible.value = true;
};

// 处理作业创建成功
const handleAssignmentCreated = () => {
  createDialogVisible.value = false;
  fetchAssignments();
};

// 打开编辑对话框
const openEditDialog = (assignment) => {
  currentAssignment.value = assignment;
  editDialogVisible.value = true;
};

// 处理作业更新成功
const handleAssignmentUpdated = () => {
  editDialogVisible.value = false;
  ElMessage.success('作业更新成功');
  fetchAssignments();
};

// 确认删除作业
const confirmDeleteAssignment = (assignment) => {
  ElMessageBox.confirm(
    `确定要删除作业 "${assignment.title}" 吗？此操作不可撤销。`,
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await doDelete(`/api/service/assignment/${assignment.assignmentId}`);
      ElMessage.success('作业删除成功');
      fetchAssignments(); // 重新加载列表
    } catch (error) {
      ElMessage.error('删除作业失败');
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 查看作业详情
const viewAssignment = (assignmentId) => {
  router.push(`/assignment/${assignmentId}`);
};

// 初始加载
onMounted(() => {
  fetchAssignments();
});
</script>

<style scoped>
.task-assignment-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 250px;
}

.assignment-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.assignment-title-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.assignment-title-link:hover {
  text-decoration: underline;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 