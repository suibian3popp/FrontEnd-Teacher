<template>
  <div class="home-layout">
    <!-- 顶部导航栏 -->
    <main-header></main-header>

    <div class="main-container">
      <!-- 侧边栏 -->
      <Sidebar></Sidebar>

      <!-- 内容区域 -->
      <div class="content-wrapper">
        <!-- 登录检测提示 (新增) -->
        <el-alert
          v-if="!hasValidToken"
          title="检测到登录状态异常"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 10px">
          <div>
            <p>系统检测到您可能未登录或登录已过期，这可能导致API请求失败(401错误)</p>
            <el-button type="primary" size="small" @click="redirectToLogin">重新登录</el-button>
            <el-button size="small" @click="showTokenInfo = !showTokenInfo">
              {{ showTokenInfo ? '隐藏' : '查看' }}详细信息
            </el-button>
          </div>
          <div v-if="showTokenInfo" class="token-info">
            <p>Token值: {{ token || '无' }}</p>
            <p>User信息: {{ JSON.stringify(user) || '无' }}</p>
          </div>
        </el-alert>
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import MainHeader from '../components/common/MainHeader.vue';
import Sidebar from '../components/Sidebar.vue';
import { getToken, getUser, removeToken, removeUser } from '../utils/auth';

const router = useRouter();
const token = ref('');
const user = ref(null);
const showTokenInfo = ref(false);

const hasValidToken = computed(() => {
  return !!token.value;
});

onMounted(() => {
  checkLoginStatus();
});

// 检查登录状态
function checkLoginStatus() {
  token.value = getToken() || '';
  user.value = getUser() || null;
}

// 重定向到登录页面
function redirectToLogin() {
  // 清除无效的登录信息
  removeToken();
  removeUser();
  
  // 跳转到登录页面
  router.push('/login');
}
</script>

<style scoped>
.home-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main-container {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

.content-wrapper {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
  height: calc(100vh - 60px);
}

.token-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  font-family: monospace;
  overflow: auto;
  max-height: 150px;
}
</style>