<template>
  <div class="assignment-detail-container">
    <el-page-header @back="goBack">
      <template #content>
        <span class="text-large font-600 mr-3"> 作业详情 </span>
      </template>
    </el-page-header>
    
    <div class="main-content">
      <!-- 左侧主要内容区域 -->
      <div class="content-left">
        <!-- 1. 作业基本信息卡片 -->
        <el-card class="assignment-info">
          <template #header>
            <div class="card-header">
              <span>{{ assignment.name }}</span>
            </div>
          </template>
          
          <el-descriptions :column="2" border class="info-table">
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

        <!-- 2. 提交情况表格 -->
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
                  <template #default="{ row }">
                    <el-button type="primary" link @click="openGradeDialog(row)">批改作业</el-button>
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
                <el-table-column prop="score" label="得分"></el-table-column>
                <el-table-column label="操作">
                  <template #default="{ row }">
                    <el-button type="primary" link @click="viewGradeDetails(row)">查看批改</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
        
        <!-- 3. 数据可视化区域 -->
        <div class="visualization-container">
          <!-- 提交状态分布饼图 -->
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>提交状态分布</span>
              </div>
            </template>
            <div class="chart-container" ref="pieChartRef"></div>
          </el-card>
          
          <!-- 提交时间分布热力图 -->
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>提交时间分布</span>
              </div>
            </template>
            <div class="heatmap-container">
              <div v-for="(day, index) in paginatedHeatmap" :key="index" class="heatmap-day">
                <div class="day-label">{{ day.date }}</div>
                <div class="day-count" :class="getHeatmapClass(day.count)">
                  {{ day.count }}份
                </div>
                <div class="day-students" v-if="day.students.length > 0">
                  {{ day.students.join(', ') }}
                </div>
                <div class="day-students" v-else>无提交</div>
              </div>
            </div>
            <!-- 热力图分页 -->
            <div class="heatmap-pagination">
              <el-pagination
                v-model:current-page="heatmapCurrentPage"
                :page-size="heatmapPageSize"
                layout="prev, pager, next"
                :total="submissionHeatmap.length"
                @current-change="handleHeatmapPageChange"
                small
              />
            </div>
          </el-card>
        </div>
      </div>
      
      <!-- 右侧侧边栏 -->
      <div class="content-right">
        <!-- 班级完成进度排行榜 -->
        <el-card class="progress-ranking">
          <template #header>
            <div class="card-header">
              <span>班级完成进度排行榜</span>
            </div>
          </template>
          
          <div class="ranking-list">
            <div v-for="(student, index) in studentRanking" :key="index" class="ranking-item">
              <div class="ranking-status" :class="getStatusClass(student.status)">
                <i :class="getStatusIcon(student.status)"></i>
              </div>
              <div class="ranking-info">
                <div class="student-name">{{ student.name }}</div>
                <div class="student-meta">
                  <span v-if="student.submitTime">{{ student.submitTime }}</span>
                  <span v-else>未提交</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 批改作业对话框 -->
    <grade-assignment-dialog
      v-model:visible="gradeDialogVisible"
      :submission="currentSubmission"
      :maxScore="assignment.score"
      @graded="handleGraded"
    />

    <!-- 查看批改详情对话框 -->
    <el-dialog
      v-model="viewGradeDialogVisible"
      title="批改详情"
      width="60%"
    >
      <div v-if="currentSubmission">
        <el-descriptions title="学生信息" :column="2" border>
          <el-descriptions-item label="姓名">{{ currentSubmission.studentName }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ currentSubmission.studentId }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentSubmission.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="得分">
            <span class="grade-score">{{ currentSubmission.score }}</span> / {{ assignment.score }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 作业内容 -->
        <div class="assignment-submitted-content">
          <h4>作业内容</h4>
          
          <!-- 文本内容部分 -->
          <div v-if="currentSubmission.textContent" class="content-section">
            <div class="section-title">
              <span>文本内容</span>
            </div>
            <div class="text-preview">
              <pre>{{ currentSubmission.textContent }}</pre>
            </div>
          </div>
          
          <!-- 附件部分 -->
          <div v-if="currentSubmission.attachments && currentSubmission.attachments.length > 0" class="content-section">
            <div class="section-title">
              <span>附件列表</span>
            </div>
            <el-table :data="currentSubmission.attachments" style="width: 100%">
              <el-table-column prop="name" label="文件名" />
              <el-table-column prop="size" label="大小" width="120" />
              <el-table-column prop="type" label="类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getFileTagType(row.type)">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="downloadFile(row)">
                    <el-icon><Download /></el-icon> 下载
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 兼容旧数据 -->
          <div v-if="!currentSubmission.textContent && !currentSubmission.attachments?.length && currentSubmission.content" class="content-preview">
            <pre>{{ currentSubmission.content }}</pre>
          </div>
        </div>

        <!-- 教师评语 -->
        <div class="grade-comment">
          <h4>教师评语</h4>
          <div class="comment-content">{{ currentSubmission.comment || '无评语' }}</div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewGradeDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import GradeAssignmentDialog from '../components/common/GradeAssignmentDialog.vue';
import { Download, View } from '@element-plus/icons-vue';

// 注册必需的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer
]);

const route = useRoute();
const router = useRouter();
const pieChartRef = ref(null);
let pieChart = null;

// 热力图分页
const heatmapCurrentPage = ref(1);
const heatmapPageSize = ref(4); // 每页显示4天

const assignment = ref({
  name: '加载中...',
  submissions: []
});

// 批改对话框相关
const gradeDialogVisible = ref(false);
const viewGradeDialogVisible = ref(false);
const currentSubmission = ref(null);

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
      { id: 's1', studentName: '王晓明', studentId: '2021001', submitTime: '2024-08-14 10:30', status: '已批改', score: 92, comment: '报告结构清晰，内容完整，分析透彻，很好地完成了需求分析任务。' },
      { id: 's2', studentName: '李静', studentId: '2021002', submitTime: '2024-08-14 11:15', status: '未批改' },
      { id: 's3', studentName: '张三', studentId: '2021005', submitTime: '2024-08-15 11:00', status: '未批改' },
      { id: 's4', studentName: '陈伟', studentId: '2021003', submitTime: '', status: '未提交' },
      { id: 's5', studentName: '赵琳', studentId: '2021004', submitTime: '2024-08-15 09:00', status: '已批改', score: 88, comment: '整体表现良好，但需求分析部分可以更加详细。' },
    ]
  };
};

// 提交状态计算
const ungradedSubmissions = computed(() =>
  assignment.value.submissions.filter(s => s.status === '未批改')
);

const notSubmittedSubmissions = computed(() =>
  assignment.value.submissions.filter(s => s.status === '未提交')
);

const gradedSubmissions = computed(() =>
  assignment.value.submissions.filter(s => s.status === '已批改')
);

// 提交时间分布热力图数据
const submissionHeatmap = computed(() => {
  // 生成从开始日期到截止日期的每一天
  const startDate = new Date(assignment.value.startDate);
  const dueDate = new Date(assignment.value.dueDate);
  const days = [];
  
  // 克隆开始日期以进行迭代
  const currentDate = new Date(startDate);
  
  while (currentDate <= dueDate) {
    // 日期格式化为 MM/DD
    const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
    
    // 找出当天提交的学生
    const submissions = assignment.value.submissions.filter(s => {
      if (!s.submitTime) return false;
      const submitDate = new Date(s.submitTime);
      return (
        submitDate.getFullYear() === currentDate.getFullYear() &&
        submitDate.getMonth() === currentDate.getMonth() &&
        submitDate.getDate() === currentDate.getDate()
      );
    });
    
    days.push({
      date: dateStr,
      count: submissions.length,
      students: submissions.map(s => s.studentName)
    });
    
    // 移到下一天
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
});

// 热力图分页数据
const paginatedHeatmap = computed(() => {
  const start = (heatmapCurrentPage.value - 1) * heatmapPageSize.value;
  const end = start + heatmapPageSize.value;
  return submissionHeatmap.value.slice(start, end);
});

// 处理热力图分页变化
const handleHeatmapPageChange = (page) => {
  heatmapCurrentPage.value = page;
};

// 班级完成进度排行榜
const studentRanking = computed(() => {
  return assignment.value.submissions.map(s => {
    return {
      name: s.studentName,
      status: s.status,
      submitTime: s.submitTime ? s.submitTime.split(' ')[0] : ''
    };
  }).sort((a, b) => {
    // 已批改的排前面，然后是未批改的，最后是未提交的
    const statusOrder = { '已批改': 0, '未批改': 1, '未提交': 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    
    // 同一状态的按提交时间排序
    if (a.submitTime && b.submitTime) {
      return new Date(b.submitTime) - new Date(a.submitTime);
    }
    
    // 未提交的放最后
    if (!a.submitTime) return 1;
    if (!b.submitTime) return -1;
    
    return 0;
  });
});

// 工具函数
const getHeatmapClass = (count) => {
  if (count === 0) return 'heatmap-0';
  if (count <= 2) return 'heatmap-1';
  if (count <= 4) return 'heatmap-2';
  return 'heatmap-3';
};

const getStatusClass = (status) => {
  switch (status) {
    case '已批改': return 'status-completed';
    case '未批改': return 'status-pending';
    case '未提交': return 'status-missing';
    default: return '';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case '已批改': return 'el-icon-check';
    case '未批改': return 'el-icon-time';
    case '未提交': return 'el-icon-close';
    default: return '';
  }
};

const getStatusTagType = (status) => {
  switch (status) {
    case '已批改': return 'success'; // 绿色
    case '未批改': return 'warning'; // 橙色
    case '未提交': return 'danger'; // 红色
    default: return '';
  }
};

const initPieChart = () => {
  if (!pieChartRef.value) return;
  
  // 初始化图表
  pieChart = echarts.init(pieChartRef.value);
  
  // 设置图表配置项
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '提交状态',
        type: 'pie',
        radius: '70%',
        data: [
          { 
            value: ungradedSubmissions.value.length, 
            name: '未批改',
            itemStyle: { color: '#E6A23C' } // 橙色
          },
          { 
            value: notSubmittedSubmissions.value.length, 
            name: '未提交',
            itemStyle: { color: '#909399' } // 灰色
          },
          { 
            value: gradedSubmissions.value.length, 
            name: '已批改',
            itemStyle: { color: '#67C23A' } // 绿色
          }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
  
  // 使用配置项设置图表
  pieChart.setOption(option);
};

// 提醒学生相关函数
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

// 批改作业相关函数
const openGradeDialog = (submission) => {
  currentSubmission.value = submission;
  gradeDialogVisible.value = true;
};

const viewGradeDetails = (submission) => {
  currentSubmission.value = { ...submission };
  
  // 如果没有新格式的数据，添加模拟数据
  if (!currentSubmission.value.textContent && !currentSubmission.value.attachments) {
    currentSubmission.value.textContent = "这是学生提交的作业内容。\n\n软件工程需求分析报告\n\n按照要求，我完成了以下内容：\n1. 功能需求分析\n2. 系统架构设计\n3. 数据库设计\n\n总结：本次作业让我深入理解了软件工程的基本原理...";
    
    currentSubmission.value.attachments = [
      { id: 1, name: "需求分析报告.pdf", size: "1.5MB", type: "PDF", url: "#" },
      { id: 2, name: "系统架构图.jpg", size: "420KB", type: "图片", url: "#" },
    ];
  }
  
  viewGradeDialogVisible.value = true;
};

const handleGraded = (gradedSubmission) => {
  // 更新作业状态
  const index = assignment.value.submissions.findIndex(s => s.id === gradedSubmission.id);
  if (index !== -1) {
    assignment.value.submissions[index] = gradedSubmission;
    
    // 更新图表
    if (pieChart) {
      initPieChart();
    }
    
    ElMessage.success('作业批改成功');
  }
};

const goBack = () => {
  router.back();
};

// 获取文件类型的标签样式
const getFileTagType = (fileType) => {
  const typeMap = {
    'PDF': 'danger',
    'Word文档': 'primary',
    'Excel表格': 'success',
    'PPT演示文稿': 'warning',
    '图片': 'info',
    '压缩文件': 'default',
    '文本文件': 'success',
  };
  return typeMap[fileType] || '';
};

// 下载文件
const downloadFile = (file) => {
  ElMessage.success(`开始下载: ${file.name}`);
  // 实际项目中应调用后端API进行文件下载
  console.log('下载文件:', file);
};

onMounted(() => {
  fetchAssignmentDetail(route.params.id);
  // 等待下一个DOM更新周期，确保DOM元素已渲染
  nextTick(() => {
    initPieChart();
    
    // 监听窗口大小变化，重绘图表
    window.addEventListener('resize', () => {
      if (pieChart) pieChart.resize();
    });
    
    // 检查是否有批改请求
    if (route.query.action === 'grade') {
      // 找到第一个未批改的作业
      const firstUngradedSubmission = ungradedSubmissions.value[0];
      if (firstUngradedSubmission) {
        openGradeDialog(firstUngradedSubmission);
      } else {
        ElMessage.info('没有需要批改的作业');
      }
    }
  });
});
</script>

<style scoped>
.assignment-detail-container {
  padding: 24px;
}

.el-page-header {
  margin-bottom: 24px;
}

.main-content {
  display: flex;
  gap: 20px;
}

.content-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-right {
  width: 280px;
}

.assignment-info {
  margin-bottom: 0;
}

.info-table {
  width: 100%;
}

.visualization-container {
  display: flex;
  gap: 20px;
}

.chart-card {
  flex: 1;
}

.chart-container {
  height: 200px;
}

.heatmap-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 120px;
}

.heatmap-pagination {
  text-align: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.heatmap-day {
  flex: 1;
  min-width: 120px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  text-align: center;
}

.day-label {
  font-weight: bold;
  margin-bottom: 5px;
}

.day-count {
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 5px;
}

.heatmap-0 {
  background-color: #f0f0f0;
  color: #909399;
}

.heatmap-1 {
  background-color: #e1f3d8;
  color: #67C23A;
}

.heatmap-2 {
  background-color: #67C23A;
  color: white;
}

.heatmap-3 {
  background-color: #3c7521;
  color: white;
}

.day-students {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.ranking-status {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.status-completed {
  background-color: #67C23A;
}

.status-pending {
  background-color: #E6A23C;
}

.status-missing {
  background-color: #909399;
}

.ranking-info {
  flex: 1;
}

.student-name {
  font-weight: 500;
  margin-bottom: 3px;
}

.student-meta {
  font-size: 12px;
  color: #909399;
}

.submission-status {
  margin-top: 0;
}

.submission-tabs {
  margin-top: 10px;
}

.tab-pane-toolbar {
  margin-bottom: 10px;
  text-align: left;
}

.grade-score {
  font-size: 18px;
  font-weight: bold;
  color: #F56C6C;
}

.grade-comment {
  margin-top: 20px;
}

.grade-comment .comment-content {
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f9f9f9;
  min-height: 60px;
}

.assignment-submitted-content {
  margin-top: 20px;
  margin-bottom: 20px;
}

.assignment-submitted-content h4,
.grade-comment h4 {
  font-size: 16px;
  margin-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 5px;
}

.content-section {
  margin-bottom: 20px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 5px;
  font-size: 14px;
  color: #333;
}

.text-preview {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
  background-color: #f9f9f9;
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
}

.text-preview pre {
  white-space: pre-wrap;
  font-family: monospace;
}

.content-preview {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
  background-color: #f9f9f9;
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
}
</style>