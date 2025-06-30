<template>
  <div class="exam-container">
    <!-- 1. 顶部操作栏 -->
    <el-card shadow="never" class="action-bar">
      <div class="action-content">
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
              <el-option label="考试时间" value="examDate" />
            </el-select>
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
        <el-button type="primary">创建新考试</el-button>
      </div>
    </el-card>

    <!-- 2. 待批改考试列表 -->
    <el-card class="exam-list">
      <template #header>
        <span>待批改考试</span>
      </template>
      <el-table :data="examsToGrade" stripe>
        <el-table-column prop="name" label="考试名称" />
        <el-table-column prop="course" label="所属课程" />
        <el-table-column prop="class" label="班级" />
        <el-table-column prop="examDate" label="考试时间" />
        <el-table-column prop="submissions" label="提交人数">
          <template #default="{ row }">
            <span>{{ row.submissions.submitted }} / {{ row.submissions.total }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default>
            <el-button type="primary" link>批改试卷</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const searchQuery = ref('');
const searchCategory = ref('name'); // 默认按名称搜索

// 原始数据源
const allExams = ref([
  { id: 1, name: '软件工程-期中考试', course: '软件工程', class: '软件2101', examDate: '2024-07-30 09:00', submissions: { submitted: 40, total: 40 } },
  { id: 2, name: '计算机网络-随堂测试', course: '计算机网络', class: '计算机2102', examDate: '2024-08-01 14:00', submissions: { submitted: 43, total: 45 } },
  { id: 3, name: '操作系统-期末考试', course: '操作系统', class: '软件2101', examDate: '2024-08-15 09:00', submissions: { submitted: 39, total: 40 } },
]);

// 用于在表格中展示的、经过筛选的考试列表
const examsToGrade = ref([...allExams.value]);

const handleSearch = () => {
  const query = searchQuery.value.trim().toLowerCase();
  const category = searchCategory.value;

  if (!query) {
    examsToGrade.value = [...allExams.value];
    return;
  }

  examsToGrade.value = allExams.value.filter(exam => {
    const value = exam[category];
    return value && String(value).toLowerCase().includes(query);
  });
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
</style> 