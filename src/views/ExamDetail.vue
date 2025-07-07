<template>
  <div class="exam-detail-container">
    <el-page-header @back="goBack">
      <template #content>
        <span class="text-large font-600 mr-3"> 考试详情 </span>
      </template>
    </el-page-header>
    
    <div class="main-content">
      <!-- 左侧主要内容区域 -->
      <div class="content-left">
        <!-- 1. 考试基本信息卡片 -->
        <el-card class="exam-info">
          <template #header>
            <div class="card-header">
              <span>{{ exam.name }}</span>
            </div>
          </template>
          
          <el-descriptions :column="2" border class="info-table">
            <el-descriptions-item label="所属课程">{{ exam.course }}</el-descriptions-item>
            <el-descriptions-item label="所属班级">{{ Array.isArray(exam.class) ? exam.class.join(', ') : exam.class }}</el-descriptions-item>
            <el-descriptions-item label="考试时间">{{ exam.examTime }}</el-descriptions-item>
            <el-descriptions-item label="考试时长">{{ exam.duration }}分钟</el-descriptions-item>
            <el-descriptions-item label="考试类型">{{ exam.type === 'online' ? '线上考试' : '线下考试' }}</el-descriptions-item>
            <el-descriptions-item label="总分数">{{ exam.score }}</el-descriptions-item>
            <el-descriptions-item label="试卷" v-if="exam.type === 'online'">
              <el-link type="primary">点击下载</el-link>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 2. 考试情况表格 -->
        <el-card class="submission-status">
          <template #header>
            <div class="card-header">
              <span>考试情况</span>
            </div>
          </template>

          <el-tabs type="border-card" class="submission-tabs">
            <el-tab-pane>
              <template #label>
                <span><i class="el-icon-edit"></i> 未批改 ({{ ungradedSubmissions.length }})</span>
              </template>
              <el-table :data="ungradedSubmissions" stripe empty-text="暂无未批改的试卷">
                <el-table-column prop="studentName" label="学生姓名"></el-table-column>
                <el-table-column prop="studentId" label="学号"></el-table-column>
                <el-table-column prop="submitTime" label="提交时间"></el-table-column>
                <el-table-column label="操作">
                  <template #default="{ row }">
                    <el-button type="primary" link @click="openGradeDialog(row)">批改试卷</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane>
              <template #label>
                <span><i class="el-icon-warning"></i> 未参加 ({{ absentSubmissions.length }})</span>
              </template>
              <div class="tab-pane-toolbar">
                <el-button 
                  type="warning" 
                  size="small"
                  @click="handleAbsentStudents"
                  v-if="absentSubmissions.length > 0">
                  标记缺考学生
                </el-button>
              </div>
              <el-table :data="absentSubmissions" stripe empty-text="所有学生均已参加考试">
                <el-table-column prop="studentName" label="学生姓名"></el-table-column>
                <el-table-column prop="studentId" label="学号"></el-table-column>
                <el-table-column label="操作">
                  <template #default="{ row }">
                    <el-button type="danger" link @click="markAbsent(row)">标记缺考</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane>
              <template #label>
                <span><i class="el-icon-success"></i> 已批改 ({{ gradedSubmissions.length }})</span>
              </template>
              <el-table :data="gradedSubmissions" stripe empty-text="暂无已批改的试卷">
                <el-table-column prop="studentName" label="学生姓名"></el-table-column>
                <el-table-column prop="studentId" label="学号"></el-table-column>
                <el-table-column prop="submitTime" label="提交时间"></el-table-column>
                <el-table-column prop="score" label="得分"></el-table-column>
                <el-table-column label="操作">
                  <template #default="{ row }">
                    <el-button type="primary" link @click="viewGradeDetails(row)">查看详情</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
        
        <!-- 3. 数据可视化区域 -->
        <div class="visualization-container">
          <!-- 成绩分布柱状图 -->
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>成绩分布</span>
              </div>
            </template>
            <div class="chart-container" ref="barChartRef"></div>
          </el-card>
          
          <!-- 提交状态饼图 -->
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>提交状态分布</span>
              </div>
            </template>
            <div class="chart-container" ref="pieChartRef"></div>
          </el-card>
        </div>
      </div>
      
      <!-- 右侧侧边栏 -->
      <div class="content-right">
        <!-- 考试成绩排行榜 -->
        <el-card class="progress-ranking">
          <template #header>
            <div class="card-header">
              <span>考试成绩排行榜</span>
            </div>
          </template>
          
          <div class="ranking-list">
            <div v-for="(student, index) in studentRanking" :key="index" class="ranking-item">
              <div class="ranking-position">{{ index + 1 }}</div>
              <div class="ranking-info">
                <div class="student-name">{{ student.name }}</div>
                <div class="student-meta">
                  <span v-if="student.score !== undefined">{{ student.score }}分</span>
                  <span v-else-if="student.status === '未批改'">待批改</span>
                  <span v-else-if="student.status === '缺考'">缺考</span>
                  <span v-else>未提交</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 考试统计信息 -->
        <el-card class="exam-stats">
          <template #header>
            <div class="card-header">
              <span>考试统计</span>
            </div>
          </template>
          
          <div class="stats-list">
            <div class="stats-item">
              <div class="stats-label">参加人数</div>
              <div class="stats-value">{{ gradedSubmissions.length + ungradedSubmissions.length }}</div>
            </div>
            <div class="stats-item">
              <div class="stats-label">缺考人数</div>
              <div class="stats-value">{{ absentSubmissions.length }}</div>
            </div>
            <div class="stats-item">
              <div class="stats-label">平均分</div>
              <div class="stats-value">{{ averageScore }}</div>
            </div>
            <div class="stats-item">
              <div class="stats-label">最高分</div>
              <div class="stats-value">{{ highestScore }}</div>
            </div>
            <div class="stats-item">
              <div class="stats-label">最低分</div>
              <div class="stats-value">{{ lowestScore }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 批改试卷对话框 -->
    <el-dialog
      v-model="gradeDialogVisible"
      title="批改试卷"
      width="60%"
    >
      <div v-if="currentSubmission" class="grade-dialog-content">
        <el-descriptions title="学生信息" :column="2" border>
          <el-descriptions-item label="姓名">{{ currentSubmission.studentName }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ currentSubmission.studentId }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentSubmission.submitTime }}</el-descriptions-item>
        </el-descriptions>

        <h4>试卷内容</h4>
        
        <div class="exam-paper-preview">
          <el-table :data="currentPaper.questions" style="width: 100%">
            <el-table-column prop="id" label="题号" width="80" />
            <el-table-column prop="type" label="题型" width="120">
              <template #default="{ row }">
                <el-tag :type="getQuestionTagType(row.type)">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="题目内容" show-overflow-tooltip />
            <el-table-column prop="points" label="分值" width="80" />
            <el-table-column label="得分" width="120">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.score"
                  :min="0"
                  :max="row.points"
                  :precision="1"
                  :step="0.5"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="grade-comment">
          <h4>批改评语</h4>
          <el-input
            v-model="gradeComment"
            type="textarea"
            :rows="3"
            placeholder="请输入评语..."
          />
        </div>
        
        <div class="total-score">
          总分：<span class="score-value">{{ totalQuestionScore }}</span> / {{ exam.score }}
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="gradeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitGrade">提交批改</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看试卷详情对话框 -->
    <el-dialog
      v-model="viewGradeDialogVisible"
      title="试卷详情"
      width="60%"
    >
      <div v-if="currentSubmission">
        <el-descriptions title="学生信息" :column="2" border>
          <el-descriptions-item label="姓名">{{ currentSubmission.studentName }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ currentSubmission.studentId }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentSubmission.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="得分">
            <span class="grade-score">{{ currentSubmission.score }}</span> / {{ exam.score }}
          </el-descriptions-item>
        </el-descriptions>

        <h4>试卷批改详情</h4>
        
        <el-table :data="currentSubmission.questions || []" style="width: 100%">
          <el-table-column prop="id" label="题号" width="80" />
          <el-table-column prop="type" label="题型" width="120">
            <template #default="{ row }">
              <el-tag :type="getQuestionTagType(row.type)">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="题目内容" show-overflow-tooltip />
          <el-table-column prop="points" label="分值" width="80" />
          <el-table-column prop="score" label="得分" width="80" />
        </el-table>

        <!-- 教师评语 -->
        <div class="grade-comment-view">
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
import { PieChart, BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必需的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  PieChart,
  BarChart,
  CanvasRenderer
]);

const route = useRoute();
const router = useRouter();
const pieChartRef = ref(null);
const barChartRef = ref(null);
let pieChart = null;
let barChart = null;

const exam = ref({
  name: '加载中...',
  submissions: []
});

// 批改对话框相关
const gradeDialogVisible = ref(false);
const viewGradeDialogVisible = ref(false);
const currentSubmission = ref(null);
const gradeComment = ref('');
const currentPaper = ref({ questions: [] });

// 在实际项目中，这里会根据 route.params.id 调用 API 获取数据
const fetchExamDetail = (id) => {
  console.log('Fetching details for exam ID:', id);
  // 模拟从API获取数据
  exam.value = {
    id: id,
    name: '软件工程-期中考试',
    course: '软件工程',
    class: ['软件2101'],
    examTime: '2024-07-30 09:00',
    duration: 120,
    type: 'online',
    score: 100,
    submissions: [
      { id: 's1', studentName: '王晓明', studentId: '2021001', submitTime: '2024-07-30 10:45', status: '已批改', score: 92, comment: '表现优秀，概念掌握清晰。' },
      { id: 's2', studentName: '李静', studentId: '2021002', submitTime: '2024-07-30 10:55', status: '未批改' },
      { id: 's3', studentName: '张三', studentId: '2021005', submitTime: '2024-07-30 10:50', status: '未批改' },
      { id: 's4', studentName: '陈伟', studentId: '2021003', submitTime: '', status: '缺考' },
      { id: 's5', studentName: '赵琳', studentId: '2021004', submitTime: '2024-07-30 10:20', status: '已批改', score: 88, comment: '基本概念理解正确，部分应用题有小错误。' },
    ]
  };
};

// 试题类型标签
const getQuestionTagType = (type) => {
  const typeMap = {
    '单选题': 'success',
    '多选题': 'warning',
    '填空题': 'info',
    '简答题': 'primary',
    '编程题': 'danger'
  };
  return typeMap[type] || '';
};

// 提交状态计算
const ungradedSubmissions = computed(() =>
  exam.value.submissions.filter(s => s.status === '未批改')
);

const absentSubmissions = computed(() =>
  exam.value.submissions.filter(s => s.status === '缺考')
);

const gradedSubmissions = computed(() =>
  exam.value.submissions.filter(s => s.status === '已批改')
);

// 班级排名
const studentRanking = computed(() => {
  return [...exam.value.submissions]
    .filter(s => s.status !== '缺考') // 过滤掉缺考的学生
    .sort((a, b) => {
      // 已批改的按分数排序
      if (a.status === '已批改' && b.status === '已批改') {
        return b.score - a.score;
      }
      
      // 已批改的排在未批改的前面
      if (a.status === '已批改') return -1;
      if (b.status === '已批改') return 1;
      
      // 剩下的都是未批改的，按姓名排序
      return a.studentName.localeCompare(b.studentName);
    });
});

// 统计数据
const averageScore = computed(() => {
  const scores = gradedSubmissions.value.map(s => s.score);
  if (scores.length === 0) return '暂无';
  const sum = scores.reduce((a, b) => a + b, 0);
  return (sum / scores.length).toFixed(1);
});

const highestScore = computed(() => {
  const scores = gradedSubmissions.value.map(s => s.score);
  if (scores.length === 0) return '暂无';
  return Math.max(...scores);
});

const lowestScore = computed(() => {
  const scores = gradedSubmissions.value.map(s => s.score);
  if (scores.length === 0) return '暂无';
  return Math.min(...scores);
});

// 当前批改试卷的总分
const totalQuestionScore = computed(() => {
  if (!currentPaper.value || !currentPaper.value.questions) return 0;
  return currentPaper.value.questions.reduce((sum, q) => sum + (q.score || 0), 0);
});

// 初始化饼图
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
            value: absentSubmissions.value.length, 
            name: '缺考',
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

// 初始化柱状图
const initBarChart = () => {
  if (!barChartRef.value) return;
  
  // 初始化图表
  barChart = echarts.init(barChartRef.value);
  
  // 准备数据
  const scoreRanges = [
    '0-59', '60-69', '70-79', '80-89', '90-100'
  ];
  
  const scoreData = [0, 0, 0, 0, 0]; // 对应各分数段人数
  
  gradedSubmissions.value.forEach(submission => {
    const score = submission.score;
    if (score < 60) scoreData[0]++;
    else if (score < 70) scoreData[1]++;
    else if (score < 80) scoreData[2]++;
    else if (score < 90) scoreData[3]++;
    else scoreData[4]++;
  });
  
  // 设置图表配置项
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: scoreRanges,
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '人数',
        type: 'bar',
        barWidth: '60%',
        data: scoreData.map((value, index) => {
          const colors = ['#F56C6C', '#E6A23C', '#909399', '#67C23A', '#409EFF'];
          return {
            value: value,
            itemStyle: {
              color: colors[index]
            }
          };
        })
      }
    ]
  };
  
  // 使用配置项设置图表
  barChart.setOption(option);
};

// 批改相关函数
const openGradeDialog = (submission) => {
  currentSubmission.value = submission;
  gradeComment.value = '';
  
  // 模拟试卷内容
  currentPaper.value = {
    questions: [
      { id: 1, type: '单选题', content: '软件工程的核心原则是什么？', points: 5, score: 5 },
      { id: 2, type: '单选题', content: '敏捷开发的主要特点是？', points: 5, score: 5 },
      { id: 3, type: '多选题', content: '以下哪些属于面向对象的特性？', points: 10, score: 8 },
      { id: 4, type: '填空题', content: '软件测试的白盒测试主要关注于____。', points: 10, score: 10 },
      { id: 5, type: '简答题', content: '简述软件需求分析的主要步骤。', points: 20, score: 15 },
      { id: 6, type: '编程题', content: '实现一个简单的学生信息管理系统。', points: 50, score: 40 }
    ]
  };
  
  gradeDialogVisible.value = true;
};

const submitGrade = () => {
  if (!currentSubmission.value) return;
  
  // 计算总分
  const totalScore = totalQuestionScore.value;
  
  // 更新学生提交信息
  const updatedSubmission = {
    ...currentSubmission.value,
    status: '已批改',
    score: totalScore,
    comment: gradeComment.value,
    questions: [...currentPaper.value.questions]
  };
  
  // 更新状态
  const index = exam.value.submissions.findIndex(s => s.id === updatedSubmission.id);
  if (index !== -1) {
    exam.value.submissions[index] = updatedSubmission;
    
    // 更新图表
    if (pieChart) initPieChart();
    if (barChart) initBarChart();
    
    ElMessage.success('试卷批改成功');
    gradeDialogVisible.value = false;
  }
};

const viewGradeDetails = (submission) => {
  // 模拟添加试题数据
  if (!submission.questions) {
    submission.questions = [
      { id: 1, type: '单选题', content: '软件工程的核心原则是什么？', points: 5, score: 5 },
      { id: 2, type: '单选题', content: '敏捷开发的主要特点是？', points: 5, score: 5 },
      { id: 3, type: '多选题', content: '以下哪些属于面向对象的特性？', points: 10, score: 8 },
      { id: 4, type: '填空题', content: '软件测试的白盒测试主要关注于____。', points: 10, score: 10 },
      { id: 5, type: '简答题', content: '简述软件需求分析的主要步骤。', points: 20, score: 15 },
      { id: 6, type: '编程题', content: '实现一个简单的学生信息管理系统。', points: 50, score: 40 }
    ];
  }
  
  currentSubmission.value = { ...submission };
  viewGradeDialogVisible.value = true;
};

// 缺考处理
const markAbsent = (student) => {
  ElMessageBox.confirm(
    `确认将学生 ${student.studentName} 标记为缺考吗？`,
    '标记缺考',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 更新学生状态
    const index = exam.value.submissions.findIndex(s => s.id === student.id);
    if (index !== -1) {
      exam.value.submissions[index].status = '缺考';
      
      // 更新图表
      if (pieChart) initPieChart();
      
      ElMessage.success(`已将学生 ${student.studentName} 标记为缺考`);
    }
  }).catch(() => {
    ElMessage.info('已取消操作');
  });
};

const handleAbsentStudents = () => {
  if (absentSubmissions.value.length === 0) {
    ElMessage.info('没有需要标记缺考的学生');
    return;
  }
  
  ElMessageBox.confirm(
    `确认将所有未参加考试的学生标记为缺考吗？`,
    '批量标记缺考',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 更新所有未提交的学生状态
    exam.value.submissions.forEach(submission => {
      if (submission.status === '未提交') {
        submission.status = '缺考';
      }
    });
    
    // 更新图表
    if (pieChart) initPieChart();
    
    ElMessage.success('已批量标记缺考学生');
  }).catch(() => {
    ElMessage.info('已取消操作');
  });
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchExamDetail(route.params.id);
  // 等待下一个DOM更新周期，确保DOM元素已渲染
  nextTick(() => {
    initPieChart();
    initBarChart();
    
    // 监听窗口大小变化，重绘图表
    window.addEventListener('resize', () => {
      if (pieChart) pieChart.resize();
      if (barChart) barChart.resize();
    });
    
    // 检查是否有批改请求
    if (route.query.action === 'grade') {
      // 找到第一个未批改的试卷
      const firstUngradedSubmission = ungradedSubmissions.value[0];
      if (firstUngradedSubmission) {
        openGradeDialog(firstUngradedSubmission);
      } else {
        ElMessage.info('没有需要批改的试卷');
      }
    }
  });
});
</script>

<style scoped>
.exam-detail-container {
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

.exam-info {
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

.ranking-position {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.ranking-info {
  flex: 1;
}

.student-name {
  font-weight: bold;
}

.student-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 10px;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.stats-label {
  color: #909399;
}

.stats-value {
  font-weight: bold;
  color: #303133;
}

.grade-dialog-content {
  padding: 10px 0;
}

.exam-paper-preview {
  margin: 20px 0;
}

.grade-comment, .grade-comment-view {
  margin: 20px 0;
}

.grade-comment h4, .grade-comment-view h4 {
  margin-bottom: 10px;
}

.comment-content {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  color: #606266;
}

.total-score {
  margin-top: 20px;
  font-size: 16px;
  text-align: right;
}

.score-value {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}

.grade-score {
  font-size: 18px;
  font-weight: bold;
  color: #67C23A;
}

.tab-pane-toolbar {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-start;
}
</style> 