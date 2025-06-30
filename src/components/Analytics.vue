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
            <el-button type="primary">筛选</el-button>
            <el-button>导出数据</el-button>
          </div>
        </div>
      </template>
      <el-table :data="studentData" stripe>
        <el-table-column prop="name" label="学生姓名" />
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
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';

// 1. 卡片数据
const stats = ref([
  { title: '班级数量', value: 3 },
  { title: '课程数量', value: 8 },
  { title: '学生数量', value: 152 },
  { title: '作业完成数', value: '1,280' },
]);

// 2. 学生学习情况数据
const studentData = ref([
  { name: '王晓明', courseCompletion: 95, homeworkSubmission: 100, lastSeen: '2024-07-28 10:30' },
  { name: '李静', courseCompletion: 92, homeworkSubmission: 95, lastSeen: '2024-07-28 09:15' },
  { name: '陈伟', courseCompletion: 88, homeworkSubmission: 90, lastSeen: '2024-07-27 20:05' },
  { name: '赵琳', courseCompletion: 85, homeworkSubmission: 80, lastSeen: '2024-07-27 18:45' },
]);

// 3. ECharts 实例
const barChartRef = ref(null);
const pieChartRef = ref(null);

onMounted(() => {
  // 作业完成率柱状图
  const barChart = echarts.init(barChartRef.value);
  barChart.setOption({
    title: { text: '作业完成率各班对比' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['完成率'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['软件2101', '计算机2102', '人工智能2103'] },
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
</style> 