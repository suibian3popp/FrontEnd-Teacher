<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center p-4">
    <!-- 主容器 -->
    <div class="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
      <!-- 顶部导航 -->
      <div class="p-6 flex justify-between items-center border-b border-white/10">
        <div class="flex items-center space-x-2">
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
          </svg>
          <h1 class="text-xl font-bold text-white">LiveClass</h1>
        </div>
        <div>
          <button class="text-white hover:text-blue-200 transition-colors duration-300 p-2 rounded-full hover:bg-white/10">
            <i class="fa fa-question-circle text-lg"></i>
          </button>
        </div>
      </div>
      
      <!-- 主要内容 -->
      <div class="flex flex-col md:flex-row">
        <!-- 左侧表单区域 -->
        <div class="p-8 md:p-10 w-full md:w-1/2">
          <h2 class="text-2xl font-bold text-white mb-2">加入直播课堂</h2>
          <p class="text-blue-100 mb-8">输入房间号和您的信息，立即加入直播课程</p>
          
          <form @submit.prevent="joinLiveSession" class="space-y-6">
            <!-- 房间号输入 -->
            <div class="space-y-2">
              <label for="roomId" class="block text-sm font-medium text-blue-100">直播间房间号</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-200">
                  <i class="fa fa-hashtag"></i>
                </span>
                <input 
                  type="text" 
                  id="roomId" 
                  v-model="roomId" 
                  class="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-blue-300 transition-all duration-300"
                  placeholder="请输入直播间房间号"
                  required
                  :disabled="loading"
                >
              </div>
            </div>
            
            <!-- 昵称输入 -->
            <div class="space-y-2">
              <label for="nickname" class="block text-sm font-medium text-blue-100">您的昵称</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-200">
                  <i class="fa fa-user"></i>
                </span>
                <input 
                  type="text" 
                  id="nickname" 
                  v-model="nickname" 
                  class="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-blue-300 transition-all duration-300"
                  placeholder="请输入您的昵称"
                  required
                  :disabled="loading"
                >
              </div>
            </div>
            
            <!-- 角色选择 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-blue-100">您的角色</label>
              <div class="grid grid-cols-2 gap-4">
                <label class="flex items-center space-x-2 p-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors duration-300">
                  <input 
                    type="radio" 
                    name="role" 
                    value="student" 
                    v-model="role" 
                    class="w-4 h-4 text-blue-500 focus:ring-blue-500 border-blue-300"
                    :disabled="loading"
                  >
                  <span class="text-white">学生</span>
                </label>
                <label class="flex items-center space-x-2 p-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors duration-300">
                  <input 
                    type="radio" 
                    name="role" 
                    value="teacher" 
                    v-model="role" 
                    class="w-4 h-4 text-blue-500 focus:ring-blue-500 border-blue-300"
                    :disabled="loading"
                  >
                  <span class="text-white">老师</span>
                </label>
              </div>
            </div>
            
            <!-- 加入按钮 - 加载状态优化 -->
            <button 
              type="submit" 
              class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2"
              :disabled="loading"
            >
              <span v-if="!loading">加入直播</span>
              <span v-if="loading" class="flex items-center">
                <i class="fa fa-spinner fa-spin mr-2"></i>
                加入中...
              </span>
              <i class="fa fa-arrow-right" v-if="!loading"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { checkAuthStatus } from '@/utils/auth';
import { getTrtcParams_1 } from '@/api/course.js';
import { getUser } from '@/utils/auth';

const router = useRouter();

// 获取当前userId
const ownerId = ref(getUser()?.userId || ''); 

// 表单数据
const roomId = ref('');
const nickname = ref('');
const role = ref('student');
const loading = ref(false); // 加载状态管理

// 加入直播会话
const joinLiveSession = async () => {
  // 表单验证
  if (!roomId.value.trim()) {
    alert('请输入直播间房间号');
    return;
  }
  
  if (!nickname.value.trim()) {
    alert('请输入您的昵称');
    return;
  }
  
  try {
    // 开始加载状态
    loading.value = true;
    
    // 验证用户登录状态
    if (!checkAuthStatus()) {
      throw new Error('请先登录后再加入直播');
    }
    
   
    const trtcRes = await getTrtcParams_1(
     // 使用固定值而非用户输入
      ownerId.value, 
      role.value
    );
    
    console.log("TRTC参数响应:", trtcRes);
    
    if (!trtcRes?.data) {
      throw new Error(trtcRes?.message || '获取TRTC参数失败');
    }
    
    const trtcParams = trtcRes.data;
    console.log("TRTC参数获取成功，准备跳转...");

    // 编码参数并跳转，携带固定sessionId
    const encodedParams = encodeURIComponent(JSON.stringify(trtcParams));
    router.push({
      path: '/live-class/joinclass',
      query: {
        roomId: roomId.value,
        trtcParams: encodedParams,
        nickname: nickname.value
      }
    });
  } catch (error) {
    console.error('加入直播失败:', error);
    alert(`加入直播失败: ${error.message || '请稍后重试'}`);
  } finally {
    // 结束加载状态
    loading.value = false;
  }
};

// 快速加入功能
const quickJoin = (roomIdVal, name) => {
  roomId.value = roomIdVal;
  nickname.value = name || `用户${Math.floor(Math.random() * 10000)}`;
};
</script>

<style scoped>
/* 自定义动画 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 禁用状态样式 */
input:disabled,
button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
</style>