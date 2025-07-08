<template>
  <el-header class="main-header">
    <div class="header-left">
      <span class="project-title">智慧教学支持平台——教师中心</span>
    </div>
    <div class="header-right">
      <el-icon :size="24" class="header-icon"><Message /></el-icon>
      <div v-if="user" class="user-info">
        <el-dropdown @command="handleCommand">
          <span class="el-dropdown-link">
            欢迎您, {{ user.realName || user.username }} <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人资料</el-dropdown-item>
              <el-dropdown-item command="settings">系统设置</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <el-icon v-else :size="24" class="header-icon"><User /></el-icon>
    </div>
  </el-header>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Message, User, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUser, removeToken, removeUser } from '../../utils/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);

// 页面加载时获取用户信息
onMounted(() => {
  user.value = getUser();
});

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm(
      '确定要退出登录吗?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      // 清除用户登录信息
      removeToken();
      removeUser();
      ElMessage.success('退出登录成功');
      // 重定向到登录页
      router.push('/login');
    }).catch(() => {
      // 用户取消操作
    });
  } else if (command === 'profile') {
    ElMessage.info('个人资料功能开发中...');
  } else if (command === 'settings') {
    ElMessage.info('系统设置功能开发中...');
  }
};
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

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--el-color-primary);
}
</style> 