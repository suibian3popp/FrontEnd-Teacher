<template>
  <ConferenceMainView />

  <!-- 录制控制区域 -->
  <div class="fixed top-8 right-6 z-9999 flex flex-col items-end">
    <!-- 录制按钮 -->
    <el-button 
      type="info" 
      @click="toggleRecording" 
      :class="{ 'is-recording': isRecording }"
      style="position: fixed; top: 14px; left: 1150px;"
    >
      <i class="fa fa-circle mr-1 text-red-300"></i>
      <span>{{ isRecording ? '录制中' : '开始录屏' }}</span>
    </el-button>

    <!-- 录制文件列表 -->
    <div 
      v-if="recordingFiles.length > 0" 
      class="mt-2 bg-gray-900/80 p-2 rounded-md w-56 shadow-lg backdrop-blur-sm border border-gray-800"
      style="position: fixed; left: 1090px; top: 50px;"
    >
      <h3 class="text-xs font-medium mb-1 text-gray-300" style="color:white">录制文件</h3>
      <ul class="space-y-1 max-h-40 overflow-y-auto">
        <li v-for="(file, index) in recordingFiles" :key="index">
          <a
            href="#"
            class="text-blue-400 hover:text-blue-300 text-xs flex items-center justify-between py-1"
            @click.prevent="downloadFile(file, index)"
            style="color:white"
          >
            <span>{{ file.name }}</span>
            <i class="fa fa-download text-blue-300"></i>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ConferenceMainView } from '@tencentcloud/roomkit-web-vue3';
import { conference } from '@tencentcloud/roomkit-web-vue3';
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router'

const errorMessage = ref('');
const route = useRoute()
const options = ref(null);
const roomId = ref(''); // 定义roomId响应式变量

// 解析trtc参数
onMounted(() => {
  try {
    const paramsStr = route.query.trtcParams;
    roomId.value = route.query.roomId; // 赋值roomId
    
    if (!paramsStr) {
      throw new Error('缺少TRTC参数，请从直播列表进入');
    }
    
    // 先解码再解析
    const decodedStr = decodeURIComponent(paramsStr);
    options.value = JSON.parse(decodedStr);

    console.log('TRTC参数解析成功:', options.value);
    console.log("options.value.sdkAppId: " + options.value.sdkAppId);
    
    // 验证解析后的参数是否包含必要字段
    if (!options.value.sdkAppId || !options.value.userId || !options.value.userSig) {
      throw new Error('TRTC参数格式不正确');
    }
    
    // 调用加入会议函数（已定义）
    startConference();
  } catch (error) {
    console.error('解析TRTC参数失败:', error);
    errorMessage.value = error.message;
  }
});

// 定义startConference函数（之前缺失的函数）
const startConference = async () => {
  try {
    if (!options.value) {
      throw new Error('TRTC参数未初始化');
    }
    await joinConference();
    console.log('成功加入会议');
  } catch (error) {
    console.error('加入会议失败:', error);
    errorMessage.value = '加入会议失败: ' + error.message;
  }
};

// 加入会议函数
const joinConference = async () => {
  await conference.login({    
    sdkAppId: options.value.sdkAppId,
    userId: options.value.userId,
    userSig: options.value.userSig
  });
  await conference.join(roomId.value, { // 使用响应式的roomId.value
    isOpenCamera: false,
    isOpenMicrophone: false,
  });
};

// 屏幕录制相关逻辑
let isRecording = ref(false);
let recordingFiles = ref([]);
let mediaRecorder = ref(null);
let recordedChunks = ref([]);
let screenStream = ref(null);

// 屏幕录制支持检测
const checkScreenRecordingSupport = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    alert('您的浏览器不支持屏幕录制功能，请使用Chrome、Firefox或Edge最新版本');
    return false;
  }
  if (!window.MediaRecorder) {
    alert('您的浏览器不支持媒体录制，请升级浏览器');
    return false;
  }
  return true;
};

// 切换录制状态
const toggleRecording = async () => {
  if (isRecording.value) {
    await stopScreenRecording();
  } else {
    if (checkScreenRecordingSupport()) {
      await startScreenRecording();
    }
  }
};

// 开始屏幕录制
const startScreenRecording = async () => {
  try {
    screenStream.value = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      audio: true
    });

    screenStream.value.getVideoTracks()[0].onended = () => {
      stopScreenRecording();
      alert('屏幕共享已结束，录制已停止');
    };

    mediaRecorder.value = new MediaRecorder(screenStream.value, {
      mimeType: 'video/mp4',
      videoBitsPerSecond: 5000000,
      audioBitsPerSecond: 128000
    });

    recordedChunks.value = [];
    mediaRecorder.value.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.value.push(e.data);
      }
    };

    mediaRecorder.value.onstop = () => {
      const blob = new Blob(recordedChunks.value, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const fileName = `screen-recording_${new Date().toISOString().replace(/[:.]/g, '-')}.mp4`;
      recordingFiles.value.push({ name: fileName, url });
    };

    mediaRecorder.value.start();
    isRecording.value = true;
    alert('屏幕录制已开始，请选择要录制的区域');
  } catch (error) {
    console.error('启动屏幕录制失败:', error);
    alert('启动失败: ' + (error.message || '请允许屏幕录制权限'));
    isRecording.value = false;
  }
};

// 停止屏幕录制
const stopScreenRecording = async () => {
  try {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop();
      if (screenStream.value) {
        screenStream.value.getTracks().forEach(track => track.stop());
      }
      isRecording.value = false;
    }
  } catch (error) {
    console.error('停止录制失败:', error);
    alert('停止录制失败: ' + error.message);
  }
};

// 下载并清理文件
const downloadFile = (file, index) => {
  const a = document.createElement('a');
  a.href = file.url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast(`文件 ${file.name} 已开始下载`);
  recordingFiles.value.splice(index, 1);
  URL.revokeObjectURL(file.url);
};

// 提示框
const showToast = (message) => {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    background: rgba(0,0,0,0.7);
    color: white;
    border-radius: 4px;
    z-index: 9999;
    animation: fade 2.5s;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
};

onUnmounted(() => {
  if (isRecording.value && mediaRecorder.value) {
    stopScreenRecording();
  }
  recordingFiles.value.forEach(file => {
    URL.revokeObjectURL(file.url);
  });
  if (screenStream.value) {
    screenStream.value.getTracks().forEach(track => track.stop());
  }
});
</script>

<style scoped>
/* 录制中呼吸动画 */
.is-recording {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(255, 0, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
}

/* 滚动条美化 */
ul::-webkit-scrollbar {
  width: 4px;
}
ul::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
}
ul::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
}

/* 提示框动画 */
@keyframes fade {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style>