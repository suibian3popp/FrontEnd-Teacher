<template>
  <div class="student-management">
    <!-- 标题和基本信息 -->
    <div class="header-section">
      <div class="header-left">
        <el-page-header @back="goBack">
          <template #content>
            <div class="page-header-content">
              <span class="page-title">{{ classInfo.name }} - 学生管理</span>
              <el-tag type="primary" size="small">{{ classInfo.major }}</el-tag>
              <el-tag type="info" size="small">{{ classInfo.grade }}级</el-tag>
            </div>
          </template>
        </el-page-header>
      </div>
      <div class="header-right">
        <el-button type="primary" color="#1890ff" @click="showAddStudentDialog">
          <el-icon class="el-icon--left"><Plus /></el-icon>添加学生
        </el-button>
        <el-dropdown @command="handleCommand">
          <el-button type="primary" plain>
            <span>批量操作</span>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="import">导入学生</el-dropdown-item>
              <el-dropdown-item command="export">导出名单</el-dropdown-item>
              <el-dropdown-item command="email" divided>发送邮件</el-dropdown-item>
              <el-dropdown-item command="sms">发送短信</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索学号/姓名/专业"
        clearable
        class="search-input"
        prefix-icon="Search"
      />
      
      <el-select v-model="genderFilter" placeholder="性别" clearable class="filter-select">
        <el-option label="男" value="男" />
        <el-option label="女" value="女" />
      </el-select>
      
      <el-select v-model="statusFilter" placeholder="状态" clearable class="filter-select">
        <el-option label="正常" value="正常" />
        <el-option label="休学" value="休学" />
        <el-option label="退学" value="退学" />
      </el-select>
    </div>
    
    <!-- 学生列表 -->
    <el-table
      :data="filteredStudents"
      stripe
      border
      style="width: 100%; margin-top: 20px;"
      v-loading="tableLoading"
      :header-cell-style="{ background: '#f5f5f5', color: '#333' }"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="学号" prop="id" min-width="100" />
      <el-table-column label="姓名" prop="name" min-width="100" />
      <el-table-column label="性别" prop="gender" width="80">
        <template #default="{ row }">
          <el-tag
            :type="row.gender === '男' ? 'primary' : 'danger'"
            size="small"
          >{{ row.gender }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="专业" prop="major" min-width="160" />
      <el-table-column label="班级" prop="className" min-width="100" />
      <el-table-column label="电话" prop="phone" min-width="130" />
      <el-table-column label="邮箱" prop="email" min-width="180" />
      <el-table-column label="状态" prop="status" width="100">
        <template #default="{ row }">
          <el-tag
            :type="getStatusTagType(row.status)"
            size="small"
          >{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="viewStudentDetail(row)">详情</el-button>
          <el-button size="small" type="success" @click="editStudent(row)">编辑</el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="confirmDeleteStudent(row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredStudents.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 添加/编辑学生对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑学生信息' : '添加学生'"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="studentFormRef"
        :model="studentForm"
        :rules="studentFormRules"
        label-position="top"
        class="student-form"
      >
        <div class="form-row">
          <el-form-item label="学号" prop="id" class="form-item-half">
            <el-input v-model="studentForm.id" placeholder="请输入学号" />
          </el-form-item>
          <el-form-item label="姓名" prop="name" class="form-item-half">
            <el-input v-model="studentForm.name" placeholder="请输入姓名" />
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="性别" prop="gender" class="form-item-half">
            <el-radio-group v-model="studentForm.gender">
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="学生状态" prop="status" class="form-item-half">
            <el-select v-model="studentForm.status" placeholder="请选择状态" class="w-100">
              <el-option label="正常" value="正常" />
              <el-option label="休学" value="休学" />
              <el-option label="退学" value="退学" />
            </el-select>
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="专业" prop="major" class="form-item-half">
            <el-input v-model="studentForm.major" placeholder="请输入专业" />
          </el-form-item>
          <el-form-item label="班级" prop="className" class="form-item-half">
            <el-input v-model="studentForm.className" placeholder="请输入班级" />
          </el-form-item>
        </div>
        
        <div class="form-row">
          <el-form-item label="电话" prop="phone" class="form-item-half">
            <el-input v-model="studentForm.phone" placeholder="请输入电话" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email" class="form-item-half">
            <el-input v-model="studentForm.email" placeholder="请输入邮箱" />
          </el-form-item>
        </div>
        
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="studentForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" color="#1890ff" @click="submitStudentForm" :loading="submitting">
            {{ isEdit ? '保存修改' : '添加学生' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导入学生对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入学生"
      width="500px"
      destroy-on-close
    >
      <div class="import-tips">
        <p>请按照模板格式准备Excel文件，然后上传:</p>
        <ul>
          <li>表格必须包含：学号、姓名、性别、专业、班级</li>
          <li>其他字段：电话、邮箱、状态为可选</li>
          <li>文件大小不超过10MB</li>
        </ul>
      </div>
      
      <el-upload
        class="upload-container"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持Excel文件(.xlsx, .xls)
            <el-link type="primary" @click="downloadTemplate" class="template-link">下载模板</el-link>
          </div>
        </template>
      </el-upload>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            color="#1890ff"
            @click="importStudents" 
            :loading="importing"
            :disabled="!importFile"
          >
            开始导入
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 学生详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="学生详情"
      width="700px"
      destroy-on-close
    >
      <div v-if="selectedStudent" class="student-detail">
        <div class="detail-header">
          <div class="avatar-container">
            <el-avatar :size="80" :src="selectedStudent.avatar || defaultAvatar">
              {{ selectedStudent.name ? selectedStudent.name.substring(0, 1) : 'U' }}
            </el-avatar>
          </div>
          <div class="basic-info">
            <h2 class="student-name">{{ selectedStudent.name }}</h2>
            <div class="student-id">学号：{{ selectedStudent.id }}</div>
            <div class="tags">
              <el-tag size="small">{{ selectedStudent.gender }}</el-tag>
              <el-tag type="success" size="small">{{ selectedStudent.className }}</el-tag>
              <el-tag :type="getStatusTagType(selectedStudent.status)" size="small">
                {{ selectedStudent.status }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <el-tabs>
          <el-tab-pane label="基本信息">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="专业">{{ selectedStudent.major }}</el-descriptions-item>
              <el-descriptions-item label="班级">{{ selectedStudent.className }}</el-descriptions-item>
              <el-descriptions-item label="电话">{{ selectedStudent.phone }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ selectedStudent.email }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusTagType(selectedStudent.status)">
                  {{ selectedStudent.status }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="入学时间">{{ selectedStudent.enrollDate }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">
                {{ selectedStudent.notes || '无' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="课程成绩">
            <el-table :data="selectedStudent.courses || []" style="width: 100%" border>
              <el-table-column prop="name" label="课程名称" min-width="180" />
              <el-table-column prop="credit" label="学分" width="80" />
              <el-table-column prop="score" label="分数" width="100">
                <template #default="{ row }">
                  <span :class="getScoreClass(row.score)">{{ row.score }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="semester" label="学期" min-width="150" />
              <el-table-column prop="teacher" label="授课教师" min-width="120" />
            </el-table>
            <div v-if="!selectedStudent.courses || selectedStudent.courses.length === 0" class="no-data">
              暂无课程成绩数据
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="学业情况">
            <div class="academic-stats">
              <el-card class="stat-card">
                <div class="stat-value">{{ selectedStudent.gpa || 'N/A' }}</div>
                <div class="stat-label">GPA</div>
              </el-card>
              <el-card class="stat-card">
                <div class="stat-value">{{ selectedStudent.credits || 0 }}</div>
                <div class="stat-label">已修学分</div>
              </el-card>
              <el-card class="stat-card">
                <div class="stat-value">{{ selectedStudent.ranking || 'N/A' }}</div>
                <div class="stat-label">班级排名</div>
              </el-card>
              <el-card class="stat-card">
                <div class="stat-value">{{ selectedStudent.attendance || '0%' }}</div>
                <div class="stat-label">出勤率</div>
              </el-card>
            </div>
            <div class="academic-chart">
              <div ref="gradeChartRef" style="width: 100%; height: 300px;"></div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { 
  Plus,
  Search,
  ArrowDown,
  Upload
} from '@element-plus/icons-vue';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册ECharts组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  LineChart,
  CanvasRenderer
]);

const route = useRoute();
const router = useRouter();
const gradeChartRef = ref(null);
let gradeChart = null;

// 班级信息
const classInfo = ref({
  id: '',
  name: '',
  major: '',
  grade: ''
});

// 搜索和筛选
const searchKeyword = ref('');
const genderFilter = ref('');
const statusFilter = ref('');

// 表格相关
const tableLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);

// 对话框控制
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const importDialogVisible = ref(false);
const importing = ref(false);
const importFile = ref(null);
const detailDialogVisible = ref(false);
const selectedStudent = ref(null);
const studentFormRef = ref(null);

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 学生表单数据
const studentForm = reactive({
  id: '',
  name: '',
  gender: '男',
  major: '',
  className: '',
  phone: '',
  email: '',
  status: '正常',
  notes: ''
});

// 表单验证规则
const studentFormRules = {
  id: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d+$/, message: '学号必须为数字', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  major: [
    { required: true, message: '请输入专业', trigger: 'blur' }
  ],
  className: [
    { required: true, message: '请输入班级', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

// 模拟学生数据
const students = ref([]);

// 生成模拟数据
const generateMockStudents = (count = 55) => {
  const result = [];
  const majors = ['计算机科学与技术', '软件工程', '人工智能', '网络工程', '数据科学'];
  const statuses = ['正常', '正常', '正常', '正常', '休学', '退学'];
  const classNames = ['计科2101', '计科2102', '软件2101', '软件2102', '人工智能2101'];
  
  for (let i = 1; i <= count; i++) {
    const id = `2021${String(i).padStart(4, '0')}`;
    const gender = Math.random() > 0.7 ? '女' : '男';
    const firstName = gender === '男' ? 
      ['张', '李', '王', '赵', '陈', '刘', '杨', '黄', '周', '吴'][Math.floor(Math.random() * 10)] :
      ['张', '李', '王', '赵', '陈', '刘', '杨', '黄', '林', '徐'][Math.floor(Math.random() * 10)];
      
    const lastName = gender === '男' ?
      ['伟', '强', '磊', '勇', '军', '杰', '涛', '超', '明', '刚'][Math.floor(Math.random() * 10)] :
      ['芳', '娜', '敏', '静', '丽', '娟', '颖', '琳', '雪', '燕'][Math.floor(Math.random() * 10)];
    
    const majorIndex = Math.floor(Math.random() * majors.length);
    const major = majors[majorIndex];
    const className = classNames[majorIndex];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // 随机生成GPA和学分
    const gpa = (Math.random() * 2 + 2).toFixed(2);
    const credits = Math.floor(Math.random() * 50 + 50);
    
    // 随机生成课程成绩
    const courses = [
      {
        name: '高等数学',
        credit: 5,
        score: Math.floor(Math.random() * 40 + 60),
        semester: '2021-2022学年第一学期',
        teacher: '张教授'
      },
      {
        name: '大学英语',
        credit: 3,
        score: Math.floor(Math.random() * 40 + 60),
        semester: '2021-2022学年第一学期',
        teacher: '李教授'
      },
      {
        name: 'C++程序设计',
        credit: 4,
        score: Math.floor(Math.random() * 40 + 60),
        semester: '2021-2022学年第二学期',
        teacher: '王教授'
      },
      {
        name: '数据结构',
        credit: 4,
        score: Math.floor(Math.random() * 40 + 60),
        semester: '2022-2023学年第一学期',
        teacher: '陈教授'
      }
    ];
    
    result.push({
      id,
      name: firstName + lastName,
      gender,
      major,
      className,
      phone: `1${Math.floor(Math.random() * 9) + 3}${Math.floor(Math.random() * 10000000000).toString().padStart(9, '0')}`,
      email: `${id}@example.com`,
      status,
      enrollDate: '2021-09-01',
      notes: '',
      gpa,
      credits,
      attendance: `${Math.floor(Math.random() * 20 + 80)}%`,
      ranking: Math.floor(Math.random() * 45 + 1),
      courses
    });
  }
  
  return result;
};

// 过滤学生列表
const filteredStudents = computed(() => {
  let result = [...students.value];
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(s => 
      s.id.toLowerCase().includes(keyword) ||
      s.name.toLowerCase().includes(keyword) ||
      s.major.toLowerCase().includes(keyword)
    );
  }
  
  // 性别筛选
  if (genderFilter.value) {
    result = result.filter(s => s.gender === genderFilter.value);
  }
  
  // 状态筛选
  if (statusFilter.value) {
    result = result.filter(s => s.status === statusFilter.value);
  }
  
  return result;
});

// 分页相关
const handleSizeChange = (size) => {
  pageSize.value = size;
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
};

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    '正常': 'success',
    '休学': 'warning',
    '退学': 'danger'
  };
  return typeMap[status] || 'info';
};

// 获取成绩样式
const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent';
  if (score >= 80) return 'score-good';
  if (score >= 70) return 'score-average';
  if (score >= 60) return 'score-pass';
  return 'score-fail';
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 显示添加学生对话框
const showAddStudentDialog = () => {
  isEdit.value = false;
  dialogVisible.value = true;
};

// 编辑学生
const editStudent = (student) => {
  isEdit.value = true;
  Object.assign(studentForm, student);
  dialogVisible.value = true;
};

// 提交学生表单
const submitStudentForm = async () => {
  if (!studentFormRef.value) return;
  
  try {
    await studentFormRef.value.validate();
    submitting.value = true;
    
    setTimeout(() => {
      if (isEdit.value) {
        // 编辑现有学生
        const index = students.value.findIndex(s => s.id === studentForm.id);
        if (index !== -1) {
          students.value[index] = { ...students.value[index], ...studentForm };
          ElMessage.success(`学生 ${studentForm.name} 信息已更新`);
        }
      } else {
        // 添加新学生
        const newStudent = {
          ...studentForm,
          enrollDate: '2021-09-01',
          gpa: (Math.random() * 2 + 2).toFixed(2),
          credits: Math.floor(Math.random() * 30 + 20),
          attendance: `${Math.floor(Math.random() * 20 + 80)}%`,
          ranking: Math.floor(Math.random() * 45 + 1),
          courses: []
        };
        students.value.unshift(newStudent);
        ElMessage.success(`学生 ${newStudent.name} 已添加`);
      }
      
      submitting.value = false;
      dialogVisible.value = false;
      resetStudentForm();
    }, 800);
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 重置学生表单
const resetStudentForm = () => {
  if (studentFormRef.value) {
    studentFormRef.value.resetFields();
  }
  
  Object.assign(studentForm, {
    id: '',
    name: '',
    gender: '男',
    major: '',
    className: '',
    phone: '',
    email: '',
    status: '正常',
    notes: ''
  });
};

// 确认删除学生
const confirmDeleteStudent = (student) => {
  ElMessageBox.confirm(
    `确定要删除学生 ${student.name} (${student.id}) 吗？此操作将无法恢复！`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      const index = students.value.findIndex(s => s.id === student.id);
      if (index !== -1) {
        students.value.splice(index, 1);
        ElMessage.success(`学生 ${student.name} 已删除`);
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除');
    });
};

// 查看学生详情
const viewStudentDetail = (student) => {
  selectedStudent.value = student;
  detailDialogVisible.value = true;
  
  // 在下一个DOM更新周期初始化图表
  nextTick(() => {
    initGradeChart(student);
  });
};

// 初始化成绩趋势图表
const initGradeChart = (student) => {
  if (!gradeChartRef.value) return;
  if (gradeChart) {
    gradeChart.dispose();
  }
  
  // 初始化图表
  gradeChart = echarts.init(gradeChartRef.value);
  
  // 准备数据
  const courses = student.courses || [];
  const courseNames = courses.map(c => c.name);
  const scores = courses.map(c => c.score);
  
  // 设置图表配置项
  const option = {
    title: {
      text: '课程成绩趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: courseNames
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 10,
      axisLabel: {
        formatter: '{value} 分'
      }
    },
    series: [
      {
        name: '成绩',
        type: 'line',
        data: scores,
        markLine: {
          data: [{ type: 'average', name: '平均分' }],
          label: {
            formatter: '平均: {c}'
          }
        },
        itemStyle: {
          color: '#1890ff'
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  };
  
  // 使用配置项设置图表
  gradeChart.setOption(option);
};

// 导入学生相关
const handleFileChange = (file) => {
  importFile.value = file;
};

const importStudents = () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择文件');
    return;
  }
  
  importing.value = true;
  
  // 模拟导入过程
  setTimeout(() => {
    // 这里在实际项目中应该处理Excel文件解析
    const newStudentsCount = Math.floor(Math.random() * 10) + 5;
    const newStudents = generateMockStudents(newStudentsCount);
    
    students.value = [...newStudents, ...students.value];
    
    importing.value = false;
    importDialogVisible.value = false;
    importFile.value = null;
    
    ElMessage.success(`成功导入 ${newStudentsCount} 名学生`);
  }, 1500);
};

const downloadTemplate = () => {
  ElMessage.success('模板下载中...');
  // 实际项目中应该提供真实的模板下载功能
};

// 批量操作命令处理
const handleCommand = (command) => {
  switch (command) {
    case 'import':
      importDialogVisible.value = true;
      break;
    case 'export':
      ElMessage.success('学生名单导出中...');
      break;
    case 'email':
      ElMessage.info('发送邮件功能开发中...');
      break;
    case 'sms':
      ElMessage.info('发送短信功能开发中...');
      break;
  }
};

// 获取班级信息和学生列表
const fetchClassData = () => {
  tableLoading.value = true;
  
  // 模拟API调用
  setTimeout(() => {
    // 获取班级ID
    const classId = route.params.id || 'c1';
    
    // 获取班级信息
    const classInfoMap = {
      c1: {
        id: 'c1',
        name: '软件2101',
        major: '软件工程',
        grade: '2021'
      },
      c2: {
        id: 'c2',
        name: '计科2103',
        major: '计算机科学与技术',
        grade: '2021'
      },
      c3: {
        id: 'c3',
        name: '人工智能2102',
        major: '人工智能',
        grade: '2021'
      },
      c4: {
        id: 'c4',
        name: '计科2201',
        major: '计算机科学与技术',
        grade: '2022'
      },
      c5: {
        id: 'c5',
        name: '软件2202',
        major: '软件工程',
        grade: '2022'
      },
      c6: {
        id: 'c6',
        name: '网络2201',
        major: '网络工程',
        grade: '2022'
      }
    };
    
    // 设置班级信息
    classInfo.value = classInfoMap[classId] || {
      id: classId,
      name: `班级 ${classId}`,
      major: '未知专业',
      grade: '2021'
    };
    
    // 生成学生数据
    students.value = generateMockStudents(45);
    
    // 根据班级名称过滤学生
    students.value = students.value.filter(s => s.className === classInfo.value.name);
    
    tableLoading.value = false;
  }, 1000);
};

// 监听窗口大小变化，重绘图表
window.addEventListener('resize', () => {
  if (gradeChart) {
    gradeChart.resize();
  }
});

// 生命周期钩子
onMounted(() => {
  fetchClassData();
});
</script>

<style scoped>
/* 学生管理主容器 */
.student-management {
  padding: 20px;
}

/* 头部区域 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 页面标题内容 */
.page-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 页面标题 */
.page-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

/* 搜索输入框 */
.search-input {
  width: 250px;
}

/* 筛选下拉框 */
.filter-select {
  width: 120px;
}

/* 分页容器 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 表单样式 */
.student-form {
  max-width: 100%;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-item-half {
  width: 100%;
}

.w-100 {
  width: 100%;
}

/* 导入对话框 */
.import-tips {
  margin-bottom: 20px;
}

.import-tips ul {
  padding-left: 20px;
  margin-top: 10px;
}

.template-link {
  margin-left: 10px;
}

/* 学生详情样式 */
.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.avatar-container {
  margin-right: 20px;
}

.student-name {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 5px 0;
  color: #333;
}

.student-id {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.tags {
  display: flex;
  gap: 8px;
}

.academic-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
  border: 1px solid #e8e8e8;
  box-shadow: none;
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.academic-chart {
  margin-top: 20px;
}

.no-data {
  text-align: center;
  padding: 30px;
  color: #909399;
}

/* 成绩样式 */
.score-excellent {
  color: #67C23A;
  font-weight: bold;
}

.score-good {
  color: #409EFF;
  font-weight: bold;
}

.score-average {
  color: #E6A23C;
}

.score-pass {
  color: #909399;
}

.score-fail {
  color: #F56C6C;
  font-weight: bold;
}
</style> 