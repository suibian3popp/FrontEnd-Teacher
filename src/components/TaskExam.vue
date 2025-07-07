<template>
  <div class="exam-container">
    <!-- 1. 顶部操作栏 -->
    <el-card shadow="never" class="action-bar">
      <div class="action-content">
        <div class="action-left">
          <el-input
            v-model="searchQuery"
            placeholder="请输入关键字"
            class="search-input"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prepend>
              <el-select v-model="searchCategory" style="width: 115px">
                <el-option label="名称" value="name" />
                <el-option label="课程" value="course" />
                <el-option label="班级" value="class" />
                <el-option label="考试时间" value="examTime" />
              </el-select>
            </template>
          </el-input>
        </div>
        <div class="action-right">
          <el-button type="primary" @click="openCreateDialog">创建新考试</el-button>
        </div>
      </div>
    </el-card>

    <!-- 2. 待批改考试列表 -->
    <el-card class="exam-list">
      <template #header>
        <div class="card-header">
          <span>待批改考试</span>
          <el-radio-group v-model="gradeFilterStatus" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="ongoing">进行中</el-radio-button>
            <el-radio-button label="finished">已结束</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div v-if="filteredPendingExams.length > 0" class="exam-list">
        <el-card v-for="item in filteredPendingExams" :key="item.id" class="exam-card">
          <div class="exam-content">
            <div class="exam-details">
              <h3>{{ item.name }}</h3>
              <p class="description">{{ item.description || '暂无说明' }}</p>
              <div class="meta">
                <span><el-icon><Calendar /></el-icon> 考试时间: {{ item.examTime }}</span>
                <span><el-icon><Timer /></el-icon> 时长: {{ item.duration }}分钟</span>
                <span><el-icon><User /></el-icon> 完成人数: {{ item.submissions.submitted }} / {{ item.submissions.total }}</span>
              </div>
            </div>
            <div class="exam-actions">
              <el-button type="primary" link @click="viewDetails(item.id)">
                <el-icon><View /></el-icon> 查看详情
              </el-button>
              <el-button type="success" link @click="gradeExam(item.id)">
                <el-icon><Check /></el-icon> 批改试卷
              </el-button>
              <el-button type="danger" link @click="deleteExam(item.id)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="暂无待批改的考试"></el-empty>
    </el-card>

    <!-- 3. 未开始考试列表 -->
    <el-card class="exam-list">
      <template #header>
        <span>未开始考试</span>
      </template>
      <el-table :data="notStartedExams" stripe>
        <el-table-column prop="name" label="考试名称" />
        <el-table-column prop="course" label="所属课程" />
        <el-table-column label="班级">
          <template #default="{ row }">
            {{ Array.isArray(row.class) ? row.class.join(', ') : row.class }}
          </template>
        </el-table-column>
        <el-table-column prop="examTime" label="考试时间" />
        <el-table-column prop="duration" label="考试时长">
          <template #default="{ row }">
            {{ row.duration }} 分钟
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">修改</el-button>
            <el-button type="danger" link @click="deleteExam(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建新考试弹窗 -->
    <el-dialog v-model="isDialogVisible" title="创建新考试" width="600px">
      <CreateExamForm v-if="isDialogVisible" ref="createFormRef" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleFormSubmit">
            确认创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改考试弹窗 -->
    <el-dialog v-model="editDialogVisible" title="修改考试信息" width="600px">
      <CreateExamForm
        v-if="editDialogVisible"
        ref="editFormRef"
        :initial-data="currentExam"
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
import { Calendar, User, View, Delete, Timer, Check } from '@element-plus/icons-vue';
import CreateExamForm from './common/CreateExamForm.vue';

const searchQuery = ref('');
const searchCategory = ref('name'); // 默认按名称搜索
const isDialogVisible = ref(false);
const editDialogVisible = ref(false);
const currentExam = ref(null);
const router = useRouter();
const editFormRef = ref(null);
const createFormRef = ref(null);
const gradeFilterStatus = ref('all'); // 'all', 'ongoing', 'finished'

// 原始数据源
const allExams = ref([
  { 
    id: 1, 
    name: '软件工程-期中考试', 
    course: '软件工程', 
    class: ['软件2101'], 
    examTime: '2024-07-30 09:00', 
    duration: 120,
    status: 'pending', // 'pending', 'draft'
    description: '软件工程课程期中考试，包含选择题和简答题',
    submissions: { submitted: 40, total: 40 },
    type: 'online'
  },
  { 
    id: 2, 
    name: '计算机网络-随堂测试', 
    course: '计算机网络', 
    class: ['计算机2102'], 
    examTime: '2024-08-01 14:00', 
    duration: 60,
    status: 'pending',
    description: '计算机网络课程随堂测验，主要考察基本概念掌握情况',
    submissions: { submitted: 43, total: 45 },
    type: 'offline'
  },
  { 
    id: 3, 
    name: '操作系统-期末考试', 
    course: '操作系统', 
    class: ['软件2101', '计算机2102'],
    examTime: '2024-08-15 09:00', 
    duration: 180,
    status: 'draft',
    description: '操作系统课程期末考试，重点考察进程管理和内存管理',
    submissions: { submitted: 0, total: 80 },
    type: 'online'
  },
  { 
    id: 4, 
    name: '数据结构-期中考试', 
    course: '数据结构', 
    class: ['人工智能2103'],
    examTime: '2024-08-20 14:00', 
    duration: 120,
    status: 'draft',
    description: '数据结构课程期中考试，包含选择题和编程题',
    submissions: { submitted: 0, total: 45 },
    type: 'online'
  },
]);

// 计算属性：根据搜索条件过滤的考试列表
const filteredExams = computed(() => {
  if (!searchQuery.value) {
    return allExams.value;
  }
  return allExams.value.filter(exam => {
    const value = exam[searchCategory.value];
    const searchTerm = searchQuery.value.toLowerCase();
    
    if (Array.isArray(value)) {
      return value.some(v => String(v).toLowerCase().includes(searchTerm));
    }
    return String(value).toLowerCase().includes(searchTerm);
  });
});

// 待批改考试列表
const pendingExams = computed(() =>
  filteredExams.value.filter(exam => exam.status === 'pending')
);

// 根据过滤条件筛选待批改考试
const filteredPendingExams = computed(() => {
  let exams = pendingExams.value;
  
  if (gradeFilterStatus.value !== 'all') {
    const now = new Date();
    
    exams = exams.filter(item => {
      const examDateTime = new Date(item.examTime);
      const examEndTime = new Date(examDateTime.getTime() + item.duration * 60000);
      
      // 进行中: 考试时间已开始，但未结束
      if (gradeFilterStatus.value === 'ongoing') {
        return examDateTime <= now && examEndTime >= now;
      } 
      // 已结束: 考试结束时间已过
      else if (gradeFilterStatus.value === 'finished') {
        return examEndTime < now;
      }
      return true;
    });
  }
  
  return exams;
});

// 未开始的考试列表
const notStartedExams = computed(() => {
  return filteredExams.value.filter(exam => exam.status === 'draft');
});

// 处理搜索
const handleSearch = () => {
  console.log(`搜索条件：${searchCategory.value} = ${searchQuery.value}`);
};

// 打开创建考试对话框
const openCreateDialog = () => {
  currentExam.value = null;
  isDialogVisible.value = true;
};

// 表单提交处理
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
    if (currentExam.value && currentExam.value.id) {
      formData.id = currentExam.value.id;
    }
    
    if (formData.id) {
      // 编辑操作
      const index = allExams.value.findIndex(e => e.id === formData.id);
      if (index !== -1) {
        // 保留原始的一些字段
        const originalExam = allExams.value[index];
        const updatedExam = { 
          ...originalExam,
          name: formData.name,
          course: formData.course,
          class: Array.isArray(formData.class) ? 
                formData.class.filter(c => c !== 'all') : 
                [formData.class],
          score: formData.score,
          duration: formData.duration,
          type: formData.type,
          description: formData.description || ''
        };
        
        // 处理考试时间
        if (formData.examTime) {
          updatedExam.examTime = formatDateTime(formData.examTime);
        }
        
        allExams.value[index] = updatedExam;
        ElMessage.success('考试修改成功');
        editDialogVisible.value = false;
      }
    } else {
      // 创建操作
      const newExam = {
        id: Date.now(),
        name: formData.name,
        course: formData.course,
        class: Array.isArray(formData.class) ? 
              formData.class.filter(c => c !== 'all') : 
              [formData.class],
        status: 'draft',
        duration: formData.duration,
        type: formData.type,
        description: formData.description || '',
        submissions: { submitted: 0, total: calculateTotalCount(formData.class) }
      };
      
      // 处理考试时间
      if (formData.examTime) {
        newExam.examTime = formatDateTime(formData.examTime);
        
        // 检查考试时间是否已过，如果已过则不允许创建
        const examTime = new Date(newExam.examTime);
        const now = new Date();
        if (examTime < now) {
          ElMessage.warning('不能创建过去时间的考试');
          return;
        }
      }
      
      allExams.value.unshift(newExam);
      ElMessage.success('考试创建成功');
      isDialogVisible.value = false;
    }
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入');
    console.error(error);
  }
};

// 辅助函数：格式化日期时间为YYYY-MM-DD HH:MM
const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 辅助函数：计算总人数
const calculateTotalCount = (classList) => {
  if (!Array.isArray(classList)) return 0;
  // 过滤掉'all'选项
  const filteredClasses = classList.filter(c => c !== 'all');
  // 假设每个班25人
  return filteredClasses.length * 25;
};

// 查看考试详情
const viewDetails = (id) => {
  router.push({ name: 'ExamDetail', params: { id } });
};

// 批改考试
const gradeExam = (id) => {
  // 跳转到考试详情页面并自动打开批改对话框
  router.push({ 
    name: 'ExamDetail', 
    params: { id },
    query: { action: 'grade' }
  });
};

// 删除考试
const deleteExam = (id) => {
  ElMessageBox.confirm('确定要删除这项考试吗？此操作不可撤销。', '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    allExams.value = allExams.value.filter(exam => exam.id !== id);
    ElMessage.success('考试删除成功');
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 编辑考试信息
const handleEdit = (row) => {
  currentExam.value = { ...row };
  editDialogVisible.value = true;
};
</script>

<style scoped>
.exam-container {
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

.exam-list {
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

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exam-card {
  border-radius: 4px;
}

.exam-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exam-details {
  flex-grow: 1;
}

.exam-details h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.exam-details .description {
  color: #606266;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.exam-details .meta {
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

.action-left {
  flex: 1;
}

.action-right {
  margin-left: 16px;
}
</style> 