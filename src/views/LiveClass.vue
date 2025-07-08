<template>
  <ConferenceMainView />

  <!-- 录制控制区域：视觉优化 + 位置微调 -->
  <div class="fixed top-8 right-6 z-9999 flex flex-col items-end">
    <!-- 录制按钮：渐变背景 + 呼吸动画 -->
    <el-button type="info" :icon="Message" @click="toggleRecording" :class="{ 'is-recording': isRecording }"
               style="position: fixed;
    top: 14px; /* 向上移动（数值越小越靠上） */
    left: 1150px; /* 向左移动（数值越小越靠左） */">

      <i class="fa fa-circle mr-1 text-red-300"></i>
      <span>{{ isRecording ? '录制中' : '开始录屏' }}</span>
      <!--    </button>-->
    </el-button>

    <!-- 录制文件列表：玻璃拟态 + 滚动条美化 -->
    <div v-if="recordingFiles.length > 0" class="mt-2 bg-gray-900/80 p-2 rounded-md w-56 shadow-lg backdrop-blur-sm border border-gray-800"
         style="position: fixed;
            left: 1090px;
            top: 50px;">
      <h3 class="text-xs font-medium mb-1 text-gray-300" style="color:white">录制文件</h3>
      <ul class="space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

// 状态管理
let isRecording = ref(false);
let recordingFiles = ref([]);
let mediaRecorder = ref(null);
let recordedChunks = ref([]);
let screenStream = ref(null);

// 腾讯云配置,实际调用后端接口
const config = {
  sdkAppId: 1600,
  userId: '',
  userSig: '',
  roomId: '12345'
};

// 启动会议
const startConference = async () => {
  try {
    await conference.login({
      sdkAppId: config.sdkAppId,
      userId: config.userId,
      userSig: config.userSig
    });

    await conference.start(config.roomId, {
      roomName: 'TestRoom',
      isSeatEnabled: false,
      isOpenCamera: false,
      isOpenMicrophone: false,
    });

    await nextTick();
    console.log('会议启动成功');
  } catch (error) {
    console.error('启动会议失败:', error);
    alert('启动会议失败: ' + error.message);
  }
};

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

// 提示框（优化动画）
const showToast = (message) => {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = 'showToast'; // 关联CSS动画
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
};

onMounted(() => {
  startConference();
});

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
/* 定位与布局 */
.fixed { position: fixed; }
.top-8 { top: 2rem; }
.right-6 { right: 1.5rem; }
.z-9999 { z-index: 9999; }
.flex.flex-col.items-end {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* 录制按钮样式 */
.mr-1 { margin-right: 0.25rem; }
.text-red-300 { color: #fca5a5; }

/* 录制中呼吸动画 */
.is-recording {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 0, 0,1); }
  50% { box-shadow: 0 0 0 8px rgba(252, 165, 165, 0); }
  100% { box-shadow: 0 0 0 0 rgba(252, 165, 165, 0); }
}

/* 录制文件列表：玻璃拟态 + 滚动条 */
.mt-2 { margin-top: 0.5rem; }
.bg-gray-900\/80 { background-color: rgba(96, 165, 250, 0.7); }
.p-2 { padding: 0.5rem; }
.rounded-md { border-radius: 0.375rem; }
.w-56 { width: 14rem; }
.shadow-lg { box-shadow: 0 6px 12px rgba(0,0,0,0.3); }
.backdrop-blur-sm { backdrop-filter: blur(4px); }
.border-gray-800 { border-color: #1f2937; }
.text-gray-300 { color: #d1d5db; }
.text-xs { font-size: 0.75rem; }
.space-y-1 > * + * { margin-top: 0.25rem; }
.max-h-40 { max-height: 10rem; }


@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
