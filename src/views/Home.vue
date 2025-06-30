<template>
  <el-container style="height: 100vh;">
    <Sidebar />
    <el-container direction="vertical">
      <el-header class="main-header">
        <div class="header-left">
          <span class="project-title">智慧教学支持平台——教师中心</span>
        </div>
        <div class="header-right">
          <el-icon :size="24" class="header-icon"><Message /></el-icon>
          <div v-if="isLoggedIn" class="user-info">
            欢迎您, {{ username }}
          </div>
          <el-icon v-else :size="24" class="header-icon"><User /></el-icon>
        </div>
      </el-header>
      <el-main style="background: #f5f6fa;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import { Message, User } from '@element-plus/icons-vue'

// 模拟登录状态 (你可以改为 true 来查看登录后的效果)
const isLoggedIn = ref(false)
const username = ref('张老师')
</script>

<style scoped>
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
}

.header-left .project-title {
  font-size: 20px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  cursor: pointer;
}

.user-info {
  font-size: 16px;
}
</style>