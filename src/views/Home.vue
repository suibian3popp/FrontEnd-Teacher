<template>
  <el-container style="height: 100vh;">
    <Sidebar />
    <el-container direction="vertical">
      <MainHeader />
      <el-main style="background: #f5f6fa;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import Sidebar from '../components/Sidebar.vue';
import MainHeader from '../components/common/MainHeader.vue';
</script>

<style scoped>
/* No specific styles needed here anymore */
</style>