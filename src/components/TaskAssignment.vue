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
              <el-select v-model="searchCategory" style="width: 115px">
                <el-option label="名称" value="name" />
                <el-option label="课程" value="course" />
                <el-option label="班级" value="class" />
                <el-option label="截止日期" value="dueDate" />
              </el-select>
            </template>
          </el-input>
        </div>
        <div class="action-right">
          <el-button type="primary" @click="dialogVisible = true">创建新作业</el-button>
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
      <el-table :data="assignmentsToGrade" stripe>
        <el-table-column prop="name" label="作业名称" />
        <el-table-column prop="course" label="所属课程" />
        <el-table-column prop="class" label="班级" />
        <el-table-column prop="dueDate" label="截止日期" />
        <el-table-column prop="submissions" label="提交人数">
          <template #default="{ row }">
            <span>{{ row.submissions.submitted }} / {{ row.submissions.total }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button v-if="isOngoing(row.dueDate)" type="primary" link @click="handleEdit(row)">
              修改
            </el-button>
            <el-button v-else type="primary" link>
              批改作业
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 3. 未开始作业列表 -->
    <el-card class="assignment-list">
      <template #header>
        <span>未开始作业</span>
      </template>
      <el-table :data="notStartedAssignments" stripe>
        <el-table-column prop="name" label="作业名称" />
        <el-table-column prop="course" label="所属课程" />
        <el-table-column prop="class" label="班级" />
        <el-table-column prop="startDate" label="开始日期" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建新作业弹窗 -->
    <el-dialog v-model="dialogVisible" title="创建新作业" width="600px">
      <CreateAssignmentForm v-if="dialogVisible" ref="createFormRef" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateAssignment">
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
          <el-button type="primary" @click="handleUpdateAssignment">
            确认修改
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CreateAssignmentForm from './common/CreateAssignmentForm.vue';
import { ElMessage } from 'element-plus';

const searchQuery = ref('');
const searchCategory = ref('name'); // 默认按名称搜索
const dialogVisible = ref(false);
const createFormRef = ref(null);
const editDialogVisible = ref(false);
const editFormRef = ref(null);
const currentAssignment = ref(null);
const gradeFilterStatus = ref('all'); // 'all', 'ongoing', 'finished'

// --- 原始数据源 ---
const allAssignmentsToGrade = ref([
  // 已结束
  { id: 1, name: '第三章-需求分析报告', course: '软件工程', class: '软件2101', dueDate: '2024-08-05', submissions: { submitted: 35, total: 40 } },
  { id: 2, name: '第五章-TCP协议分析', course: '计算机网络', class: '计算机2102', dueDate: '2024-08-06', submissions: { submitted: 42, total: 45 } },
  { id: 3, name: '期中项目-简易文件系统', course: '操作系统', class: '软件2101', dueDate: '2024-08-10', submissions: { submitted: 38, total: 40 } },
  // 进行中 (从之前的列表中合并过来)
  { id: 201, name: '第六章-网络安全策略', course: '计算机网络', class: '计算机2102', dueDate: '2024-08-25', submissions: { submitted: 15, total: 45 } },
  { id: 202, name: '第二次随堂测试', course: '操作系统', class: '软件2101, 人工智能2103', dueDate: '2024-08-28', submissions: { submitted: 50, total: 82 } },
  { id: 203, name: '团队项目-需求访谈', course: '软件工程', class: '软件2101', dueDate: '2024-08-30', submissions: { submitted: 5, total: 10 } },
]);
const allNotStartedAssignments = ref([
  { id: 101, name: '期末大作业-项目策划书', course: '软件工程', class: '软件2101, 计算机2102', startDate: '2024-09-01' },
  { id: 102, name: '第七章-UML建模', course: '软件工程', class: '软件2101', startDate: '2024-09-05' },
  { id: 103, name: '课程论文-网络安全展望', course: '计算机网络', class: '计算机2102', startDate: '2024-09-10' },
]);

// --- 计算属性，用于动态筛选和展示 ---
const assignmentsToGrade = computed(() => {
  // 1. 先按状态筛选 (进行中/已结束)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 标准化到当天零点
  let statusFilteredList = allAssignmentsToGrade.value;
  if (gradeFilterStatus.value === 'ongoing') {
    statusFilteredList = allAssignmentsToGrade.value.filter(a => new Date(a.dueDate) >= today);
  } else if (gradeFilterStatus.value === 'finished') {
    statusFilteredList = allAssignmentsToGrade.value.filter(a => new Date(a.dueDate) < today);
  }

  // 2. 再按搜索关键词筛选
  const query = searchQuery.value.trim().toLowerCase();
  const category = searchCategory.value;
  if (!query) {
    return statusFilteredList; // 没有搜索词，直接返回状态筛选结果
  }
  return statusFilteredList.filter(item => {
    const value = item[category];
    return value && String(value).toLowerCase().includes(query);
  });
});

const notStartedAssignments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const category = searchCategory.value;
  if (!query) {
    return allNotStartedAssignments.value;
  }
  return allNotStartedAssignments.value.filter(item => {
    const value = item[category];
    return value && String(value).toLowerCase().includes(query);
  });
});

const isOngoing = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 标准化到当天零点
  return new Date(dueDate) >= today;
};

const handleCreateAssignment = async () => {
  try {
    const formData = await createFormRef.value.submit();
    
    const selectedClasses = formData.class.filter(c => c !== 'all');
    
    // 决定新作业应该被添加到哪个列表
    const newAssignment = {
      id: Date.now(),
      name: formData.name,
      course: formData.course,
      class: selectedClasses.join(', '),
      startDate: formData.dates[0].toLocaleDateString('zh-CN'),
      dueDate: formData.dates[1].toLocaleDateString('zh-CN'),
      submissions: { submitted: 0, total: 40 * selectedClasses.length }
    };

    // 新创建的作业，根据截止日期决定是"未开始"还是"待批改（进行中）"
    allAssignmentsToGrade.value.unshift(newAssignment);
    
    dialogVisible.value = false;
    ElMessage.success('作业创建成功！');

  } catch (error) {
    console.error(error);
    ElMessage.error('表单填写有误，请检查！');
  }
};

const handleEdit = (assignment) => {
  currentAssignment.value = assignment;
  editDialogVisible.value = true;
};

const handleUpdateAssignment = async () => {
  try {
    const formData = await editFormRef.value.submit();
    
    // 更新数据
    currentAssignment.value.name = formData.name;
    currentAssignment.value.course = formData.course;
    currentAssignment.value.class = formData.class.join(', ');
    // ... 其他字段的更新
    
    editDialogVisible.value = false;
    ElMessage.success('作业修改成功！');
  } catch (error) {
    ElMessage.error('表单填写有误，请检查！');
  }
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
</style> 