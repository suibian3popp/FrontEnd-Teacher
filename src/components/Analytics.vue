<template>
  <div class="analytics-container">
    <!-- 1. 数据卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card shadow="hover">
          <div class="stat-card-content">
            <div class="stat-info">
              <div class="stat-title">{{ stat.title }}</div>
              <div class="stat-value">{{ stat.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 2. 图表 -->
    <el-row :gutter="20" class="chart-cards">
      <el-col :span="12">
        <el-card>
          <div ref="barChartRef" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div ref="pieChartRef" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 3. 学生学习情况 -->
    <el-card class="student-status-card">
      <template #header>
        <div class="card-header">
          <span>学生学习情况</span>
          <div class="actions">
            <el-dropdown @command="handleClassFilter" trigger="click">
              <el-button type="primary">
                {{ selectedClass ? selectedClass : '筛选' }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="">全部班级</el-dropdown-item>
                  <el-dropdown-item v-for="cls in classList" :key="cls" :command="cls">{{ cls }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button @click="exportToExcel">
              <el-icon class="el-icon--left"><download /></el-icon>
              导出数据
            </el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredStudentData" stripe>
        <el-table-column prop="name" label="学生姓名" />
        <el-table-column prop="class" label="班级" />
        <el-table-column prop="courseCompletion" label="课程完成率">
          <template #default="{ row }">
            <el-progress :percentage="row.courseCompletion" />
          </template>
        </el-table-column>
        <el-table-column prop="homeworkSubmission" label="作业提交率">
          <template #default="{ row }">
            <el-progress :percentage="row.homeworkSubmission" />
          </template>
        </el-table-column>
        <el-table-column prop="lastSeen" label="最近学习时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import * as echarts from 'echarts';
import { ArrowDown, Download } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ElMessage } from 'element-plus';

// 1. 卡片数据
const stats = ref([
  { title: '班级数量', value: 3 },
  { title: '课程数量', value: 8 },
  { title: '学生数量', value: 152 },
  { title: '作业完成数', value: '1,280' },
]);

// 2. 班级列表
const classList = ref(['软件2101', '计算机2102', '人工智能2103']);
const selectedClass = ref('');

// 3. 学生学习情况数据
const allStudentData = ref([
  { name: '王晓明', class: '软件2101', courseCompletion: 95, homeworkSubmission: 100, lastSeen: '2024-07-28 10:30' },
  { name: '李静', class: '计算机2102', courseCompletion: 92, homeworkSubmission: 95, lastSeen: '2024-07-28 09:15' },
  { name: '陈伟', class: '软件2101', courseCompletion: 88, homeworkSubmission: 90, lastSeen: '2024-07-27 20:05' },
  { name: '赵琳', class: '人工智能2103', courseCompletion: 85, homeworkSubmission: 80, lastSeen: '2024-07-27 18:45' },
  { name: '张明', class: '软件2101', courseCompletion: 78, homeworkSubmission: 85, lastSeen: '2024-07-28 14:20' },
  { name: '刘洋', class: '计算机2102', courseCompletion: 90, homeworkSubmission: 92, lastSeen: '2024-07-28 08:45' },
  { name: '孙芳', class: '人工智能2103', courseCompletion: 82, homeworkSubmission: 88, lastSeen: '2024-07-27 19:30' },
]);

// 4. 根据班级筛选学生数据
const filteredStudentData = computed(() => {
  if (!selectedClass.value) {
    return allStudentData.value;
  }
  return allStudentData.value.filter(student => student.class === selectedClass.value);
});

// 5. ECharts 实例
const barChartRef = ref(null);
const pieChartRef = ref(null);

// 6. 处理班级筛选
const handleClassFilter = (command) => {
  selectedClass.value = command;
};

// 7. 导出Excel功能
const exportToExcel = () => {
  try {
    // 准备导出数据
    const exportData = filteredStudentData.value.map(student => ({
      '学生姓名': student.name,
      '班级': student.class,
      '课程完成率(%)': student.courseCompletion,
      '作业提交率(%)': student.homeworkSubmission,
      '最近学习时间': student.lastSeen
    }));

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // 设置列宽
    const columnWidths = [
      { wch: 10 }, // 学生姓名
      { wch: 12 }, // 班级
      { wch: 15 }, // 课程完成率
      { wch: 15 }, // 作业提交率
      { wch: 20 }, // 最近学习时间
    ];
    worksheet['!cols'] = columnWidths;
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '学生学习情况');
    
    // 生成Excel文件的二进制数据
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // 创建Blob对象
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // 生成文件名（包含当前日期）
    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const fileName = `学生学习情况_${selectedClass.value || '全部班级'}_${dateStr}.xlsx`;
    
    // 保存文件
    saveAs(blob, fileName);
    
    ElMessage.success('数据导出成功');
  } catch (error) {
    console.error('导出Excel失败:', error);
    ElMessage.error('导出失败，请稍后重试');
  }
};

onMounted(() => {
  // 作业完成率柱状图
  const barChart = echarts.init(barChartRef.value);
  barChart.setOption({
    title: { text: '作业完成率各班对比' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['完成率'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: classList.value },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
    series: [{ name: '完成率', type: 'bar', data: [92, 85, 88] }]
  });

  // 考试得分率扇形图
  const pieChart = echarts.init(pieChartRef.value);
  pieChart.setOption({
    title: { text: '考试得分率分布', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c}%' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: '得分率',
      type: 'pie',
      radius: '65%',
      center: ['55%', '50%'],
      data: [
        { value: 25, name: '优秀 (90-100)' },
        { value: 45, name: '良好 (80-89)' },
        { value: 20, name: '中等 (70-79)' },
        { value: 8, name: '及格 (60-69)' },
        { value: 2, name: '不及格 (<60)' },
      ]
    }]
  });
});
</script>

<style scoped>
.analytics-container {
  padding: 24px;
}

.stats-cards, .chart-cards {
  margin-bottom: 20px;
}

.stat-card-content {
  text-align: center;
}

.stat-title {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.student-status-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 10px;
}
</style> 