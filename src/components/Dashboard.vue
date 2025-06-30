<template>
  <div class="dashboard-container">
    <!-- 1. 欢迎模块 -->
    <div class="welcome-module">
      <h2>下午好, 张老师!</h2>
      <p>今天是 {{ currentDate }}</p>
    </div>

    <!-- 2. 数据统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card shadow="hover">
          <div class="stat-card-content">
            <el-icon :size="40" class="stat-icon"><component :is="stat.icon" /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 3. 近期课程 & 待办事项 -->
    <el-row :gutter="20" class="list-cards">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>近期课程</span>
              <el-button type="primary" link @click="goTo('/course-management')">查看全部</el-button>
            </div>
          </template>
          <ul class="item-list">
            <li v-for="course in recentCourses" :key="course.id">{{ course.name }}</li>
          </ul>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
              <el-button type="primary" link @click="goTo('/todos')">处理全部</el-button>
            </div>
          </template>
          <ul class="item-list">
            <li v-for="todo in todos" :key="todo.id">{{ todo.title }}</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>

    <!-- 4. 活跃学生 -->
    <el-row class="active-students-card">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>活跃学生</span>
          </template>
          <el-table :data="activeStudents" stripe>
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="class" label="班级" />
            <el-table-column prop="progress" label="学习进度">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Collection, Avatar, Tickets, Files } from '@element-plus/icons-vue';

const router = useRouter();

// 1. 欢迎模块数据
const currentDate = computed(() => new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }));

// 2. 数据卡片 (图标与数据)
const stats = ref([
  { title: '课程数量', value: 8, icon: Collection },
  { title: '学生数量', value: 152, icon: Avatar },
  { title: '待办数量', value: 6, icon: Tickets },
  { title: '个人资源', value: 24, icon: Files },
]);

// 3. 列表卡片数据
const recentCourses = ref([
  { id: 1, name: '《软件工程》 - 第三章 需求分析' },
  { id: 2, name: '《计算机网络》 - 第五章 传输层' },
  { id: 3, name: '《操作系统》 - 第四章 存储管理' },
]);

const todos = ref([
  { id: 1, title: '批改《软件工程》期中测试卷' },
  { id: 2, title: '审核"计算机2101班"的课程项目申请' },
  { id: 3, title: '上传《计算机网络》第六章课件' },
]);

// 4. 活跃学生数据
const activeStudents = ref([
  { name: '王晓明', class: '软件工程2101', progress: 95 },
  { name: '李静', class: '计算机2102', progress: 92 },
  { name: '陈伟', class: '软件工程2101', progress: 88 },
  { name: '赵琳', class: '人工智能2103', progress: 85 },
]);

// 跳转方法
const goTo = (path) => {
  router.push(path);
};
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
}

.welcome-module {
  margin-bottom: 24px;
}

.welcome-module h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.welcome-module p {
  margin: 0;
  color: #606266;
}

.stats-cards, .list-cards, .active-students-card {
  margin-bottom: 20px;
}

.stat-card-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  color: #409EFF;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-title {
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f2f2f2;
}

.item-list li:last-child {
  border-bottom: none;
}
</style>