<template>
  <div class="assignment-container">
    <!-- 1. 顶部操作栏 -->
    <el-card shadow="never" class="action-bar">
      <div class="action-content">
        <div class="action-left">
          <el-input
            v-model="searchQuery"
            placeholder="请输入关键字"
            class="search-input"
            clearable
          >
            <template #prepend>
              <el-select v-model="searchType" style="width: 115px">
                <el-option label="名称" value="name" />
                <el-option label="课程" value="course" />
                <el-option label="班级" value="class" />
                <el-option label="截止日期" value="deadline" />
              </el-select>
            </template>
          </el-input>
        </div>
        <div class="action-right">
          <el-button type="primary" @click="openCreateDialog">创建新作业</el-button>
        </div>
      </div>
    </el-card>

    <!-- 2. 待批改作业列表 -->
    <el-card class="assignment-list">
      <template #header>
        <div class="card-header">
          <span>待批改作业</span>
          <el-radio-group v-model="gradeFilterStatus" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="ongoing">进行中</el-radio-button>
            <el-radio-button label="finished">已结束</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div v-if="filteredPendingAssignments.length > 0" class="assignment-list">
        <el-card v-for="item in filteredPendingAssignments" :key="item.id" class="assignment-card">
          <div class="assignment-content">
            <div class="assignment-details">
              <h3>{{ item.name }}</h3>
              <p class="description">{{ item.description }}</p>
              <div class="meta">
                <span><el-icon><Calendar /></el-icon> 截止日期: {{ item.deadline }}</span>
                <span><el-icon><User /></el-icon> 完成人数: {{ item.completedCount }} / {{ item.totalCount }}</span>
              </div>
            </div>
            <div class="assignment-actions">
              <el-button type="primary" link @click="viewDetails(item.id)">
                <el-icon><View /></el-icon> 查看详情
              </el-button>
              <el-button type="danger" link @click="deleteAssignment(item.id)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="暂无待批改的作业"></el-empty>
    </el-card>

    <!-- 3. 未开始作业列表 -->
    <el-card class="assignment-list">
      <template #header>
        <span>未开始作业</span>
      </template>
      <el-table :data="notStartedAssignments" stripe>
        <el-table-column prop="name" label="作业名称" />
        <el-table-column prop="course" label="所属课程" />
        <el-table-column label="班级">
          <template #default="{ row }">
            {{ Array.isArray(row.class) ? row.class.join(', ') : row.class }}
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止日期" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">修改</el-button>
            <el-button type="danger" link @click="deleteAssignment(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建新作业弹窗 -->
    <el-dialog v-model="isDialogVisible" title="创建新作业" width="600px">
      <CreateAssignmentForm v-if="isDialogVisible" ref="createFormRef" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleFormSubmit">
            确认创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改作业弹窗 -->
    <el-dialog v-model="editDialogVisible" title="修改作业信息" width="600px">
      <CreateAssignmentForm
        v-if="editDialogVisible"
        ref="editFormRef"
        :initial-data="currentAssignment"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleFormSubmit">
            确认修改
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Calendar, User, View, Delete, Search } from '@element-plus/icons-vue';
import CreateAssignmentForm from './common/CreateAssignmentForm.vue';

const searchQuery = ref('');
const searchType = ref('name');
const activeTab = ref('pending');
const isDialogVisible = ref(false);
const editDialogVisible = ref(false);
const currentAssignment = ref(null);
const router = useRouter();
const editFormRef = ref(null);
const createFormRef = ref(null);

// 修改数据源，添加startDate字段
const allAssignments = ref([
  {
    id: 'hw001',
    name: '第一章习题',
    description: '完成课本第一章的课后习题1-10',
    status: 'pending', // 'pending', 'draft', 'archived'
    startDate: '2025-06-25',
    deadline: '2025-07-05',
    course: '高等数学',
    class: ['计科2101', '计科2102'],
    completedCount: 38,
    totalCount: 45,
    score: 100
  },
  {
    id: 'hw002',
    name: '函数与极限作业',
    description: '完成函数与极限相关的20道练习题',
    status: 'pending',
    startDate: '2025-07-01',
    deadline: '2025-07-10',
    course: '高等数学',
    class: ['计科2101'],
    completedCount: 42,
    totalCount: 45,
    score: 100
  },
  {
    id: 'hw003',
    name: '期中复习卷',
    description: '复习前五章内容，完成模拟试卷',
    status: 'draft',
    startDate: '2025-07-15',
    deadline: '2025-07-20',
    course: '线性代数',
    class: ['软工2101'],
    completedCount: 0,
    totalCount: 50,
    score: 100
  },
  {
    id: 'hw004',
    name: '项目最终报告',
    description: '提交最终项目报告和代码',
    status: 'archived',
    startDate: '2025-06-20',
    deadline: '2025-06-30',
    course: '计算机组成原理',
    class: ['计科2102'],
    completedCount: 40,
    totalCount: 40,
    score: 100
  },
]);

// --- 计算属性 ---
const filteredAssignments = computed(() => {
  if (!searchQuery.value) {
    return allAssignments.value;
  }
  return allAssignments.value.filter(item => {
    const term = searchQuery.value.toLowerCase();
    const data = (item[searchType.value] || '').toString().toLowerCase();
    return data.includes(term);
  });
});

const pendingReviewAssignments = computed(() =>
  filteredAssignments.value.filter(a => a.status === 'pending')
);

const draftAssignments = computed(() =>
  filteredAssignments.value.filter(a => a.status === 'draft')
);

const archivedAssignments = computed(() =>
  filteredAssignments.value.filter(a => a.status === 'archived')
);

const gradeFilterStatus = ref('all'); // 'all', 'ongoing', 'finished'

const notStartedAssignments = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 标准化到当天零点
  
  return filteredAssignments.value.filter(item => {
    // 筛选出草稿状态的作业
    if (item.status !== 'draft') return false;
    
    // 检查开始日期
    if (item.startDate) {
      const startDate = new Date(item.startDate);
      // 如果开始日期已经到了，应该自动发布作业
      if (startDate <= today) {
        // 在实际项目中，这里应该调用API更新作业状态
        // 这里为了演示，直接修改本地状态
        item.status = 'pending';
        return false; // 不再显示在未开始列表中
      }
    }
    
    return true;
  });
});

// 添加计算属性来过滤待批改作业
const filteredPendingAssignments = computed(() => {
  // 先获取所有待批改作业
  let assignments = pendingReviewAssignments.value;
  
  // 根据选择的筛选状态进行过滤
  if (gradeFilterStatus.value !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 标准化到当天零点
    
    assignments = assignments.filter(item => {
      const deadlineDate = new Date(item.deadline);
      // 进行中: 截止日期在今天或之后
      if (gradeFilterStatus.value === 'ongoing') {
        return deadlineDate >= today;
      } 
      // 已结束: 截止日期在今天之前
      else if (gradeFilterStatus.value === 'finished') {
        return deadlineDate < today;
      }
      return true;
    });
  }
  
  return assignments;
});

// --- 方法 ---

const handleSearch = () => {
  // 计算属性会自动重新计算，所以这里可以留空，或者用于触发API请求
  console.log(`Searching for ${searchQuery.value} in ${searchType.value}`);
};

const openCreateDialog = () => {
  currentAssignment.value = null;
  isDialogVisible.value = true;
};

const handleFormSubmit = async () => {
  try {
    let formRef;
    // 根据当前打开的是哪个对话框，选择对应的表单引用
    if (editDialogVisible.value) {
      formRef = editFormRef;
    } else {
      formRef = createFormRef;
    }
    
    if (!formRef.value) {
      ElMessage.error('表单引用不存在');
      return;
    }
    
    // 获取表单数据
    const formData = await formRef.value.submit();
    console.log('表单数据:', formData);
    
    // 添加id，如果是编辑操作
    if (currentAssignment.value && currentAssignment.value.id) {
      formData.id = currentAssignment.value.id;
    }
    
    if (formData.id) {
      // 编辑操作
      const index = allAssignments.value.findIndex(a => a.id === formData.id);
      if (index !== -1) {
        // 保留原始的一些字段
        const originalAssignment = allAssignments.value[index];
        const updatedAssignment = { 
          ...originalAssignment,
          name: formData.name,
          course: formData.course,
          class: Array.isArray(formData.class) ? 
                formData.class.filter(c => c !== 'all') : 
                [formData.class],
          score: formData.score
        };
        
        // 处理日期选择
        if (formData.dates && formData.dates.length === 2) {
          updatedAssignment.startDate = formatDate(formData.dates[0]);
          updatedAssignment.deadline = formatDate(formData.dates[1]);
        }
        
        allAssignments.value[index] = updatedAssignment;
        ElMessage.success('作业修改成功');
        editDialogVisible.value = false;
      }
    } else {
      // 创建操作
      const newAssignment = {
        id: `hw${Date.now()}`,
        name: formData.name,
        course: formData.course,
        class: Array.isArray(formData.class) ? 
              formData.class.filter(c => c !== 'all') : 
              [formData.class],
        status: 'draft',
        completedCount: 0,
        totalCount: calculateTotalCount(formData.class),
        score: formData.score,
        description: `${formData.name}的详细描述`
      };
      
      // 处理日期选择
      if (formData.dates && formData.dates.length === 2) {
        newAssignment.startDate = formatDate(formData.dates[0]);
        newAssignment.deadline = formatDate(formData.dates[1]);
        
        // 检查开始日期是否已过，如果已过则自动设为pending状态
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(newAssignment.startDate);
        if (startDate <= today) {
          newAssignment.status = 'pending';
        }
      }
      
      allAssignments.value.unshift(newAssignment);
      ElMessage.success('作业创建成功');
      isDialogVisible.value = false;
    }
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入');
    console.error(error);
  }
};

// 辅助函数：格式化日期为YYYY-MM-DD
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 辅助函数：计算总人数
const calculateTotalCount = (classList) => {
  if (!Array.isArray(classList)) return 0;
  // 过滤掉'all'选项
  const filteredClasses = classList.filter(c => c !== 'all');
  // 假设每个班25人
  return filteredClasses.length * 25;
};

const viewDetails = (id) => {
  router.push({ name: 'AssignmentDetail', params: { id } });
};

const deleteAssignment = (id) => {
  ElMessageBox.confirm('确定要删除这项作业吗？此操作不可撤销。', '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    allAssignments.value = allAssignments.value.filter(a => a.id !== id);
    ElMessage.success('作业删除成功');
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

const handleEdit = (row) => {
  currentAssignment.value = { ...row };
  editDialogVisible.value = true;
};
</script>

<style scoped>
.assignment-container {
  padding: 24px;
}

.action-bar {
  margin-bottom: 20px;
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignment-list {
  margin-top: 20px;
}

.search-input {
  width: 450px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assignment-card {
  border-radius: 4px;
}

.assignment-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignment-details {
  flex-grow: 1;
}

.assignment-details h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.assignment-details .description {
  color: #606266;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.assignment-details .meta {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 13px;
  color: #909399;
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.assignment-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  padding-left: 20px;
}

.assignment-actions .el-button {
  font-size: 14px;
}
</style> 