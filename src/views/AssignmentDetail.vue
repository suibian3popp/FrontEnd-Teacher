<template>
  <div class="assignment-detail-container">
    <el-page-header @back="goBack">
      <template #content>
        <span class="text-large font-600 mr-3"> 作业详情 </span>
      </template>
    </el-page-header>
    
    <el-card class="assignment-info">
      <template #header>
        <div class="card-header">
          <span>{{ assignment.name }}</span>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="所属课程">{{ assignment.course }}</el-descriptions-item>
        <el-descriptions-item label="所属班级">{{ assignment.class }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ assignment.startDate }}</el-descriptions-item>
        <el-descriptions-item label="截止时间">{{ assignment.dueDate }}</el-descriptions-item>
        <el-descriptions-item label="总分数">{{ assignment.score }}</el-descriptions-item>
        <el-descriptions-item label="附件">
          <el-link type="primary">点击下载</el-link>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="submission-status">
      <template #header>
        <div class="card-header">
          <span>提交情况</span>
        </div>
      </template>

      <el-tabs type="border-card" class="submission-tabs">
        <el-tab-pane>
          <template #label>
            <span><i class="el-icon-edit"></i> 未批改 ({{ ungradedSubmissions.length }})</span>
          </template>
          <el-table :data="ungradedSubmissions" stripe empty-text="暂无未批改的作业">
            <el-table-column prop="studentName" label="学生姓名"></el-table-column>
            <el-table-column prop="studentId" label="学号"></el-table-column>
            <el-table-column prop="submitTime" label="提交时间"></el-table-column>
            <el-table-column label="操作">
              <template #default>
                <el-button type="primary" link>批改作业</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane>
          <template #label>
            <span><i class="el-icon-warning"></i> 未提交 ({{ notSubmittedSubmissions.length }})</span>
          </template>
          <div class="tab-pane-toolbar">
            <el-button 
              type="warning" 
              size="small"
              @click="remindAllStudents"
              v-if="notSubmittedSubmissions.length > 0">
              一键提醒所有未交学生
            </el-button>
          </div>
          <el-table :data="notSubmittedSubmissions" stripe empty-text="所有学生均已提交">
            <el-table-column prop="studentName" label="学生姓名"></el-table-column>
            <el-table-column prop="studentId" label="学号"></el-table-column>
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button type="danger" link @click="remindStudent(row)">提醒该学生</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane>
          <template #label>
            <span><i class="el-icon-success"></i> 已批改 ({{ gradedSubmissions.length }})</span>
          </template>
          <el-table :data="gradedSubmissions" stripe empty-text="暂无已批改的作业">
            <el-table-column prop="studentName" label="学生姓名"></el-table-column>
            <el-table-column prop="studentId" label="学号"></el-table-column>
            <el-table-column prop="submitTime" label="提交时间"></el-table-column>
             <el-table-column label="操作">
              <template #default>
                <el-button type="primary" link>查看批改</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();

const assignment = ref({
  name: '加载中...',
  submissions: []
});

// 在实际项目中，这里会根据 route.params.id 调用 API 获取数据
const fetchAssignmentDetail = (id) => {
  console.log('Fetching details for assignment ID:', id);
  // 模拟从API获取数据
  assignment.value = {
    id: id,
    name: '第三章-需求分析报告',
    course: '软件工程',
    class: '软件2101',
    startDate: '2024-08-01',
    dueDate: '2024-08-15',
    score: 100,
    submissions: [
      { studentName: '王晓明', studentId: '2021001', submitTime: '2024-08-14 10:30', status: '已批改' },
      { studentName: '李静', studentId: '2021002', submitTime: '2024-08-14 11:15', status: '未批改' },
      { studentName: '张三', studentId: '2021005', submitTime: '2024-08-15 11:00', status: '未批改' },
      { studentName: '陈伟', studentId: '2021003', submitTime: '', status: '未提交' },
      { studentName: '赵琳', studentId: '2021004', submitTime: '2024-08-15 09:00', status: '已批改' },
    ]
  };
};

onMounted(() => {
  fetchAssignmentDetail(route.params.id);
});

const goBack = () => {
  router.back();
};

const ungradedSubmissions = computed(() =>
  assignment.value.submissions.filter(s => s.status === '未批改')
);

const notSubmittedSubmissions = computed(() =>
  assignment.value.submissions.filter(s => s.status === '未提交')
);

const gradedSubmissions = computed(() =>
  assignment.value.submissions.filter(s => s.status === '已批改')
);

const getStatusTagType = (status) => {
  switch (status) {
    case '已批改':
      return 'info'; // 灰色
    case '未批改':
      return 'success'; // 绿色
    case '未提交':
      return 'danger'; // 红色
    default:
      return '';
  }
};

const remindStudent = (student) => {
  console.log('Reminding student:', student.studentName);
  ElMessage.success(`已发送提醒给 ${student.studentName}`);
};

const remindAllStudents = () => {
  if (notSubmittedSubmissions.value.length === 0) {
    ElMessage.info('没有需要提醒的学生');
    return;
  }
  
  const studentCount = notSubmittedSubmissions.value.length;
  ElMessageBox.confirm(
    `确定要向这 ${studentCount} 位未提交学生发送提醒吗?`,
    '一键提醒',
    {
      confirmButtonText: '确定发送',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    console.log('Reminding all unsubmitted students...');
    ElMessage({
      type: 'success',
      message: '已向所有未提交学生发送提醒',
    });
  }).catch(() => {
    ElMessage({
      type: 'info',
      message: '已取消操作',
    });
  });
};
</script>

<style scoped>
.assignment-detail-container {
  padding: 24px;
}
.el-page-header {
  margin-bottom: 24px;
}
.assignment-info {
  margin-bottom: 20px;
}
.submission-status {
  margin-top: 20px;
}

.submission-tabs {
  margin-top: 10px;
}

.tab-pane-toolbar {
  margin-bottom: 10px;
  text-align: left;
}
</style> 