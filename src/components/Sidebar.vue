<template>
    <el-aside width="220px" style="background: #fff; min-height: 100vh;">
      <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" router>
        <!-- 首页 -->
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>

        <!-- 在线授课
        <el-menu-item index="/live-class">
          <el-icon><VideoCamera /></el-icon>
          <span>在线授课</span>
        </el-menu-item> -->

          <!-- 任务中心 -->
        <el-sub-menu index="live-class">
          <template #title>
            <el-icon><List /></el-icon>
            <span>在线授课</span>
          </template>
          <el-menu-item index="/live-class/online">直播授课</el-menu-item>
          <el-menu-item index="/live-class/join">加入直播</el-menu-item>
          <el-menu-item index="/live-class/joinclass">success</el-menu-item>
        </el-sub-menu>

        <!-- 课程管理 -->
        <el-menu-item index="/course">
          <el-icon><Collection /></el-icon>
          <span>课程管理</span>
        </el-menu-item>
        
        <!-- 班级管理 -->
        <el-menu-item index="/class">
          <el-icon><User /></el-icon>
          <span>班级管理</span>
        </el-menu-item>

        <!-- 学情分析 -->
        <el-menu-item index="/analytics">
          <el-icon><DataAnalysis /></el-icon>
          <span>学情分析</span>
        </el-menu-item>

        <!-- 资源库 -->
        <el-menu-item index="/resource/list/1000">
          <el-icon><Files /></el-icon>
          <span>资源库</span>
        </el-menu-item>

        <!-- 任务中心 -->
        <el-sub-menu index="task">
          <template #title>
            <el-icon><List /></el-icon>
            <span>任务中心</span>
          </template>
          <el-menu-item index="/task/assignment">作业</el-menu-item>
          <el-menu-item index="/task/exam">考试</el-menu-item>
          <el-menu-item index="/task/approval">审批</el-menu-item>
        </el-sub-menu>

      </el-menu>
    </el-aside>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import {
    HomeFilled,
    VideoCamera,
    Collection,
    User,
    DataAnalysis,
    Files,
    List,
  } from '@element-plus/icons-vue'

  // 首页是默认激活的菜单
  const activeMenu = ref('/dashboard')
  </script>

  <style scoped>
  .el-menu {
    border-right: none;
  }
  </style>