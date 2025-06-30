<template>
    <el-aside width="220px" style="background: #fff; min-height: 100vh;">
      <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" router>
        <el-menu-item index="/dashboard">学情分析</el-menu-item>
        <el-menu-item index="/course">课程管理</el-menu-item>
        <el-sub-menu index="assignment">
          <template #title>作业管理</template>
          <el-menu-item v-for="item in classes" :key="item" :index="`/assignment/${item}`">{{ item }}</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="exam">
          <template #title>考试管理</template>
          <el-menu-item v-for="item in classes" :key="item" :index="`/exam/${item}`">{{ item }}</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="resource">
          <template #title>资源库</template>
          <el-menu-item index="/resource/personal">个人资源库</el-menu-item>
          <el-menu-item index="/resource/public">公共资源库</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="student">
          <template #title>学生管理</template>
          <el-menu-item v-for="item in classes" :key="item" :index="`/student/${item}`">{{ item }}</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/class">班级管理</el-menu-item>
      </el-menu>
    </el-aside>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  const activeMenu = ref('/dashboard')
  const courses = ['课程一', '课程二', '课程三']
  const classes = ['班级一', '班级二', '班级三']
  </script>