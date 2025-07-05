<template>
  <div class="class-management">
    <!-- 班级管理头部区域 - 包含创建按钮和搜索筛选 -->
    <div class="class-header">
      <div class="header-left">
        <!-- 创建班级按钮 -->
        <el-button type="primary" color="#1890ff" @click="showAddClassDialog">
          <el-icon class="el-icon--left"><Plus /></el-icon>新增班级
        </el-button>
        
        <!-- 搜索输入框 -->
        <el-input
          v-model="searchKeyword"
          placeholder="搜索班级名称或班主任"
          clearable
          class="search-input"
          prefix-icon="Search"
        />
        
        <!-- 专业筛选 -->
        <el-select v-model="filterMajor" placeholder="专业筛选" clearable class="filter-select">
          <el-option
            v-for="item in majorOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
        
        <!-- 年级筛选 -->
        <el-select v-model="filterGrade" placeholder="年级筛选" clearable class="filter-select">
          <el-option
            v-for="item in gradeOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </div>
    </div>

    <!-- 班级列表卡片 -->
    <div class="class-grid">
      <el-card
        v-for="classItem in filteredClasses"
        :key="classItem.id"
        class="class-card"
        :body-style="{ padding: '0px' }"
        shadow="hover"
      >
        <div class="class-header-bar" :style="{ backgroundColor: '#1890ff' }">
          <div class="class-name">{{ classItem.name }}</div>
        </div>
        <div class="class-content">
          <div class="class-info">
            <div class="info-header">
              <div>
                <div class="info-item">
                  <span class="info-label">专业：</span>
                  <span>{{ classItem.major }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">年级：</span>
                  <span>{{ classItem.grade }}级</span>
                </div>
                <div class="info-item">
                  <span class="info-label">班主任：</span>
                  <span>{{ classItem.headTeacher }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">人数：</span>
                  <span>{{ classItem.studentCount }}人</span>
                </div>
              </div>
              <!-- 操作按钮 -->
              <div class="class-quick-actions">
                <el-button 
                  type="info" 
                  circle 
                  @click="editClass(classItem)"
                  :icon="Edit"
                  size="small"
                />
                <el-button 
                  type="danger" 
                  circle 
                  @click="deleteClass(classItem)"
                  :icon="Delete"
                  size="small"
                />
              </div>
            </div>
            
            <div class="class-actions-bottom">
              <el-button type="primary" link @click="viewClassDetail(classItem)">
                <el-icon><View /></el-icon> 查看详情
              </el-button>
              <el-button type="success" link @click="manageStudents(classItem)">
                <el-icon><User /></el-icon> 学生管理
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 无数据显示 -->
    <el-empty v-if="filteredClasses.length === 0" description="暂无班级数据"></el-empty>

    <!-- 新增/编辑班级对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑班级' : '新增班级'"
      width="500px"
      @closed="resetForm"
      destroy-on-close
    >
      <el-form
        ref="classFormRef"
        :model="classForm"
        :rules="classFormRules"
        label-position="top"
      >
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="classForm.name" placeholder="请输入班级名称，如：计算机2101"></el-input>
        </el-form-item>
        
        <el-form-item label="所属专业" prop="major">
          <el-select v-model="classForm.major" placeholder="请选择专业" class="w-100">
            <el-option
              v-for="item in majorOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="年级" prop="grade">
          <el-select v-model="classForm.grade" placeholder="请选择年级" class="w-100">
            <el-option
              v-for="item in gradeOptions"
              :key="item"
              :label="`${item}级`"
              :value="item"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="班主任" prop="headTeacher">
          <el-input v-model="classForm.headTeacher" placeholder="请输入班主任姓名"></el-input>
        </el-form-item>
        
        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="classForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入班级备注信息（选填）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" color="#1890ff" @click="submitClassForm" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 班级详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="班级详情"
      width="650px"
      :before-close="() => detailDialogVisible = false"
      destroy-on-close
      top="5vh"
    >
      <div v-if="selectedClass" class="class-detail">
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="班级名称">{{ selectedClass.name }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ selectedClass.major }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ selectedClass.grade }}级</el-descriptions-item>
          <el-descriptions-item label="班主任">{{ selectedClass.headTeacher }}</el-descriptions-item>
          <el-descriptions-item label="学生人数">{{ selectedClass.studentCount }}人</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedClass.createdTime }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="remarks-section" v-if="selectedClass.remarks">
          <h4>班级备注</h4>
          <div class="remarks-content">{{ selectedClass.remarks }}</div>
        </div>
        
        <div class="student-stats">
          <h4>学生情况统计</h4>
          <div class="stats-cards">
            <el-card class="stats-card">
              <div class="stats-value">{{ selectedClass.maleCount }}</div>
              <div class="stats-label">男生人数</div>
            </el-card>
            <el-card class="stats-card">
              <div class="stats-value">{{ selectedClass.femaleCount }}</div>
              <div class="stats-label">女生人数</div>
            </el-card>
            <el-card class="stats-card">
              <div class="stats-value">{{ selectedClass.scholarshipCount }}</div>
              <div class="stats-label">获奖学金</div>
            </el-card>
            <el-card class="stats-card">
              <div class="stats-value">{{ selectedClass.academicCount }}</div>
              <div class="stats-label">学术竞赛</div>
            </el-card>
          </div>
        </div>
        
        <div class="courses-section">
          <h4>开设课程</h4>
          <el-table 
            :data="selectedClass.courses" 
            style="width: 100%" 
            border
            :header-cell-style="{ background: '#f5f5f5', color: '#333' }"
          >
            <el-table-column prop="name" label="课程名称" />
            <el-table-column prop="teacher" label="任课教师" />
            <el-table-column prop="semester" label="学期" />
            <el-table-column prop="credits" label="学分" width="80" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, View, Edit, Delete, User } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// 路由实例
const router = useRouter()

// 班级列表数据
const classes = ref([])
const searchKeyword = ref('')
const filterMajor = ref('')
const filterGrade = ref('')
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const classFormRef = ref(null)
const selectedClass = ref(null)

// 专业和年级选项
const majorOptions = ['计算机科学与技术', '软件工程', '人工智能', '网络工程', '数据科学', '信息安全']
const gradeOptions = ['2020', '2021', '2022', '2023', '2024']

// 班级表单数据
const classForm = reactive({
  id: '',
  name: '',
  major: '',
  grade: '',
  headTeacher: '',
  remarks: ''
})

// 表单验证规则
const classFormRules = {
  name: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 2, max: 20, message: '班级名称长度应为2-20个字符', trigger: 'blur' }
  ],
  major: [
    { required: true, message: '请选择所属专业', trigger: 'change' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  headTeacher: [
    { required: true, message: '请输入班主任姓名', trigger: 'blur' }
  ]
}

// 根据专业获取颜色 - 使用统一的主色调
const getClassColor = (major) => {
  return '#1890ff'
}

// 过滤后的班级列表
const filteredClasses = computed(() => {
  let result = [...classes.value]
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(c => 
      c.name.toLowerCase().includes(keyword) || 
      c.headTeacher.toLowerCase().includes(keyword)
    )
  }
  
  // 专业筛选
  if (filterMajor.value) {
    result = result.filter(c => c.major === filterMajor.value)
  }
  
  // 年级筛选
  if (filterGrade.value) {
    result = result.filter(c => c.grade === filterGrade.value)
  }
  
  return result
})

// 新增班级
const showAddClassDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑班级
const editClass = (classItem) => {
  isEdit.value = true
  Object.assign(classForm, classItem)
  dialogVisible.value = true
}

// 查看班级详情
const viewClassDetail = (classItem) => {
  selectedClass.value = classItem
  detailDialogVisible.value = true
}

// 学生管理
const manageStudents = (classItem) => {
  router.push(`/students/${classItem.id}`)
}

// 导出学生名单
const exportStudentList = (classItem) => {
  ElMessage.success(`已开始导出 ${classItem.name} 的学生名单`)
  // 实际项目中这里会调用导出API
}

// 删除班级
const deleteClass = (classItem) => {
  ElMessageBox.confirm(
    `确定要删除班级 ${classItem.name} 吗？此操作将无法恢复！`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      // 模拟删除操作
      const index = classes.value.findIndex(c => c.id === classItem.id)
      if (index !== -1) {
        classes.value.splice(index, 1)
        ElMessage.success(`班级 ${classItem.name} 已删除`)
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 提交表单
const submitClassForm = async () => {
  if (!classFormRef.value) return
  
  try {
    await classFormRef.value.validate()
    submitting.value = true
    
    setTimeout(() => {
      if (isEdit.value) {
        // 编辑现有班级
        const index = classes.value.findIndex(c => c.id === classForm.id)
        if (index !== -1) {
          classes.value[index] = { ...classes.value[index], ...classForm }
          ElMessage.success(`班级 ${classForm.name} 已更新`)
        }
      } else {
        // 添加新班级
        const newClass = {
          ...classForm,
          id: `c${Date.now()}`,
          studentCount: Math.floor(Math.random() * 40) + 20,
          createdTime: new Date().toLocaleDateString()
        }
        classes.value.unshift(newClass)
        ElMessage.success(`班级 ${newClass.name} 已创建`)
      }
      
      submitting.value = false
      dialogVisible.value = false
    }, 800)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 重置表单
const resetForm = () => {
  if (classFormRef.value) {
    classFormRef.value.resetFields()
  }
  
  Object.assign(classForm, {
    id: '',
    name: '',
    major: '',
    grade: '',
    headTeacher: '',
    remarks: ''
  })
}

// 获取班级数据
const fetchClasses = () => {
  // 模拟API调用
  const mockClasses = [
    {
      id: 'c1',
      name: '软件2101',
      major: '软件工程',
      grade: '2021',
      headTeacher: '王教授',
      studentCount: 42,
      createdTime: '2021-09-01',
      remarks: '软件工程专业重点班级，有多名学生参与了大创项目。',
      maleCount: 32,
      femaleCount: 10,
      scholarshipCount: 15,
      academicCount: 8,
      courses: [
        { name: '软件工程导论', teacher: '李明', semester: '2021-2022第一学期', credits: 3 },
        { name: '数据结构', teacher: '张华', semester: '2021-2022第一学期', credits: 4 },
        { name: '操作系统', teacher: '刘芳', semester: '2021-2022第二学期', credits: 3 },
        { name: '计算机网络', teacher: '陈伟', semester: '2021-2022第二学期', credits: 3 },
      ]
    },
    {
      id: 'c2',
      name: '计科2103',
      major: '计算机科学与技术',
      grade: '2021',
      headTeacher: '李教授',
      studentCount: 45,
      createdTime: '2021-09-01',
      remarks: '',
      maleCount: 35,
      femaleCount: 10,
      scholarshipCount: 12,
      academicCount: 5,
      courses: [
        { name: '计算机导论', teacher: '王明', semester: '2021-2022第一学期', credits: 2 },
        { name: '程序设计基础', teacher: '张华', semester: '2021-2022第一学期', credits: 4 },
        { name: '数据结构', teacher: '孙芳', semester: '2021-2022第二学期', credits: 4 },
        { name: '计算机组成原理', teacher: '陈伟', semester: '2021-2022第二学期', credits: 3 },
      ]
    },
    {
      id: 'c3',
      name: '人工智能2102',
      major: '人工智能',
      grade: '2021',
      headTeacher: '张教授',
      studentCount: 38,
      createdTime: '2021-09-01',
      remarks: '该班级学生在数学建模竞赛中表现出色。',
      maleCount: 24,
      femaleCount: 14,
      scholarshipCount: 10,
      academicCount: 12,
      courses: [
        { name: '人工智能导论', teacher: '孙明', semester: '2021-2022第一学期', credits: 3 },
        { name: '机器学习基础', teacher: '李华', semester: '2021-2022第一学期', credits: 4 },
        { name: '深度学习', teacher: '王芳', semester: '2021-2022第二学期', credits: 4 },
        { name: '计算机视觉', teacher: '张伟', semester: '2021-2022第二学期', credits: 3 },
      ]
    },
    {
      id: 'c4',
      name: '计科2201',
      major: '计算机科学与技术',
      grade: '2022',
      headTeacher: '陈教授',
      studentCount: 46,
      createdTime: '2022-09-01',
      remarks: '',
      maleCount: 36,
      femaleCount: 10,
      scholarshipCount: 14,
      academicCount: 6,
      courses: [
        { name: '计算机导论', teacher: '王明', semester: '2022-2023第一学期', credits: 2 },
        { name: '程序设计基础', teacher: '张华', semester: '2022-2023第一学期', credits: 4 },
        { name: 'Web开发基础', teacher: '李芳', semester: '2022-2023第二学期', credits: 3 },
        { name: '数据库原理', teacher: '陈伟', semester: '2022-2023第二学期', credits: 4 },
      ]
    },
    {
      id: 'c5',
      name: '软件2202',
      major: '软件工程',
      grade: '2022',
      headTeacher: '刘教授',
      studentCount: 40,
      createdTime: '2022-09-01',
      remarks: '该班级承担了多个企业合作项目。',
      maleCount: 28,
      femaleCount: 12,
      scholarshipCount: 12,
      academicCount: 8,
      courses: [
        { name: '软件工程导论', teacher: '李明', semester: '2022-2023第一学期', credits: 3 },
        { name: '面向对象程序设计', teacher: '张华', semester: '2022-2023第一学期', credits: 4 },
        { name: '软件需求分析', teacher: '刘芳', semester: '2022-2023第二学期', credits: 3 },
        { name: '数据库系统', teacher: '陈伟', semester: '2022-2023第二学期', credits: 4 },
      ]
    },
    {
      id: 'c6',
      name: '网络2201',
      major: '网络工程',
      grade: '2022',
      headTeacher: '赵教授',
      studentCount: 36,
      createdTime: '2022-09-01',
      remarks: '',
      maleCount: 26,
      femaleCount: 10,
      scholarshipCount: 9,
      academicCount: 5,
      courses: [
        { name: '网络工程导论', teacher: '王明', semester: '2022-2023第一学期', credits: 2 },
        { name: '计算机网络基础', teacher: '张华', semester: '2022-2023第一学期', credits: 4 },
        { name: '网络协议分析', teacher: '李芳', semester: '2022-2023第二学期', credits: 3 },
        { name: '网络安全', teacher: '陈伟', semester: '2022-2023第二学期', credits: 3 },
      ]
    }
  ]
  
  classes.value = mockClasses
}

// 生命周期钩子
onMounted(() => {
  fetchClasses()
})
</script>

<style scoped>
/* 班级管理主容器样式 */
.class-management {
  padding: 20px;
}

/* 头部区域样式 */
.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 头部左侧区域 */
.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

/* 搜索输入框样式 */
.search-input {
  width: 250px;
}

/* 筛选下拉框样式 */
.filter-select {
  width: 160px;
}

/* 班级列表网格 */
.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 20px;
}

/* 班级卡片样式 */
.class-card {
  height: 100%;
  transition: transform 0.3s, box-shadow 0.3s;
  border: none;
}

/* 卡片悬停效果 */
.class-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 班级标题栏 */
.class-header-bar {
  padding: 12px 15px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 4px 4px 0 0;
}

/* 班级名称样式 */
.class-name {
  font-size: 16px;
  font-weight: bold;
}

/* 班级内容区域 */
.class-content {
  padding: 0;
}

/* 班级信息区域 */
.class-info {
  padding: 15px;
}

/* 信息头部布局 */
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

/* 信息项目样式 */
.info-item {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #333;
}

/* 信息标签样式 */
.info-label {
  font-weight: bold;
  color: #666;
  margin-right: 5px;
}

/* 快速操作按钮区域 */
.class-quick-actions {
  display: flex;
  gap: 5px;
}

/* 底部操作按钮区域 */
.class-actions-bottom {
  display: flex;
  justify-content: flex-start;
  gap: 15px;
  margin-top: 15px;
  border-top: 1px solid #e8e8e8;
  padding-top: 15px;
}

/* 表单全宽元素 */
.w-100 {
  width: 100%;
}

/* 班级详情区域 */
.class-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 各区块标题样式 */
.remarks-section h4,
.student-stats h4,
.courses-section h4 {
  font-size: 16px;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 500;
  color: #333;
}

/* 备注内容区域 */
.remarks-content {
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
  min-height: 60px;
  white-space: pre-line;
  color: #333;
}

/* 统计卡片网格 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

/* 统计卡片样式 */
.stats-card {
  text-align: center;
  border: 1px solid #e8e8e8;
  box-shadow: none;
  background-color: #fff;
}

/* 统计数值样式 */
.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 5px;
}

/* 统计标签样式 */
.stats-label {
  color: #666;
}

/* 深度选择器样式覆盖 */
:deep(.el-descriptions__label) {
  background-color: #f5f5f5 !important;
  color: #333 !important;
}

:deep(.el-descriptions__content) {
  color: #333 !important;
}

:deep(.el-button--primary) {
  --el-button-hover-bg-color: #40a9ff;
  --el-button-active-bg-color: #096dd9;
}

:deep(.el-button--text) {
  color: #1890ff;
}

:deep(.el-button--text:hover) {
  color: #40a9ff;
}

:deep(.el-table th) {
  background-color: #f5f5f5 !important;
}

:deep(.el-dialog__title) {
  color: #333;
}
</style> 