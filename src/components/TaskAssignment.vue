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
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prepend>
              <el-select v-model="searchCategory" style="width: 115px">
                <el-option label="名称" value="name" />
                <el-option label="课程" value="course" />
                <el-option label="班级" value="class" />
                <el-option label="截止日期" value="dueDate" />
              </el-select>
            </template>
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
        <div class="action-right">
          <el-button type="primary">创建新作业</el-button>
        </div>
      </div>
    </el-card>

    <!-- 2. 待批改作业列表 -->
    <el-card class="assignment-list">
      <template #header>
        <span>待批改作业</span>
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
        <el-table-column label="操作">
          <template #default>
            <el-button type="primary" link>批改作业</el-button>
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

// 原始数据源，将来可以从 API 获取
const allAssignments = ref([
  { id: 1, name: '第三章-需求分析报告', course: '软件工程', class: '软件2101', dueDate: '2024-08-05', submissions: { submitted: 35, total: 40 } },
  { id: 2, name: '第五章-TCP协议分析', course: '计算机网络', class: '计算机2102', dueDate: '2024-08-06', submissions: { submitted: 42, total: 45 } },
  { id: 3, name: '期中项目-简易文件系统', course: '操作系统', class: '软件2101', dueDate: '2024-08-10', submissions: { submitted: 38, total: 40 } },
]);

// 用于在表格中展示的、经过筛选的作业列表
const assignmentsToGrade = ref([...allAssignments.value]);

const handleSearch = () => {
  const query = searchQuery.value.trim().toLowerCase();
  const category = searchCategory.value;

  if (!query) {
    assignmentsToGrade.value = [...allAssignments.value];
    return;
  }

  assignmentsToGrade.value = allAssignments.value.filter(assignment => {
    const value = assignment[category];
    // 确保值存在且可以被搜索
    return value && String(value).toLowerCase().includes(query);
  });
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
</style> 