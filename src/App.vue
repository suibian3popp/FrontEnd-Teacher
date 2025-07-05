<script setup>
import Login from './components/Login.vue'
</script>

<template>
  <!-- 此div将替换HTML中的<div id="app">内容 -->
  <div class="global-bg-container">
    <Login />
    <!-- 未来其他页面通过<router-view>切换 -->
  </div>
</template>

<style>
/* 全局样式（不scoped） */
.global-bg-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image: url('/images/background.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed; /* 可选：固定背景 */
  z-index: 0; /* 确保在底层 */
}

/* 确保开发工具容器不会遮挡内容 */
#vue-inspector-container,
#__vue-devtools-container__ {
  z-index: 9999 !important;
  pointer-events: none !important;
}
</style>